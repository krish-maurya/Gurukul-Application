"use client";

import React from "react";

export function PageLoader({ text = "Loading..." }: { text?: string }) {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner" />
      <span className="page-loader-text">{text}</span>
    </div>
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card p-5 space-y-3">
      <div className="skeleton skeleton-heading w-1/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton skeleton-text"
          style={{ width: `${60 + Math.random() * 40}%` }}
        />
      ))}
    </div>
  );
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton skeleton-text flex-1" />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton h-20 rounded-xl" />
      ))}
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-8 pb-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} rows={2} />
        ))}
      </div>
      <SkeletonCard rows={5} />
    </div>
  );
}

export function SkeletonTable({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-4 py-2.5 px-4 border-b"
        style={{ background: "var(--soft)", borderColor: "var(--line)" }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton skeleton-text w-16" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="border-b last:border-0"
          style={{ borderColor: "var(--hover)" }}
        >
          <SkeletonRow cols={cols} />
        </div>
      ))}
    </div>
  );
}
