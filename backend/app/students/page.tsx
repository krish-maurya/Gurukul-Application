"use client";

import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  GraduationCap,
  Search,
  Filter,
  CheckCircle,
  FileText,
  X,
  Phone,
  MapPin,
  HeartPulse,
  School,
  User,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pencil,
  IndianRupee,
} from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";
import {
  EditStudentModal,
  ManageFeesModal,
  BatchFeesModal,
} from "@/components/admin/manage-modals";

interface StudentRecord {
  id: string;
  rollNumber: number;
  name: string;
  dob: string;
  grade: string;
  parentName: string;
  contact: string;
  address: string | null;
  medicalNotes: string | null;
  previousSchool: string | null;
  status: "ADMITTED" | "PENDING" | "REJECTED";
}

const STATUS_STYLES: Record<StudentRecord["status"], string> = {
  ADMITTED: "bg-emerald-100 text-emerald-700",
  PENDING: "bg-amber-100 text-amber-700",
  REJECTED: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

function StudentRegistry() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selParam = searchParams.get("sel");

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const selectedRowRef = useRef<HTMLTableRowElement | null>(null);

  const { isAdmin } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [showFees, setShowFees] = useState(false);
  const [showBatchFees, setShowBatchFees] = useState(false);

  const loadStudents = () => {
    fetch("/api/students")
      .then((r) => r.json())
      .then((data) => setStudents(Array.isArray(data) ? data : []))
      .catch(() => setStudents([]))
      .finally(() => setIsLoading(false));
  };
  useEffect(loadStudents, []);

  const grades = useMemo(
    () => ["ALL", ...Array.from(new Set(students.map((s) => s.grade))).sort()],
    [students],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return students.filter((s) => {
      if (selectedGrade !== "ALL" && s.grade !== selectedGrade) return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q) ||
        s.contact.toLowerCase().includes(q) ||
        String(s.rollNumber) === q
      );
    });
  }, [students, searchTerm, selectedGrade]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  // Deep link from the global search bar: select, jump to the right page, highlight
  useEffect(() => {
    if (selParam && students.length > 0) {
      const target = students.find((s) => s.id === selParam);
      if (target) {
        setSelectedId(target.id);
        setSelectedGrade("ALL");
        setSearchTerm("");
        const idx = students.findIndex((s) => s.id === selParam);
        setPage(Math.floor(idx / PAGE_SIZE) + 1);
      }
    }
  }, [selParam, students]);

  // Scroll the highlighted row into view
  useEffect(() => {
    if (selectedId && selectedRowRef.current) {
      selectedRowRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [selectedId, currentPage]);

  // While typing in the page search, the preview follows the first match
  useEffect(() => {
    if (searchTerm.trim()) {
      setPage(1);
      if (filtered.length > 0) setSelectedId(filtered[0].id);
      else setSelectedId(null);
    }
  }, [searchTerm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleGradeChange = (g: string) => {
    setSelectedGrade(g);
    setPage(1);
  };

  const handleSelect = (id: string) => {
    setSelectedId(id);
    // keep the URL shareable
    router.replace(`/students?sel=${id}`, { scroll: false });
  };

  const clearSelection = () => {
    setSelectedId(null);
    router.replace("/students", { scroll: false });
  };

  const selected = students.find((s) => s.id === selectedId) || null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-5"
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
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1
              className="text-xl font-bold text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Student Registry
            </h1>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {isLoading
                ? "Loading..."
                : `${filtered.length} of ${students.length} students`}
            </p>
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowBatchFees(true)}
            className="btn-primary font-medium text-xs px-4 py-2.5 flex items-center gap-2 self-start sm:self-auto"
          >
            <IndianRupee className="w-4 h-4" />
            <span>Set Class Fees</span>
          </button>
        )}
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--faint)" }}
          />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, parent, contact or roll number..."
            className="input w-full text-sm pl-9 pr-3 py-2.5 rounded-lg text-gurukul-ink"
          />
        </div>
        <div className="relative">
          <Filter
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--faint)" }}
          />
          <select
            value={selectedGrade}
            onChange={(e) => handleGradeChange(e.target.value)}
            className="select text-sm pl-9 pr-8 py-2.5 rounded-lg text-gurukul-ink appearance-none"
          >
            {grades.map((g) => (
              <option key={g} value={g}>
                {g === "ALL" ? "All Grades" : g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List + Preview Panel */}
      <div
        className={`grid grid-cols-1 gap-5 items-start ${selected ? "lg:grid-cols-3" : ""}`}
      >
        {/* Student list */}
        <div
          className={`card overflow-hidden ${selected ? "lg:col-span-2" : ""}`}
        >
          {/* Mobile card view */}
          <div
            className="md:hidden divide-y"
            style={{ borderColor: "var(--hover)" }}
          >
            {isLoading ? (
              <div
                className="px-4 py-10 text-center text-sm"
                style={{ color: "var(--faint)" }}
              >
                Loading students...
              </div>
            ) : pageItems.length === 0 ? (
              <div
                className="px-4 py-10 text-center text-sm"
                style={{ color: "var(--faint)" }}
              >
                No students match your search.
              </div>
            ) : (
              pageItems.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelect(s.id)}
                  className="cursor-pointer transition-colors px-4 py-3 active:bg-[var(--hover)]"
                  style={
                    selectedId === s.id
                      ? {
                          background: "var(--accent-soft)",
                          borderLeft: "2px solid var(--accent)",
                        }
                      : { background: "transparent" }
                  }
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="text-[10px] font-mono shrink-0"
                        style={{ color: "var(--muted)" }}
                      >
                        #{s.rollNumber}
                      </span>
                      <span className="text-xs font-semibold text-gurukul-ink truncate">
                        {s.name}
                      </span>
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0 ${STATUS_STYLES[s.status]}`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-3 text-[11px]"
                    style={{ color: "var(--muted)" }}
                  >
                    <span>{s.grade}</span>
                    <span className="truncate">{s.parentName}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop table view */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead>
                <tr
                  className="border-b text-[10px] uppercase tracking-wider"
                  style={{ borderColor: "var(--line)", color: "var(--faint)" }}
                >
                  <th className="px-4 py-3 font-medium">Roll</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    Grade
                  </th>
                  <th className="px-4 py-3 font-medium hidden md:table-cell">
                    Parent
                  </th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: "var(--hover)" }}
              >
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm"
                      style={{ color: "var(--faint)" }}
                    >
                      Loading students...
                    </td>
                  </tr>
                ) : pageItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-10 text-center text-sm"
                      style={{ color: "var(--faint)" }}
                    >
                      No students match your search.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((s) => (
                    <tr
                      key={s.id}
                      ref={selectedId === s.id ? selectedRowRef : null}
                      onClick={() => handleSelect(s.id)}
                      className="cursor-pointer transition-colors text-xs"
                      style={
                        selectedId === s.id
                          ? {
                              background: "var(--accent-soft)",
                              borderLeft: "2px solid var(--accent)",
                            }
                          : { background: "transparent" }
                      }
                      onMouseEnter={(e) => {
                        if (selectedId !== s.id)
                          e.currentTarget.style.background = "var(--hover)";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedId !== s.id)
                          e.currentTarget.style.background = "transparent";
                      }}
                    >
                      <td
                        className="px-4 py-3 font-mono"
                        style={{ color: "var(--muted)" }}
                      >
                        {s.rollNumber}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gurukul-ink">
                        {s.name}
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell"
                        style={{ color: "var(--muted)" }}
                      >
                        {s.grade}
                      </td>
                      <td
                        className="px-4 py-3 hidden md:table-cell"
                        style={{ color: "var(--muted)" }}
                      >
                        {s.parentName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[s.status]}`}
                        >
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filtered.length > PAGE_SIZE && (
            <div
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-t"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="text-[11px]" style={{ color: "var(--faint)" }}>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–
                {Math.min(currentPage * PAGE_SIZE, filtered.length)} of{" "}
                {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border bg-white disabled:opacity-30 transition-colors"
                  style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (p) =>
                      p === 1 ||
                      p === totalPages ||
                      Math.abs(p - currentPage) <= 1,
                  )
                  .reduce<(number | "...")[]>((acc, p, i, arr) => {
                    if (i > 0 && p - (arr[i - 1] as number) > 1)
                      acc.push("...");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "..." ? (
                      <span
                        key={`gap-${i}`}
                        className="text-[11px] px-1"
                        style={{ color: "var(--faint)" }}
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p as number)}
                        className="min-w-[28px] text-[11px] font-medium py-1.5 rounded-lg border transition-colors"
                        style={
                          p === currentPage
                            ? {
                                background: "var(--accent)",
                                color: "#ffffff",
                                borderColor: "var(--accent)",
                              }
                            : {
                                background: "#ffffff",
                                color: "var(--muted)",
                                borderColor: "var(--line)",
                              }
                        }
                      >
                        {p}
                      </button>
                    ),
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border bg-white disabled:opacity-30 transition-colors"
                  style={{ borderColor: "var(--line)", color: "var(--muted)" }}
                  aria-label="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Preview panel — rendered only when someone is selected */}
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
                      Roll {selected.rollNumber} · {selected.grade}
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
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[selected.status]}`}
                  >
                    {selected.status === "ADMITTED" ? (
                      <span className="inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        ADMITTED
                      </span>
                    ) : (
                      selected.status
                    )}
                  </span>
                  <span style={{ color: "var(--faint)" }}>
                    DOB: {selected.dob}
                  </span>
                </div>

                {[
                  {
                    icon: User,
                    label: "Parent / Guardian",
                    value: selected.parentName,
                  },
                  { icon: Phone, label: "Contact", value: selected.contact },
                  {
                    icon: MapPin,
                    label: "Address",
                    value: selected.address || "—",
                  },
                  {
                    icon: HeartPulse,
                    label: "Medical Notes",
                    value: selected.medicalNotes || "—",
                  },
                  {
                    icon: School,
                    label: "Previous School",
                    value: selected.previousSchool || "—",
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
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button
                      onClick={() => setShowEdit(true)}
                      className="btn-secondary font-medium text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Details</span>
                    </button>
                    <button
                      onClick={() => setShowFees(true)}
                      className="btn-secondary font-medium text-xs py-2.5 flex items-center justify-center gap-1.5"
                    >
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Manage Fees</span>
                    </button>
                  </div>
                )}

                <Link
                  href={`/students/${selected.id}`}
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

      {showEdit && selected && (
        <EditStudentModal
          studentId={selected.id}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            loadStudents();
          }}
        />
      )}
      {showBatchFees && (
        <BatchFeesModal
          grades={grades.filter((g) => g !== "ALL")}
          onClose={() => setShowBatchFees(false)}
          onDone={loadStudents}
        />
      )}
      {showFees && selected && (
        <ManageFeesModal
          studentId={selected.id}
          studentName={selected.name}
          onClose={() => setShowFees(false)}
          onChanged={loadStudents}
        />
      )}
    </div>
  );
}

export default function StudentRegistryPage() {
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
      <StudentRegistry />
    </Suspense>
  );
}
