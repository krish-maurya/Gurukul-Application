import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, createSessionCookie } from "@/lib/auth/server";
import type { UserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function findValidInvite(token: string) {
  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { staff: { select: { id: true, department: true } } },
  });
  if (!invite) return { error: "Invitation not found", status: 404 as const };
  if (invite.usedAt)
    return { error: "Invitation already used", status: 410 as const };
  if (invite.expiresAt < new Date())
    return { error: "Invitation expired", status: 410 as const };
  return { invite };
}

/** GET /api/auth/invite/[token] — validate + show invite details (public) */
export async function GET(
  _: Request,
  { params }: { params: { token: string } },
) {
  try {
    const res = await findValidInvite(params.token);
    if ("error" in res)
      return NextResponse.json({ error: res.error }, { status: res.status });
    const { invite } = res;
    return NextResponse.json({
      name: invite.name,
      email: invite.email,
      role: invite.role,
      department: invite.staff?.department,
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error("[api/auth/invite/token] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load invitation" },
      { status: 500 },
    );
  }
}

/** POST /api/auth/invite/[token] — accept: set password, create account, sign in */
export async function POST(
  req: Request,
  { params }: { params: { token: string } },
) {
  try {
    const body = await req.json().catch(() => ({}));
    const password = String(body.password || "");
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    const res = await findValidInvite(params.token);
    if ("error" in res)
      return NextResponse.json({ error: res.error }, { status: res.status });
    const { invite } = res;

    const passwordHash = await hashPassword(password);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: invite.name,
          email: invite.email,
          passwordHash,
          role: invite.role,
          staffId: invite.staffId,
        },
      });
      await tx.invitation.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      return created;
    });

    await createSessionCookie({
      sub: user.id,
      role: user.role as UserRole,
      staffId: user.staffId,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json(
      { ok: true, user: { id: user.id, name: user.name, role: user.role } },
      { status: 201 },
    );
  } catch (error) {
    console.error("[api/auth/invite/token] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to accept invitation" },
      { status: 500 },
    );
  }
}
