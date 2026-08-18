"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";

interface PermissionRow {
  permission: string;
  description: string;
  admin: boolean;
  staff: boolean;
}

const PERMISSION_MATRIX: PermissionRow[] = [
  {
    permission: "Document Intake Upload",
    description: "Upload new student admission forms & scanned certificates",
    admin: true,
    staff: true,
  },
  {
    permission: "Document Human Review & Override",
    description: "Edit flagged OCR fields and commit verified record to DB",
    admin: true,
    staff: false,
  },
  {
    permission: "Timetable Constraint Matrix View",
    description: "Inspect master school schedule and detected clash flags",
    admin: true,
    staff: true,
  },
  {
    permission: "Approve & Publish Master Timetable",
    description: "Final authorization to deploy updated timetable to school",
    admin: true,
    staff: false,
  },
  {
    permission: "Audit Log & System Role Configuration",
    description: "Manage system roles, security policies, and access logs",
    admin: true,
    staff: false,
  },
];

export default function AdminRolesPage() {
  const { currentUser, isAdmin } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-b pb-5" style={{ borderColor: "var(--line)" }}>
        <div className="flex items-center gap-2">
          <h1
            className="text-xl font-bold text-gurukul-ink tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Audit & Access Control
          </h1>
          <span className="badge-dark">RBAC</span>
        </div>
        <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
          Role-Based Access Control matrix governing system boundaries between
          Executive Admin and Teaching Staff.
        </p>
      </div>

      {!isAdmin && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl text-xs"
          style={{ background: "var(--soft)", border: "1px solid var(--line)" }}
        >
          <ShieldAlert
            className="w-5 h-5 flex-shrink-0 mt-0.5"
            style={{ color: "var(--muted)" }}
          />
          <div>
            <p className="font-semibold text-gurukul-ink">
              Restricted View (Staff Role Active)
            </p>
            <p className="mt-0.5" style={{ color: "var(--muted)" }}>
              You are currently viewing this page in Staff simulation mode. Use
              the Role Simulator pill in the header to switch to Administrator
              mode.
            </p>
          </div>
        </div>
      )}

      {/* Permission Matrix Table */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-4 border-b"
          style={{ borderColor: "var(--line)", background: "var(--soft)" }}
        >
          <h3
            className="text-sm font-semibold text-gurukul-ink"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Access Permission Boundaries
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
            Strict RBAC enforcement across all API endpoints and server actions.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr
                style={{
                  background: "var(--soft)",
                  borderColor: "var(--line)",
                }}
                className="border-b"
              >
                <th
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--faint)" }}
                >
                  Permission / Capability
                </th>
                <th
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: "var(--faint)" }}
                >
                  Scope Description
                </th>
                <th
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-center"
                  style={{ color: "var(--faint)" }}
                >
                  Administrator
                </th>
                <th
                  className="px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-center"
                  style={{ color: "var(--faint)" }}
                >
                  Staff / Faculty
                </th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: "var(--hover)" }}>
              {PERMISSION_MATRIX.map((row) => (
                <tr
                  key={row.permission}
                  className="transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--hover)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <td className="px-5 py-4 font-medium text-gurukul-ink">
                    <span className="flex items-center gap-2">
                      <ShieldCheck
                        className="w-4 h-4"
                        style={{ color: "var(--accent)" }}
                      />
                      <span>{row.permission}</span>
                    </span>
                  </td>
                  <td
                    className="px-5 py-4 max-w-sm"
                    style={{ color: "var(--muted)" }}
                  >
                    {row.description}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {row.admin ? (
                      <span className="badge-dark gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Allowed
                      </span>
                    ) : (
                      <span className="badge-default gap-1">
                        <XCircle className="w-3 h-3" />
                        Denied
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    {row.staff ? (
                      <span className="badge-dark gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Allowed
                      </span>
                    ) : (
                      <span className="badge-default gap-1">
                        <XCircle className="w-3 h-3" />
                        Restricted
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
