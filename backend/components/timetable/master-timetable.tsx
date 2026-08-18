"use client";

import { useEffect, useState, useCallback } from "react";
import { CalendarDays, Loader2, RefreshCw } from "lucide-react";
import { TimetableGrid } from "./grid";
import { ConflictPanel } from "./conflict-panel";
import type {
  TimetableConflictDetail,
  TimetableSlotInput,
} from "@/lib/timetable/optimizer";
import { useAuth } from "@/lib/auth/session-context";

interface MasterTimetableProps {
  date?: string;
  refreshTrigger?: number;
  onTimetableUpdated?: () => void;
  isAdminOverride?: boolean;
}

export function MasterTimetable({
  date = "2026-08-17",
  refreshTrigger = 0,
  onTimetableUpdated,
  isAdminOverride,
}: MasterTimetableProps) {
  const { currentUser } = useAuth();
  const isAdmin =
    isAdminOverride !== undefined
      ? isAdminOverride
      : currentUser
        ? currentUser.role === "ADMIN"
        : true;

  const [slots, setSlots] = useState<TimetableSlotInput[]>([]);
  const [conflicts, setConflicts] = useState<TimetableConflictDetail[]>([]);
  const [selectedConflict, setSelectedConflict] =
    useState<TimetableConflictDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchTimetable = useCallback(() => {
    setLoading(true);
    fetch(`/api/timetable?date=${date}`)
      .then((response) => response.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        const detectedConflicts = data.evaluation?.conflicts ?? [];
        setConflicts(detectedConflicts);
        setSelectedConflict((prev) => {
          if (!prev) return detectedConflicts[0] || null;
          const found = detectedConflicts.find(
            (c: TimetableConflictDetail) =>
              c.id === prev.id ||
              (c.day === prev.day && c.period === prev.period),
          );
          return found || detectedConflicts[0] || null;
        });
      })
      .catch((err) => console.error("Failed to load timetable:", err))
      .finally(() => setLoading(false));
  }, [date]);

  useEffect(() => {
    fetchTimetable();
  }, [fetchTimetable, refreshTrigger]);

  async function handleAssignRoom(slotId: string, newRoomId: string) {
    if (!isAdmin) return;
    setBusy(true);
    setFeedback(null);
    try {
      const response = await fetch("/api/timetable/conflicts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, roomId: newRoomId, date }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to reassign room");
      }
      setFeedback(
        `Room successfully updated to ${data.slot?.room?.roomNumber || "new room"}. Conflict resolved.`,
      );
      fetchTimetable();
      onTimetableUpdated?.();
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Could not reassign room",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleApplyFix(conflict: TimetableConflictDetail) {
    if (!isAdmin) return;
    const targetRoomId =
      conflict.alternativeRooms?.[0]?.roomId || conflict.suggestedRoomIds?.[0];
    const targetSlotId =
      conflict.affectedSlotIds[conflict.affectedSlotIds.length - 1] ||
      conflict.affectedSlotIds[0];
    if (targetRoomId && targetSlotId) {
      await handleAssignRoom(targetSlotId, targetRoomId);
    }
  }

  return (
    <section className="space-y-4 animate-slide-up">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4" style={{ color: "var(--faint)" }} />
          <div>
            <h2
              className="text-sm font-semibold text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              {isAdmin
                ? "Master Timetable Schedule"
                : "Approved Class Timetable"}
            </h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Active schedule viewing date:{" "}
              <span className="font-mono font-medium text-gurukul-ink">
                {date}
              </span>
              {!isAdmin && (
                <span className="ml-2 text-gurukul-ink font-medium">
                  ✓ Official Approved Schedule
                </span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={fetchTimetable}
          disabled={loading || busy}
          className="btn-ghost flex items-center gap-1.5 self-start sm:self-auto min-h-[36px]"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh schedule</span>
        </button>
      </div>

      {feedback && (
        <div
          className="p-3 text-xs rounded-lg bg-white text-gurukul-ink flex items-center justify-between shadow-subtle"
          style={{ border: "1px solid var(--line)" }}
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback(null)}
            className="font-medium ml-2 transition-colors"
            style={{ color: "var(--faint)" }}
          >
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div
          className="h-64 card flex items-center justify-center text-sm gap-2"
          style={{ color: "var(--muted)" }}
        >
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading timetable…
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className={isAdmin ? "xl:col-span-2" : "xl:col-span-3"}>
            <TimetableGrid
              slots={slots}
              conflicts={isAdmin ? conflicts : []}
              selectedConflict={isAdmin ? selectedConflict : null}
              onSelectConflict={isAdmin ? setSelectedConflict : () => {}}
              activeDate={date}
            />
          </div>
          {isAdmin && (
            <div className="xl:col-span-1">
              <ConflictPanel
                conflicts={conflicts}
                selectedConflict={selectedConflict}
                onSelectConflict={setSelectedConflict}
                onApplyFix={handleApplyFix}
                onAssignRoom={handleAssignRoom}
                onApproveTimetable={() =>
                  setFeedback("Timetable approved and published.")
                }
                busy={busy}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
