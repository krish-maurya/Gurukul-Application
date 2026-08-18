import { prisma } from "@/lib/prisma";
import type { CopilotContext } from "./types";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Grades a teacher is assigned to via timetable (same logic as attendance API). */
export async function getTeacherGrades(
  staffId: string | null | undefined,
): Promise<string[]> {
  if (!staffId) return [];
  const slots = await prisma.timetableSlot.findMany({
    where: { teacherId: staffId },
    select: { grade: true },
    distinct: ["grade"],
  });
  return slots.map((s) => s.grade).sort();
}

export async function getDefaultTeacherGrade(
  staffId: string | null | undefined,
): Promise<string | undefined> {
  if (!staffId) return undefined;
  const slots = await prisma.timetableSlot.findMany({
    where: { teacherId: staffId },
    select: { grade: true, day: true, period: true },
    orderBy: { period: "asc" },
  });
  const today = WEEKDAYS[new Date().getDay()];
  const todayFirst = slots
    .filter((s) => s.day === today)
    .sort((a, b) => a.period - b.period)[0];
  const grades = Array.from(new Set(slots.map((s) => s.grade))).sort();
  return todayFirst?.grade ?? grades[0];
}

export function teacherCanAccessGrade(
  context: CopilotContext,
  grade: string | undefined,
  allowedGrades: string[],
): boolean {
  if (context.role === "ADMIN" || !grade) return true;
  return allowedGrades.includes(grade);
}

export function denyGradeAccess(
  context: CopilotContext,
  grade: string,
  allowedGrades: string[],
): string {
  return `You don't have access to ${grade}. Your assigned classes: ${allowedGrades.length ? allowedGrades.join(", ") : "none on file"}.`;
}

export type CopilotHistoryItem = {
  role: string;
  content: string;
  intent?: string;
};

/** Merge short follow-ups with prior user question for better DB retrieval. */
export function enrichQueryWithHistory(
  query: string,
  history: CopilotHistoryItem[],
): string {
  const q = query.trim();
  if (!history.length) return q;

  const lastUser = [...history].reverse().find((m) => m.role === "user");
  const lastAssistant = [...history]
    .reverse()
    .find((m) => m.role === "assistant");
  if (!lastUser) return q;

  const isShort = q.split(/\s+/).length <= 6;
  const isFollowUp =
    isShort &&
    (/\b(again|same|repeat|that|this|those|them|it|him|her|yes|ok|sure)\b/i.test(
      q,
    ) ||
      /\b(what about|how about|and for|now for)\b/i.test(q) ||
      (lastAssistant?.intent &&
        !/\b(who|which|how many|show|list|open)\b/i.test(q)));

  if (!isFollowUp) return q;

  if (/\b(again|same|repeat|refresh)\b/i.test(q)) return lastUser.content;

  if (/\b(what about|how about)\b/i.test(q)) {
    const modifier = q
      .replace(/\b(what|how|about|and|for|the|now)\b/gi, " ")
      .trim();
    if (modifier) return `${lastUser.content} ${modifier}`;
  }

  // Carry forward intent context: "roll 7" after "who is absent in 10A"
  if (
    lastAssistant?.intent === "ATTENDANCE_QUERY" &&
    /\broll\b/i.test(q) &&
    !/absent|present|attendance/i.test(q)
  ) {
    return `${lastUser.content} ${q}`;
  }

  if (lastAssistant?.intent === "STUDENT_QUERY" && q.split(/\s+/).length <= 3) {
    return `${lastUser.content} ${q}`;
  }

  return q;
}
