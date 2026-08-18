import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";
import { ensurePortalToken } from "@/lib/communication/engine";
import { sendMail, buildPortalLinkEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

/**
 * POST /api/portal-link — generate (and optionally email) a student's
 * parent-portal link. Body: { studentId, email?: string, sendEmail?: boolean }
 */
export async function POST(req: Request) {
  try {
    await requireSession();
    const body = await req.json().catch(() => ({}));
    const studentId = String(body.studentId || "");
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 },
        );
      }
      await prisma.student.update({
        where: { id: studentId },
        data: { parentEmail: email },
      });
    }

    const token = await ensurePortalToken(studentId);
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      req.headers.get("origin") ||
      `http://${req.headers.get("host") || "localhost:3000"}`;
    const portalUrl = `${origin}/p/${token}`;

    const targetEmail = email || student.parentEmail;
    let emailed = false;
    let emailError: string | undefined;
    if (body.sendEmail && targetEmail) {
      if (!process.env.BREVO_API_KEY) {
        emailError =
          "Email service is not configured (BREVO_API_KEY missing) — copy the link instead.";
      } else {
        try {
          const mail = buildPortalLinkEmail({
            parentName: student.parentName,
            studentName: student.name,
            portalUrl,
          });
          await sendMail({
            to: { email: targetEmail, name: student.parentName },
            ...mail,
          });
          emailed = true;
        } catch (e) {
          emailError = "Email could not be sent — copy the link instead.";
          console.warn("[portal-link] email failed:", e);
        }
      }
    }

    return NextResponse.json({
      portalUrl,
      emailed,
      emailError,
      parentEmail: targetEmail || null,
    });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/portal-link] failed:", error);
    return NextResponse.json(
      { error: "Failed to create portal link" },
      { status: 500 },
    );
  }
}
