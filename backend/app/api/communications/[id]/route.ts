import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/communications/[id]/send — the manual Send click.
 * Marks the message SENT so it appears in the student's private parent portal.
 * Only the initial admission/portal-link message is emailed.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireSession();

    const message = await prisma.parentMessage.findUnique({
      where: { id: params.id },
      include: {
        student: {
          select: { id: true, name: true, parentName: true, parentEmail: true },
        },
      },
    });
    if (!message)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Message was already sent" },
        { status: 409 },
      );
    }

    const updated = await prisma.parentMessage.update({
      where: { id: message.id },
      data: { status: "SENT", sentAt: new Date(), sentByName: session.name },
    });

    // The parent receives the first portal-link email at admission. Every
    // subsequent school message is delivered inside that private portal only.
    return NextResponse.json({ message: updated, emailed: false });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/communications/send] failed:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
}

/** DELETE /api/communications/[id] — discard a draft. */
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession();
    const message = await prisma.parentMessage.findUnique({
      where: { id: params.id },
    });
    if (!message)
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    if (message.status !== "DRAFT") {
      return NextResponse.json(
        { error: "Only drafts can be deleted" },
        { status: 409 },
      );
    }
    await prisma.parentMessage.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/communications/delete] failed:", error);
    return NextResponse.json(
      { error: "Failed to delete draft" },
      { status: 500 },
    );
  }
}
