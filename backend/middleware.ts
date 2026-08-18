import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "gurukul_session";
const PUBLIC_PAGES = ["/login", "/landing"];
const PUBLIC_PAGE_PREFIXES = ["/invite/", "/p/"];
const PUBLIC_API = ["/api/auth/login", "/api/auth/logout", "/api/auth/me"];
const PUBLIC_API_PREFIXES = ["/api/auth/invite/", "/api/portal/"];

async function verifyToken(token: string): Promise<boolean> {
  if (!process.env.AUTH_SECRET) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
    return true;
  } catch {
    return false;
  }
}

async function verifySession(req: NextRequest): Promise<boolean> {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  const bearerToken = req.headers.get("authorization")?.replace("Bearer ", "");
  const token = bearerToken || cookieToken;
  if (!token) return false;
  return verifyToken(token);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PAGES.includes(pathname) ||
    PUBLIC_PAGE_PREFIXES.some((p) => pathname.startsWith(p)) ||
    PUBLIC_API.includes(pathname) ||
    PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (isPublic) return NextResponse.next();

  const authenticated = await verifySession(req);

  if (!authenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    const loginUrl = new URL("/landing", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|tesseract/|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js)$).*)",
  ],
};
