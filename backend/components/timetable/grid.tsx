"use client";

import React, { useState } from "react";
import {
  TimetableSlotInput,
  TimetableConflictDetail,
} from "@/lib/timetable/optimizer";
import {
  Calendar,
  AlertTriangle,
  User,
  MapPin,
  LayoutGrid,
  CalendarRange,
  Clock,
} from "lucide-react";

interface TimetableGridProps {
  slots: TimetableSlotInput[];
  conflicts: TimetableConflictDetail[];
  selectedConflict: TimetableConflictDetail | null;
  onSelectConflict: (conflict: TimetableConflictDetail) => void;
  activeDate?: string;
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const PERIODS = [
  { id: 1, time: "09:00 - 09:50 AM" },
  { id: 2, time: "10:00 - 10:50 AM" },
  { id: 3, time: "11:00 - 11:50 AM" },
  { id: 4, time: "12:00 - 12:50 PM" },
  { id: 5, time: "02:00 - 02:50 PM" },
  { id: 6, time: "03:00 - 03:50 PM" },
];

function getDayFromDate(dateStr?: string): string {
  if (!dateStr) return "Mon";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    const shortDay = d.toLocaleDateString("en-US", { weekday: "short" });
    return ["Mon", "Tue", "Wed", "Thu", "Fri"].includes(shortDay)
      ? shortDay
      : "Mon";
  } catch {
    return "Mon";
  }
}

function getFormattedDateTitle(dateStr?: string): string {
  if (!dateStr) return "Monday, August 17, 2026";
  try {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

/* ── Mobile Card for a single slot ── */
function MobileSlotCard({
  slot,
  conflict,
  onSelectConflict,
}: {
  slot: TimetableSlotInput;
  conflict?: TimetableConflictDetail;
  onSelectConflict: (c: TimetableConflictDetail) => void;
}) {
  const isConflict = !!conflict;
  const isProxy = slot.isProxy;
  const bgStyle = isConflict
    ? { background: "var(--red-soft)", border: "1px solid rgba(185,28,28,0.3)" }
    : isProxy
      ? {
          background: "var(--amber-soft)",
          border: "1px solid rgba(183,121,31,0.3)",
        }
      : { background: "var(--hover)", border: "1px solid var(--line)" };

  return (
    <div
      className="rounded-xl p-3 transition-all"
      style={bgStyle}
      onClick={() => conflict && onSelectConflict(conflict)}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <p
            className="text-[10px] font-medium uppercase tracking-wider"
            style={{ color: "var(--faint)" }}
          >
            {slot.grade}
          </p>
          <p
            className="text-sm font-bold text-gurukul-ink mt-0.5"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            {slot.subjectName}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isProxy && <span className="badge-warning text-[8px]">Proxy</span>}
          {slot.proxyStatus === "PENDING" && (
            <span className="badge-error text-[8px]">Absent</span>
          )}
          {slot.requiresLab && (
            <span className="badge-default text-[8px]">Lab</span>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        <p
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--muted)" }}
        >
          <User
            className="w-3.5 h-3.5 shrink-0"
            style={{ color: isProxy ? "var(--amber)" : "var(--faint)" }}
          />
          <span className="truncate font-medium">{slot.teacherName}</span>
        </p>
        <p
          className="flex items-center gap-1.5 text-[11px]"
          style={{ color: "var(--faint)" }}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate font-mono">{slot.roomName}</span>
          <span className="text-[9px]">({slot.roomType})</span>
        </p>
      </div>
      {isConflict && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelectConflict(conflict!);
          }}
          className="mt-2.5 w-full text-[10px] font-medium px-2.5 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
          style={{
            color: "var(--red)",
            background: "var(--red-soft)",
            border: "1px solid rgba(185,28,28,0.3)",
          }}
        >
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Resolve {conflict.type.replace("_", " ")}</span>
        </button>
      )}
    </div>
  );
}

/* ── Mobile Day View ── */
function MobileDayView({
  daySlots,
  dayConflicts,
  selectedConflict,
  onSelectConflict,
  grades,
}: {
  daySlots: TimetableSlotInput[];
  dayConflicts: TimetableConflictDetail[];
  selectedConflict: TimetableConflictDetail | null;
  onSelectConflict: (c: TimetableConflictDetail) => void;
  grades: string[];
}) {
  return (
    <div className="lg:hidden divide-y" style={{ borderColor: "var(--line)" }}>
      {PERIODS.map((p) => {
        const periodSlots = daySlots.filter((s) => s.period === p.id);
        const conflict = dayConflicts.find((c) => c.period === p.id);
        if (periodSlots.length === 0 && !conflict) return null;
        return (
          <div
            key={p.id}
            className="p-3 space-y-2"
            style={{ borderColor: "var(--line)" }}
          >
            <div className="flex items-center gap-2">
              <Clock
                className="w-3.5 h-3.5"
                style={{ color: "var(--accent)" }}
              />
              <span className="text-xs font-bold text-gurukul-ink">
                Period {p.id}
              </span>
              <span
                className="text-[10px] font-mono"
                style={{ color: "var(--faint)" }}
              >
                {p.time}
              </span>
            </div>
            <div className="space-y-2 pl-1">
              {periodSlots.map((slot) => {
                const slotConflict =
                  conflict && conflict.affectedSlotIds?.includes(slot.id)
                    ? conflict
                    : undefined;
                return (
                  <MobileSlotCard
                    key={slot.id}
                    slot={slot}
                    conflict={slotConflict}
                    onSelectConflict={onSelectConflict}
                  />
                );
              })}
              {periodSlots.length === 0 && (
                <p
                  className="text-[11px] font-mono py-2 text-center rounded-lg"
                  style={{ background: "var(--hover)", color: "var(--faint)" }}
                >
                  Free Period
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function TimetableGrid({
  slots,
  conflicts,
  selectedConflict,
  onSelectConflict,
  activeDate = "2026-08-17",
}: TimetableGridProps) {
  const [viewMode, setViewMode] = useState<"day" | "week">("day");
  const activeDay = getDayFromDate(activeDate);
  const formattedTitle = getFormattedDateTitle(activeDate);

  const availableGrades = Array.from(new Set(slots.map((s) => s.grade))).sort();
  const grades =
    availableGrades.length > 0 ? availableGrades : ["Grade 10A", "Grade 11A"];

  const daySlots = slots.filter((s) => s.day === activeDay);
  const dayConflicts = conflicts.filter((c) => c.day === activeDay);

  const getSlotConflict = (
    day: string,
    period: number,
  ): TimetableConflictDetail | undefined => {
    return conflicts.find((c) => c.day === day && c.period === period);
  };

  return (
    <div className="card overflow-hidden animate-fade-in">
      {/* Grid Header & View Mode Switcher */}
      <div
        className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ borderColor: "var(--line)", background: "var(--soft)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Calendar
            className="w-4 h-4 shrink-0"
            style={{ color: "var(--faint)" }}
          />
          <div className="min-w-0">
            <h3
              className="text-sm font-semibold text-gurukul-ink truncate"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {viewMode === "day" ? `Daily Schedule` : "Weekly Schedule"}
            </h3>
            <p
              className="text-[11px] truncate"
              style={{ color: "var(--muted)" }}
            >
              {viewMode === "day" ? `${activeDay}, ${activeDate}` : "Mon – Fri"}
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-3 self-start sm:self-auto">
          <div
            className="p-0.5 rounded-lg flex items-center gap-1"
            style={{
              background: "var(--hover)",
              border: "1px solid var(--line)",
            }}
          >
            <button
              onClick={() => setViewMode("day")}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 min-h-[36px]"
              style={
                viewMode === "day"
                  ? {
                      background: "#ffffff",
                      color: "var(--ink)",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Day View</span>
              <span className="sm:hidden">Day</span>
            </button>
            <button
              onClick={() => setViewMode("week")}
              className="text-xs font-medium px-2.5 py-1.5 rounded-md transition-all flex items-center gap-1.5 min-h-[36px]"
              style={
                viewMode === "week"
                  ? {
                      background: "#ffffff",
                      color: "var(--ink)",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Week View</span>
              <span className="sm:hidden">Week</span>
            </button>
          </div>
        </div>
      </div>

      {/* Legend Bar - hidden on mobile */}
      <div
        className="hidden sm:flex px-4 py-2 border-b flex-wrap items-center gap-4 text-[11px]"
        style={{ borderColor: "var(--line)", background: "var(--hover)" }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: "#ffffff", border: "1px solid var(--line)" }}
          />
          <span style={{ color: "var(--muted)" }}>Standard Lecture</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{
              background: "var(--amber-soft)",
              border: "1px solid rgba(183, 121, 31, 0.25)",
            }}
          />
          <span style={{ color: "var(--muted)" }}>Proxy Covered</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-sm"
            style={{
              background: "var(--red-soft)",
              border: "1px solid rgba(185, 28, 28, 0.22)",
            }}
          />
          <span style={{ color: "var(--muted)" }}>Clash Detected</span>
        </div>
      </div>

      {/* ═══════════ MOBILE CARD VIEW (hidden on lg+) ═══════════ */}
      {viewMode === "day" && (
        <MobileDayView
          daySlots={daySlots}
          dayConflicts={dayConflicts}
          selectedConflict={selectedConflict}
          onSelectConflict={onSelectConflict}
          grades={grades}
        />
      )}
      {viewMode === "week" && (
        <div
          className="lg:hidden divide-y"
          style={{ borderColor: "var(--line)" }}
        >
          {DAYS.map((day) => {
            const daySlotsList = slots.filter((s) => s.day === day);
            const isToday = day === activeDay;
            return (
              <div
                key={day}
                className="p-3"
                style={{
                  background: isToday ? "var(--accent-soft)" : "transparent",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isToday ? "text-white" : ""}`}
                    style={
                      isToday
                        ? { background: "var(--accent)" }
                        : { background: "var(--soft)", color: "var(--muted)" }
                    }
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: "var(--accent)" }}
                    >
                      Today
                    </span>
                  )}
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--faint)" }}
                  >
                    {daySlotsList.length} classes
                  </span>
                </div>
                {daySlotsList.length === 0 ? (
                  <p
                    className="text-[11px] py-3 text-center rounded-lg font-mono"
                    style={{
                      background: "var(--hover)",
                      color: "var(--faint)",
                    }}
                  >
                    No classes
                  </p>
                ) : (
                  <div className="space-y-2">
                    {daySlotsList.map((slot) => {
                      const conflict = getSlotConflict(day, slot.period);
                      return (
                        <MobileSlotCard
                          key={slot.id}
                          slot={slot}
                          conflict={conflict}
                          onSelectConflict={onSelectConflict}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ DESKTOP TABLE VIEW (hidden below lg) ═══════════ */}
      <div className="hidden lg:block overflow-x-auto">
        {viewMode === "day" ? (
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr
                style={{
                  background: "var(--soft)",
                  borderColor: "var(--line)",
                }}
                className="border-b"
              >
                <th
                  className="p-3.5 w-36 text-[11px] font-medium uppercase tracking-wider border-r"
                  style={{ borderColor: "var(--line)", color: "var(--faint)" }}
                >
                  Period
                </th>
                <th
                  className="p-3.5 text-[11px] font-medium uppercase tracking-wider"
                  style={{ color: "var(--faint)" }}
                >
                  Schedule for {activeDay}
                </th>
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => {
                const periodSlots = daySlots.filter((s) => s.period === p.id);
                const conflict = dayConflicts.find((c) => c.period === p.id);
                const hasConflict = !!conflict;
                return (
                  <tr
                    key={p.id}
                    className="border-b last:border-b-0 transition-colors"
                    style={{
                      borderColor: "var(--line)",
                      background: hasConflict
                        ? "var(--red-soft)"
                        : "transparent",
                    }}
                  >
                    <td
                      className="p-3.5 border-r align-top"
                      style={{
                        borderColor: "var(--line)",
                        background: "var(--soft)",
                      }}
                    >
                      <p className="text-xs font-bold text-gurukul-ink">
                        Period {p.id}
                      </p>
                      <p
                        className="text-[10px] font-mono mt-0.5"
                        style={{ color: "var(--faint)" }}
                      >
                        {p.time}
                      </p>
                    </td>
                    <td className="p-2">
                      {periodSlots.length === 0 ? (
                        <p
                          className="text-[11px] font-mono py-3 text-center rounded-lg"
                          style={{
                            background: "var(--hover)",
                            color: "var(--faint)",
                          }}
                        >
                          Free Period
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {periodSlots.map((slot) => {
                            const slotConflict =
                              hasConflict &&
                              conflict?.affectedSlotIds?.includes(slot.id)
                                ? conflict
                                : undefined;
                            const isProxy = slot.isProxy;
                            return (
                              <div
                                key={slot.id}
                                className={`rounded-lg p-2.5 min-w-[180px] max-w-[240px] border cursor-pointer transition-all ${slotConflict ? "cursor-pointer hover:opacity-80" : ""}`}
                                style={{
                                  background: slotConflict
                                    ? "var(--red-soft)"
                                    : isProxy
                                      ? "var(--amber-soft)"
                                      : "var(--hover)",
                                  borderColor: slotConflict
                                    ? "rgba(185,28,28,0.3)"
                                    : isProxy
                                      ? "rgba(183,121,31,0.25)"
                                      : "var(--line)",
                                  border: slotConflict
                                    ? "1px solid rgba(185,28,28,0.3)"
                                    : isProxy
                                      ? "1px solid rgba(183,121,31,0.25)"
                                      : "1px solid var(--line)",
                                }}
                                onClick={() =>
                                  slotConflict && onSelectConflict(slotConflict)
                                }
                              >
                                <div className="flex items-center gap-1.5 mb-1.5">
                                  <span
                                    className="text-[9px] font-medium uppercase tracking-wider"
                                    style={{ color: "var(--faint)" }}
                                  >
                                    {slot.grade}
                                  </span>
                                  <div className="flex items-center gap-1">
                                    {isProxy && (
                                      <span className="badge-warning text-[8px]">
                                        Proxy
                                      </span>
                                    )}
                                    {slot.proxyStatus === "PENDING" && (
                                      <span className="badge-error text-[8px]">
                                        Absent
                                      </span>
                                    )}
                                    {slot.requiresLab && (
                                      <span className="badge-default text-[8px]">
                                        Lab
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <p
                                  className="text-xs font-bold text-gurukul-ink"
                                  style={{ fontFamily: "var(--font-syne)" }}
                                >
                                  {slot.subjectName}
                                </p>
                                <p
                                  className="text-[11px] mt-1"
                                  style={{ color: "var(--muted)" }}
                                >
                                  <User
                                    className="w-3 h-3 inline mr-1"
                                    style={{ verticalAlign: "-2px" }}
                                  />
                                  {slot.teacherName}
                                </p>
                                <p
                                  className="text-[11px]"
                                  style={{ color: "var(--faint)" }}
                                >
                                  <MapPin
                                    className="w-3 h-3 inline mr-1"
                                    style={{ verticalAlign: "-2px" }}
                                  />
                                  {slot.roomName}{" "}
                                  <span className="text-[9px]">
                                    ({slot.roomType})
                                  </span>
                                </p>
                                {slotConflict && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectConflict(slotConflict!);
                                    }}
                                    className="mt-2 w-full text-[10px] font-medium px-2 py-1 rounded flex items-center justify-center gap-1"
                                    style={{
                                      color: "var(--red)",
                                      background: "var(--red-soft)",
                                      border: "1px solid rgba(185,28,28,0.3)",
                                    }}
                                  >
                                    <AlertTriangle className="w-3 h-3" />
                                    Resolve{" "}
                                    {slotConflict.type.replace("_", " ")}
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr
                style={{
                  background: "var(--soft)",
                  borderColor: "var(--line)",
                }}
                className="border-b"
              >
                <th
                  className="p-3.5 w-36 text-[11px] font-medium uppercase tracking-wider border-r"
                  style={{ borderColor: "var(--line)", color: "var(--faint)" }}
                >
                  Period
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-3.5 text-[11px] font-medium uppercase tracking-wider border-r last:border-r-0"
                    style={{
                      borderColor: "var(--line)",
                      color:
                        day === activeDay ? "var(--accent)" : "var(--faint)",
                      background:
                        day === activeDay
                          ? "var(--accent-soft)"
                          : "var(--soft)",
                    }}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERIODS.map((p) => (
                <tr
                  key={p.id}
                  className="border-b last:border-b-0"
                  style={{ borderColor: "var(--line)" }}
                >
                  <td
                    className="p-3 border-r align-top"
                    style={{
                      borderColor: "var(--line)",
                      background: "var(--soft)",
                    }}
                  >
                    <p className="text-[11px] font-bold text-gurukul-ink">
                      P{p.id}
                    </p>
                    <p
                      className="text-[9px] font-mono"
                      style={{ color: "var(--faint)" }}
                    >
                      {p.time}
                    </p>
                  </td>
                  {DAYS.map((day) => {
                    const daySlotsList = slots.filter(
                      (s) => s.day === day && s.period === p.id,
                    );
                    const conflict = getSlotConflict(day, p.id);
                    const hasConflict = !!conflict;
                    const isTodayCol = day === activeDay;
                    return (
                      <td
                        key={day}
                        className="p-1.5 border-r last:border-r-0 align-top"
                        style={{
                          borderColor: "var(--line)",
                          background: hasConflict
                            ? "var(--red-soft)"
                            : isTodayCol
                              ? "var(--accent-soft)"
                              : "transparent",
                        }}
                      >
                        {daySlotsList.length === 0 ? null : (
                          <div className="flex flex-col gap-1">
                            {daySlotsList.map((slot) => {
                              const slotConflict =
                                hasConflict &&
                                conflict?.affectedSlotIds?.includes(slot.id)
                                  ? conflict
                                  : undefined;
                              const isProxy = slot.isProxy;
                              return (
                                <div
                                  key={slot.id}
                                  className={`rounded p-2 border text-[10px] ${slotConflict ? "cursor-pointer hover:opacity-80" : ""}`}
                                  style={{
                                    background: slotConflict
                                      ? "var(--red-soft)"
                                      : isProxy
                                        ? "var(--amber-soft)"
                                        : "var(--hover)",
                                    border: slotConflict
                                      ? "1px solid rgba(185,28,28,0.3)"
                                      : isProxy
                                        ? "1px solid rgba(183,121,31,0.25)"
                                        : "1px solid var(--line)",
                                  }}
                                  onClick={() =>
                                    slotConflict &&
                                    onSelectConflict(slotConflict)
                                  }
                                >
                                  <p
                                    className="font-medium text-gurukul-ink text-[10px]"
                                    style={{ fontFamily: "var(--font-syne)" }}
                                  >
                                    {slot.subjectName}
                                  </p>
                                  <p style={{ color: "var(--muted)" }}>
                                    {slot.grade}
                                  </p>
                                  <p style={{ color: "var(--faint)" }}>
                                    {slot.teacherName}
                                  </p>
                                  <p
                                    className="font-mono"
                                    style={{ color: "var(--faint)" }}
                                  >
                                    {slot.roomName}
                                  </p>
                                  {isProxy && (
                                    <span className="badge-warning text-[7px] mt-1 inline-block">
                                      Proxy
                                    </span>
                                  )}
                                  {slotConflict && (
                                    <AlertTriangle
                                      className="w-3 h-3 mt-1"
                                      style={{ color: "var(--red)" }}
                                    />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
