import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** GET /api/timetable/meta — dropdown data for the add-slot form */
export async function GET() {
  try {
    await requireSession();
    const [subjects, rooms, teachers, gradeRows] = await Promise.all([
      prisma.subject.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true, code: true, requiresLab: true },
      }),
      prisma.room.findMany({
        where: { isAvailable: true },
        orderBy: { roomNumber: "asc" },
        select: {
          id: true,
          roomNumber: true,
          building: true,
          type: true,
          capacity: true,
        },
      }),
      prisma.staff.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true, department: true },
      }),
      prisma.timetableSlot.findMany({
        distinct: ["grade"],
        select: { grade: true },
        orderBy: { grade: "asc" },
      }),
    ]);
    const studentGrades = await prisma.student.findMany({
      distinct: ["grade"],
      select: { grade: true },
    });
    const grades = Array.from(
      new Set([
        ...gradeRows.map((g) => g.grade),
        ...studentGrades.map((g) => g.grade),
      ]),
    ).sort();

    return NextResponse.json({ subjects, rooms, teachers, grades });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[api/timetable/meta] failed:", error);
    return NextResponse.json(
      { error: "Failed to load timetable metadata" },
      { status: 500 },
    );
  }
}
