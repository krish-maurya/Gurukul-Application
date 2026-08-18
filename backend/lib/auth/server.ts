import "server-only";
import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserSession } from "./index";

const COOKIE_NAME = "gurukul_session";
const SESSION_DAYS = 7;

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET env variable is not set");
  return new TextEncoder().encode(secret);
}

/* ---------------- passwords ---------------- */

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/* ---------------- sessions ---------------- */

export interface SessionPayload {
  sub: string; // user id
  role: UserRole;
  staffId?: string | null;
  name: string;
  email: string;
}

export async function createSessionCookie(
  payload: SessionPayload,
): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(getSecret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    path: "/",
  });
}

export function clearSessionCookie(): void {
  cookies().set(COOKIE_NAME, "", { httpOnly: true, maxAge: 0, path: "/" });
}

/** Verify the session JWT from cookies. Returns null when absent/invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const bearerToken = headers().get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearerToken || cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      sub: String(payload.sub),
      role: payload.role as UserRole,
      staffId: (payload.staffId as string | null) ?? null,
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

/** Load the fresh user record for the current session (null if revoked). */
export async function getSessionUser(): Promise<UserSession | null> {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    include: { staff: { select: { id: true, department: true } } },
  });
  if (!user || !user.isActive) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
    avatar: user.avatar ?? undefined,
    department: user.staff?.department,
    staffId: user.staffId,
  };
}

/** Guard for route handlers. Throws a Response-like error object. */
export async function requireSession(role?: UserRole): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new AuthError(401, "Authentication required");
  if (role === "ADMIN" && session.role !== "ADMIN") {
    throw new AuthError(403, "Admin access required");
  }
  return session;
}

export class AuthError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
