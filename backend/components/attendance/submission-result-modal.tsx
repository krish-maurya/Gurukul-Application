"use client";

import React from "react";
import { AlertCircle, Check, X } from "lucide-react";

interface SubmissionResultModalProps {
  type: "success" | "error";
  title: string;
  message: string;
  onClose: () => void;
  doneLabel?: string;
}

export function SubmissionResultModal({
  type,
  title,
  message,
  onClose,
  doneLabel,
}: SubmissionResultModalProps) {
  const isSuccess = type === "success";

  return (
    <div
      className="attendance-result-backdrop fixed inset-0 z-[70] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4"
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="attendance-result-card relative w-full max-w-xs overflow-hidden rounded-xl border bg-white px-6 pb-6 pt-8 text-center shadow-modal animate-scale-in"
        style={{ borderColor: "var(--line)" }}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-md p-1.5 transition-colors"
          style={{ color: "var(--faint)" }}
          aria-label="Close"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div
          className="attendance-result-icon relative mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
          style={
            isSuccess
              ? {
                  background: "var(--green-soft)",
                  border: "1px solid rgba(11, 159, 110, 0.3)",
                }
              : {
                  background: "var(--red-soft)",
                  border: "1px solid rgba(185, 28, 28, 0.3)",
                }
          }
        >
          {isSuccess ? (
            <Check
              className="h-6 w-6"
              style={{ color: "var(--green)" }}
              strokeWidth={2.5}
            />
          ) : (
            <AlertCircle
              className="h-6 w-6"
              style={{ color: "var(--red)" }}
              strokeWidth={2}
            />
          )}
        </div>

        <h2
          className="text-sm font-semibold tracking-tight text-gurukul-ink"
          style={{ fontFamily: "var(--font-syne)" }}
        >
          {title}
        </h2>
        <p
          className="mx-auto mt-1.5 max-w-xs text-[11px] leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          {message}
        </p>

        <button
          onClick={onClose}
          className={`mt-5 w-full rounded-lg px-4 py-2.5 text-xs font-medium transition-colors ${
            isSuccess ? "btn-primary" : "btn-secondary"
          }`}
        >
          {isSuccess ? doneLabel || "Done" : "Try Again"}
        </button>
      </div>
    </div>
  );
}
