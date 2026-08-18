import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";
import { draftFeeReminders } from "@/lib/communication/engine";

export const dynamic = "force-dynamic";

/** GET /api/communications?status=DRAFT|SENT|ACKNOWLEDGED&q= — list messages */
export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const q = searchParams.get("q")?.trim();
    const validTypes = ["ABSENCE", "FEE", "ANNOUNCEMENT", "CUSTOM"];
    const messageType = type && validTypes.includes(type) ? type : undefined;

    const messages = await prisma.parentMessage.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(messageType ? { type: messageType } : {}),
        ...(q
          ? { student: { name: { contains: q, mode: "insensitive" } } }
          : {}),
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            grade: true,
            rollNumber: true,
            parentName: true,
            parentEmail: true,
            portalToken: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    const counts = await prisma.parentMessage.groupBy({
      by: ["status"],
      _count: { _all: true },
    });
    const stats = Object.fromEntries(
      counts.map((c) => [c.status, c._count._all]),
    );

    return NextResponse.json({ messages, stats });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/communications] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/communications — compose message(s).
 * Body: { title, body, type?, studentIds?: string[], grade?: string }
 * Creates DRAFTS — nothing reaches a parent until Send is clicked.
 */
export async function POST(req: Request) {
  try {
    await requireSession();
    const payload = await req.json().catch(() => ({}));
    const title = String(payload.title || "").trim();
    const body = String(payload.body || "").trim();
    const type = ["ABSENCE", "FEE", "ANNOUNCEMENT", "CUSTOM"].includes(
      payload.type,
    )
      ? payload.type
      : "CUSTOM";

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 },
      );
    }

    let studentIds: string[] = Array.isArray(payload.studentIds)
      ? payload.studentIds.filter((x: unknown) => typeof x === "string")
      : [];
    if (payload.grade && typeof payload.grade === "string") {
      const gradeStudents = await prisma.student.findMany({
        where: { grade: payload.grade, status: "ADMITTED" },
        select: { id: true },
      });
      studentIds = [
        ...new Set([...studentIds, ...gradeStudents.map((s) => s.id)]),
      ];
    }
    if (studentIds.length === 0) {
      return NextResponse.json(
        { error: "Choose at least one student or a grade" },
        { status: 400 },
      );
    }

    const created = await prisma.parentMessage.createMany({
      data: studentIds.map((studentId) => ({ studentId, type, title, body })),
    });

    return NextResponse.json({ created: created.count }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/communications] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create messages" },
      { status: 500 },
    );
  }
}

/** PUT /api/communications — generate drafts from live data (fee reminders). */
export async function PUT() {
  try {
    await requireSession();
    const feeDrafts = await draftFeeReminders();
    return NextResponse.json({ created: feeDrafts });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/communications] PUT failed:", error);
    return NextResponse.json(
      { error: "Failed to generate drafts" },
      { status: 500 },
    );
  }
}
