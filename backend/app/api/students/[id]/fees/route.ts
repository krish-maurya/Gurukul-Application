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

/** GET /api/students/[id]/fees — fee account with payment history */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const account = await prisma.feeAccount.findUnique({
      where: { studentId: params.id },
      include: { payments: { orderBy: { paidAt: "desc" } } },
    });
    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/students/id/fees] GET failed:", error);
    return NextResponse.json({ error: "Failed to load fees" }, { status: 500 });
  }
}

/**
 * PUT /api/students/[id]/fees — create or update the fee account (ADMIN only)
 * Body: { amountDue, dueDate (YYYY-MM-DD), academicYear? }
 */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession("ADMIN");

    const student = await prisma.student.findUnique({
      where: { id: params.id },
    });
    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const amountDue = Number(body.amountDue);
    const dueDate = String(body.dueDate || "");
    const academicYear = String(body.academicYear || "2026-27");

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

    const existing = await prisma.feeAccount.findUnique({
      where: { studentId: params.id },
    });
    const amountPaid = existing?.amountPaid ?? 0;

    const account = await prisma.feeAccount.upsert({
      where: { studentId: params.id },
      create: {
        studentId: params.id,
        academicYear,
        amountDue: Math.round(amountDue),
        dueDate,
        status: computeStatus(Math.round(amountDue), 0, dueDate),
      },
      update: {
        academicYear,
        amountDue: Math.round(amountDue),
        dueDate,
        status: computeStatus(Math.round(amountDue), amountPaid, dueDate),
      },
      include: { payments: { orderBy: { paidAt: "desc" } } },
    });

    return NextResponse.json({ account });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/students/id/fees] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to save fee account" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/students/[id]/fees — record a payment (ADMIN only)
 * Body: { amount, method: "CASH" | "UPI" | "CARD" | "BANK" }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession("ADMIN");

    const body = await req.json().catch(() => ({}));
    const amount = Number(body.amount);
    const method = ["CASH", "UPI", "CARD", "BANK"].includes(body.method)
      ? body.method
      : "CASH";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Payment amount must be a positive number" },
        { status: 400 },
      );
    }

    const existing = await prisma.feeAccount.findUnique({
      where: { studentId: params.id },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Set the fee amount first, then record payments" },
        { status: 409 },
      );
    }
    const remaining = existing.amountDue - existing.amountPaid;
    if (amount > remaining) {
      return NextResponse.json(
        {
          error: `Payment exceeds remaining balance (₹${remaining.toLocaleString("en-IN")})`,
        },
        { status: 400 },
      );
    }

    const today = new Date().toLocaleDateString("en-CA");
    const receiptNo = `RCPT-${Date.now().toString(36).toUpperCase()}`;

    const account = await prisma.$transaction(async (tx) => {
      await tx.feePayment.create({
        data: {
          feeAccountId: existing.id,
          amount: Math.round(amount),
          paidAt: today,
          method,
          receiptNo,
        },
      });
      const newPaid = existing.amountPaid + Math.round(amount);
      return tx.feeAccount.update({
        where: { id: existing.id },
        data: {
          amountPaid: newPaid,
          status: computeStatus(existing.amountDue, newPaid, existing.dueDate),
        },
        include: { payments: { orderBy: { paidAt: "desc" } } },
      });
    });

    return NextResponse.json({ account, receiptNo }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/students/id/fees] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to record payment" },
      { status: 500 },
    );
  }
}
