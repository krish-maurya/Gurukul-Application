"use client";

import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bell,
  X,
  FileText,
  CalendarClock,
  UserPlus2,
  UserMinus,
  Inbox,
  RefreshCw,
  MessagesSquare,
} from "lucide-react";

interface NotificationItem {
  id: string;
  type: "DOCUMENT" | "PROXY" | "ADMISSION" | "LEAVE" | "PARENT_MSG";
  title: string;
  detail: string;
  href: string;
  createdAt: string;
}

const TYPE_META: Record<
  NotificationItem["type"],
  { icon: React.ElementType; label: string; cls: string }
> = {
  DOCUMENT: {
    icon: FileText,
    label: "Documents",
    cls: "bg-amber-50 text-amber-700 border-amber-100",
  },
  PROXY: {
    icon: CalendarClock,
    label: "Coverage",
    cls: "bg-violet-50 text-violet-700 border-violet-100",
  },
  ADMISSION: {
    icon: UserPlus2,
    label: "Admissions",
    cls: "bg-sky-50 text-sky-700 border-sky-100",
  },
  LEAVE: {
    icon: UserMinus,
    label: "Leave",
    cls: "bg-rose-50 text-rose-700 border-rose-100",
  },
  PARENT_MSG: {
    icon: MessagesSquare,
    label: "Parents",
    cls: "bg-emerald-50 text-emerald-700 border-emerald-100",
  },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationsBell() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch("/api/notifications", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setItems([]))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setMounted(true);
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  const close = useCallback(() => {
    setVisible(false);
    setTimeout(() => setIsOpen(false), 220);
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    load();
    requestAnimationFrame(() => setVisible(true));
  }, [load]);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.setAttribute("data-notifications-open", "");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.documentElement.removeAttribute("data-notifications-open");
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, close]);

  const openItem = (item: NotificationItem) => {
    close();
    router.push(item.href);
  };

  const overlay =
    isOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[250]"
            role="dialog"
            aria-modal="true"
            aria-label="Notifications"
          >
            {/* Full-screen dim backdrop — blur is handled via CSS on [data-notifications-open] */}
            <button
              type="button"
              aria-label="Close notifications"
              onClick={close}
              className={`absolute inset-0 bg-black/40 transition-opacity duration-200 ${visible ? "opacity-100" : "opacity-0"}`}
            />

            {/* Panel */}
            <aside
              className={`absolute flex w-full flex-col border-l border-white/20 bg-white shadow-2xl transition-all duration-200 ease-out sm:top-0 sm:right-0 sm:h-full sm:max-w-[380px] sm:rounded-l-2xl bottom-0 left-0 h-[85vh] rounded-t-2xl sm:rounded-t-none ${visible ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}`}
            >
              <div className="flex items-center justify-between border-b border-gurukul-line px-5 py-4">
                <div>
                  <h2
                    className="text-sm font-semibold text-gurukul-ink"
                    style={{ fontFamily: "var(--font-syne)" }}
                  >
                    Notifications
                  </h2>
                  <p className="text-[10px] text-gurukul-muted mt-0.5">
                    {items.length
                      ? `${items.length} item${items.length === 1 ? "" : "s"} need attention`
                      : "You're all caught up"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={load}
                    className="p-2 rounded-lg text-gurukul-muted hover:bg-gurukul-soft hover:text-gurukul-ink transition-colors"
                    aria-label="Refresh"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`}
                    />
                  </button>
                  <button
                    onClick={close}
                    className="p-2 rounded-lg text-gurukul-muted hover:bg-gurukul-soft hover:text-gurukul-ink transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {items.length === 0 ? (
                  <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-gurukul-soft flex items-center justify-center mb-3">
                      <Inbox className="w-6 h-6 text-gurukul-muted" />
                    </div>
                    <p className="text-sm font-medium text-gurukul-ink">
                      All caught up
                    </p>
                    <p className="text-xs text-gurukul-muted mt-1">
                      No notifications right now.
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gurukul-line/60 p-2">
                    {items.map((item) => {
                      const meta = TYPE_META[item.type];
                      const Icon = meta.icon;
                      return (
                        <li key={item.id}>
                          <button
                            onClick={() => openItem(item)}
                            className="w-full text-left rounded-xl px-3 py-3 transition-colors hover:bg-gurukul-soft flex gap-3 group"
                          >
                            <div
                              className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${meta.cls}`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <p className="text-[10px] font-semibold uppercase tracking-wide text-gurukul-muted">
                                    {meta.label}
                                  </p>
                                  <p className="text-xs font-semibold text-gurukul-ink mt-0.5 group-hover:text-gurukul-accent transition-colors">
                                    {item.title}
                                  </p>
                                </div>
                                <span className="text-[9px] text-gurukul-muted shrink-0 pt-0.5">
                                  {timeAgo(item.createdAt)}
                                </span>
                              </div>
                              <p className="text-[11px] text-gurukul-muted mt-1 line-clamp-2">
                                {item.detail}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {items.length > 0 && (
                <div className="border-t border-gurukul-line px-5 py-3 bg-gurukul-canvas/80">
                  <p className="text-[10px] text-center text-gurukul-muted">
                    Tap a notification to open it
                  </p>
                </div>
              )}
            </aside>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        onClick={open}
        className="relative p-1.5 rounded-md transition-colors text-gurukul-muted hover:bg-gurukul-soft hover:text-gurukul-ink"
        aria-label={`Notifications${items.length ? ` (${items.length})` : ""}`}
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />
        {items.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 px-1 rounded-full bg-gurukul-accent text-white text-[8px] font-bold flex items-center justify-center">
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>
      {overlay}
    </>
  );
}
