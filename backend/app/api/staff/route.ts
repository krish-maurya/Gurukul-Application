import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** GET /api/staff — list all staff with account/invite status (authenticated) */
export async function GET() {
  try {
    await requireSession();
    const staff = await prisma.staff.findMany({
      orderBy: { name: "asc" },
      include: {
        subjectQualifications: {
          include: { subject: { select: { name: true } } },
        },
        user: { select: { id: true, role: true, isActive: true } },
        invitation: { select: { usedAt: true, expiresAt: true } },
      },
    });

    return NextResponse.json({
      staff: staff.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        department: s.department,
        maxPeriodsPerDay: s.maxPeriodsPerDay,
        maxPeriodsPerWeek: s.maxPeriodsPerWeek,
        isActive: s.isActive,
        subjects: s.subjectQualifications.map((q) => q.subject.name),
        accountStatus: s.user
          ? s.user.role === "ADMIN"
            ? "ADMIN"
            : "ACTIVE"
          : s.invitation && !s.invitation.usedAt
            ? s.invitation.expiresAt < new Date()
              ? "INVITE_EXPIRED"
              : "INVITED"
            : "NO_ACCOUNT",
      })),
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[api/staff] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff" },
      { status: 500 },
    );
  }
}
