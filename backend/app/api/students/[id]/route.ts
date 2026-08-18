import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePortalToken } from "@/lib/communication/engine";
import { sendMail, buildPortalLinkEmail } from "@/lib/mail";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** GET /api/students/[id] — single student (authenticated) */
export async function GET(_: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const student = await prisma.student.findUnique({
      where: { id: params.id },
      include: {
        feeAccount: { include: { payments: { orderBy: { paidAt: "desc" } } } },
      },
    });
    if (!student)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    return NextResponse.json(student);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/students/id] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to load student" },
      { status: 500 },
    );
  }
}

/** PATCH /api/students/[id] — edit student info (ADMIN only) */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession("ADMIN");

    const existing = await prisma.student.findUnique({
      where: { id: params.id },
    });
    if (!existing)
      return NextResponse.json({ error: "Student not found" }, { status: 404 });

    const body = await req.json().catch(() => ({}));

    // Only whitelisted fields; blank strings for required fields are rejected
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);
    const required = {
      name: str(body.name),
      dob: str(body.dob),
      grade: str(body.grade),
      parentName: str(body.parentName),
      contact: str(body.contact),
    };
    for (const [k, v] of Object.entries(required)) {
      if (v !== undefined && v.length === 0) {
        return NextResponse.json(
          { error: `${k} cannot be empty` },
          { status: 400 },
        );
      }
    }

    const parentEmail = str(body.parentEmail);
    if (parentEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
      return NextResponse.json(
        { error: "Invalid parent email address" },
        { status: 400 },
      );
    }

    const status = str(body.status);
    if (status && !["ADMITTED", "PENDING", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const student = await prisma.student.update({
      where: { id: params.id },
      data: {
        ...(required.name !== undefined ? { name: required.name } : {}),
        ...(required.dob !== undefined ? { dob: required.dob } : {}),
        ...(required.grade !== undefined ? { grade: required.grade } : {}),
        ...(required.parentName !== undefined
          ? { parentName: required.parentName }
          : {}),
        ...(required.contact !== undefined
          ? { contact: required.contact }
          : {}),
        ...(parentEmail !== undefined
          ? { parentEmail: parentEmail || null }
          : {}),
        ...(str(body.address) !== undefined
          ? { address: str(body.address) || null }
          : {}),
        ...(str(body.medicalNotes) !== undefined
          ? { medicalNotes: str(body.medicalNotes) || null }
          : {}),
        ...(str(body.previousSchool) !== undefined
          ? { previousSchool: str(body.previousSchool) || null }
          : {}),
        ...(status ? { status } : {}),
      },
    });

    // Send this student's private portal link when an admin first records or
    // changes the parent's email. Ordinary profile edits do not resend it.
    let parentEmailSent = false;
    if (
      parentEmail &&
      parentEmail !== existing.parentEmail &&
      process.env.NEXT_PUBLIC_APP_URL
    ) {
      try {
        const token = await ensurePortalToken(student.id);
        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/p/${token}`;
        await sendMail({
          to: { email: parentEmail, name: student.parentName },
          ...buildPortalLinkEmail({
            parentName: student.parentName,
            studentName: student.name,
            portalUrl,
          }),
        });
        parentEmailSent = true;
      } catch (mailError) {
        console.error(
          "[api/students/id] parent portal email failed:",
          mailError,
        );
      }
    }

    return NextResponse.json({ ...student, parentEmailSent });
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/students/id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update student" },
      { status: 500 },
    );
  }
}
