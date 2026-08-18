import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export interface NotificationItem {
  id: string;
  type: "DOCUMENT" | "PROXY" | "ADMISSION" | "LEAVE" | "PARENT_MSG";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

/**
 * GET /api/notifications — actionable items built from live data:
 * documents waiting for review, uncovered substitute (proxy) slots,
 * pending admissions and today's teacher leaves.
 */
export async function GET() {
  try {
    const session = await requireSession();
    const today = new Date().toLocaleDateString("en-CA");

    const [docs, proxies, pendingStudents, leaves] = await Promise.all([
      prisma.documentRecord.findMany({
        where: { status: "NEEDS_REVIEW" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, fileName: true, createdAt: true },
      }),
      prisma.proxyAssignment.findMany({
        where: { status: "PENDING", date: { gte: today } },
        include: { timetableSlot: { include: { subject: true } } },
        orderBy: { date: "asc" },
        take: 15,
      }),
      prisma.student.findMany({
        where: { status: "PENDING" },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, grade: true, createdAt: true },
      }),
      prisma.teacherLeave.findMany({
        where: { date: today, status: "APPROVED" },
        include: { teacher: { select: { name: true } } },
        take: 10,
      }),
    ]);

    const draftCount = await prisma.parentMessage.count({
      where: { status: "DRAFT" },
    });

    const isAdmin = session.role === "ADMIN";

    const items: NotificationItem[] = [
      ...(draftCount > 0
        ? [
            {
              id: "parent-drafts",
              type: "PARENT_MSG" as const,
              title: "Parent messages ready to send",
              detail: `${draftCount} draft${draftCount === 1 ? "" : "s"} waiting for review`,
              href: "/communications",
              createdAt: new Date().toISOString(),
            },
          ]
        : []),
      ...docs.map((d) => ({
        id: `doc-${d.id}`,
        type: "DOCUMENT" as const,
        title: "Document needs review",
        detail: d.fileName,
        href: "/documents",
        createdAt: new Date(d.createdAt).toISOString(),
      })),
      // substitute coverage is an admin task
      ...(isAdmin
        ? proxies.map((p) => ({
            id: `proxy-${p.id}`,
            type: "PROXY" as const,
            title: "Class needs a substitute teacher",
            detail: `${p.timetableSlot.grade} · ${p.timetableSlot.subject.name} · ${p.timetableSlot.day} P${p.timetableSlot.period} (${p.date})`,
            href: "/timetable",
            createdAt: new Date(p.createdAt).toISOString(),
          }))
        : []),
      ...(isAdmin
        ? pendingStudents.map((s) => ({
            id: `adm-${s.id}`,
            type: "ADMISSION" as const,
            title: "Admission pending approval",
            detail: `${s.name} · ${s.grade}`,
            href: `/students?sel=${s.id}`,
            createdAt: new Date(s.createdAt).toISOString(),
          }))
        : []),
      ...leaves.map((l) => ({
        id: `leave-${l.id}`,
        type: "LEAVE" as const,
        title: "Teacher on leave today",
        detail: `${l.teacher.name}${l.reason ? ` — ${l.reason}` : ""}`,
        href: "/timetable",
        createdAt: new Date(l.createdAt).toISOString(),
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return NextResponse.json({ items, count: items.length });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status },
      );
    }
    console.error("[api/notifications] failed:", error);
    return NextResponse.json({ items: [], count: 0 });
  }
}
