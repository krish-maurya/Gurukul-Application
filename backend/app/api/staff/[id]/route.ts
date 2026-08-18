import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

/** PATCH /api/staff/[id] — edit teacher info (ADMIN only) */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireSession("ADMIN");

    const existing = await prisma.staff.findUnique({
      where: { id: params.id },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Staff member not found" },
        { status: 404 },
      );

    const body = await req.json().catch(() => ({}));
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : undefined);

    const name = str(body.name);
    const email = str(body.email)?.toLowerCase();
    const department = str(body.department);
    if (name !== undefined && !name)
      return NextResponse.json(
        { error: "Name cannot be empty" },
        { status: 400 },
      );
    if (department !== undefined && !department)
      return NextResponse.json(
        { error: "Department cannot be empty" },
        { status: 400 },
      );
    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { error: "Invalid email address" },
          { status: 400 },
        );
      }
      const clash = await prisma.staff.findFirst({
        where: { email, id: { not: params.id } },
      });
      if (clash)
        return NextResponse.json(
          { error: "Another staff member already uses this email" },
          { status: 409 },
        );
    }

    const maxPerDay =
      body.maxPeriodsPerDay !== undefined
        ? Number(body.maxPeriodsPerDay)
        : undefined;
    const maxPerWeek =
      body.maxPeriodsPerWeek !== undefined
        ? Number(body.maxPeriodsPerWeek)
        : undefined;
    if (
      maxPerDay !== undefined &&
      (!Number.isInteger(maxPerDay) || maxPerDay < 1 || maxPerDay > 8)
    ) {
      return NextResponse.json(
        { error: "Max periods/day must be 1-8" },
        { status: 400 },
      );
    }
    if (
      maxPerWeek !== undefined &&
      (!Number.isInteger(maxPerWeek) || maxPerWeek < 1 || maxPerWeek > 40)
    ) {
      return NextResponse.json(
        { error: "Max periods/week must be 1-40" },
        { status: 400 },
      );
    }

    const staff = await prisma.$transaction(async (tx) => {
      const updated = await tx.staff.update({
        where: { id: params.id },
        data: {
          ...(name !== undefined ? { name } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(department !== undefined ? { department } : {}),
          ...(maxPerDay !== undefined ? { maxPeriodsPerDay: maxPerDay } : {}),
          ...(maxPerWeek !== undefined
            ? { maxPeriodsPerWeek: maxPerWeek }
            : {}),
          ...(typeof body.isActive === "boolean"
            ? { isActive: body.isActive }
            : {}),
        },
      });
      // keep the login account's name/email in sync when linked
      const user = await tx.user.findUnique({ where: { staffId: params.id } });
      if (user) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(email !== undefined ? { email } : {}),
            ...(typeof body.isActive === "boolean"
              ? { isActive: body.isActive }
              : {}),
          },
        });
      }
      return updated;
    });

    return NextResponse.json(staff);
  } catch (error) {
    if (error instanceof AuthError)
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    console.error("[api/staff/id] PATCH failed:", error);
    return NextResponse.json(
      { error: "Failed to update staff member" },
      { status: 500 },
    );
  }
}
