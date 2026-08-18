import { prisma } from "@/lib/prisma";
import type { CopilotContext } from "./types";

const DAY_ALIASES: Record<string, string> = {
  mon: "Mon",
  monday: "Mon",
  tue: "Tue",
  tues: "Tue",
  tuesday: "Tue",
  wed: "Wed",
  wednesday: "Wed",
  thu: "Thu",
  thur: "Thu",
  thurs: "Thu",
  thursday: "Thu",
  fri: "Fri",
  friday: "Fri",
};

const TIMETABLE_STOP_WORDS = new Set([
  // determiners & prepositions
  "a",
  "an",
  "the",
  "for",
  "of",
  "in",
  "on",
  "at",
  "to",
  "and",
  "or",
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "do",
  "does",
  "did",
  "be",
  "been",
  "being",
  "not",
  "no",
  "yes",
  "its",
  // pronouns & common verbs
  "show",
  "give",
  "get",
  "tell",
  "me",
  "my",
  "mine",
  "our",
  "please",
  "need",
  "want",
  "what",
  "which",
  "who",
  "when",
  "where",
  "how",
  "can",
  "could",
  "would",
  "should",
  "will",
  "shall",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "them",
  "his",
  "her",
  "your",
  "their",
  // conversational words (critical for name extraction)
  "about",
  "named",
  "called",
  "name",
  "details",
  "detail",
  "info",
  "information",
  "data",
  "record",
  "records",
  "check",
  "know",
  "find",
  "lookup",
  "look",
  "this",
  "that",
  "there",
  "here",
  "with",
  "from",
  "by",
  "also",
  "just",
  "only",
  "any",
  "some",
  "if",
  "whether",
  "then",
  "so",
  "but",
  "like",
  "such",
  // timetable-specific
  "timetable",
  "schedule",
  "class",
  "classes",
  "grade",
  "section",
  "period",
  "periods",
  "room",
  "subject",
  "teacher",
  "teachers",
  "prof",
  "professor",
  "dr",
  "sir",
  "mr",
  "mrs",
  "ms",
  "whole",
  "full",
  "complete",
  "all",
  "school",
  "master",
  "weekly",
  "day",
  "today",
  "tomorrow",
]);

export function requestedGrade(query: string): string | undefined {
  const explicit = query.match(/\bgrade\s*(\d{1,2})\s*([a-z])\b/i);
  if (explicit) return `Grade ${explicit[1]}${explicit[2].toUpperCase()}`;

  const compact = query.match(/\b(?:class|grade)?\s*(\d{1,2})\s*([a-z])\b/i);
  if (
    compact &&
    /class|grade|timetable|schedule|student|attendance|section/i.test(query)
  ) {
    return `Grade ${compact[1]}${compact[2].toUpperCase()}`;
  }

  const short = query.match(/\b(\d{1,2}[a-z])\b/i);
  return short ? `Grade ${short[1].toUpperCase()}` : undefined;
}

export function requestedDay(query: string): string | undefined {
  const match = query
    .toLowerCase()
    .match(
      /\b(monday|tuesday|wednesday|thursday|friday|mon|tue|tues|wed|thu|thur|thurs|fri)\b/,
    );
  return match ? DAY_ALIASES[match[1]] : undefined;
}

export function isMyScheduleQuery(query: string) {
  return (
    /\b(my|mine|me)\b/i.test(query) &&
    /\b(timetable|schedule|periods?|classes?\b)/i.test(query)
  );
}

export function isConflictQuery(query: string) {
  return /\b(conflicts?|clashes?|collisions?|double[- ]book(?:ed|ing)?|overlaps?)\b/i.test(
    query,
  );
}

export function nameTerms(
  query: string,
  extraStopWords: string[] = [],
): string[] {
  const stopWords = new Set([
    ...TIMETABLE_STOP_WORDS,
    ...extraStopWords.map((word) => word.toLowerCase()),
  ]);
  return query
    .replace(/[^a-z0-9\s.'-]/gi, " ")
    .split(/\s+/)
    .map((term) => term.replace(/^['"]|['"]$/g, "").trim())
    .filter(
      (term) =>
        term.length > 1 &&
        !stopWords.has(term.toLowerCase()) &&
        !/^\d+$/.test(term),
    )
    .slice(0, 4);
}

export function subjectTerms(query: string): string[] {
  const match = query.match(
    /\b(?:subject|teaches?|teaching)\s+([a-z][a-z\s&]{2,40})/i,
  );
  if (match) return nameTerms(match[1], ["subject", "teaches", "teaching"]);
  return [];
}

export async function resolveStaffByTerms(terms: string[]) {
  if (!terms.length) return [];
  return prisma.staff.findMany({
    where: { AND: terms.map((term) => ({ name: { contains: term } })) },
    select: { id: true, name: true, email: true, department: true },
    take: 6,
  });
}

export async function resolveStaffFromContext(context: CopilotContext) {
  const parts = context.name.split(/\s+/).filter((part) => part.length > 2);
  for (let size = Math.min(3, parts.length); size >= 1; size--) {
    const terms = parts.slice(-size);
    const matches = await resolveStaffByTerms(terms);
    if (matches.length === 1) return matches[0];
    if (matches.length > 1) {
      const exact = matches.find(
        (staff) => staff.name.toLowerCase() === context.name.toLowerCase(),
      );
      if (exact) return exact;
    }
  }
  return null;
}

export async function resolveStaffFromQuery(
  query: string,
  context: CopilotContext,
) {
  if (isMyScheduleQuery(query)) return resolveStaffFromContext(context);

  const terms = nameTerms(query);
  if (!terms.length) return null;

  const matches = await resolveStaffByTerms(terms);
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    const best = matches.find((staff) =>
      terms.every((term) =>
        staff.name.toLowerCase().includes(term.toLowerCase()),
      ),
    );
    return best || null;
  }
  return null;
}

export async function knownGrades() {
  const [timetableGrades, studentGrades] = await Promise.all([
    prisma.timetableSlot.findMany({
      select: { grade: true },
      distinct: ["grade"],
    }),
    prisma.student.findMany({ select: { grade: true }, distinct: ["grade"] }),
  ]);
  return [
    ...new Set(
      [...timetableGrades, ...studentGrades].map((item) => item.grade),
    ),
  ].sort();
}

export async function knownTeachers() {
  return prisma.staff.findMany({
    select: { id: true, name: true, department: true },
    orderBy: { name: "asc" },
    take: 20,
  });
}

export function formatFilterDescription(filters: {
  grade?: string;
  teacher?: string;
  day?: string;
  room?: string;
  period?: number;
}) {
  const parts = [
    filters.teacher ? `for ${filters.teacher}` : "",
    filters.grade ? `in ${filters.grade}` : "",
    filters.room ? `in ${filters.room}` : "",
    filters.day ? `on ${filters.day}` : "",
    filters.period ? `during Period ${filters.period}` : "",
  ].filter(Boolean);
  return parts.length ? ` ${parts.join(" ")}` : "";
}

/** Extract a roll number from queries like "roll no 30", "roll number 30", "roll #30", "rollno 30" */
export function requestedRollNumber(query: string): number | undefined {
  const match = query.match(/\b(?:roll\s*(?:no\.?|number|#)\s*(\d{1,3}))\b/i);
  if (match) return Number(match[1]);
  // Also match standalone "roll 30" when combined with student/class context words
  const shortMatch = query.match(/\broll\s+(\d{1,3})\b/i);
  if (
    shortMatch &&
    /student|class|grade|who|find|show|tell|\d{1,2}[a-z]\b/i.test(query)
  )
    return Number(shortMatch[1]);
  return undefined;
}

/** Extract a room identifier from queries like "Room 101", "room101", "Room101", "science lab a" */
export function requestedRoom(query: string): string | undefined {
  // "Room 101", "Room101", "room 101"
  const roomNum = query.match(/\broom\s*#?\s*(\d{1,4}[a-z]?)\b/i);
  if (roomNum) return `Room ${roomNum[1]}`;
  // "Science Lab A", "Lab A"
  const lab = query.match(/\b((?:science\s+)?lab\s+[a-z])\b/i);
  if (lab)
    return lab[1]
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  return undefined;
}

/**
 * Convert a clock time mention ("10 am", "9:00", "11 AM") into a timetable period number.
 * Assumes standard school periods:
 *   Period 1: 09:00   Period 2: 10:00   Period 3: 11:00
 *   Period 4: 12:00   Period 5: 13:00 (1 PM)   Period 6: 14:00 (2 PM)
 * Also matches explicit "period 2" mentions.
 */
export function requestedPeriod(query: string): number | undefined {
  // Explicit: "period 2", "P2"
  const explicit =
    query.match(/\bperiod\s*(\d)\b/i) || query.match(/\bP(\d)\b/);
  if (explicit) {
    const n = Number(explicit[1]);
    if (n >= 1 && n <= 8) return n;
  }

  // Clock time: "10 am", "10:00", "10:00 am", "9 AM"
  const clock = query.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if (clock) {
    let hour = Number(clock[1]);
    const ampm = clock[3].toLowerCase();
    if (ampm === "pm" && hour < 12) hour += 12;
    if (ampm === "am" && hour === 12) hour = 0;
    // Map hour to period: 9→1, 10→2, 11→3, 12→4, 13→5, 14→6
    const period = hour - 8;
    if (period >= 1 && period <= 8) return period;
  }

  // 24-hour: "10:00" without am/pm
  const h24 = query.match(/\b(\d{1,2}):(\d{2})\b/);
  if (h24 && !clock) {
    const hour = Number(h24[1]);
    const period = hour - 8;
    if (period >= 1 && period <= 8) return period;
  }

  return undefined;
}
