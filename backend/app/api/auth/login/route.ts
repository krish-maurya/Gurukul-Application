import { NextResponse } from "next/server";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createSessionCookie } from "@/lib/auth/server";
import type { UserRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }

  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { staff: { select: { department: true } } },
    });

    // Same generic error for unknown email / wrong password (no user enumeration)
    if (
      !user ||
      !user.isActive ||
      !(await verifyPassword(password, user.passwordHash))
    ) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await new SignJWT({ sub: user.id, role: user.role as UserRole, staffId: user.staffId, name: user.name, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuedAt()
      .setExpirationTime(`${7}d`)
      .sign(new TextEncoder().encode(process.env.AUTH_SECRET));

    await createSessionCookie({
      sub: user.id,
      role: user.role as UserRole,
      staffId: user.staffId,
      name: user.name,
      email: user.email,
    });

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        department: user.staff?.department,
        staffId: user.staffId,
      },
    });
  } catch (error) {
    console.error("[api/auth/login] failed:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
