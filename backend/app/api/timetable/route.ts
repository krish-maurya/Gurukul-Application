import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";
import {
  evaluateTimetable,
  TimetableSlotInput,
} from "@/lib/timetable/optimizer";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const dateParam = request.nextUrl.searchParams.get("date");
    const today = new Date().toLocaleDateString("en-CA");
    const targetDate =
      dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : today;

    const [slots, studentCounts] = await Promise.all([
      prisma.timetableSlot.findMany({
        // Teachers can only receive their own weekly schedule.
        where:
          session.role === "TEACHER" && session.staffId
            ? { teacherId: session.staffId }
            : undefined,
        include: {
          subject: true,
          teacher: true,
          room: true,
          proxyAssignments: {
            include: {
              proxyTeacher: true,
            },
          },
        },
      }),
      prisma.student.groupBy({
        by: ["grade"],
        where: { status: "ADMITTED" },
        _count: { _all: true },
      }),
    ]);

    if (!slots.length) {
      return NextResponse.json({
        slots: [],
        evaluation: {
          isValid: true,
          conflicts: [],
          totalSlots: 0,
          optimizedSlots: [],
        },
      });
    }

    const classSizeByGrade = new Map(
      studentCounts.map((entry) => [entry.grade, entry._count._all]),
    );

    const formattedSlots: TimetableSlotInput[] = slots.map((s) => {
      const roomType: "LAB" | "LECTURE" =
        s.room.type === "LAB" ? "LAB" : "LECTURE";

      // Find matching proxy assignment for targetDate, or any assigned proxy for this slot
      const assignedForDate = s.proxyAssignments.find(
        (p) => p.date === targetDate && p.status === "ASSIGNED",
      );
      const pendingForDate = s.proxyAssignments.find(
        (p) => p.date === targetDate && p.status === "PENDING",
      );
      const latestAssigned =
        assignedForDate ||
        (!dateParam
          ? s.proxyAssignments.find((p) => p.status === "ASSIGNED")
          : null);

      let displayedTeacherId = s.teacherId;
      let displayedTeacherName = s.teacher.name;
      let isProxy = false;
      let proxyStatus: string | null = null;

      if (latestAssigned && latestAssigned.proxyTeacher) {
        displayedTeacherId = latestAssigned.proxyTeacher.id;
        displayedTeacherName = latestAssigned.proxyTeacher.name;
        isProxy = true;
        proxyStatus = "ASSIGNED";
      } else if (pendingForDate) {
        proxyStatus = "PENDING";
      }

      return {
        id: s.id,
        day: s.day,
        period: s.period,
        grade: s.grade,
        subjectId: s.subjectId,
        subjectName: s.subject.name,
        teacherId: displayedTeacherId,
        teacherName: displayedTeacherName,
        originalTeacherId: s.teacherId,
        originalTeacherName: s.teacher.name,
        isProxy,
        proxyStatus,
        roomId: s.roomId,
        roomName: s.room.roomNumber,
        roomCapacity: s.room.capacity,
        roomType,
        classSize: classSizeByGrade.get(s.grade) ?? 0,
        requiresLab: s.subject.requiresLab,
      };
    });

    const evaluation = evaluateTimetable(formattedSlots);

    return NextResponse.json({
      slots: formattedSlots,
      evaluation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch timetable";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/timetable — create a timetable slot.
 * ADMIN: may create slots for any teacher.
 * TEACHER: may only create slots on their OWN timetable (teacherId is forced
 * to their linked staff record server-side).
 * Rejects teacher/room/grade clashes for the same day+period.
 */
export async function POST(request: NextRequest) {
  const { requireSession, AuthError } = await import("@/lib/auth/server");
  try {
    const session = await requireSession();

    const body = await request.json().catch(() => ({}));
    const day = String(body.day || "");
    const period = Number(body.period);
    const grade = String(body.grade || "").trim();
    const subjectId = String(body.subjectId || "");
    const roomId = String(body.roomId || "");
    let teacherId = String(body.teacherId || "");

    // Teachers may only manage their own timetable
    if (session.role !== "ADMIN") {
      if (!session.staffId) {
        return NextResponse.json(
          { error: "Your account is not linked to a staff record" },
          { status: 403 },
        );
      }
      teacherId = session.staffId;
    }

    const VALID_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const problems: string[] = [];
    if (!VALID_DAYS.includes(day))
      problems.push("day must be one of Mon/Tue/Wed/Thu/Fri");
    if (!Number.isInteger(period) || period < 1 || period > 6)
      problems.push("period must be 1-6");
    if (!grade) problems.push("grade is required");
    if (!subjectId) problems.push("subjectId is required");
    if (!roomId) problems.push("roomId is required");
    if (!teacherId) problems.push("teacherId is required");
    if (problems.length) {
      return NextResponse.json(
        { error: "Invalid input", details: problems },
        { status: 400 },
      );
    }

    const [subject, room, teacher] = await Promise.all([
      prisma.subject.findUnique({ where: { id: subjectId } }),
      prisma.room.findUnique({ where: { id: roomId } }),
      prisma.staff.findUnique({ where: { id: teacherId } }),
    ]);
    if (!subject)
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    if (!room)
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    if (!teacher)
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });

    // Clash detection for the weekly grid
    const clashes = await prisma.timetableSlot.findMany({
      where: {
        day,
        period,
        OR: [{ teacherId }, { roomId }, { grade }],
      },
      include: { teacher: true, room: true, subject: true },
    });
    const conflicts = clashes.map((c) => {
      if (c.teacherId === teacherId)
        return `${c.teacher.name} already teaches ${c.grade} (${c.subject.name}) at ${day} P${period}`;
      if (c.roomId === roomId)
        return `Room ${c.room.roomNumber} is already occupied by ${c.grade} at ${day} P${period}`;
      return `${c.grade} already has ${c.subject.name} scheduled at ${day} P${period}`;
    });
    if (conflicts.length) {
      return NextResponse.json(
        { error: "Scheduling conflict", details: conflicts },
        { status: 409 },
      );
    }

    if (subject.requiresLab && room.type !== "LAB") {
      return NextResponse.json(
        {
          error: "Scheduling conflict",
          details: [
            `${subject.name} requires a LAB room; ${room.roomNumber} is ${room.type}`,
          ],
        },
        { status: 409 },
      );
    }

    const slot = await prisma.timetableSlot.create({
      data: { day, period, grade, subjectId, teacherId, roomId },
      include: { subject: true, teacher: true, room: true },
    });

    return NextResponse.json(
      {
        slot: {
          id: slot.id,
          day: slot.day,
          period: slot.period,
          grade: slot.grade,
          subjectName: slot.subject.name,
          teacherName: slot.teacher.name,
          roomName: slot.room.roomNumber,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[api/timetable] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create timetable slot" },
      { status: 500 },
    );
  }
}
