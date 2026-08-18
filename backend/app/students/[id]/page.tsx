"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { PageLoader } from "@/components/ui/loaders";
import {
  StudentFeeSection,
  type FeeAccountView,
} from "@/components/students/student-fee-section";

interface Student {
  id: string;
  name: string;
  rollNumber: number;
  grade: string;
  dob: string;
  parentName: string;
  contact: string;
  address: string | null;
  medicalNotes: string | null;
  previousSchool: string | null;
}

export default function StudentDetailsPage() {
  const params = useParams<{ id: string }>();
  const [student, setStudent] = useState<Student | null>(null);
  const [feeAccount, setFeeAccount] = useState<FeeAccountView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      fetch(`/api/students/${params.id}`).then((r) => {
        if (!r.ok) throw new Error("Student not found");
        return r.json() as Promise<Student>;
      }),
      fetch(`/api/students/${params.id}/fees`)
        .then((r) => r.json())
        .then((d: { account: FeeAccountView | null }) => d.account),
    ])
      .then(([s, f]) => {
        if (cancelled) return;
        setStudent(s);
        setFeeAccount(f);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load student");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) return <PageLoader text="Loading student…" />;
  if (error || !student) {
    return (
      <div className="max-w-3xl text-center py-20">
        <p className="text-sm text-slate-500">
          {error || "Student not found."}
        </p>
      </div>
    );
  }

  const fields = [
    ["Roll number", student.rollNumber],
    ["Grade", student.grade],
    ["Date of birth", student.dob],
    ["Parent / guardian", student.parentName],
    ["Contact", student.contact],
    ["Address", student.address || "—"],
    ["Medical notes", student.medicalNotes || "—"],
    ["Previous school", student.previousSchool || "—"],
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <div
        className="border-b pb-5 flex items-center gap-3"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
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
            {student.name}
          </h1>
          <p className="text-xs" style={{ color: "var(--faint)" }}>
            Student Information
          </p>
        </div>
      </div>

      <div
        className="bg-white rounded-xl border shadow-subtle divide-y"
        style={{ borderColor: "var(--line)" }}
      >
        {fields.map(([label, value]) => (
          <div
            key={String(label)}
            className="grid grid-cols-1 sm:grid-cols-3 gap-1 px-5 py-4 text-xs"
          >
            <dt className="font-semibold" style={{ color: "var(--faint)" }}>
              {label}
            </dt>
            <dd className="sm:col-span-2 text-gurukul-ink">{String(value)}</dd>
          </div>
        ))}
      </div>

      <StudentFeeSection account={feeAccount} />
    </div>
  );
}
