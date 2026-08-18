"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import {
  GraduationCap,
  CalendarCheck2,
  IndianRupee,
  MessagesSquare,
  CalendarDays,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

interface PortalData {
  student: {
    name: string;
    grade: string;
    rollNumber: number;
    parentName: string;
    status: string;
  };
  attendance: {
    totalMarked: number;
    present: number;
    absent: number;
    percentage: number | null;
    recent: { date: string; status: string }[];
  };
  fees: {
    academicYear: string;
    amountDue: number;
    amountPaid: number;
    remaining: number;
    dueDate: string;
    status: string;
    payments: {
      amount: number;
      paidAt: string;
      method: string;
      receiptNo: string;
    }[];
  } | null;
  messages: {
    id: string;
    type: string;
    title: string;
    body: string;
    status: string;
    sentAt: string | null;
    acknowledgedAt: string | null;
    sentByName: string | null;
  }[];
  timetable: {
    day: string;
    period: number;
    subject: string;
    teacher: string;
    room: string;
  }[];
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

type Tab = "attendance" | "fees" | "messages" | "timetable";

export default function ParentPortalPage() {
  const params = useParams<{ token: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [ackBusy, setAckBusy] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("attendance");
  const [searchQ, setSearchQ] = useState("");

  const load = useCallback(() => {
    fetch(`/api/portal/${params.token}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) setError(d.error || "This link is not valid.");
        else setData(d);
      })
      .catch(() =>
        setError("Could not load. Please check your connection and try again."),
      )
      .finally(() => setIsLoading(false));
  }, [params.token]);

  useEffect(load, [load]);

  const acknowledge = async (messageId: string) => {
    setAckBusy(messageId);
    try {
      await fetch(`/api/portal/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId }),
      });
      load();
    } finally {
      setAckBusy(null);
    }
  };

  // Filter messages when on the messages tab + search bar is active.
  // NOTE: This MUST run before any early returns to satisfy React hooks rules.
  const messages = data?.messages ?? [];
  const filteredMessages = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return messages;
    return messages.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.body.toLowerCase().includes(q) ||
        (m.sentByName ?? "").toLowerCase().includes(q),
    );
  }, [messages, searchQ]);

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--canvas)" }}
      >
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          Loading...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: "var(--canvas)" }}
      >
        <div
          className="bg-white rounded-2xl border shadow-sm p-8 text-center max-w-sm"
          style={{ borderColor: "var(--line)" }}
        >
          <AlertCircle
            className="w-10 h-10 mx-auto mb-3"
            style={{ color: "var(--amber)" }}
          />
          <p className="text-sm font-semibold text-gurukul-ink">
            {error || "This link is not valid."}
          </p>
          <p className="text-xs mt-2" style={{ color: "var(--faint)" }}>
            Please ask the school office for a new link.
          </p>
        </div>
      </div>
    );
  }

  const { student, attendance, fees, messages: _messages, timetable } = data;
  const attendanceColor =
    attendance.percentage === null
      ? "var(--muted)"
      : attendance.percentage >= 90
        ? "var(--green-text)"
        : attendance.percentage >= 75
          ? "var(--amber-text)"
          : "var(--red-text)";

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "attendance", label: "Attendance", icon: CalendarCheck2 },
    { id: "fees", label: "Fees", icon: IndianRupee },
    { id: "messages", label: "Messages", icon: MessagesSquare },
    { id: "timetable", label: "Timetable", icon: CalendarDays },
  ];

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--canvas)" }}>
      {/* Header */}
      <div className="text-white" style={{ background: "var(--accent)" }}>
        <div className="max-w-lg mx-auto px-5 py-6">
          <div className="flex items-center gap-2 mb-5">
            <GraduationCap
              className="w-5 h-5"
              style={{ color: "var(--accent-soft)" }}
            />
            <span
              className="text-sm font-bold tracking-wide"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              GURUKUL
            </span>
            <span
              className="text-[10px] ml-auto"
              style={{ color: "rgba(255, 255, 255, 0.7)" }}
            >
              Parent Portal
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-full font-bold text-lg flex items-center justify-center"
              style={{
                background: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
              }}
            >
              {student.name.charAt(0)}
            </div>
            <div>
              <h1
                className="text-lg font-bold leading-tight"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {student.name}
              </h1>
              <p
                className="text-xs"
                style={{ color: "rgba(255, 255, 255, 0.7)" }}
              >
                {student.grade} · Roll {student.rollNumber}
              </p>
            </div>
          </div>
          <p
            className="text-[11px] mt-4"
            style={{ color: "rgba(255, 255, 255, 0.7)" }}
          >
            Hello {student.parentName}, here is everything about{" "}
            {student.name.split(" ")[0]}&apos;s school life.
          </p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-5 -mt-3 space-y-4">
        {/* === Underline-style Tabs === */}
        <div
          className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          style={{ borderColor: "var(--line)" }}
        >
          <nav
            className="flex items-center gap-1 px-2 pt-1 overflow-x-auto custom-scrollbar"
            role="tablist"
            aria-label="Parent portal sections"
          >
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  role="tab"
                  aria-selected={isActive}
                  className="relative flex items-center gap-1.5 px-3 sm:px-4 py-3 text-[11px] sm:text-xs font-semibold transition-colors whitespace-nowrap"
                  style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--ink)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = "var(--muted)";
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  {t.id === "messages" && messages.length > 0 && (
                    <span
                      className="ml-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                      style={
                        isActive
                          ? { background: "var(--accent)", color: "#ffffff" }
                          : { background: "var(--soft)", color: "var(--muted)" }
                      }
                    >
                      {messages.length}
                    </span>
                  )}
                  {/* Underline indicator */}
                  <span
                    className="absolute left-2 right-2 bottom-0 h-0.5 rounded-t-full transition-all duration-300"
                    style={{
                      background: isActive ? "var(--accent)" : "transparent",
                      opacity: isActive ? 1 : 0,
                      transform: isActive ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </button>
              );
            })}
          </nav>
        </div>

        {/* === Search bar below the tabs (visible on Messages tab) === */}
        {activeTab === "messages" && (
          <div className="relative animate-tab-fade">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--faint)" }}
            />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="Search messages by title, content or sender..."
              className="input w-full text-sm pl-9 pr-3 py-2.5 rounded-lg"
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors"
                style={{ color: "var(--faint)" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--soft)";
                  e.currentTarget.style.color = "var(--ink)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--faint)";
                }}
                aria-label="Clear search"
              >
                <AlertCircle className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}

        {/* === Tab content — animated transition between tabs === */}
        <div key={activeTab} className="animate-tab-fade">
          {/* ───────── ATTENDANCE TAB ───────── */}
          {activeTab === "attendance" && (
            <div
              className="bg-white rounded-2xl border shadow-sm p-5"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <CalendarCheck2
                    className="w-4 h-4"
                    style={{ color: "var(--accent)" }}
                  />
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Attendance Overview
                  </span>
                </div>
                {attendance.percentage !== null && (
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                    style={{
                      background:
                        attendance.percentage >= 90
                          ? "var(--green-soft)"
                          : attendance.percentage >= 75
                            ? "var(--amber-soft)"
                            : "var(--red-soft)",
                      color:
                        attendance.percentage >= 90
                          ? "var(--green-text)"
                          : attendance.percentage >= 75
                            ? "var(--amber-text)"
                            : "var(--red-text)",
                    }}
                  >
                    {attendance.percentage >= 90
                      ? "Excellent"
                      : attendance.percentage >= 75
                        ? "Watch"
                        : "At Risk"}
                  </span>
                )}
              </div>

              <div className="flex items-end gap-3 mb-4">
                <p
                  className="text-4xl font-bold"
                  style={{
                    color: attendanceColor,
                    fontFamily: "var(--font-syne)",
                  }}
                >
                  {attendance.percentage === null
                    ? "—"
                    : `${attendance.percentage}%`}
                </p>
                <p
                  className="text-[11px] pb-1"
                  style={{ color: "var(--faint)" }}
                >
                  {attendance.totalMarked > 0
                    ? `last ${attendance.totalMarked} days`
                    : "No data yet"}
                </p>
              </div>

              {attendance.totalMarked > 0 ? (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: "var(--green-soft)",
                      border: "1px solid rgba(11, 159, 110, 0.2)",
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: "var(--green-text)" }}
                    >
                      Present
                    </p>
                    <p
                      className="text-lg font-bold mt-1"
                      style={{
                        color: "var(--green-text)",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {attendance.present}
                    </p>
                  </div>
                  <div
                    className="rounded-lg p-3"
                    style={{
                      background: "var(--red-soft)",
                      border: "1px solid rgba(185, 28, 28, 0.2)",
                    }}
                  >
                    <p
                      className="text-[10px] font-semibold uppercase"
                      style={{ color: "var(--red-text)" }}
                    >
                      Absent
                    </p>
                    <p
                      className="text-lg font-bold mt-1"
                      style={{
                        color: "var(--red-text)",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {attendance.absent}
                    </p>
                  </div>
                </div>
              ) : (
                <p
                  className="text-xs text-center py-4"
                  style={{ color: "var(--faint)" }}
                >
                  No attendance has been marked yet.
                </p>
              )}

              {attendance.recent.length > 0 && (
                <div>
                  <p
                    className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                    style={{ color: "var(--muted)" }}
                  >
                    Last 14 days
                  </p>
                  <div className="flex gap-1 flex-wrap">
                    {attendance.recent.slice(0, 14).map((r, i) => (
                      <span
                        key={i}
                        title={`${r.date}: ${r.status}`}
                        className="w-4 h-4 rounded-sm transition-transform hover:scale-110"
                        style={{
                          background:
                            r.status === "PRESENT"
                              ? "var(--green)"
                              : "var(--red)",
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────── FEES TAB ───────── */}
          {activeTab === "fees" && (
            <div
              className="bg-white rounded-2xl border shadow-sm p-5"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <IndianRupee
                  className="w-4 h-4"
                  style={{ color: "var(--accent)" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  School Fees
                </span>
              </div>

              {fees ? (
                <>
                  <div className="flex items-end gap-3 mb-4">
                    <p
                      className="text-4xl font-bold"
                      style={{
                        color:
                          fees.remaining === 0
                            ? "var(--green-text)"
                            : "var(--ink)",
                        fontFamily: "var(--font-syne)",
                      }}
                    >
                      {fees.remaining === 0
                        ? "Paid ✓"
                        : `₹${fees.remaining.toLocaleString("en-IN")}`}
                    </p>
                    <p
                      className="text-[11px] pb-1"
                      style={{ color: "var(--faint)" }}
                    >
                      {fees.remaining === 0
                        ? `${fees.academicYear} · all clear`
                        : `remaining of ₹${fees.amountDue.toLocaleString("en-IN")}`}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div
                      className="rounded-lg p-2.5 text-center"
                      style={{
                        background: "var(--hover)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <p
                        className="text-[9px] font-semibold uppercase"
                        style={{ color: "var(--faint)" }}
                      >
                        Total
                      </p>
                      <p
                        className="text-xs font-bold mt-0.5 text-gurukul-ink"
                        style={{ fontFamily: "var(--font-syne)" }}
                      >
                        ₹{fees.amountDue.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-2.5 text-center"
                      style={{
                        background: "var(--green-soft)",
                        border: "1px solid rgba(11, 159, 110, 0.2)",
                      }}
                    >
                      <p
                        className="text-[9px] font-semibold uppercase"
                        style={{ color: "var(--green-text)" }}
                      >
                        Paid
                      </p>
                      <p
                        className="text-xs font-bold mt-0.5"
                        style={{
                          color: "var(--green-text)",
                          fontFamily: "var(--font-syne)",
                        }}
                      >
                        ₹{fees.amountPaid.toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div
                      className="rounded-lg p-2.5 text-center"
                      style={{
                        background: "var(--hover)",
                        border: "1px solid var(--line)",
                      }}
                    >
                      <p
                        className="text-[9px] font-semibold uppercase"
                        style={{ color: "var(--faint)" }}
                      >
                        Due
                      </p>
                      <p
                        className="text-xs font-bold mt-0.5 text-gurukul-ink"
                        style={{ fontFamily: "var(--font-syne)" }}
                      >
                        {fees.dueDate}
                      </p>
                    </div>
                  </div>

                  {fees.payments.length > 0 && (
                    <div>
                      <p
                        className="text-[10px] font-semibold uppercase tracking-wide mb-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Payment history
                      </p>
                      <div
                        className="divide-y rounded-lg overflow-hidden"
                        style={{
                          border: "1px solid var(--line)",
                          borderColor: "var(--hover)",
                        }}
                      >
                        {fees.payments.map((p, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between px-3 py-2 text-[11px]"
                          >
                            <span className="font-semibold text-gurukul-ink">
                              ₹{p.amount.toLocaleString("en-IN")}
                            </span>
                            <span style={{ color: "var(--muted)" }}>
                              {p.method}
                            </span>
                            <span style={{ color: "var(--faint)" }}>
                              {p.paidAt}
                            </span>
                            <span
                              className="font-mono text-[10px]"
                              style={{ color: "var(--faint)" }}
                            >
                              {p.receiptNo}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p
                  className="text-sm text-center py-4"
                  style={{ color: "var(--faint)" }}
                >
                  No fee account yet. Please contact the school office.
                </p>
              )}
            </div>
          )}

          {/* ───────── MESSAGES TAB ───────── */}
          {activeTab === "messages" && (
            <div
              className="bg-white rounded-2xl border shadow-sm overflow-hidden"
              style={{ borderColor: "var(--line)" }}
            >
              {filteredMessages.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <MessagesSquare
                    className="w-8 h-8 mx-auto mb-2"
                    style={{ color: "var(--line-strong)" }}
                  />
                  <p className="text-sm" style={{ color: "var(--faint)" }}>
                    {searchQ
                      ? `No messages match "${searchQ}"`
                      : "No messages yet."}
                  </p>
                </div>
              ) : (
                <div
                  className="divide-y"
                  style={{ borderColor: "var(--hover)" }}
                >
                  {filteredMessages.map((m) => (
                    <div key={m.id} className="px-4 py-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-gurukul-ink">
                          {m.title}
                        </p>
                        <span
                          className="text-[10px] shrink-0"
                          style={{ color: "var(--faint)" }}
                        >
                          {m.sentAt
                            ? new Date(m.sentAt).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      <p
                        className="text-[11px] mt-1.5 whitespace-pre-line leading-relaxed"
                        style={{ color: "var(--muted)" }}
                      >
                        {m.body}
                      </p>
                      <div className="flex items-center justify-between mt-2.5">
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--faint)" }}
                        >
                          {m.sentByName ? `— ${m.sentByName}` : ""}
                        </span>
                        {m.status === "ACKNOWLEDGED" ? (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg"
                            style={{
                              background: "var(--green-soft)",
                              color: "var(--green-text)",
                              border: "1px solid rgba(11, 159, 110, 0.2)",
                            }}
                          >
                            <CheckCircle className="w-3 h-3" /> Acknowledged
                          </span>
                        ) : (
                          <button
                            onClick={() => acknowledge(m.id)}
                            disabled={ackBusy === m.id}
                            className="btn-primary disabled:opacity-60 text-[10px] font-semibold px-3 py-1.5 rounded-lg"
                          >
                            {ackBusy === m.id ? "..." : "Mark as read ✓"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ───────── TIMETABLE TAB ───────── */}
          {activeTab === "timetable" && (
            <div
              className="bg-white rounded-2xl border shadow-sm p-5"
              style={{ borderColor: "var(--line)" }}
            >
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays
                  className="w-4 h-4"
                  style={{ color: "var(--accent)" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide"
                  style={{ color: "var(--muted)" }}
                >
                  {student.grade} Weekly Schedule
                </span>
              </div>

              {timetable.length === 0 ? (
                <p
                  className="text-sm text-center py-6"
                  style={{ color: "var(--faint)" }}
                >
                  Timetable not published yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {DAYS.map((day) => {
                    const slots = timetable
                      .filter((t) => t.day === day)
                      .sort((a, b) => a.period - b.period);
                    if (slots.length === 0) return null;
                    return (
                      <div key={day}>
                        <p
                          className="text-[10px] font-bold uppercase mb-1.5"
                          style={{ color: "var(--faint)" }}
                        >
                          {day}
                        </p>
                        <div className="space-y-1">
                          {slots.map((s, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-[11px] rounded-lg px-2.5 py-1.5"
                              style={{ background: "var(--hover)" }}
                            >
                              <span
                                className="font-mono w-6"
                                style={{ color: "var(--faint)" }}
                              >
                                P{s.period}
                              </span>
                              <span className="font-semibold text-gurukul-ink flex-1">
                                {s.subject}
                              </span>
                              <span style={{ color: "var(--faint)" }}>
                                {s.teacher.split(" ").slice(-1)[0]} · {s.room}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <p
          className="text-center text-[10px] pt-2"
          style={{ color: "var(--faint)" }}
        >
          This is a private page for {student.parentName}. Please don&apos;t
          share the link.
        </p>
      </div>
    </div>
  );
}
