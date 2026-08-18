import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

function computeStatus(
  amountDue: number,
  amountPaid: number,
  dueDate: string,
): string {
  if (amountPaid >= amountDue && amountDue > 0) return "PAID";
  const today = new Date().toLocaleDateString("en-CA");
  if (dueDate < today) return "OVERDUE";
  return amountPaid > 0 ? "PARTIAL" : "PENDING";
}

/**
 * POST /api/fees/batch — set the SAME fee for every admitted student of a
 * STANDARD at once (ADMIN only). Fees don't differ by division, so
 * "Grade 10" covers Grade 10A + Grade 10B together. Individual students
 * can still be adjusted afterwards through Manage Fees on the student panel.
 *
 * Body: {
 *   grade: string,      // standard, e.g. "Grade 10" (matches all divisions)
 *   amountDue: number,
 *   dueDate: "YYYY-MM-DD",
 *   academicYear?: string,
 *   overwrite?: boolean   // false (default): only students WITHOUT a fee yet
 *                         // true: also update existing accounts (payments kept)
 * }
 */
export async function POST(req: Request) {
  try {
    await requireSession("ADMIN");

    const body = await req.json().catch(() => ({}));
    const grade = String(body.grade || "").trim();
    const amountDue = Number(body.amountDue);
    const dueDate = String(body.dueDate || "");
    const academicYear = String(body.academicYear || "2026-27");
    const overwrite = body.overwrite === true;

    if (!grade)
      return NextResponse.json({ error: "Choose a standard" }, { status: 400 });
    if (!Number.isFinite(amountDue) || amountDue <= 0) {
      return NextResponse.json(
        { error: "Amount due must be a positive number" },
        { status: 400 },
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      return NextResponse.json(
        { error: "Due date must be YYYY-MM-DD" },
        { status: 400 },
      );
    }

    // Match every division of the standard: "Grade 10" -> Grade 10A, Grade 10B...
    const students = await prisma.student.findMany({
      where: {
        grade: { startsWith: grade, mode: "insensitive" },
        status: "ADMITTED",
      },
      select: {
        id: true,
        feeAccount: { select: { id: true, amountPaid: true } },
      },
    });
    if (students.length === 0) {
      return NextResponse.json(
        { error: `No admitted students found in ${grade}` },
        { status: 404 },
      );
    }

    const due = Math.round(amountDue);
    const withoutAccount = students.filter((s) => !s.feeAccount);
    const withAccount = students.filter((s) => s.feeAccount);

    const result = await prisma.$transaction(async (tx) => {
      // create for students who have no fee account yet
      if (withoutAccount.length > 0) {
        await tx.feeAccount.createMany({
          data: withoutAccount.map((s) => ({
            studentId: s.id,
            academicYear,
            amountDue: due,
            dueDate,
            status: computeStatus(due, 0, dueDate),
          })),
        });
      }

      // optionally update existing ones — payments are preserved,
      // status recomputed per student from their amountPaid
      let updated = 0;
      if (overwrite) {
        for (const s of withAccount) {
          await tx.feeAccount.update({
            where: { id: s.feeAccount!.id },
            data: {
              academicYear,
              amountDue: due,
              dueDate,
              status: computeStatus(due, s.feeAccount!.amountPaid, dueDate),
            },
          });
          updated++;
        }
      }

      return {
        created: withoutAccount.length,
        updated,
        skipped: overwrite ? 0 : withAccount.length,
      };
    });

    return NextResponse.json({
      ...result,
      totalStudents: students.length,
      grade,
      amountDue: due,
      dueDate,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/fees/batch] failed:", error);
    return NextResponse.json(
      { error: "Failed to set class fees" },
      { status: 500 },
    );
  }
}
