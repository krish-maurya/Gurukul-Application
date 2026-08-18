import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 20;

type SearchResult = {
  id: string;
  name: string;
  type: "student" | "teacher";
  detail: string;
};

type TeacherSearchRecord = {
  id: string;
  name: string;
  email: string;
  department: string;
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const includeTeachers =
    request.nextUrl.searchParams.get("people") !== "students";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    // Query only matching rows. Prefix queries are separate so they can be
    // deterministically shown before broader contains matches.
    const [
      startingStudents,
      matchingStudents,
      startingTeachers,
      matchingTeachers,
    ] = await Promise.all([
      prisma.student.findMany({
        where: { name: { startsWith: query, mode: "insensitive" } },
        select: { id: true, name: true, rollNumber: true, grade: true },
        orderBy: { name: "asc" },
        take: MAX_RESULTS,
      }),
      prisma.student.findMany({
        where: { name: { contains: query, mode: "insensitive" } },
        select: { id: true, name: true, rollNumber: true, grade: true },
        orderBy: { name: "asc" },
        take: MAX_RESULTS,
      }),
      includeTeachers
        ? prisma.staff.findMany({
            where: { name: { startsWith: query, mode: "insensitive" } },
            select: { id: true, name: true, email: true, department: true },
            orderBy: { name: "asc" },
            take: MAX_RESULTS,
          })
        : Promise.resolve([] as TeacherSearchRecord[]),
      includeTeachers
        ? prisma.staff.findMany({
            where: { name: { contains: query, mode: "insensitive" } },
            select: { id: true, name: true, email: true, department: true },
            orderBy: { name: "asc" },
            take: MAX_RESULTS,
          })
        : Promise.resolve([] as TeacherSearchRecord[]),
    ]);

    const toStudentResult = (
      student: (typeof matchingStudents)[number],
    ): SearchResult => ({
      id: student.id,
      name: student.name,
      type: "student",
      detail: `Roll ${student.rollNumber} - ${student.grade}`,
    });
    const toTeacherResult = (
      teacher: (typeof matchingTeachers)[number],
    ): SearchResult => ({
      id: teacher.id,
      name: teacher.name,
      type: "teacher",
      detail: teacher.email || teacher.department,
    });

    const seen = new Set<string>();
    const results = [
      ...startingStudents.map(toStudentResult),
      ...startingTeachers.map(toTeacherResult),
      ...matchingStudents.map(toStudentResult),
      ...matchingTeachers.map(toTeacherResult),
    ]
      .filter((result) => {
        const key = `${result.type}:${result.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, MAX_RESULTS);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Global person search failed:", error);
    return NextResponse.json(
      { error: "Failed to search people" },
      { status: 500 },
    );
  }
}
