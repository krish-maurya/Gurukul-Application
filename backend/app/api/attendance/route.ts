import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { draftAbsenceMessages } from "@/lib/communication/engine";
import { AuthError, requireSession } from "@/lib/auth/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade") || "Grade 10A";
    const date =
      searchParams.get("date") || new Date().toISOString().split("T")[0];
    const section = searchParams.get("section") || "A";

    const existingRecord = await prisma.attendanceRecord.findFirst({
      // Attendance is taken once per class and day. `period` remains in the
      // database for backwards compatibility with existing records only.
      where: { grade, section, date },
      include: {
        entries: true,
      },
    });

    return NextResponse.json({ record: existingRecord });
  } catch (error) {
    console.error("[api/attendance] request failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    // Teachers submit for their classes; admins may submit for any class.
    if (!session.staffId && session.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Your account is not linked to a staff profile, so attendance cannot be recorded.",
        },
        { status: 403 },
      );
    }
    const staffId = session.staffId ?? null;

    const body = await req.json();
    const { grade, section = "A", date, entries } = body;

    if (
      typeof grade !== "string" ||
      typeof date !== "string" ||
      !Array.isArray(entries) ||
      entries.length === 0
    ) {
      return NextResponse.json(
        { error: "Choose a class and include at least one student." },
        { status: 400 },
      );
    }

    const requestedStudentIds = entries
      .map((entry: { studentId?: unknown }) => entry.studentId)
      .filter(
        (studentId: unknown): studentId is string =>
          typeof studentId === "string",
      );
    const validStudents = await prisma.student.findMany({
      where: { id: { in: requestedStudentIds }, grade },
      select: { id: true, rollNumber: true },
    });
    if (validStudents.length !== entries.length) {
      return NextResponse.json(
        { error: "The class list changed. Refresh the page and try again." },
        { status: 400 },
      );
    }
    const studentsById = new Map(
      validStudents.map((student) => [student.id, student]),
    );

    // Single Atomic Transaction Write
    const result = await prisma.$transaction(async (tx) => {
      // Check if existing record exists for today to update instead of duplicating
      const existing = await tx.attendanceRecord.findFirst({
        where: { grade, section, date },
      });

      let recordId: string;

      if (existing) {
        // Delete old entries and re-write updated ones
        await tx.attendanceEntry.deleteMany({
          where: { attendanceRecordId: existing.id },
        });
        const updated = await tx.attendanceRecord.update({
          where: { id: existing.id },
          data: { status: "SUBMITTED" },
        });
        recordId = updated.id;
      } else {
        const created = await tx.attendanceRecord.create({
          data: {
            grade,
            section,
            date,
            period: 1,
            takenByTeacherId: staffId,
            status: "SUBMITTED",
          },
        });
        recordId = created.id;
      }

      // Bulk write all entries (present & absent) in single transaction
      const entriesToCreate = entries.map(
        (e: { studentId: string; status: string }) => ({
          attendanceRecordId: recordId,
          studentId: e.studentId,
          rollNumber: studentsById.get(e.studentId)!.rollNumber,
          status: e.status === "ABSENT" ? "ABSENT" : "PRESENT",
        }),
      );

      await tx.attendanceEntry.createMany({
        data: entriesToCreate,
      });

      return { recordId, totalEntries: entriesToCreate.length };
    });

    // Absence notices are automatically sent to the parent portal.
    let parentDrafts = 0;
    try {
      const absentees = entries.filter(
        (e: { status: string }) => e.status === "ABSENT",
      );
      parentDrafts = await draftAbsenceMessages(absentees, date, grade);
    } catch (e) {
      console.warn("[attendance] absence draft generation failed:", e);
    }

    return NextResponse.json({
      success: true,
      result,
      parentDrafts,
      parentNotified: parentDrafts,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("Attendance transaction error:", error);
    return NextResponse.json(
      { error: "Single transaction attendance write failed" },
      { status: 500 },
    );
  }
}
