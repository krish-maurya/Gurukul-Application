"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCheck, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";
import { GlobalPersonSearch } from "./global-person-search";
import { NotificationsBell } from "./notifications-panel";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const router = useRouter();
  const { currentUser, logout, isAdmin } = useAuth();

  if (!currentUser) return null;

  const handleLogout = () => {
    logout();
  };

  return (
    <header
      className="h-14 bg-white border-b px-4 md:px-6 flex items-center justify-between sticky top-0 z-20"
      style={{ borderColor: "var(--line)" }}
    >
      {/* Left: Hamburger (mobile) + Search */}
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="md:hidden btn-icon"
            aria-label="Open sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <GlobalPersonSearch />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        <div
          className="text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1"
          style={
            isAdmin
              ? { background: "var(--accent)", color: "#ffffff" }
              : { background: "var(--soft)", color: "var(--muted)" }
          }
        >
          {isAdmin ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <UserCheck className="w-3 h-3" />
          )}
          <span>{isAdmin ? "Admin" : "Teacher"}</span>
        </div>

        {/* Notifications */}
        <NotificationsBell />

        {/* Current User Profile & Logout */}
        <div
          className="flex items-center gap-2.5 pl-2.5 border-l"
          style={{ borderColor: "var(--line)" }}
        >
          <div className="text-right hidden md:block">
            <p className="text-[11px] font-medium text-gurukul-ink leading-tight">
              {currentUser.name}
            </p>
            <p className="text-[10px]" style={{ color: "var(--faint)" }}>
              {currentUser.department}
            </p>
          </div>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] text-gurukul-ink"
            style={{
              background: "var(--soft)",
              border: "1px solid var(--line)",
            }}
          >
            {currentUser.name.charAt(0)}
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-1.5 rounded-md transition-colors"
            style={{ color: "var(--faint)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--red-soft)";
              e.currentTarget.style.color = "var(--red)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--faint)";
            }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
