import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/portal/[token] — everything a parent needs about their child.
 * Public, protected only by the unguessable token (as designed).
 */
export async function GET(
  _: Request,
  { params }: { params: { token: string } },
) {
  try {
    const student = await prisma.student.findUnique({
      where: { portalToken: params.token },
      include: {
        feeAccount: {
          include: { payments: { orderBy: { paidAt: "desc" }, take: 5 } },
        },
      },
    });
    if (!student) {
      return NextResponse.json(
        {
          error: "This link is not valid. Please ask the school for a new one.",
        },
        { status: 404 },
      );
    }

    const [entries, messages, timetable] = await Promise.all([
      prisma.attendanceEntry.findMany({
        where: { studentId: student.id },
        include: { attendanceRecord: { select: { date: true, grade: true } } },
        orderBy: { attendanceRecord: { date: "desc" } },
        take: 30,
      }),
      prisma.parentMessage.findMany({
        where: {
          studentId: student.id,
          status: { in: ["SENT", "ACKNOWLEDGED"] },
        },
        orderBy: { sentAt: "desc" },
        take: 50,
        select: {
          id: true,
          type: true,
          title: true,
          body: true,
          status: true,
          sentAt: true,
          acknowledgedAt: true,
          sentByName: true,
        },
      }),
      prisma.timetableSlot.findMany({
        where: { grade: student.grade },
        include: {
          subject: { select: { name: true } },
          teacher: { select: { name: true } },
          room: { select: { roomNumber: true } },
        },
        orderBy: [{ day: "asc" }, { period: "asc" }],
      }),
    ]);

    const present = entries.filter((e) => e.status === "PRESENT").length;
    const absent = entries.filter((e) => e.status === "ABSENT").length;
    const total = present + absent;

    return NextResponse.json({
      student: {
        name: student.name,
        grade: student.grade,
        rollNumber: student.rollNumber,
        parentName: student.parentName,
        status: student.status,
      },
      attendance: {
        totalMarked: total,
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : null,
        recent: entries
          .slice(0, 14)
          .map((e) => ({ date: e.attendanceRecord.date, status: e.status })),
      },
      fees: student.feeAccount
        ? {
            academicYear: student.feeAccount.academicYear,
            amountDue: student.feeAccount.amountDue,
            amountPaid: student.feeAccount.amountPaid,
            remaining: Math.max(
              0,
              student.feeAccount.amountDue - student.feeAccount.amountPaid,
            ),
            dueDate: student.feeAccount.dueDate,
            status: student.feeAccount.status,
            payments: student.feeAccount.payments.map((p) => ({
              amount: p.amount,
              paidAt: p.paidAt,
              method: p.method,
              receiptNo: p.receiptNo,
            })),
          }
        : null,
      messages,
      timetable: timetable.map((t) => ({
        day: t.day,
        period: t.period,
        subject: t.subject.name,
        teacher: t.teacher.name,
        room: t.room.roomNumber,
      })),
    });
  } catch (error) {
    console.error("[api/portal] GET failed:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

/** POST /api/portal/[token] — parent acknowledges a message. Body: { messageId } */
export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  try {
    const student = await prisma.student.findUnique({
      where: { portalToken: params.token },
      select: { id: true },
    });
    if (!student)
      return NextResponse.json({ error: "Invalid link" }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const messageId = String(body.messageId || "");
    const message = await prisma.parentMessage.findFirst({
      where: { id: messageId, studentId: student.id, status: "SENT" },
    });
    if (!message)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });

    const updated = await prisma.parentMessage.update({
      where: { id: message.id },
      data: { status: "ACKNOWLEDGED", acknowledgedAt: new Date() },
    });
    return NextResponse.json({
      ok: true,
      acknowledgedAt: updated.acknowledgedAt,
    });
  } catch (error) {
    console.error("[api/portal] POST failed:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 },
    );
  }
}
