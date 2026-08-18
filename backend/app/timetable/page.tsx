"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProxyCoverage } from "@/components/timetable/proxy-coverage";
import { MasterTimetable } from "@/components/timetable/master-timetable";
import { AddSlotModal } from "@/components/timetable/add-slot-modal";
import { useAuth } from "@/lib/auth/session-context";
import { Calendar, CalendarPlus } from "lucide-react";

export default function TimetablePage() {
  const { currentUser } = useAuth();
  const pathname = usePathname();
  const isFocusMode = pathname === "/timetable/my";
  // Admin role check: if role is TEACHER, user sees read-only approved timetable
  const isAdmin = currentUser ? currentUser.role === "ADMIN" : true;

  const [activeDate, setActiveDate] = useState("2026-08-17");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showAddSlot, setShowAddSlot] = useState(false);

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div
      className={
        isFocusMode
          ? "mx-auto min-h-screen max-w-7xl space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
          : "space-y-6 animate-fade-in"
      }
    >
      {isFocusMode && (
        <div
          className="rounded-2xl border bg-white px-5 py-4 shadow-subtle sm:px-6"
          style={{ borderColor: "var(--line)" }}
        >
          <p
            className="text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ color: "var(--faint)" }}
          >
            Teacher workspace
          </p>
          <p className="mt-1 text-sm font-semibold text-gurukul-ink">
            Your personal teaching schedule
          </p>
        </div>
      )}
      <div
        className="border-b pb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        style={{ borderColor: "var(--line)" }}
      >
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2.5">
            <h1
              className="text-lg font-semibold text-gurukul-ink tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {isAdmin ? "Timetable Operations & Dispatch" : "School Timetable"}
            </h1>
            <span className="badge-default self-start sm:self-auto">
              {isAdmin ? "Admin Console" : "Teacher View"}
            </span>
          </div>
          <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
            {isAdmin
              ? "Absence coverage and room clashes are date-isolated. Absences marked for one day do not affect other dates."
              : "Teachers can view the official approved schedule. Coverage and room modifications are managed by school administrators."}
          </p>
        </div>

        {/* Add Slot + Clean Date Picker */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto">
          {isFocusMode && (
            <Link href="/" className="btn-secondary text-xs whitespace-nowrap">
              Go to Dashboard
            </Link>
          )}
          <button
            onClick={() => setShowAddSlot(true)}
            className="btn-primary flex items-center gap-1.5"
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>{isAdmin ? "Add Slot" : "Add My Lecture"}</span>
          </button>
          <div
            className="flex flex-1 sm:flex-none shrink-0 items-center gap-2 bg-white px-3 py-1.5 rounded-xl shadow-subtle min-w-0"
            style={{ border: "1px solid var(--line)" }}
          >
            <Calendar
              className="w-3.5 h-3.5 shrink-0"
              style={{ color: "var(--faint)" }}
            />
            <span
              className="text-xs font-medium whitespace-nowrap hidden sm:inline"
              style={{ color: "var(--muted)" }}
            >
              Schedule Date:
            </span>
            <input
              type="date"
              aria-label="Select Date"
              value={activeDate}
              onChange={(e) => e.target.value && setActiveDate(e.target.value)}
              className="input !py-1 !px-2.5 !text-xs flex-1 min-w-0"
            />
          </div>
        </div>
      </div>

      {showAddSlot && (
        <AddSlotModal
          onClose={() => setShowAddSlot(false)}
          onCreated={handleRefresh}
        />
      )}

      <MasterTimetable
        date={activeDate}
        refreshTrigger={refreshTrigger}
        onTimetableUpdated={handleRefresh}
        isAdminOverride={isAdmin}
      />

      {isAdmin && (
        <ProxyCoverage
          date={activeDate}
          onDateChange={setActiveDate}
          onProxyAssigned={handleRefresh}
        />
      )}
    </div>
  );
}
