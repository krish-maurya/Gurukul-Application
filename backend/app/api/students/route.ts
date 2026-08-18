import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensurePortalToken } from "@/lib/communication/engine";
import { sendMail, buildPortalLinkEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const grade = searchParams.get("grade")?.trim();
    const students = await prisma.student.findMany({
      where: grade ? { grade, status: "ADMITTED" } : undefined,
    });
    // Sort by standard, division, then roll number (10A #1, #2 … 10B … 11A).
    students.sort((a, b) => {
      const gradeA = a.grade.match(/(\d+)\s*([A-Za-z]*)/) || ["", "0", ""];
      const gradeB = b.grade.match(/(\d+)\s*([A-Za-z]*)/) || ["", "0", ""];
      const standard = Number(gradeA[1]) - Number(gradeB[1]);
      if (standard) return standard;
      const division = gradeA[2].localeCompare(gradeB[2], undefined, {
        numeric: true,
      });
      return (
        division || a.rollNumber - b.rollNumber || a.name.localeCompare(b.name)
      );
    });
    return NextResponse.json(students);
  } catch (error) {
    console.error("[api/students] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    // Accept both `name` (GET contract) and `studentName` (OCR/legacy contract)
    const name = (body.name ?? body.studentName) as string | undefined;
    const {
      dob,
      grade,
      parentName,
      parentEmail,
      contact,
      address,
      medicalNotes,
      previousSchool,
    } = body as Record<string, string | undefined>;
    const normalizedParentEmail = parentEmail?.trim().toLowerCase() || null;
    if (
      normalizedParentEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedParentEmail)
    ) {
      return NextResponse.json(
        { error: "Parent email address is invalid" },
        { status: 400 },
      );
    }

    // Validate required fields -> 400 with details instead of an opaque 500
    const missing = Object.entries({ name, dob, grade, parentName, contact })
      .filter(([, v]) => typeof v !== "string" || v.trim().length === 0)
      .map(([k]) => k);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Missing required fields", details: missing },
        { status: 400 },
      );
    }

    // Auto-assign the next roll number within the grade (schema default of 1
    // would otherwise give every student the same roll number).
    const student = await prisma.$transaction(async (tx) => {
      const last = await tx.student.findFirst({
        where: { grade: grade as string },
        orderBy: { rollNumber: "desc" },
        select: { rollNumber: true },
      });
      return tx.student.create({
        data: {
          name: (name as string).trim(),
          rollNumber: (last?.rollNumber ?? 0) + 1,
          dob: dob as string,
          grade: grade as string,
          parentName: parentName as string,
          parentEmail: normalizedParentEmail,
          contact: contact as string,
          address: address ?? null,
          medicalNotes: medicalNotes ?? null,
          previousSchool: previousSchool ?? null,
          status: "ADMITTED",
        },
      });
    });

    // Admission confirmation is sent to the portal and, when the recorded
    // parent email exists, a direct email carries that child's private link.
    await prisma.parentMessage.create({
      data: {
        studentId: student.id,
        type: "ANNOUNCEMENT",
        title: "Welcome to Gurukul — admission confirmed",
        body: `Dear ${student.parentName},\n\nWe are pleased to confirm that ${student.name}'s admission to ${student.grade} has been recorded. Welcome to the Gurukul community.\n\nGurukul School Office`,
        status: "SENT",
        sentAt: new Date(),
        sentByName: "Gurukul Admissions",
      },
    });

    let parentEmailSent = false;
    if (student.parentEmail && process.env.NEXT_PUBLIC_APP_URL) {
      try {
        const token = await ensurePortalToken(student.id);
        const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/p/${token}`;
        await sendMail({
          to: { email: student.parentEmail, name: student.parentName },
          ...buildPortalLinkEmail({
            parentName: student.parentName,
            studentName: student.name,
            portalUrl,
          }),
        });
        parentEmailSent = true;
      } catch (mailError) {
        console.error(
          "[api/students] admission portal email failed:",
          mailError,
        );
      }
    }

    return NextResponse.json({ ...student, parentEmailSent }, { status: 201 });
  } catch (error) {
    console.error("[api/students] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to create student record" },
      { status: 500 },
    );
  }
}
