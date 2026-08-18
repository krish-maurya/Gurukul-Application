"use client";

import React from "react";
import { TimetableConflictDetail } from "@/lib/timetable/optimizer";
import { generateAIConflictExplanation } from "@/lib/timetable/ai-explainer";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  RefreshCw,
  MapPin,
  ArrowRight,
} from "lucide-react";

interface ConflictPanelProps {
  conflicts: TimetableConflictDetail[];
  selectedConflict: TimetableConflictDetail | null;
  onSelectConflict: (conflict: TimetableConflictDetail) => void;
  onApplyFix: (conflict: TimetableConflictDetail) => void;
  onAssignRoom?: (slotId: string, roomId: string) => void;
  onApproveTimetable: () => void;
  busy?: boolean;
}

export function ConflictPanel({
  conflicts,
  selectedConflict,
  onSelectConflict,
  onApplyFix,
  onAssignRoom,
  onApproveTimetable,
  busy = false,
}: ConflictPanelProps) {
  const activeConflict =
    selectedConflict || (conflicts.length > 0 ? conflicts[0] : null);
  const aiExplanation = activeConflict
    ? generateAIConflictExplanation(activeConflict)
    : null;

  // For room/lab clashes with multiple affected slots, default to reassigning the secondary slot
  const targetSlotId =
    activeConflict?.affectedSlotIds?.[
      activeConflict.affectedSlotIds.length - 1
    ] || activeConflict?.affectedSlotIds?.[0];

  return (
    <div className="card p-6 flex flex-col justify-between h-full animate-fade-in">
      <div>
        {/* Panel Header */}
        <div
          className="flex items-center justify-between pb-4 border-b mb-5"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" style={{ color: "var(--faint)" }} />
            <h3
              className="text-sm font-semibold text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Conflict Inspector
            </h3>
          </div>
          <span
            className={conflicts.length > 0 ? "badge-error" : "badge-success"}
          >
            {conflicts.length > 0
              ? `${conflicts.length} Clash${conflicts.length !== 1 ? "es" : ""}`
              : "Schedule Optimal"}
          </span>
        </div>

        {conflicts.length > 0 ? (
          <div className="space-y-5">
            {/* Conflict List Selector */}
            <div>
              <label
                className="text-[11px] font-medium uppercase tracking-wider block mb-2"
                style={{ color: "var(--faint)" }}
              >
                Active Schedule Clashes
              </label>
              <div className="space-y-2">
                {conflicts.map((c, i) => {
                  const isSelected = activeConflict?.id === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectConflict(c)}
                      className="w-full text-left p-3 rounded-lg border text-xs transition-all"
                      style={
                        isSelected
                          ? {
                              borderColor: "var(--accent)",
                              background: "var(--accent-soft)",
                              color: "var(--accent-text)",
                              fontWeight: 500,
                            }
                          : {
                              borderColor: "var(--line)",
                              background: "#ffffff",
                              color: "var(--muted)",
                            }
                      }
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gurukul-ink">
                          Clash #{i + 1}: {c.type.replace("_", " ")}
                        </span>
                        <span
                          className="text-[10px] font-mono"
                          style={{ color: "var(--faint)" }}
                        >
                          {c.day} P{c.period}
                        </span>
                      </div>
                      <p
                        className="text-[11px] truncate mt-1"
                        style={{ color: "var(--muted)" }}
                      >
                        {c.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Diagnosis & Suggested Alternatives */}
            {activeConflict && (
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: "var(--soft)",
                  border: "1px solid var(--line)",
                }}
              >
                <div
                  className="flex items-center justify-between border-b pb-2"
                  style={{ borderColor: "var(--line)" }}
                >
                  <span className="text-[11px] font-semibold text-gurukul-ink flex items-center gap-1.5">
                    <Sparkles
                      className="w-3.5 h-3.5"
                      style={{ color: "var(--faint)" }}
                    />
                    Conflict Diagnosis & Resolution
                  </span>
                  <span
                    className="text-[10px] font-mono bg-white px-2 py-0.5 rounded"
                    style={{
                      color: "var(--muted)",
                      border: "1px solid var(--line)",
                    }}
                  >
                    {activeConflict.day} Period {activeConflict.period}
                  </span>
                </div>

                <div>
                  <h4
                    className="text-xs font-semibold mb-1"
                    style={{ color: "var(--red)" }}
                  >
                    {activeConflict.type.replace("_", " ")}
                  </h4>
                  <p
                    className="text-xs leading-relaxed"
                    style={{ color: "var(--muted)" }}
                  >
                    {activeConflict.description}
                  </p>
                </div>

                {/* Available Alternatives List */}
                {activeConflict.alternativeRooms &&
                activeConflict.alternativeRooms.length > 0 ? (
                  <div
                    className="space-y-2 pt-2 border-t"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span
                      className="text-[10px] font-medium uppercase tracking-wider block"
                      style={{ color: "var(--faint)" }}
                    >
                      Recommended Alternative Rooms
                    </span>
                    <div className="space-y-1.5">
                      {activeConflict.alternativeRooms.map((alt) => (
                        <div
                          key={alt.roomId}
                          className="flex items-center justify-between p-2.5 bg-white rounded-lg border text-xs"
                          style={{ borderColor: "var(--line)" }}
                        >
                          <div className="flex items-center gap-2 truncate mr-2">
                            <MapPin
                              className="w-3.5 h-3.5 shrink-0"
                              style={{ color: "var(--faint)" }}
                            />
                            <div className="truncate">
                              <span className="font-medium text-gurukul-ink block">
                                {alt.roomNumber}
                              </span>
                              <span
                                className="text-[10px] block truncate"
                                style={{ color: "var(--muted)" }}
                              >
                                {alt.reason}
                              </span>
                            </div>
                          </div>
                          <button
                            disabled={busy || !targetSlotId}
                            onClick={() =>
                              onAssignRoom &&
                              targetSlotId &&
                              onAssignRoom(targetSlotId, alt.roomId)
                            }
                            className="btn-primary !text-[11px] !py-1.5 !px-3 shrink-0 flex items-center gap-1"
                          >
                            <span>Assign</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  aiExplanation && (
                    <div
                      className="p-3 bg-white rounded-lg border space-y-2"
                      style={{ borderColor: "var(--line)" }}
                    >
                      <span
                        className="text-[10px] font-medium uppercase tracking-wider block"
                        style={{ color: "var(--faint)" }}
                      >
                        Optimization Recommendation
                      </span>
                      <p className="text-xs text-gurukul-ink font-medium leading-relaxed">
                        {aiExplanation.recommendation}
                      </p>
                      <button
                        disabled={busy}
                        onClick={() => onApplyFix(activeConflict)}
                        className="btn-primary w-full mt-2 !text-xs flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Apply Suggested Fix</span>
                      </button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        ) : (
          /* Zero Conflicts State */
          <div className="py-12 text-center space-y-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto"
              style={{ background: "var(--soft)", color: "var(--accent)" }}
            >
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4
              className="text-sm font-semibold text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Schedule Conflict-Free
            </h4>
            <p
              className="text-xs max-w-xs mx-auto"
              style={{ color: "var(--muted)" }}
            >
              All constraint rules (teacher workload, room double-booking, lab
              requirements, and capacity) are fully satisfied.
            </p>
          </div>
        )}
      </div>

      {/* Approve Action */}
      <div
        className="pt-5 border-t mt-6"
        style={{ borderColor: "var(--line)" }}
      >
        <button
          onClick={onApproveTimetable}
          disabled={conflicts.length > 0}
          className="btn-primary w-full !py-3 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Approve & Publish Master Timetable</span>
        </button>
        {conflicts.length > 0 && (
          <p
            className="text-[10px] text-center mt-2"
            style={{ color: "var(--faint)" }}
          >
            Resolve all critical clashes before publishing schedule.
          </p>
        )}
      </div>
    </div>
  );
}
