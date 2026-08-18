import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";
import { sendMail, buildInviteEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

const INVITE_EXPIRY_DAYS = 7;

/**
 * POST /api/auth/invite  (ADMIN only)
 * Creates a Staff record + an invitation token, then emails the invite link
 * to the teacher via Brevo.
 */
export async function POST(req: Request) {
  try {
    await requireSession("ADMIN");

    const body = await req.json().catch(() => ({}));
    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const department = String(body.department || "").trim();

    if (!name || !email || !department) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          details: ["name", "email", "department"].filter((k) => !body[k]),
        },
        { status: 400 },
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Refuse duplicates
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const token = randomBytes(24).toString("hex");
    const expiresAt = new Date(
      Date.now() + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
    );

    const result = await prisma.$transaction(async (tx) => {
      // Reuse staff record if the email matches an existing staff member
      let staff = await tx.staff.findUnique({ where: { email } });
      if (!staff) {
        staff = await tx.staff.create({
          data: {
            name,
            email,
            department,
            maxPeriodsPerDay: Number(body.maxPeriodsPerDay) || 4,
            maxPeriodsPerWeek: Number(body.maxPeriodsPerWeek) || 24,
          },
        });
      }

      // Replace any previous (unused) invitation for this staff member
      await tx.invitation.deleteMany({
        where: { staffId: staff.id, usedAt: null },
      });

      const invitation = await tx.invitation.create({
        data: {
          token,
          email,
          name,
          role: "TEACHER",
          staffId: staff.id,
          expiresAt,
        },
      });
      return { staff, invitation };
    });

    const origin =
      req.headers.get("origin") ||
      `http://${req.headers.get("host") || "localhost:3000"}`;
    const inviteUrl = `${origin}/invite/${result.invitation.token}`;

    // Send the invitation email via Brevo
    let emailSent = false;
    try {
      await sendMail({
        to: { email, name },
        subject: "You're invited to join Gurukul",
        htmlContent: buildInviteEmail({
          teacherName: name,
          inviteUrl,
          expiresInDays: INVITE_EXPIRY_DAYS,
        }),
      });
      emailSent = true;
    } catch (mailErr) {
      // Log but don't fail the invitation — the URL is still valid
      console.error("[api/auth/invite] email delivery failed:", mailErr);
    }

    return NextResponse.json(
      {
        inviteUrl,
        emailSent,
        expiresAt: result.invitation.expiresAt,
        staffId: result.staff.id,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[api/auth/invite] failed:", error);
    return NextResponse.json(
      { error: "Failed to create invitation" },
      { status: 500 },
    );
  }
}
