import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ user: null }, { status: 401 });
    return NextResponse.json({ user });
  } catch (error) {
    console.error("[api/auth/me] failed:", error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
