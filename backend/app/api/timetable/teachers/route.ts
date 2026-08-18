import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const teachers = await prisma.staff.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, department: true },
  });
  return NextResponse.json({ teachers });
}
