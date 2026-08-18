"use client";

import React, { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AttendancePanel } from "@/components/attendance/attendance-panel";
import { useAuth } from "@/lib/auth/session-context";

function FocusAttendanceContent() {
  const router = useRouter();
  const { isTeacher, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && !isTeacher) router.replace("/attendance");
  }, [isAuthenticated, isTeacher, router]);

  if (!isAuthenticated) return null;

  return <AttendancePanel focusMode />;
}

export default function TakeAttendancePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-xs text-neutral-400">
          Loading...
        </div>
      }
    >
      <FocusAttendanceContent />
    </Suspense>
  );
}
