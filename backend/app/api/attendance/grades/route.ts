import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * GET /api/attendance/grades
 * The classes this user takes attendance for:
 * - TEACHER: grades from THEIR timetable slots, with today's first
 *   lecture's grade as the default (their "current class").
 * - ADMIN: every grade that has admitted students.
 */
export async function GET(request: Request) {
  try {
    const session = await requireSession();
    const requestedDate = new URL(request.url).searchParams.get("date");
    const date = requestedDate && /^\d{4}-\d{2}-\d{2}$/.test(requestedDate)
      ? requestedDate
      : new Date().toLocaleDateString("en-CA");

    const allGrades = (
      await prisma.student.findMany({
        where: { status: "ADMITTED" },
        distinct: ["grade"],
        select: { grade: true },
        orderBy: { grade: "asc" },
      })
    ).map((g) => g.grade);

    if (session.role === "ADMIN" || !session.staffId) {
      return NextResponse.json({
        grades: allGrades.map((grade) => ({ grade, section: grade.match(/([A-Za-z])$/)?.[1] ?? "" })),
        defaultGrade: allGrades[0]
          ? { grade: allGrades[0], section: allGrades[0].match(/([A-Za-z])$/)?.[1] ?? "" }
          : null,
        hasFirstLecture: true,
        scope: "ALL",
      });
    }

    // Teacher: their own classes, ordered by today's schedule
    const slots = await prisma.timetableSlot.findMany({
      where: { teacherId: session.staffId },
      select: { grade: true, day: true, period: true },
      orderBy: { period: "asc" },
    });

    const day = WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
    const firstLecture = slots
      .filter((s) => s.day === day)
      .sort((a, b) => a.period - b.period)[0];

    // Attendance for teachers is tied to the first lecture of the selected
    // day. A later lecture must not silently expose another class.
    if (!firstLecture) {
      return NextResponse.json({
        grades: [],
        defaultGrade: null,
        hasFirstLecture: false,
        message: "YOU HAVE NO FIRST LECTURE",
        scope: "MINE",
      });
    }

    const firstGrade = firstLecture.grade;
    const firstOption = {
      grade: firstGrade,
      section: firstGrade.match(/([A-Za-z])$/)?.[1] ?? "",
    };

    return NextResponse.json({
      grades: [firstOption],
      defaultGrade: firstOption,
      hasFirstLecture: true,
      scope: "MINE",
      day,
      period: firstLecture.period,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/attendance/grades] failed:", error);
    return NextResponse.json(
      { error: "Failed to load classes" },
      { status: 500 },
    );
  }
}
