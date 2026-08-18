"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ReviewModal } from "@/components/attendance/review-modal";
import { SubmissionResultModal } from "@/components/attendance/submission-result-modal";
import { useAuth } from "@/lib/auth/session-context";
import {
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  Filter,
  GraduationCap,
  LayoutGrid,
  List,
  Send,
  Users,
  UserX,
} from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";

interface StudentRollState {
  id: string;
  rollNumber: number;
  name: string;
  status: "PRESENT" | "ABSENT";
}
type Result = { type: "success" | "error"; title: string; message: string };

interface AttendancePanelProps {
  focusMode?: boolean;
}

export function AttendancePanel({ focusMode = false }: AttendancePanelProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [grades, setGrades] = useState<string[]>([]);
  const [grade, setGrade] = useState("");
  const [section] = useState("A");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentRollState[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [mobileView, setMobileView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    fetch("/api/attendance/grades")
      .then((r) => r.json())
      .then((d) => {
        const list: string[] = d.grades || [];
        setGrades(list);
        const fromUrl = searchParams.get("grade");
        setGrade(
          fromUrl && list.includes(fromUrl)
            ? fromUrl
            : d.defaultGrade || list[0] || "",
        );
      })
      .catch(() => setGrades([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!grade) return;
    const controller = new AbortController();
    setIsLoading(true);
    setIsSubmitted(false);
    setStudents([]);
    Promise.all([
      fetch("/api/students", { signal: controller.signal }).then(
        async (response) => {
          if (!response.ok) throw new Error("Could not load the class roster.");
          return response.json() as Promise<
            Array<{
              id: string;
              rollNumber: number;
              name: string;
              grade: string;
            }>
          >;
        },
      ),
      fetch(
        `/api/attendance?grade=${encodeURIComponent(grade)}&section=${encodeURIComponent(section)}&date=${encodeURIComponent(date)}`,
        { signal: controller.signal },
      ).then(async (response) => {
        if (!response.ok) throw new Error("Could not load saved attendance.");
        return response.json() as Promise<{
          record: {
            entries: Array<{ rollNumber: number; status: string }>;
          } | null;
        }>;
      }),
    ])
      .then(([records, attendance]) => {
        const saved = new Map(
          (attendance.record?.entries ?? []).map((entry) => [
            entry.rollNumber,
            entry.status as StudentRollState["status"],
          ]),
        );
        setStudents(
          records
            .filter((student) => student.grade === grade)
            .sort((a, b) => a.rollNumber - b.rollNumber)
            .map((student) => ({
              ...student,
              status: saved.get(student.rollNumber) ?? "PRESENT",
            })),
        );
        setIsSubmitted(Boolean(attendance.record));
      })
      .catch((error: unknown) => {
        if ((error as Error).name !== "AbortError")
          setResult({
            type: "error",
            title: "Attendance could not load",
            message:
              error instanceof Error
                ? error.message
                : "Please refresh and try again.",
          });
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [grade, section, date]);

  const handleToggleRoll = (rollNumber: number) => {
    if (isSubmitted) return;
    setStudents((current) =>
      current.map((student) =>
        student.rollNumber === rollNumber
          ? {
              ...student,
              status: student.status === "PRESENT" ? "ABSENT" : "PRESENT",
            }
          : student,
      ),
    );
  };

  const handleConfirmSubmit = async () => {
    if (!students.length) {
      setIsModalOpen(false);
      setResult({
        type: "error",
        title: "No students to submit",
        message: "This class does not have a saved student roster yet.",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade,
          section,
          date,
          entries: students.map(({ id, status }) => ({
            studentId: id,
            status,
          })),
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok)
        throw new Error(
          payload.error || "The attendance record could not be saved.",
        );
      setIsSubmitted(true);
      setIsModalOpen(false);
      const absentCount = students.filter((s) => s.status === "ABSENT").length;
      const notified =
        typeof payload.parentNotified === "number" ? payload.parentNotified : 0;
      let message = `${grade} attendance for ${date} has been saved. ${students.length} students recorded.`;
      if (absentCount > 0) {
        message +=
          notified > 0
            ? ` ${notified} parent${notified === 1 ? "" : "s"} notified about absence${notified === 1 ? "" : "s"} automatically.`
            : " Absence alerts were already sent for today.";
      }
      setResult({ type: "success", title: "Attendance submitted", message });
    } catch (error) {
      setIsModalOpen(false);
      setResult({
        type: "error",
        title: "Submission failed",
        message:
          error instanceof Error
            ? error.message
            : "Please check your connection and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResultClose = () => {
    const wasSuccess = result?.type === "success";
    setResult(null);
    if (focusMode && wasSuccess) router.push("/");
  };

  const absentRollNumbers = useMemo(
    () =>
      students
        .filter((student) => student.status === "ABSENT")
        .map((student) => student.rollNumber),
    [students],
  );
  const presentCount = students.length - absentRollNumbers.length;

  const bottomBarClass = focusMode
    ? "fixed bottom-0 left-0 right-0 z-30"
    : "fixed bottom-0 left-0 right-0 z-30 transition-[left] duration-200 md:left-[var(--sidebar-width)]";

  return (
    <div
      className={`${focusMode ? "min-h-screen bg-white" : ""} space-y-4 pb-28 sm:space-y-5 sm:pb-28 animate-fade-in`}
    >
      {focusMode && (
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gurukul-dark text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <ClipboardCheck className="h-3.5 w-3.5 text-gurukul-tech shrink-0" />
                  <h1 className="text-sm font-semibold tracking-tight text-gurukul-dark truncate">
                    Take Attendance
                  </h1>
                </div>
                <p className="text-[10px] text-neutral-400 truncate">
                  {currentUser?.name || "Faculty"} · {date}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isSubmitted && (
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="btn-secondary btn-sm text-[10px] flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  <span>Edit</span>
                </button>
              )}
              {isSubmitted && (
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="btn-secondary btn-sm shrink-0 text-[10px]"
                >
                  Dashboard
                </button>
              )}
              <span className="badge-dark text-[9px]">Focus mode</span>
            </div>
          </div>
        </header>
      )}

      <div className={focusMode ? "mx-auto max-w-5xl px-4 pt-4 sm:px-6" : ""}>
        {!focusMode && (
          <div className="flex flex-col gap-3 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold tracking-tight text-gurukul-dark">
                  Daily Attendance
                </h1>
                <span className="badge-dark text-[9px]">One per day</span>
              </div>
              <p className="mt-0.5 text-[11px] text-neutral-400">
                Tap a roll number to toggle present/absent.
              </p>
            </div>
            {isSubmitted && (
              <button
                onClick={() => setIsSubmitted(false)}
                className="btn-secondary btn-sm"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Filters */}
        <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:p-3">
          <div className="flex flex-col gap-3 text-xs sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <select
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="select min-w-0 flex-1 py-2 text-xs sm:w-auto sm:py-1.5"
              >
                {grades.length === 0 && (
                  <option value="">Loading classes...</option>
                )}
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="input min-w-0 flex-1 py-2 text-xs sm:w-auto sm:py-1.5"
              />
            </div>
          </div>
          {!focusMode && (
            <div className="hidden text-[11px] text-neutral-400 sm:block">
              <strong className="text-gurukul-dark">
                {currentUser?.name || "Faculty"}
              </strong>
            </div>
          )}
          {focusMode && (
            <p className="text-[11px] text-neutral-500">
              Tap a roll to mark absent · Submit when done
            </p>
          )}
        </div>

        {/* Mobile summary chips */}
        <div className="flex gap-2 sm:hidden">
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2.5">
            <Users className="w-4 h-4 text-emerald-500" />
            <div>
              <p className="text-[9px] font-medium text-neutral-400 uppercase">
                Present
              </p>
              <p className="text-sm font-bold text-gurukul-dark">
                {presentCount}
                <span className="text-[10px] font-normal text-neutral-400">
                  /{students.length}
                </span>
              </p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
            <UserX className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-[9px] font-medium text-red-400 uppercase">
                Absent
              </p>
              <p className="text-sm font-bold text-red-700">
                {absentRollNumbers.length}
              </p>
            </div>
          </div>
        </div>

        {isSubmitted && (
          <div className="flex items-center justify-between gap-3 card p-3 text-xs text-neutral-600">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>
                Attendance for {grade} on {date} is saved
                {focusMode
                  ? " — tap Edit to make changes."
                  : " — tap Edit (top right) to make changes."}
              </span>
            </div>
            {focusMode && (
              <button
                type="button"
                onClick={() => setIsSubmitted(false)}
                className="btn-secondary btn-sm shrink-0 flex items-center gap-1"
              >
                <Edit3 className="h-3 w-3" />
                <span>Edit</span>
              </button>
            )}
          </div>
        )}

        {/* Roll Grid */}
        <div className="card p-3 sm:p-5">
          <div className="mb-3 flex flex-col gap-2 border-b border-neutral-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between sm:justify-start sm:gap-2">
              <h3 className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
                {grade} Roll Grid
              </h3>
              {/* Mobile view toggle - grid / list */}
              <div className="flex items-center rounded-lg border border-neutral-200 bg-neutral-50 p-0.5 sm:hidden">
                <button
                  type="button"
                  onClick={() => setMobileView("grid")}
                  className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${mobileView === "grid" ? "bg-white shadow-sm text-gurukul-dark" : "text-neutral-400"}`}
                  aria-label="Grid view"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className={`flex items-center justify-center rounded-md p-1.5 transition-colors ${mobileView === "list" ? "bg-white shadow-sm text-gurukul-dark" : "text-neutral-400"}`}
                  aria-label="List view"
                >
                  <List className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <div className="hidden sm:flex gap-3 text-[10px] font-medium">
              <span className="flex items-center gap-1 text-neutral-500">
                <span className="h-2.5 w-2.5 rounded-sm bg-neutral-100" />
                Present
              </span>
              <span className="flex items-center gap-1 text-red-700">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" />
                Absent
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center">
              <PageLoader text="Loading roster..." />
            </div>
          ) : students.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center text-xs text-neutral-400">
              No students enrolled in {grade}.
            </div>
          ) : (
            <>
              {/* ====== MOBILE CARD LIST VIEW ====== */}
              <div
                className={`space-y-2 ${mobileView === "list" ? "" : "hidden"} sm:hidden`}
              >
                {students.map((student) => {
                  const isAbsent = student.status === "ABSENT";
                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 rounded-2xl border-2 p-3 transition-all duration-100 ${
                        isAbsent
                          ? "border-red-400 bg-red-50"
                          : "border-neutral-200 bg-white"
                      } ${isSubmitted ? "opacity-70" : ""}`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2">
                          <span
                            className={`font-mono text-sm font-extrabold ${isAbsent ? "text-red-700" : "text-gurukul-dark"}`}
                          >
                            #{student.rollNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider ${isAbsent ? "text-red-400" : "text-neutral-400"}`}
                          >
                            {student.status}
                          </span>
                        </div>
                        <p
                          className={`mt-0.5 text-sm font-semibold truncate ${isAbsent ? "text-red-800" : "text-neutral-700"}`}
                        >
                          {student.name}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleRoll(student.rollNumber)}
                        disabled={isSubmitted}
                        aria-pressed={isAbsent}
                        aria-label={`Mark ${student.name} ${isAbsent ? "present" : "absent"}`}
                        className={`shrink-0 flex h-12 w-20 items-center justify-center rounded-2xl text-sm font-bold transition-all duration-100 ${
                          isAbsent
                            ? "bg-red-600 text-white shadow-sm"
                            : "bg-emerald-500 text-white shadow-sm"
                        } ${isSubmitted ? "cursor-not-allowed opacity-60" : "active:scale-95"}`}
                      >
                        {isAbsent ? "Absent" : "Present"}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* ====== GRID VIEW (mobile + desktop) ====== */}
              <div
                className={`${mobileView === "grid" ? "" : "hidden sm:block"}`}
              >
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
                  {students.map((student) => {
                    const isAbsent = student.status === "ABSENT";
                    return (
                      <button
                        key={student.id}
                        onClick={() => handleToggleRoll(student.rollNumber)}
                        disabled={isSubmitted}
                        aria-pressed={isAbsent}
                        aria-label={`Roll ${student.rollNumber}: ${student.status.toLowerCase()}. Tap to mark ${isAbsent ? "present" : "absent"}.`}
                        className={`relative flex h-[84px] flex-col items-center justify-center rounded-2xl border-2 transition-all duration-100 sm:h-[88px] ${
                          isAbsent
                            ? "border-red-500 bg-red-600 text-white shadow-sm"
                            : "border-neutral-200 bg-white text-neutral-700"
                        } ${isSubmitted ? "cursor-not-allowed opacity-70" : "active:scale-[0.90] active:border-gurukul-accent"}`}
                      >
                        <span
                          className={`font-mono text-xl font-extrabold leading-none sm:text-lg ${isAbsent ? "text-white" : "text-gurukul-dark"}`}
                        >
                          #{student.rollNumber}
                        </span>
                        {/* Student name - visible on mobile, hidden on sm+ (desktop unchanged) */}
                        <span
                          className={`mt-0.5 text-[10px] font-semibold truncate max-w-[90%] leading-tight ${isAbsent ? "text-red-100" : "text-neutral-500"} sm:hidden`}
                        >
                          {student.name}
                        </span>
                        <span
                          className={`mt-1 text-[9px] font-bold tracking-wider ${isAbsent ? "text-red-100" : "text-neutral-400"}`}
                        >
                          {student.status}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        className={`${bottomBarClass} flex flex-col gap-2.5 border-t border-neutral-200 bg-white/95 backdrop-blur-md p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4 sm:px-8`}
      >
        {/* Mobile: compact summary with counts + submit */}
        <div className="flex items-center justify-between sm:hidden">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
              <Users className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-700">
                {presentCount}
              </span>
              <span className="text-[10px] font-medium text-emerald-600">
                Present
              </span>
            </div>
            <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-2.5 py-1.5">
              <UserX className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-bold text-red-700">
                {absentRollNumbers.length}
              </span>
              <span className="text-[10px] font-medium text-red-600">
                Absent
              </span>
            </div>
          </div>
          <span className="text-[10px] text-neutral-400 shrink-0">
            {grade} · {date}
          </span>
        </div>

        {/* Desktop: original summary row */}
        <div className="hidden min-w-0 items-center gap-4 sm:flex sm:gap-6">
          <div>
            <p className="text-[9px] font-medium uppercase tracking-wider text-neutral-400">
              Summary
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-gurukul-dark">
              {grade} · {date}
            </p>
          </div>
          <div className="hidden h-6 w-px bg-neutral-200 sm:block" />
          <div className="hidden gap-4 text-[11px] sm:flex">
            <span className="text-neutral-400">
              Roll:{" "}
              <strong className="text-gurukul-dark">{students.length}</strong>
            </span>
            <span className="text-neutral-500">
              Present:{" "}
              <strong className="text-gurukul-dark">{presentCount}</strong>
            </span>
            <span className="rounded-md bg-red-50 px-2 py-1 text-red-700">
              Absent:{" "}
              <strong className="text-red-800">
                {absentRollNumbers.length}
              </strong>
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 sm:gap-2">
          {focusMode && isSubmitted && (
            <button
              type="button"
              onClick={() => setIsSubmitted(false)}
              className="btn-secondary btn-sm flex items-center gap-1 sm:flex"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </button>
          )}
          <button
            onClick={() =>
              focusMode && isSubmitted ? router.push("/") : setIsModalOpen(true)
            }
            disabled={
              (!focusMode && isSubmitted) || isLoading || students.length === 0
            }
            className="btn-primary w-full justify-center sm:w-auto sm:btn-sm"
          >
            <Send className="h-3.5 w-3.5" />
            <span>
              {isSubmitted
                ? focusMode
                  ? "Dashboard"
                  : "Submitted"
                : "Submit Attendance"}
            </span>
          </button>
        </div>
      </div>

      {isModalOpen && (
        <ReviewModal
          grade={grade}
          section={section}
          date={date}
          students={students}
          absentRolls={absentRollNumbers}
          isSubmitting={isSubmitting}
          onConfirmSubmit={handleConfirmSubmit}
          onClose={() => setIsModalOpen(false)}
          isEditMode={isSubmitted}
        />
      )}
      {result && (
        <SubmissionResultModal
          {...result}
          onClose={handleResultClose}
          doneLabel={
            focusMode && result.type === "success"
              ? "Go to Dashboard"
              : undefined
          }
        />
      )}
    </div>
  );
}
