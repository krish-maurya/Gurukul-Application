"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessagesSquare,
  Send,
  Trash2,
  PenSquare,
  RefreshCw,
  Search,
  X,
  AlertCircle,
  CheckCircle,
  Link2,
  Copy,
  Mail,
  Sparkles,
  UserX,
  IndianRupee,
  Megaphone,
} from "lucide-react";

interface MessageRow {
  id: string;
  type: "ABSENCE" | "FEE" | "ANNOUNCEMENT" | "CUSTOM";
  title: string;
  body: string;
  status: "DRAFT" | "SENT" | "ACKNOWLEDGED";
  sentByName: string | null;
  sentAt: string | null;
  acknowledgedAt: string | null;
  createdAt: string;
  student: {
    id: string;
    name: string;
    grade: string;
    rollNumber: number;
    parentName: string;
    parentEmail: string | null;
    portalToken: string | null;
  };
}

interface StudentLite {
  id: string;
  name: string;
  grade: string;
  rollNumber: number;
}

const TYPE_META: Record<
  MessageRow["type"],
  { icon: React.ElementType; cls: string; label: string }
> = {
  ABSENCE: {
    icon: UserX,
    cls: "bg-amber-100 text-amber-700",
    label: "Absence",
  },
  FEE: { icon: IndianRupee, cls: "bg-rose-100 text-rose-700", label: "Fees" },
  ANNOUNCEMENT: {
    icon: Megaphone,
    cls: "bg-sky-100 text-sky-700",
    label: "Notice",
  },
  CUSTOM: {
    icon: MessagesSquare,
    cls: "bg-violet-100 text-violet-700",
    label: "Message",
  },
};

const STATUS_CLS: Record<MessageRow["status"], string> = {
  DRAFT: "bg-slate-100 text-slate-600 border border-slate-200",
  SENT: "bg-sky-100 text-sky-800 border border-sky-200",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 border border-emerald-200",
};

export default function ParentConnectPage() {
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<
    "DRAFT" | "SENT" | "ACKNOWLEDGED" | "ABSENT" | "ALL"
  >("DRAFT");
  const [q, setQ] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flash, setFlash] = useState("");
  const [showCompose, setShowCompose] = useState(false);
  const [linkModal, setLinkModal] = useState<MessageRow["student"] | null>(
    null,
  );

  const load = useCallback(() => {
    const params = new URLSearchParams();
    if (tab === "ABSENT") params.set("type", "ABSENCE");
    else if (tab !== "ALL") params.set("status", tab);
    if (q.trim()) params.set("q", q.trim());
    fetch(`/api/communications?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setMessages(d.messages || []);
        setStats(d.stats || {});
      })
      .catch(() => setMessages([]))
      .finally(() => setIsLoading(false));
  }, [tab, q]);

  useEffect(() => {
    setIsLoading(true);
    const t = setTimeout(load, q ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, q]);

  const showFlash = (text: string) => {
    setFlash(text);
    setTimeout(() => setFlash(""), 3500);
  };

  const handleSend = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/communications/${id}`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        showFlash(
          data.emailed
            ? "Sent — parent notified by email ✓"
            : "Sent — visible on the parent portal ✓",
        );
        load();
      } else showFlash(data.error || "Could not send");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setBusyId(id);
    try {
      await fetch(`/api/communications/${id}`, { method: "DELETE" });
      load();
    } finally {
      setBusyId(null);
    }
  };

  const handleGenerate = async () => {
    const res = await fetch("/api/communications", { method: "PUT" });
    const data = await res.json().catch(() => ({}));
    showFlash(
      data.created > 0
        ? `${data.created} fee reminder draft(s) created`
        : "No new drafts needed — everything is covered",
    );
    load();
  };

  const draftCount = stats.DRAFT || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-text)",
            }}
          >
            <MessagesSquare className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Parent Connect
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Every message is reviewed and sent by a teacher — parents read
              them on their private portal.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerate}
            className="btn-secondary font-medium text-xs px-3.5 py-2.5 flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span>Draft Fee Reminders</span>
          </button>
          <button
            onClick={() => setShowCompose(true)}
            className="btn-primary font-medium text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <PenSquare className="w-4 h-4" />
            <span>Compose</span>
          </button>
        </div>
      </div>

      {flash && (
        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 font-medium">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{flash}</span>
        </div>
      )}

      {/* Tabs + search */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div
          className="flex items-center gap-1 p-1 rounded-xl w-fit"
          style={{
            background: "var(--hover)",
            border: "1px solid var(--line)",
          }}
        >
          {(
            [
              ["DRAFT", `Drafts${draftCount ? ` (${draftCount})` : ""}`],
              ["SENT", "Sent"],
              ["ACKNOWLEDGED", "Read ✓"],
              ["ABSENT", "Absent Students"],
              ["ALL", "All"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold transition-all"
              style={
                tab === key
                  ? {
                      background: "#ffffff",
                      color: "var(--ink)",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--faint)" }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by student..."
            className="input w-full text-sm pl-9 pr-3 py-2 rounded-lg"
          />
        </div>
      </div>

      {/* Message list */}
      <div
        className="bg-white rounded-xl shadow-subtle divide-y overflow-hidden"
        style={{ border: "1px solid var(--line)", borderColor: "var(--line)" }}
      >
        {isLoading ? (
          <p
            className="text-sm text-center py-12"
            style={{ color: "var(--faint)" }}
          >
            Loading messages...
          </p>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <MessagesSquare
              className="w-8 h-8 mx-auto mb-2"
              style={{ color: "var(--line-strong)" }}
            />
            <p className="text-sm" style={{ color: "var(--faint)" }}>
              {tab === "DRAFT"
                ? "No drafts waiting. Compose a message or submit attendance to auto-draft absence notes."
                : "Nothing here yet."}
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const meta = TYPE_META[m.type] || TYPE_META.CUSTOM;
            const Icon = meta.icon;
            return (
              <div key={m.id} className="px-5 py-4 transition-colors">
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent-text)",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-gurukul-ink">
                        {m.student.name}
                      </span>
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--faint)" }}
                      >
                        {m.student.grade} · Roll {m.student.rollNumber}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_CLS[m.status]}`}
                      >
                        {m.status === "ACKNOWLEDGED"
                          ? "Read by parent ✓"
                          : m.status === "SENT"
                            ? "Sent"
                            : "Draft"}
                      </span>
                    </div>
                    <p
                      className="text-xs font-semibold mt-1"
                      style={{ color: "var(--ink)" }}
                    >
                      {m.title}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 line-clamp-2 whitespace-pre-line"
                      style={{ color: "var(--muted)" }}
                    >
                      {m.body}
                    </p>
                    <p
                      className="text-[10px] mt-1"
                      style={{ color: "var(--faint)" }}
                    >
                      To {m.student.parentName}
                      {m.student.parentEmail
                        ? ` · ${m.student.parentEmail}`
                        : " · no email on file"}
                      {m.sentAt
                        ? ` · sent ${new Date(m.sentAt).toLocaleString()} by ${m.sentByName || "staff"}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => setLinkModal(m.student)}
                      title="Parent portal link"
                      className="p-2 rounded-lg transition-colors"
                      style={{ color: "var(--faint)" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--accent-soft)";
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.color = "var(--faint)";
                      }}
                    >
                      <Link2 className="w-4 h-4" />
                    </button>
                    {m.status === "DRAFT" && (
                      <>
                        <button
                          onClick={() => handleDelete(m.id)}
                          disabled={busyId === m.id}
                          title="Discard draft"
                          className="p-2 rounded-lg transition-colors disabled:opacity-50"
                          style={{ color: "var(--faint)" }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "var(--red-soft)";
                            e.currentTarget.style.color = "var(--red)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.color = "var(--faint)";
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleSend(m.id)}
                          disabled={busyId === m.id}
                          className="btn-primary disabled:opacity-60 font-semibold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{busyId === m.id ? "Sending..." : "Send"}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showCompose && (
        <ComposeModal
          onClose={() => setShowCompose(false)}
          onCreated={() => {
            setShowCompose(false);
            setTab("DRAFT");
            load();
            showFlash("Draft(s) created — review and press Send");
          }}
        />
      )}
      {linkModal && (
        <PortalLinkModal
          student={linkModal}
          onClose={() => setLinkModal(null)}
        />
      )}
    </div>
  );
}

/* ---------------- Compose modal ---------------- */

function ComposeModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [students, setStudents] = useState<StudentLite[]>([]);
  const [mode, setMode] = useState<"STUDENT" | "GRADE">("STUDENT");
  const [studentQuery, setStudentQuery] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<StudentLite[]>([]);
  const [grade, setGrade] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((d) => setStudents(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const grades = useMemo(
    () => Array.from(new Set(students.map((s) => s.grade))).sort(),
    [students],
  );
  const matches = useMemo(() => {
    const term = studentQuery.trim().toLowerCase();
    if (!term) return [];
    return students
      .filter(
        (s) =>
          s.name.toLowerCase().includes(term) &&
          !selectedStudents.some((x) => x.id === s.id),
      )
      .slice(0, 6);
  }, [studentQuery, students, selectedStudents]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          type: "CUSTOM",
          ...(mode === "STUDENT"
            ? { studentIds: selectedStudents.map((s) => s.id) }
            : { grade }),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Failed to create draft");
      else onCreated();
    } catch {
      setError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(17, 19, 18, 0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-base font-bold text-gurukul-ink flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            <PenSquare className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span>Message to Parents</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div
            className="grid grid-cols-2 gap-1 p-1 rounded-xl"
            style={{
              background: "var(--hover)",
              border: "1px solid var(--line)",
            }}
          >
            <button
              type="button"
              onClick={() => setMode("STUDENT")}
              className="text-xs font-semibold py-2 rounded-lg transition-all"
              style={
                mode === "STUDENT"
                  ? {
                      background: "#ffffff",
                      color: "var(--ink)",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              Specific students
            </button>
            <button
              type="button"
              onClick={() => setMode("GRADE")}
              className="text-xs font-semibold py-2 rounded-lg transition-all"
              style={
                mode === "GRADE"
                  ? {
                      background: "#ffffff",
                      color: "var(--ink)",
                      boxShadow: "0 1px 3px rgba(15, 23, 42, 0.06)",
                    }
                  : { color: "var(--muted)" }
              }
            >
              Whole class
            </button>
          </div>

          {mode === "STUDENT" ? (
            <div>
              <label
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: "var(--muted)" }}
              >
                Students
              </label>
              {selectedStudents.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {selectedStudents.map((s) => (
                    <span
                      key={s.id}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg"
                      style={{
                        background: "var(--accent-soft)",
                        color: "var(--accent-text)",
                      }}
                    >
                      {s.name}{" "}
                      <span
                        style={{ color: "var(--accent-text)", opacity: 0.6 }}
                      >
                        ({s.grade})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedStudents((prev) =>
                            prev.filter((x) => x.id !== s.id),
                          )
                        }
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                value={studentQuery}
                onChange={(e) => setStudentQuery(e.target.value)}
                placeholder="Type a student's name..."
                className="input w-full text-sm px-3 py-2.5 rounded-lg"
              />
              {matches.length > 0 && (
                <div
                  className="mt-1 rounded-lg divide-y overflow-hidden"
                  style={{
                    border: "1px solid var(--line)",
                    borderColor: "var(--hover)",
                  }}
                >
                  {matches.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => {
                        setSelectedStudents((prev) => [...prev, s]);
                        setStudentQuery("");
                      }}
                      className="w-full text-left px-3 py-2 text-xs flex justify-between transition-colors"
                      style={{ background: "transparent" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "var(--hover)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <span className="font-medium text-gurukul-ink">
                        {s.name}
                      </span>
                      <span style={{ color: "var(--faint)" }}>
                        {s.grade} · Roll {s.rollNumber}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label
                className="text-xs font-semibold mb-1.5 block"
                style={{ color: "var(--muted)" }}
              >
                Class
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                required
                className="select w-full text-sm px-3 py-2.5 rounded-lg"
              >
                <option value="">Choose a class...</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label
              className="text-xs font-semibold mb-1.5 block"
              style={{ color: "var(--muted)" }}
            >
              Subject
            </label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Parent-teacher meeting on Friday"
              className="input w-full text-sm px-3 py-2.5 rounded-lg"
            />
          </div>
          <div>
            <label
              className="text-xs font-semibold mb-1.5 block"
              style={{ color: "var(--muted)" }}
            >
              Message
            </label>
            <textarea
              required
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write your message to the parents..."
              className="input w-full text-sm px-3 py-2.5 rounded-lg resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (mode === "STUDENT" && selectedStudents.length === 0)
            }
            className="btn-primary w-full disabled:opacity-60 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            <PenSquare className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : "Save as Draft"}</span>
          </button>
          <p
            className="text-[11px] text-center"
            style={{ color: "var(--faint)" }}
          >
            Drafts are never delivered automatically — you press Send when
            ready.
          </p>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Portal link modal ---------------- */

function PortalLinkModal({
  student,
  onClose,
}: {
  student: MessageRow["student"];
  onClose: () => void;
}) {
  const [email, setEmail] = useState(student.parentEmail || "");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("");
  const [copied, setCopied] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const generate = async (sendEmail: boolean) => {
    setIsBusy(true);
    setStatus("");
    try {
      const res = await fetch("/api/portal-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: student.id,
          email: email || undefined,
          sendEmail,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setStatus(data.error || "Failed");
      else {
        setUrl(data.portalUrl);
        if (sendEmail)
          setStatus(
            data.emailed
              ? `Emailed to ${data.parentEmail} ✓`
              : data.emailError || "Email not sent — copy the link instead.",
          );
      }
    } finally {
      setIsBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(17, 19, 18, 0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-base font-bold text-gurukul-ink flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            <Link2 className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span>Parent Portal — {student.name}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
          The private link where {student.parentName} can see attendance, fees,
          timetable and your messages. No app, no password.
        </p>

        <label
          className="text-xs font-semibold mb-1.5 block"
          style={{ color: "var(--muted)" }}
        >
          Parent email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="parent@example.com"
          className="input w-full text-sm px-3 py-2.5 rounded-lg mb-3"
        />

        <div className="flex gap-2 mb-3">
          <button
            onClick={() => generate(true)}
            disabled={isBusy || !email}
            className="btn-primary flex-1 disabled:opacity-50 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{isBusy ? "Working..." : "Email the Link"}</span>
          </button>
          <button
            onClick={() => generate(false)}
            disabled={isBusy}
            className="btn-secondary flex-1 font-semibold text-xs py-2.5 rounded-lg flex items-center justify-center gap-1.5"
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>Get Link Only</span>
          </button>
        </div>

        {status && (
          <p
            className="text-[11px] font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 mb-3"
            style={{ color: "var(--muted)" }}
          >
            {status}
          </p>
        )}

        {url && (
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={url}
              onFocus={(e) => e.target.select()}
              className="input flex-1 text-[11px] font-mono px-3 py-2.5 rounded-lg"
            />
            <button
              onClick={copy}
              className="btn-primary shrink-0 text-xs font-medium px-3 py-2.5 rounded-lg flex items-center gap-1.5"
            >
              {copied ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
