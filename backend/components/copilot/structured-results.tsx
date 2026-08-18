"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  Database,
  FileText,
  ShieldAlert,
  User,
} from "lucide-react";
import type { AssistantResponse } from "@/lib/copilot/types";

export function StructuredResults({
  response,
}: {
  response: AssistantResponse;
}) {
  const rows = response.data?.rows || [];
  const columns = rows.length ? Object.keys(rows[0]) : [];
  const isProfile = response.data?.kind === "student_profile";

  return (
    <div className="mt-3 max-w-full space-y-2.5 overflow-hidden">
      {/* ── Stat Cards ── */}
      {response.data?.stats && (
        <div className="grid grid-cols-2 gap-1.5">
          {response.data.stats.map((stat) => (
            <div key={stat.label} className="copilot-stat-card">
              <p className="copilot-stat-label">{stat.label}</p>
              <p className="copilot-stat-value">{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Student Profile Card (special layout for single student) ── */}
      {isProfile && rows.length > 0 && (
        <div className="copilot-profile-card">
          <div className="copilot-profile-header">
            <div className="copilot-profile-avatar">
              <User className="h-4 w-4" />
            </div>
            <div>
              <p className="copilot-profile-name">
                {rows.find((r) => r.Field === "Name")?.Value || "Student"}
              </p>
              <p className="copilot-profile-meta">
                {rows.find((r) => r.Field === "Class")?.Value} · Roll{" "}
                {rows.find((r) => r.Field === "Roll Number")?.Value}
              </p>
            </div>
          </div>
          <div className="copilot-profile-fields">
            {rows
              .filter(
                (r) =>
                  r.Field !== "Name" &&
                  r.Field !== "Roll Number" &&
                  r.Field !== "Class",
              )
              .map((row) => (
                <div key={row.Field} className="copilot-profile-row">
                  <span className="copilot-profile-label">{row.Field}</span>
                  <span
                    className={`copilot-profile-value ${
                      row.Field === "Status"
                        ? String(row.Value).toUpperCase() === "ADMITTED"
                          ? "text-gurukul-dark font-semibold"
                          : "text-gurukul-ocean"
                        : ""
                    }`}
                  >
                    {row.Value}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Data Table (for non-profile data) ── */}
      {!isProfile && rows.length > 0 && (
        <div className="copilot-table-container">
          <div className="copilot-table-header">
            <Database className="h-3 w-3 text-gurukul-muted" />
            <span>Verified Records</span>
          </div>
          <div className="copilot-table-scroll">
            <table className="w-full text-left text-[10px]">
              <thead>
                <tr className="copilot-table-thead">
                  {columns.map((col) => (
                    <th key={col} className="copilot-table-th">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="copilot-table-tr">
                    {columns.map((col) => (
                      <td key={col} className="copilot-table-td">
                        {col === "Status" ? (
                          <span
                            className={`copilot-status-pill ${
                              String(row[col]).toUpperCase() === "PRESENT" ||
                              String(row[col]).toUpperCase() === "ADMITTED" ||
                              String(row[col]).toUpperCase() === "PAID"
                                ? "copilot-status-good"
                                : String(row[col]).toUpperCase() === "ABSENT" ||
                                    String(row[col]).toUpperCase() ===
                                      "REJECTED" ||
                                    String(row[col]).toUpperCase() === "OVERDUE"
                                  ? "copilot-status-bad"
                                  : "copilot-status-neutral"
                            }`}
                          >
                            {row[col]}
                          </span>
                        ) : (
                          row[col]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Confirmation Warning ── */}
      {response.requiresConfirmation && (
        <div className="copilot-confirmation-bar">
          <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
          <span>
            Confirmation required in the attendance workspace before any record
            is changed.
          </span>
        </div>
      )}

      {/* ── Sources ── */}
      {response.sources && response.sources.length > 0 && (
        <div className="copilot-sources">
          <p className="copilot-sources-title">
            <FileText className="h-3 w-3" />
            Sources
          </p>
          {response.sources.slice(0, 3).map((source) => (
            <p
              className="copilot-source-item"
              key={`${source.type}-${source.id}`}
            >
              <span className="copilot-source-dot" />
              {source.label}
            </p>
          ))}
        </div>
      )}

      {/* ── Action Buttons ── */}
      {response.actions && response.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {response.actions.map((action) =>
            action.route ? (
              <Link
                key={action.id}
                href={action.route}
                className="copilot-action-btn"
              >
                {action.label}
                <ArrowUpRight className="h-3 w-3 opacity-60" />
              </Link>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
