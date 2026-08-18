"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  Save,
  AlertCircle,
  CheckCircle,
  IndianRupee,
  Receipt,
  Pencil,
  GraduationCap,
} from "lucide-react";

/* =========================================================================
 * Edit Student modal (ADMIN only) — includes the parent email field
 * =======================================================================*/

interface StudentFull {
  id: string;
  name: string;
  dob: string;
  grade: string;
  parentName: string;
  contact: string;
  parentEmail?: string | null;
  address?: string | null;
  medicalNotes?: string | null;
  previousSchool?: string | null;
  status: string;
}

export function EditStudentModal({
  studentId,
  onClose,
  onSaved,
}: {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StudentFull | null>(null);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/students/${studentId}`)
      .then((r) => r.json())
      .then((d) => (d.error ? setError(d.error) : setForm(d)))
      .catch(() => setError("Failed to load student"));
  }, [studentId]);

  const set = (key: keyof StudentFull, value: string) =>
    setForm((f) => (f ? { ...f, [key]: value } : f));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          dob: form.dob,
          grade: form.grade,
          parentName: form.parentName,
          contact: form.contact,
          parentEmail: form.parentEmail ?? "",
          address: form.address ?? "",
          medicalNotes: form.medicalNotes ?? "",
          previousSchool: form.previousSchool ?? "",
          status: form.status,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Failed to save");
      else onSaved();
    } catch {
      setError("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const input = "input w-full text-sm px-3 py-2 rounded-lg";
  const label = "text-xs font-semibold mb-1 block";
  const labelStyle = { color: "var(--muted)" } as const;

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
            <Pencil className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span>Edit Student</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!form ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: "var(--faint)" }}
          >
            Loading...
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} style={labelStyle}>
                  Full Name
                </label>
                <input
                  required
                  className={input}
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </div>
              <div>
                <label className={label} style={labelStyle}>
                  Date of Birth
                </label>
                <input
                  required
                  className={input}
                  value={form.dob}
                  onChange={(e) => set("dob", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} style={labelStyle}>
                  Grade / Class
                </label>
                <input
                  required
                  className={input}
                  value={form.grade}
                  onChange={(e) => set("grade", e.target.value)}
                />
              </div>
              <div>
                <label className={label} style={labelStyle}>
                  Status
                </label>
                <select
                  className={input}
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                >
                  <option value="ADMITTED">ADMITTED</option>
                  <option value="PENDING">PENDING</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} style={labelStyle}>
                  Parent / Guardian
                </label>
                <input
                  required
                  className={input}
                  value={form.parentName}
                  onChange={(e) => set("parentName", e.target.value)}
                />
              </div>
              <div>
                <label className={label} style={labelStyle}>
                  Contact Number
                </label>
                <input
                  required
                  className={input}
                  value={form.contact}
                  onChange={(e) => set("contact", e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className={label} style={labelStyle}>
                Parent Email{" "}
                <span style={{ color: "var(--faint)", fontWeight: 400 }}>
                  (for the parent portal link)
                </span>
              </label>
              <input
                type="email"
                className={input}
                placeholder="parent@example.com"
                value={form.parentEmail ?? ""}
                onChange={(e) => set("parentEmail", e.target.value)}
              />
            </div>
            <div>
              <label className={label} style={labelStyle}>
                Address
              </label>
              <input
                className={input}
                value={form.address ?? ""}
                onChange={(e) => set("address", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={label} style={labelStyle}>
                  Medical Notes
                </label>
                <input
                  className={input}
                  value={form.medicalNotes ?? ""}
                  onChange={(e) => set("medicalNotes", e.target.value)}
                />
              </div>
              <div>
                <label className={label} style={labelStyle}>
                  Previous School
                </label>
                <input
                  className={input}
                  value={form.previousSchool ?? ""}
                  onChange={(e) => set("previousSchool", e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isSaving}
              className="btn-primary w-full disabled:opacity-60 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? "Saving..." : "Save Changes"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
 * Manage Fees modal (ADMIN only) — set amount due + record payments
 * =======================================================================*/

interface FeeAccountData {
  academicYear: string;
  amountDue: number;
  amountPaid: number;
  dueDate: string;
  status: string;
  payments: {
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    receiptNo: string;
  }[];
}

const FEE_STATUS_CLS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  PAID: {
    bg: "var(--green-soft)",
    color: "var(--green-text)",
    border: "rgba(11, 159, 110, 0.2)",
  },
  PARTIAL: { bg: "var(--soft)", color: "var(--muted)", border: "var(--line)" },
  PENDING: { bg: "var(--soft)", color: "var(--muted)", border: "var(--line)" },
  OVERDUE: {
    bg: "var(--red-soft)",
    color: "var(--red-text)",
    border: "rgba(185, 28, 28, 0.2)",
  },
};

export function ManageFeesModal({
  studentId,
  studentName,
  onClose,
  onChanged,
}: {
  studentId: string;
  studentName: string;
  onClose: () => void;
  onChanged?: () => void;
}) {
  const [account, setAccount] = useState<FeeAccountData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [flash, setFlash] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);

  // set-amount form
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  // payment form
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("CASH");
  const [isBusy, setIsBusy] = useState(false);

  const load = () => {
    fetch(`/api/students/${studentId}/fees`)
      .then((r) => r.json())
      .then((d) => {
        setAccount(d.account);
        if (d.account) {
          setAmountDue(String(d.account.amountDue));
          setDueDate(d.account.dueDate);
          setAcademicYear(d.account.academicYear);
        }
      })
      .catch(() => setError("Failed to load fees"))
      .finally(() => setIsLoading(false));
  };
  useEffect(load, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showFlash = (t: string) => {
    setFlash(t);
    setTimeout(() => setFlash(""), 3000);
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsBusy(true);
    try {
      const res = await fetch(`/api/students/${studentId}/fees`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amountDue: Number(amountDue),
          dueDate,
          academicYear,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Failed to save");
      else {
        setAccount(data.account);
        showFlash("Fee details saved ✓");
        setShowEditForm(false);
        onChanged?.();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const recordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsBusy(true);
    try {
      const res = await fetch(`/api/students/${studentId}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(payAmount), method: payMethod }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Failed to record payment");
      else {
        setAccount(data.account);
        setPayAmount("");
        showFlash(`Payment recorded — receipt ${data.receiptNo} ✓`);
        onChanged?.();
      }
    } finally {
      setIsBusy(false);
    }
  };

  const remaining = account
    ? Math.max(0, account.amountDue - account.amountPaid)
    : 0;
  const input = "input w-full text-sm px-3 py-2 rounded-lg";
  const label = "text-xs font-semibold mb-1 block";
  const labelStyle = { color: "var(--muted)" } as const;

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
            <IndianRupee
              className="w-4 h-4"
              style={{ color: "var(--accent)" }}
            />
            <span>Fees — {studentName}</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {flash && (
          <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5 mb-4 font-medium">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{flash}</span>
          </div>
        )}

        {isLoading ? (
          <p
            className="text-sm text-center py-8"
            style={{ color: "var(--faint)" }}
          >
            Loading...
          </p>
        ) : (
          <div className="space-y-5">
            {/* Summary row with status badge on left and Edit button on RIGHT */}
            {account && (
              <div className="flex items-center justify-between gap-3">
                <span
                  className="inline-block text-[10px] px-2.5 py-1 rounded-full font-semibold"
                  style={(() => {
                    const cls =
                      FEE_STATUS_CLS[account.status] || FEE_STATUS_CLS.PENDING;
                    return {
                      background: cls.bg,
                      color: cls.color,
                      border: `1px solid ${cls.border}`,
                    };
                  })()}
                >
                  {account.status} · due {account.dueDate}
                </span>
                <button
                  type="button"
                  onClick={() => setShowEditForm((v) => !v)}
                  className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>{showEditForm ? "Close" : "Edit"}</span>
                </button>
              </div>
            )}

            {/* Summary cards */}
            {account && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div
                  className="rounded-xl border py-3"
                  style={{
                    background: "var(--hover)",
                    borderColor: "var(--line)",
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: "var(--faint)" }}
                  >
                    Total
                  </p>
                  <p
                    className="text-sm font-bold text-gurukul-ink"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    ₹{account.amountDue.toLocaleString("en-IN")}
                  </p>
                </div>
                <div
                  className="rounded-xl border py-3"
                  style={{
                    background: "var(--green-soft)",
                    borderColor: "rgba(11, 159, 110, 0.2)",
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: "var(--green-text)" }}
                  >
                    Paid
                  </p>
                  <p
                    className="text-sm font-bold"
                    style={{
                      color: "var(--green-text)",
                      fontFamily: "var(--font-syne)",
                    }}
                  >
                    ₹{account.amountPaid.toLocaleString("en-IN")}
                  </p>
                </div>
                <div
                  className="rounded-xl border py-3"
                  style={{
                    background: "var(--hover)",
                    borderColor: "var(--line)",
                  }}
                >
                  <p
                    className="text-[10px] font-semibold uppercase"
                    style={{ color: "var(--faint)" }}
                  >
                    Remaining
                  </p>
                  <p
                    className="text-sm font-bold text-gurukul-ink"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    ₹{remaining.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            )}

            {/* === EDIT FORM (collapsible, sits ABOVE the Record Payment section) === */}
            {(showEditForm || !account) && (
              <form
                onSubmit={saveAccount}
                className="rounded-xl p-4 space-y-3 animate-slide-down"
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--soft)",
                }}
              >
                <p
                  className="text-xs font-bold text-gurukul-ink flex items-center gap-1.5"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  <Pencil
                    className="w-3.5 h-3.5"
                    style={{ color: "var(--accent)" }}
                  />
                  <span>
                    {account
                      ? "Update fee details"
                      : "Set the fee for this student"}
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className={label} style={labelStyle}>
                      Amount (₹)
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      className={input}
                      value={amountDue}
                      onChange={(e) => setAmountDue(e.target.value)}
                      placeholder="45000"
                    />
                  </div>
                  <div>
                    <label className={label} style={labelStyle}>
                      Due Date
                    </label>
                    <input
                      required
                      type="date"
                      className={input}
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={label} style={labelStyle}>
                      Year
                    </label>
                    <input
                      required
                      className={input}
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isBusy}
                    className="btn-primary flex-1 disabled:opacity-60 font-semibold text-xs py-2 rounded-lg"
                  >
                    {account ? "Update Fee Details" : "Create Fee Account"}
                  </button>
                  {account && (
                    <button
                      type="button"
                      onClick={() => setShowEditForm(false)}
                      className="btn-secondary text-xs py-2 px-4 rounded-lg"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}

            {/* === Record payment section (sits BELOW the edit form) === */}
            {account && remaining > 0 && (
              <form
                onSubmit={recordPayment}
                className="rounded-xl p-4 space-y-3"
                style={{ border: "1px solid var(--line)" }}
              >
                <p
                  className="text-xs font-bold text-gurukul-ink"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  Record a payment
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={label} style={labelStyle}>
                      Amount (₹)
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      max={remaining}
                      className={input}
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder={String(remaining)}
                    />
                  </div>
                  <div>
                    <label className={label} style={labelStyle}>
                      Method
                    </label>
                    <select
                      className={input}
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI</option>
                      <option value="CARD">Card</option>
                      <option value="BANK">Bank Transfer</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="btn-primary w-full disabled:opacity-60 font-semibold text-xs py-2 rounded-lg flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Record Payment</span>
                </button>
              </form>
            )}

            {/* === Payment history (sits at the bottom) === */}
            {account && account.payments.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-bold uppercase mb-2"
                  style={{ color: "var(--faint)" }}
                >
                  Payment history
                </p>
                <div
                  className="divide-y rounded-xl overflow-hidden"
                  style={{
                    border: "1px solid var(--line)",
                    borderColor: "var(--hover)",
                  }}
                >
                  {account.payments.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-gurukul-ink">
                        ₹{p.amount.toLocaleString("en-IN")}
                      </span>
                      <span style={{ color: "var(--faint)" }}>{p.method}</span>
                      <span style={{ color: "var(--faint)" }}>{p.paidAt}</span>
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
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================================
 * Edit Staff modal (ADMIN only)
 * =======================================================================*/

interface StaffEditData {
  id: string;
  name: string;
  email: string;
  department: string;
  maxPeriodsPerDay: number;
  maxPeriodsPerWeek: number;
  isActive: boolean;
}

export function EditStaffModal({
  staff,
  onClose,
  onSaved,
}: {
  staff: StaffEditData;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<StaffEditData>({ ...staff });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch(`/api/staff/${staff.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          department: form.department,
          maxPeriodsPerDay: form.maxPeriodsPerDay,
          maxPeriodsPerWeek: form.maxPeriodsPerWeek,
          isActive: form.isActive,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Failed to save");
      else onSaved();
    } catch {
      setError("Network error");
    } finally {
      setIsSaving(false);
    }
  };

  const input = "input w-full text-sm px-3 py-2 rounded-lg";
  const label = "text-xs font-semibold mb-1 block";
  const labelStyle = { color: "var(--muted)" } as const;

  return (
    <div
      className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(17, 19, 18, 0.5)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-base font-bold text-gurukul-ink flex items-center gap-2"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            <Pencil className="w-4 h-4" style={{ color: "var(--accent)" }} />
            <span>Edit Teacher</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: "var(--faint)" }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className={label} style={labelStyle}>
              Full Name
            </label>
            <input
              required
              className={input}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className={label} style={labelStyle}>
              Email{" "}
              <span style={{ color: "var(--faint)", fontWeight: 400 }}>
                (login updates too)
              </span>
            </label>
            <input
              required
              type="email"
              className={input}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className={label} style={labelStyle}>
              Department
            </label>
            <input
              required
              className={input}
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label} style={labelStyle}>
                Max periods / day
              </label>
              <input
                required
                type="number"
                min="1"
                max="8"
                className={input}
                value={form.maxPeriodsPerDay}
                onChange={(e) =>
                  setForm({ ...form, maxPeriodsPerDay: Number(e.target.value) })
                }
              />
            </div>
            <div>
              <label className={label} style={labelStyle}>
                Max periods / week
              </label>
              <input
                required
                type="number"
                min="1"
                max="40"
                className={input}
                value={form.maxPeriodsPerWeek}
                onChange={(e) =>
                  setForm({
                    ...form,
                    maxPeriodsPerWeek: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>
          <label
            className="flex items-center gap-2 text-xs font-medium py-1 cursor-pointer"
            style={{ color: "var(--muted)" }}
          >
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="w-4 h-4 rounded"
              style={{ accentColor: "var(--accent)" }}
            />
            <span>
              Active (inactive teachers can&apos;t sign in or be scheduled)
            </span>
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full disabled:opacity-60 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 mt-1"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save Changes"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

/* =========================================================================
 * Class Fees modal (ADMIN only) — same fee for a whole STANDARD in one go.
 * Fees don't differ by division: "Grade 10" covers 10A + 10B together.
 * =======================================================================*/

/** "Grade 10A" -> { standard: "Grade 10", division: "A" } */
function splitGrade(g: string): { standard: string; division: string } {
  const m = g.match(/^(.*\d)\s*([A-Za-z])$/);
  return m
    ? { standard: m[1].trim(), division: m[2].toUpperCase() }
    : { standard: g, division: "" };
}

export function BatchFeesModal({
  grades,
  onClose,
  onDone,
}: {
  grades: string[];
  onClose: () => void;
  onDone?: () => void;
}) {
  // Group divisions under their standard: Grade 10 -> [A, B]
  const standards = React.useMemo(() => {
    const map = new Map<string, string[]>();
    for (const g of grades) {
      const { standard, division } = splitGrade(g);
      const list = map.get(standard) || [];
      if (division && !list.includes(division)) list.push(division);
      map.set(standard, list.sort());
    }
    return Array.from(map.entries()).map(([standard, divisions]) => ({
      standard,
      divisions,
    }));
  }, [grades]);

  const [standard, setStandard] = useState(standards[0]?.standard || "");
  const [amountDue, setAmountDue] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [overwrite, setOverwrite] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<{
    created: number;
    updated: number;
    skipped: number;
    totalStudents: number;
    grade: string;
    amountDue: number;
  } | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSummary(null);
    setIsBusy(true);
    try {
      const res = await fetch("/api/fees/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: standard,
          amountDue: Number(amountDue),
          dueDate,
          academicYear,
          overwrite,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setError(data.error || "Failed to set class fees");
      else {
        setSummary(data);
        onDone?.();
      }
    } catch {
      setError("Network error");
    } finally {
      setIsBusy(false);
    }
  };

  const input = "input w-full text-sm px-3 py-2 rounded-lg";
  const label = "text-xs font-semibold mb-1 block";
  const labelStyle = { color: "var(--muted)" } as const;

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
            <IndianRupee
              className="w-4 h-4"
              style={{ color: "var(--accent)" }}
            />
            <span>Set Class Fees</span>
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
          Fees are the same for every division of a standard. Pick a standard
          and the fee is applied to{" "}
          <strong style={{ color: "var(--ink)" }}>all its divisions</strong> at
          once — you can still fine-tune any single student later via{" "}
          <strong style={{ color: "var(--ink)" }}>Manage Fees</strong>.
        </p>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {summary ? (
          <div className="space-y-4">
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-3 space-y-1 font-medium">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>
                  {summary.grade} (all divisions): ₹
                  {summary.amountDue.toLocaleString("en-IN")} applied
                </span>
              </div>
              <p>
                • {summary.created} student{summary.created === 1 ? "" : "s"} —
                fee account created
              </p>
              {summary.updated > 0 && (
                <p>
                  • {summary.updated} — existing fee updated (payments kept)
                </p>
              )}
              {summary.skipped > 0 && (
                <p>
                  • {summary.skipped} — skipped (already had a fee; tick the
                  overwrite box to update them too)
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="btn-secondary w-full text-xs font-medium py-2.5 rounded-lg"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className={label} style={labelStyle}>
                Standard
              </label>
              <div className="grid grid-cols-3 gap-2">
                {standards.map(({ standard: st, divisions }) => {
                  const active = st === standard;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setStandard(st)}
                      className="group relative rounded-xl border-2 px-2 py-3 text-center transition-all"
                      style={
                        active
                          ? {
                              borderColor: "var(--accent)",
                              background: "var(--accent)",
                              color: "#ffffff",
                              boxShadow: "0 4px 12px rgba(30, 58, 138, 0.22)",
                            }
                          : {
                              borderColor: "var(--line)",
                              background: "#ffffff",
                              color: "var(--muted)",
                            }
                      }
                    >
                      <GraduationCap
                        className="w-4 h-4 mx-auto mb-1"
                        style={{ color: active ? "#ffffff" : "var(--faint)" }}
                      />
                      <span className="block text-xs font-bold leading-tight">
                        {st}
                      </span>
                      {divisions.length > 0 && (
                        <span
                          className="block text-[10px] mt-0.5"
                          style={{
                            color: active
                              ? "rgba(255,255,255,0.7)"
                              : "var(--faint)",
                          }}
                        >
                          Div {divisions.join(" · ")}
                        </span>
                      )}
                      {active && (
                        <span className="absolute -top-1.5 -right-1.5 bg-white rounded-full shadow">
                          <CheckCircle
                            className="w-4 h-4"
                            style={{ color: "var(--accent)" }}
                          />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className={label} style={labelStyle}>
                  Amount (₹)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  className={input}
                  value={amountDue}
                  onChange={(e) => setAmountDue(e.target.value)}
                  placeholder="45000"
                />
              </div>
              <div>
                <label className={label} style={labelStyle}>
                  Due Date
                </label>
                <input
                  required
                  type="date"
                  className={input}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className={label} style={labelStyle}>
                  Year
                </label>
                <input
                  required
                  className={input}
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                />
              </div>
            </div>
            <label
              className="flex items-start gap-2 text-xs py-1 cursor-pointer"
              style={{ color: "var(--muted)" }}
            >
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded"
                style={{ accentColor: "var(--accent)" }}
              />
              <span>
                Also update students who{" "}
                <strong style={{ color: "var(--ink)" }}>
                  already have a fee
                </strong>{" "}
                set for this standard (their payments are kept, only the
                amount/due date changes)
              </span>
            </label>
            <button
              type="submit"
              disabled={isBusy}
              className="btn-primary w-full disabled:opacity-60 font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2"
            >
              <IndianRupee className="w-4 h-4" />
              <span>{isBusy ? "Applying..." : "Apply to Whole Standard"}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
