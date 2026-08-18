"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Pencil,
  Users,
  Mail,
  BookOpen,
  Clock,
  UserPlus,
  CheckCircle,
  X,
  AlertCircle,
  Send,
  Search,
  FileText,
  ArrowRight,
  Building2,
} from "lucide-react";
import { EditStaffModal } from "@/components/admin/manage-modals";
import { useAuth } from "@/lib/auth/session-context";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  isActive: boolean;
  subjects: string[];
  accountStatus:
    "ADMIN" | "ACTIVE" | "INVITED" | "INVITE_EXPIRED" | "NO_ACCOUNT";
}

const STATUS_BADGE: Record<
  StaffMember["accountStatus"],
  { label: string; cls: string }
> = {
  ADMIN: { label: "Admin", cls: "" },
  ACTIVE: { label: "Active", cls: "" },
  INVITED: { label: "Invited", cls: "" },
  INVITE_EXPIRED: { label: "Expired", cls: "" },
  NO_ACCOUNT: { label: "No Account", cls: "" },
};

function StaffDirectory() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selParam = searchParams.get("sel");
  const { isAdmin } = useAuth();

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [editStaff, setEditStaff] = useState<StaffMember | null>(null);

  // invite form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailFallbackUrl, setEmailFallbackUrl] = useState("");

  const loadStaff = () => {
    fetch("/api/staff")
      .then((r) => r.json())
      .then((d) => setStaff(d.staff || []))
      .catch(() => setStaff([]))
      .finally(() => setIsLoading(false));
  };

  useEffect(loadStaff, []);

  // Deep link from the global search bar
  useEffect(() => {
    if (selParam && staff.length > 0 && staff.some((s) => s.id === selParam)) {
      setSelectedId(selParam);
      setSearchTerm("");
    }
  }, [selParam, staff]);

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.department.toLowerCase().includes(q) ||
        s.subjects.some((sub) => sub.toLowerCase().includes(q)),
    );
  }, [staff, searchTerm]);

  // While typing, the preview follows the first match
  useEffect(() => {
    if (searchTerm.trim()) {
      setSelectedId(filtered.length > 0 ? filtered[0].id : null);
    }
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = (id: string) => {
    setSelectedId(id);
    router.replace(`/staff?sel=${id}`, { scroll: false });
  };

  const clearSelection = () => {
    setSelectedId(null);
    router.replace("/staff", { scroll: false });
  };

  const selected = staff.find((s) => s.id === selectedId) || null;

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setEmailSent(false);
    setEmailFallbackUrl("");
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, department }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setInviteError(data.error || "Failed to create invitation");
      else {
        setEmailSent(data.emailSent);
        if (!data.emailSent) setEmailFallbackUrl(data.inviteUrl);
        loadStaff();
      }
    } catch {
      setInviteError("Network error — please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetInviteModal = () => {
    setShowInvite(false);
    setName("");
    setEmail("");
    setDepartment("");
    setEmailSent(false);
    setEmailFallbackUrl("");
    setInviteError("");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="flex items-center justify-between border-b pb-5"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-text)",
            }}
          >
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Staff Directory
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {isLoading
                ? "Loading..."
                : `${filtered.length} of ${staff.length} staff members`}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="btn-primary font-medium text-xs px-4 py-2.5 flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Teacher</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--faint)" }}
        />
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, department or subject..."
          className="input w-full text-sm pl-9 pr-3 py-2.5 rounded-lg text-gurukul-ink"
        />
      </div>

      {/* Grid + Preview Panel */}
      <div
        className={`grid grid-cols-1 gap-5 items-start ${selected ? "lg:grid-cols-3" : ""}`}
      >
        <div className={selected ? "lg:col-span-2" : ""}>
          {isLoading ? (
            <p
              className="text-sm py-10 text-center"
              style={{ color: "var(--faint)" }}
            >
              Loading staff...
            </p>
          ) : (
            <div
              className={`grid grid-cols-1 md:grid-cols-2 gap-3 ${selected ? "" : "xl:grid-cols-3"}`}
            >
              {filtered.map((member) => {
                const badge = STATUS_BADGE[member.accountStatus];
                const isSel = selectedId === member.id;
                return (
                  <button
                    key={member.id}
                    onClick={() => handleSelect(member.id)}
                    className="text-left card p-5 transition-all"
                    style={
                      isSel
                        ? {
                            borderColor: "var(--accent)",
                            background: "var(--accent-soft)",
                          }
                        : { borderColor: "var(--line)" }
                    }
                    onMouseEnter={(e) => {
                      if (!isSel)
                        e.currentTarget.style.background = "var(--hover)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-10 h-10 rounded-full font-bold text-sm flex items-center justify-center"
                        style={
                          isSel
                            ? { background: "var(--accent)", color: "#ffffff" }
                            : { background: "var(--soft)", color: "var(--ink)" }
                        }
                      >
                        {member.name.charAt(0)}
                      </div>
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={
                          member.accountStatus === "ADMIN"
                            ? { background: "var(--accent)", color: "#ffffff" }
                            : member.accountStatus === "ACTIVE"
                              ? {
                                  background: "var(--green-soft)",
                                  color: "var(--green-text)",
                                }
                              : {
                                  background: "var(--soft)",
                                  color: "var(--muted)",
                                }
                        }
                      >
                        {badge.label}
                      </span>
                    </div>
                    <h3
                      className="text-sm font-semibold text-gurukul-ink"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {member.name}
                    </h3>
                    <p
                      className="text-xs mb-3"
                      style={{ color: "var(--muted)" }}
                    >
                      {member.department}
                    </p>
                    <div
                      className="space-y-1.5 text-[11px]"
                      style={{ color: "var(--muted)" }}
                    >
                      <div className="flex items-center gap-1.5">
                        <Mail
                          className="w-3 h-3"
                          style={{ color: "var(--faint)" }}
                        />
                        <span className="truncate">{member.email}</span>
                      </div>
                      {member.subjects.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <BookOpen
                            className="w-3 h-3"
                            style={{ color: "var(--faint)" }}
                          />
                          <span className="truncate">
                            {member.subjects.join(", ")}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p
                  className="text-sm col-span-full text-center py-10"
                  style={{ color: "var(--faint)" }}
                >
                  No staff members match your search.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Preview panel — only when someone is selected */}
        {selected && (
          <div className="lg:sticky lg:top-20 animate-slide-up">
            <div className="card overflow-hidden">
              {/* Header */}
              <div
                className="px-5 py-4 border-b flex items-center justify-between"
                style={{ borderColor: "var(--line)" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center"
                    style={{
                      background: "var(--accent-soft)",
                      color: "var(--accent-text)",
                    }}
                  >
                    {selected.name.charAt(0)}
                  </div>
                  <div>
                    <h3
                      className="text-sm font-semibold text-gurukul-ink leading-tight"
                      style={{ fontFamily: "var(--font-syne)" }}
                    >
                      {selected.name}
                    </h3>
                    <p
                      className="text-[10px]"
                      style={{ color: "var(--faint)" }}
                    >
                      {selected.department}
                    </p>
                  </div>
                </div>
                <button
                  onClick={clearSelection}
                  className="p-1 rounded-md transition-colors"
                  style={{ color: "var(--faint)" }}
                  aria-label="Close preview"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                <span
                  className="inline-block text-[10px] px-2 py-0.5 rounded-full font-medium"
                  style={
                    selected.accountStatus === "ADMIN"
                      ? { background: "var(--accent)", color: "#ffffff" }
                      : selected.accountStatus === "ACTIVE"
                        ? {
                            background: "var(--green-soft)",
                            color: "var(--green-text)",
                          }
                        : { background: "var(--soft)", color: "var(--muted)" }
                  }
                >
                  {STATUS_BADGE[selected.accountStatus].label}
                </span>

                {[
                  { icon: Mail, label: "Email", value: selected.email },
                  {
                    icon: Building2,
                    label: "Department",
                    value: selected.department,
                  },
                  {
                    icon: BookOpen,
                    label: "Subjects",
                    value: selected.subjects.length
                      ? selected.subjects.join(", ")
                      : "—",
                  },
                  {
                    icon: Clock,
                    label: "Workload Limits",
                    value: `${selected.maxPeriodsPerDay} periods/day · ${selected.maxPeriodsPerWeek} periods/week`,
                  },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-2.5">
                    <Icon
                      className="w-3.5 h-3.5 mt-0.5 shrink-0"
                      style={{ color: "var(--faint)" }}
                    />
                    <div className="min-w-0">
                      <p
                        className="text-[10px] font-medium uppercase tracking-wide"
                        style={{ color: "var(--faint)" }}
                      >
                        {label}
                      </p>
                      <p className="text-gurukul-ink font-medium break-words">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}

                {isAdmin && (
                  <button
                    onClick={() => setEditStaff(selected)}
                    className="btn-secondary mt-2 w-full font-medium text-xs py-2.5 flex items-center justify-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Teacher Details</span>
                  </button>
                )}

                <Link
                  href={`/staff/${selected.id}`}
                  className="btn-primary mt-2 w-full font-medium text-xs py-2.5 flex items-center justify-center gap-2"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open Full Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {editStaff && (
        <EditStaffModal
          staff={{
            id: editStaff.id,
            name: editStaff.name,
            email: editStaff.email,
            department: editStaff.department,
            maxPeriodsPerDay: editStaff.maxPeriodsPerDay,
            maxPeriodsPerWeek: editStaff.maxPeriodsPerWeek,
            isActive: editStaff.isActive,
          }}
          onClose={() => setEditStaff(null)}
          onSaved={() => {
            setEditStaff(null);
            loadStaff();
          }}
        />
      )}

      {/* Invite Modal */}
      {showInvite && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(17, 19, 18, 0.5)" }}
        >
          <div className="card shadow-xl w-full max-w-md p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-base font-bold text-gurukul-ink flex items-center gap-2"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                <UserPlus
                  className="w-4 h-4"
                  style={{ color: "var(--accent)" }}
                />
                <span>Invite a Teacher</span>
              </h2>
              <button
                onClick={resetInviteModal}
                className="p-1.5 rounded-lg transition-colors"
                style={{ color: "var(--faint)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {emailSent || emailFallbackUrl ? (
              <div className="space-y-4">
                {emailSent ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 text-xs font-medium text-emerald-800">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Invitation email sent to <strong>{email}</strong>. The
                      teacher will receive a link to set up their account.
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs font-medium text-amber-700">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Invitation created but email delivery failed. Please
                        share this link manually:
                      </span>
                    </div>
                    <input
                      readOnly
                      value={emailFallbackUrl}
                      onFocus={(e) => e.target.select()}
                      className="w-full text-[11px] font-mono px-3 py-2.5 rounded-lg input"
                    />
                  </>
                )}
                <p className="text-[11px]" style={{ color: "var(--faint)" }}>
                  The invitation link is valid for 7 days. The teacher opens it,
                  sets a password, and their account is ready.
                </p>
                <button
                  onClick={resetInviteModal}
                  className="btn-secondary w-full text-xs font-medium py-2.5"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                {inviteError && (
                  <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{inviteError}</span>
                  </div>
                )}
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: "var(--muted)" }}
                  >
                    Full Name
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="input w-full text-sm px-3 py-2.5 rounded-lg text-gurukul-ink"
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: "var(--muted)" }}
                  >
                    Email Address
                  </label>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jane.smith@gurukul.edu"
                    className="input w-full text-sm px-3 py-2.5 rounded-lg text-gurukul-ink"
                  />
                </div>
                <div>
                  <label
                    className="text-xs font-medium mb-1.5 block"
                    style={{ color: "var(--muted)" }}
                  >
                    Department
                  </label>
                  <input
                    required
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Physics & Chemistry"
                    className="input w-full text-sm px-3 py-2.5 rounded-lg text-gurukul-ink"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full disabled:opacity-40 font-medium text-sm py-2.5 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting ? "Sending Invitation..." : "Send Invitation"}
                  </span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffDirectoryPage() {
  return (
    <Suspense
      fallback={
        <p
          className="text-sm py-10 text-center"
          style={{ color: "var(--faint)" }}
        >
          Loading...
        </p>
      }
    >
      <StaffDirectory />
    </Suspense>
  );
}
