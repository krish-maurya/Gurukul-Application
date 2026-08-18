export interface TimetableSlotInput {
  id: string;
  day: string;
  period: number;
  grade: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  originalTeacherId?: string;
  originalTeacherName?: string;
  isProxy?: boolean;
  proxyStatus?: string | null;
  roomId: string;
  roomName: string;
  roomCapacity?: number;
  classSize?: number;
  roomType?: "LECTURE" | "LAB";
  requiresLab?: boolean;
}

export interface TimetableConflictDetail {
  id: string;
  type:
    | "TEACHER_CLASH"
    | "ROOM_CLASH"
    | "LAB_CLASH"
    | "CAPACITY_EXCEEDED"
    | "WORKLOAD_EXCEEDED"
    | "LAB_REQUIRED";
  severity: "CRITICAL" | "WARNING";
  day: string;
  period: number;
  description: string;
  suggestedFix: string;
  affectedSlotIds: string[];
  suggestedTargetSlot?: { day: string; period: number; roomId?: string };
  suggestedRoomIds?: string[];
  alternativeRooms?: Array<{
    roomId: string;
    roomNumber: string;
    capacity?: number;
    type?: string;
    reason?: string;
  }>;
  possibleSwapSlotIds?: string[];
  possibleFreePeriods?: number[];
}

export interface OptimizationResult {
  isValid: boolean;
  conflicts: TimetableConflictDetail[];
  totalSlots: number;
  optimizedSlots: TimetableSlotInput[];
}

const PERIODS = [1, 2, 3, 4, 5, 6];

/** Evaluates timetable constraints and returns deterministic suggestions only; it never mutates input. */
export function evaluateTimetable(
  slots: TimetableSlotInput[],
): OptimizationResult {
  const teacherPeriod = new Map<string, TimetableSlotInput[]>();
  const roomPeriod = new Map<string, TimetableSlotInput[]>();
  const roomsByPeriod = new Map<string, Set<string>>();
  const allRoomIds = new Set(slots.map((slot) => slot.roomId));

  slots.forEach((slot) => {
    addToIndex(
      teacherPeriod,
      `${slot.teacherId}:${slot.day}:${slot.period}`,
      slot,
    );
    addToIndex(roomPeriod, `${slot.roomId}:${slot.day}:${slot.period}`, slot);
    const key = `${slot.day}:${slot.period}`;
    const occupied = roomsByPeriod.get(key) ?? new Set<string>();
    occupied.add(slot.roomId);
    roomsByPeriod.set(key, occupied);
  });

  const conflicts: TimetableConflictDetail[] = [];
  let counter = 1;

  for (const [key, group] of teacherPeriod) {
    if (group.length > 1) {
      conflicts.push(
        buildConflict(
          `conflict-t-${counter++}`,
          "TEACHER_CLASH",
          group,
          slots,
          allRoomIds,
          roomsByPeriod,
          `Teacher Double-Booking: ${group[0].teacherName} is assigned to ${group.length} simultaneous lectures.`,
        ),
      );
    }
  }

  for (const [key, group] of roomPeriod) {
    if (group.length > 1) {
      const type = group[0].roomType === "LAB" ? "LAB_CLASH" : "ROOM_CLASH";
      conflicts.push(
        buildConflict(
          `conflict-r-${counter++}`,
          type,
          group,
          slots,
          allRoomIds,
          roomsByPeriod,
          `${group[0].roomName} is booked for ${group.length} simultaneous lectures.`,
        ),
      );
    }
  }

  for (const slot of slots) {
    if (
      slot.classSize !== undefined &&
      slot.roomCapacity !== undefined &&
      slot.classSize > slot.roomCapacity
    ) {
      conflicts.push(
        buildConflict(
          `conflict-c-${counter++}`,
          "CAPACITY_EXCEEDED",
          [slot],
          slots,
          allRoomIds,
          roomsByPeriod,
          `${slot.grade} has ${slot.classSize} students but ${slot.roomName} holds ${slot.roomCapacity}.`,
        ),
      );
    }
    if (slot.requiresLab && slot.roomType !== "LAB") {
      conflicts.push(
        buildConflict(
          `conflict-l-${counter++}`,
          "LAB_REQUIRED",
          [slot],
          slots,
          allRoomIds,
          roomsByPeriod,
          `${slot.subjectName} requires a laboratory but is assigned to ${slot.roomName}.`,
        ),
      );
    }
  }

  return {
    isValid: conflicts.length === 0,
    conflicts,
    totalSlots: slots.length,
    optimizedSlots: slots,
  };
}

function buildConflict(
  id: string,
  type: TimetableConflictDetail["type"],
  affected: TimetableSlotInput[],
  allSlots: TimetableSlotInput[],
  allRoomIds: Set<string>,
  roomsByPeriod: Map<string, Set<string>>,
  description: string,
): TimetableConflictDetail {
  const primary = affected[0];
  const freePeriods = PERIODS.filter(
    (period) =>
      period !== primary.period &&
      !allSlots.some(
        (slot) =>
          slot.day === primary.day &&
          slot.period === period &&
          (slot.teacherId === primary.teacherId ||
            slot.grade === primary.grade),
      ),
  );

  const occupiedRooms =
    roomsByPeriod.get(`${primary.day}:${primary.period}`) ?? new Set<string>();

  // Map distinct rooms
  const uniqueRooms = new Map<
    string,
    { id: string; name: string; type?: "LECTURE" | "LAB"; capacity?: number }
  >();
  allSlots.forEach((s) => {
    if (!uniqueRooms.has(s.roomId)) {
      uniqueRooms.set(s.roomId, {
        id: s.roomId,
        name: s.roomName,
        type: s.roomType,
        capacity: s.roomCapacity,
      });
    }
  });

  const requiredType = primary.requiresLab ? "LAB" : "LECTURE";
  const typedCandidates = [...uniqueRooms.values()].filter(
    (r) =>
      r.id !== primary.roomId &&
      !occupiedRooms.has(r.id) &&
      (r.type === requiredType || (!r.type && !primary.requiresLab)),
  );

  const alternativeRooms = (
    typedCandidates.length > 0
      ? typedCandidates
      : [...uniqueRooms.values()].filter(
          (r) => r.id !== primary.roomId && !occupiedRooms.has(r.id),
        )
  )
    .slice(0, 3)
    .map((r) => ({
      roomId: r.id,
      roomNumber: r.name,
      capacity: r.capacity,
      type: r.type,
      reason: `${r.type === "LAB" ? "Lab" : "Lecture room"}, available at Period ${primary.period}`,
    }));

  const suggestedRoomIds = alternativeRooms.map((r) => r.roomId);
  if (!suggestedRoomIds.length) {
    const fallback = [...allRoomIds]
      .filter(
        (roomId) => roomId !== primary.roomId && !occupiedRooms.has(roomId),
      )
      .sort();
    suggestedRoomIds.push(...fallback.slice(0, 3));
  }

  const possibleSwapSlotIds = allSlots
    .filter(
      (slot) =>
        slot.id !== primary.id &&
        slot.day === primary.day &&
        slot.period === primary.period &&
        slot.roomId !== primary.roomId,
    )
    .map((slot) => slot.id)
    .sort()
    .slice(0, 3);

  const suggestedFix = alternativeRooms.length
    ? `Move to ${alternativeRooms.map((r) => r.roomNumber).join(", ")}.`
    : suggestedRoomIds.length
      ? `Review free room ${suggestedRoomIds[0]} for administrator approval.`
      : freePeriods.length
        ? `Review period ${freePeriods[0]} for administrator approval.`
        : possibleSwapSlotIds.length
          ? `Review swap candidate ${possibleSwapSlotIds[0]} for administrator approval.`
          : "No deterministic alternative is available; administrator review is required.";

  return {
    id,
    type,
    severity: "CRITICAL",
    day: primary.day,
    period: primary.period,
    description,
    suggestedFix,
    affectedSlotIds: affected.map((slot) => slot.id),
    suggestedTargetSlot: freePeriods.length
      ? {
          day: primary.day,
          period: freePeriods[0],
          roomId: suggestedRoomIds[0],
        }
      : undefined,
    suggestedRoomIds,
    alternativeRooms,
    possibleSwapSlotIds,
    possibleFreePeriods: freePeriods,
  };
}

function addToIndex(
  index: Map<string, TimetableSlotInput[]>,
  key: string,
  value: TimetableSlotInput,
) {
  const values = index.get(key) ?? [];
  values.push(value);
  index.set(key, values);
}
