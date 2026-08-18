import { prisma } from "@/lib/prisma";
import { getTimetableDayForDate } from "./proxy-service";
import type { RoomSuggestion, ScheduleConflict } from "./proxy-types";

const PERIODS = [1, 2, 3, 4, 5, 6];

export class RoomConflictError extends Error {
  readonly statusCode = 409;
  constructor(message: string) {
    super(message);
    this.name = "RoomConflictError";
  }
}

export class ConflictService {
  async detect(date: string): Promise<ScheduleConflict[]> {
    const day = getTimetableDayForDate(date);
    const [slots, rooms, reservations, studentCounts] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: { day },
        include: { room: true, subject: true, teacher: true },
      }),
      prisma.room.findMany({
        where: { isAvailable: true },
        orderBy: { capacity: "asc" },
      }),
      prisma.roomReservation.findMany({
        where: { date, day, status: "ACTIVE" },
        select: { roomId: true, period: true, timetableSlotId: true },
      }),
      prisma.student.groupBy({
        by: ["grade"],
        where: { status: "ADMITTED" },
        _count: { _all: true },
      }),
    ]);

    const indexes = this.buildIndexes(slots, reservations, studentCounts);
    const conflicts = this.buildConflicts(slots, rooms, indexes, day);
    await this.persistConflicts(conflicts, slots, day);
    return conflicts;
  }

  /**
   * Reassign a timetable slot to a new room with strict server-side validation.
   */
  async reassignRoom(slotId: string, newRoomId: string, date?: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch the slot
      const slot = await tx.timetableSlot.findUnique({
        where: { id: slotId },
        include: { subject: true, room: true },
      });

      if (!slot) {
        throw new RoomConflictError("Timetable slot not found");
      }

      // 2. Fetch the target room
      const targetRoom = await tx.room.findUnique({
        where: { id: newRoomId },
      });

      if (!targetRoom) {
        throw new RoomConflictError("Target room not found");
      }

      if (!targetRoom.isAvailable) {
        throw new RoomConflictError(
          `Room ${targetRoom.roomNumber} is currently unavailable.`,
        );
      }

      // 3. Confirm room type matches subject requirement
      if (slot.subject.requiresLab && targetRoom.type !== "LAB") {
        throw new RoomConflictError(
          `Subject ${slot.subject.name} requires a laboratory, but ${targetRoom.roomNumber} is not a lab.`,
        );
      }

      if (!slot.subject.requiresLab && targetRoom.type === "LAB") {
        throw new RoomConflictError(
          `Subject ${slot.subject.name} does not require a laboratory; standard lecture room is expected.`,
        );
      }

      // 4. Confirm capacity is sufficient
      const classSize = await tx.student.count({
        where: { grade: slot.grade, status: "ADMITTED" },
      });

      if (targetRoom.capacity < classSize) {
        throw new RoomConflictError(
          `${slot.grade} has ${classSize} admitted students but ${targetRoom.roomNumber} only holds ${targetRoom.capacity}.`,
        );
      }

      // 5. Confirm no timetable slot already uses it at the same day + period
      const existingSlot = await tx.timetableSlot.findFirst({
        where: {
          id: { not: slotId },
          day: slot.day,
          period: slot.period,
          roomId: newRoomId,
        },
      });

      if (existingSlot) {
        throw new RoomConflictError(
          `Room ${targetRoom.roomNumber} is already occupied on ${slot.day} Period ${slot.period}.`,
        );
      }

      // 6. Confirm no active room reservation conflicts with it
      if (date) {
        const reservation = await tx.roomReservation.findFirst({
          where: {
            roomId: newRoomId,
            date,
            period: slot.period,
            status: "ACTIVE",
          },
        });

        if (reservation) {
          throw new RoomConflictError(
            `Room ${targetRoom.roomNumber} has an active reservation on ${date} Period ${slot.period}.`,
          );
        }
      }

      // 7. Update the TimetableSlot.roomId
      const updatedSlot = await tx.timetableSlot.update({
        where: { id: slotId },
        data: { roomId: newRoomId },
        include: { room: true, subject: true, teacher: true },
      });

      return updatedSlot;
    });
  }

  private buildIndexes(
    slots: Array<{
      id: string;
      period: number;
      roomId: string;
      teacherId: string;
      grade: string;
    }>,
    reservations: Array<{
      roomId: string;
      period: number;
      timetableSlotId: string | null;
    }>,
    studentCounts: Array<{ grade: string; _count: { _all: number } }>,
  ) {
    const roomPeriod = new Map<string, string[]>();
    const teacherPeriod = new Map<string, string[]>();
    const occupiedRoomPeriods = new Set<string>();
    const gradeCounts = new Map(
      studentCounts.map((entry) => [entry.grade, entry._count._all]),
    );

    slots.forEach((slot) => {
      this.addToIndex(roomPeriod, `${slot.roomId}:${slot.period}`, slot.id);
      this.addToIndex(
        teacherPeriod,
        `${slot.teacherId}:${slot.period}`,
        slot.id,
      );
      occupiedRoomPeriods.add(`${slot.roomId}:${slot.period}`);
    });

    reservations.forEach((reservation) => {
      if (!reservation.timetableSlotId) {
        occupiedRoomPeriods.add(`${reservation.roomId}:${reservation.period}`);
      }
    });

    return { roomPeriod, teacherPeriod, occupiedRoomPeriods, gradeCounts };
  }

  private buildConflicts(
    slots: Array<{
      id: string;
      period: number;
      roomId: string;
      teacherId: string;
      grade: string;
      room: {
        roomNumber: string;
        capacity: number;
        type: string;
        isAvailable: boolean;
      };
      subject: { requiresLab: boolean };
      teacher: { name: string };
    }>,
    rooms: Array<{
      id: string;
      roomNumber: string;
      capacity: number;
      type: string;
    }>,
    indexes: ReturnType<ConflictService["buildIndexes"]>,
    day: string,
  ) {
    const conflicts: ScheduleConflict[] = [];
    const handled = new Set<string>();

    for (const slot of slots) {
      const roomKey = `${slot.roomId}:${slot.period}`;
      const teacherKey = `${slot.teacherId}:${slot.period}`;
      const roomSlots = indexes.roomPeriod.get(roomKey) ?? [];
      const teacherSlots = indexes.teacherPeriod.get(teacherKey) ?? [];
      const alternatives = this.findAlternativeRooms(
        slot,
        rooms,
        indexes.occupiedRoomPeriods,
        indexes.gradeCounts.get(slot.grade) ?? 0,
      );
      const suggestions = this.findScheduleSuggestions(
        slot,
        slots,
        rooms,
        indexes,
        alternatives,
      );

      if (teacherSlots.length > 1 && !handled.has(`teacher:${teacherKey}`)) {
        handled.add(`teacher:${teacherKey}`);
        conflicts.push(
          this.conflict(
            "TEACHER_CLASH",
            slot.id,
            `${slot.teacher.name} is assigned to multiple lectures on ${day} period ${slot.period}.`,
            alternatives,
            suggestions,
          ),
        );
      }

      if (roomSlots.length > 1 && !handled.has(`room:${roomKey}`)) {
        handled.add(`room:${roomKey}`);
        const conflictType: ScheduleConflict["type"] =
          slot.room.type === "LAB" ? "LAB_CLASH" : "ROOM_CLASH";
        conflicts.push(
          this.conflict(
            conflictType,
            slot.id,
            `${slot.room.roomNumber} is double-booked on ${day} period ${slot.period}.`,
            alternatives,
            suggestions,
          ),
        );
      }

      const classSize = indexes.gradeCounts.get(slot.grade) ?? 0;
      if (classSize > slot.room.capacity) {
        conflicts.push(
          this.conflict(
            "CAPACITY_EXCEEDED",
            slot.id,
            `${slot.grade} has ${classSize} admitted students but ${slot.room.roomNumber} holds ${slot.room.capacity}.`,
            alternatives,
            suggestions,
          ),
        );
      }

      if (!slot.room.isAvailable) {
        conflicts.push(
          this.conflict(
            "ROOM_UNAVAILABLE",
            slot.id,
            `${slot.room.roomNumber} is unavailable.`,
            alternatives,
            suggestions,
          ),
        );
      }

      if (slot.subject.requiresLab && slot.room.type !== "LAB") {
        conflicts.push(
          this.conflict(
            "LAB_CONFLICT",
            slot.id,
            `${slot.grade} requires a lab for this subject, but ${slot.room.roomNumber} is not a lab.`,
            alternatives,
            suggestions,
          ),
        );
      }
    }

    return conflicts;
  }

  private findAlternativeRooms(
    slot: {
      roomId: string;
      period: number;
      room: { type: string };
      subject: { requiresLab: boolean };
    },
    rooms: Array<{
      id: string;
      roomNumber: string;
      capacity: number;
      type: string;
    }>,
    occupiedRoomPeriods: Set<string>,
    classSize: number,
  ): RoomSuggestion[] {
    const requiredType = slot.subject.requiresLab ? "LAB" : "LECTURE";
    return rooms
      .filter(
        (room) =>
          room.id !== slot.roomId &&
          room.type === requiredType &&
          room.capacity >= classSize &&
          !occupiedRoomPeriods.has(`${room.id}:${slot.period}`),
      )
      .sort(
        (a, b) =>
          a.capacity - classSize - (b.capacity - classSize) ||
          a.roomNumber.localeCompare(b.roomNumber),
      )
      .slice(0, 3)
      .map((room) => ({
        roomId: room.id,
        roomNumber: room.roomNumber,
        capacity: room.capacity,
        type: room.type,
        reason: `${room.type === "LAB" ? "Lab" : "Lecture room"}, capacity ${room.capacity}`,
      }));
  }

  private findScheduleSuggestions(
    slot: {
      id: string;
      period: number;
      teacherId: string;
      grade: string;
      roomId: string;
    },
    slots: Array<{
      id: string;
      period: number;
      teacherId: string;
      grade: string;
      roomId: string;
      room: { type: string; capacity: number };
    }>,
    rooms: Array<{
      id: string;
      roomNumber: string;
      capacity: number;
      type: string;
    }>,
    indexes: ReturnType<ConflictService["buildIndexes"]>,
    alternatives: RoomSuggestion[],
  ) {
    const freePeriods = PERIODS.filter(
      (period) =>
        period !== slot.period &&
        !indexes.teacherPeriod.get(`${slot.teacherId}:${period}`)?.length &&
        !slots.some(
          (item) => item.grade === slot.grade && item.period === period,
        ),
    );

    const swapSlotIds = slots
      .filter(
        (other) =>
          other.id !== slot.id &&
          other.period === slot.period &&
          other.roomId !== slot.roomId,
      )
      .map((other) => other.id)
      .slice(0, 3);

    return { freePeriods, swapSlotIds };
  }

  private conflict(
    type: ScheduleConflict["type"],
    timetableSlotId: string,
    description: string,
    alternativeRooms: RoomSuggestion[],
    suggestions: { freePeriods: number[]; swapSlotIds: string[] },
  ): ScheduleConflict {
    return {
      type,
      severity: "CRITICAL",
      timetableSlotId,
      description,
      alternativeRooms,
      ...suggestions,
    };
  }

  private addToIndex(index: Map<string, string[]>, key: string, value: string) {
    const values = index.get(key) ?? [];
    values.push(value);
    index.set(key, values);
  }

  private async persistConflicts(
    conflicts: ScheduleConflict[],
    slots: Array<{ id: string; day: string; period: number }>,
    day: string,
  ) {
    const slotById = new Map(slots.map((slot) => [slot.id, slot]));
    await prisma.$transaction(async (tx) => {
      await tx.timetableConflict.deleteMany({ where: { day } });
      if (!conflicts.length) return;
      await tx.timetableConflict.createMany({
        data: conflicts.map((conflict) => {
          const slot = slotById.get(conflict.timetableSlotId);
          return {
            type: conflict.type,
            severity: conflict.severity,
            description: conflict.description,
            suggestedFix: this.suggestedFix(conflict),
            day,
            period: slot?.period ?? 0,
            affectedSlots: JSON.stringify([conflict.timetableSlotId]),
          };
        }),
      });
    });
  }

  private suggestedFix(conflict: ScheduleConflict) {
    if (conflict.alternativeRooms.length) {
      return `Move to ${conflict.alternativeRooms.map((room) => room.roomNumber).join(", ")}.`;
    }
    if (conflict.swapSlotIds.length) {
      return `Review timetable swap candidates: ${conflict.swapSlotIds.join(", ")}.`;
    }
    if (conflict.freePeriods.length) {
      return `Move to available period ${conflict.freePeriods.join(", ")}.`;
    }
    return "Administrator action is required; no deterministic alternative is currently available.";
  }
}

export const conflictService = new ConflictService();
