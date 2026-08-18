"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  MessagesSquare,
  FileText,
  Calendar,
  Users,
  ShieldAlert,
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  LogOut,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
  teacherRestricted?: boolean;
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Attendance", href: "/attendance", icon: UserCheck },
  { name: "Documents", href: "/documents", icon: FileText, badge: "OCR" },
  { name: "Timetable", href: "/timetable", icon: Calendar },
  { name: "Students", href: "/students", icon: GraduationCap },
  { name: "Parent Connect", href: "/communications", icon: MessagesSquare },
  { name: "Staff", href: "/staff", icon: Users, teacherRestricted: true },
  {
    name: "Access Control",
    href: "/admin/roles",
    icon: ShieldAlert,
    adminOnly: true,
  },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isAdmin, logout } = useAuth();

  if (!currentUser) return null;

  const sidebarContent = (
    <>
      {/* Brand Header */}
      <div
        className="h-14 px-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--line)" }}
      >
        {!collapsed && (
          <Link
            href="/"
            className="flex items-center gap-2.5"
            onClick={onMobileClose}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold tracking-wider"
              style={{ background: "var(--accent)" }}
            >
              G
            </div>
            <div>
              <h1
                className="font-semibold text-[13px] tracking-tight text-gurukul-ink leading-none"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                Gurukul
              </h1>
              <p
                className="text-[9px] font-medium tracking-wider uppercase mt-0.5"
                style={{ color: "var(--faint)" }}
              >
                AI School OS
              </p>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link href="/" className="mx-auto" onClick={onMobileClose}>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold tracking-wider"
              style={{ background: "var(--accent)" }}
            >
              G
            </div>
          </Link>
        )}
        {/* Mobile close button */}
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden btn-icon -mr-1"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {!collapsed && (
          <div
            className="px-2 pb-2 text-[9px] font-medium tracking-wider uppercase"
            style={{ color: "var(--faint)" }}
          >
            Main
          </div>
        )}
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) return null;
          if (item.teacherRestricted && currentUser.role === "TEACHER")
            return null;

          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.name : undefined}
              className="flex items-center justify-between px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all duration-150"
              style={
                isActive
                  ? {
                      background: "var(--accent-soft)",
                      color: "var(--accent-text)",
                    }
                  : { color: "var(--muted)" }
              }
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "var(--hover)";
                  e.currentTarget.style.color = "var(--ink)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "var(--muted)";
                }
              }}
              onClick={onMobileClose}
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className="w-4 h-4 shrink-0"
                  style={{ color: isActive ? "var(--accent)" : "var(--faint)" }}
                />
                {!collapsed && <span>{item.name}</span>}
              </div>
              {!collapsed && item.badge && (
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style={
                    isActive
                      ? { background: "var(--accent)", color: "#ffffff" }
                      : { background: "var(--soft)", color: "var(--faint)" }
                  }
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--line)" }}>
        {/* Collapse toggle */}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="w-full flex items-center justify-center p-1.5 rounded-md hover:bg-gurukul-soft transition-colors"
          style={{ color: "var(--faint)" }}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>

        {!collapsed && (
          <>
            <div
              className="flex items-center justify-between mb-2 text-[10px] px-1"
              style={{ color: "var(--faint)" }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "var(--green)" }}
                />
                <span>Online</span>
              </div>
            </div>

            <div
              className="p-2 rounded-lg flex items-center justify-between"
              style={{
                background: "var(--soft)",
                border: "1px solid var(--line)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className="w-6 h-6 rounded-full text-white flex items-center justify-center font-bold text-[10px] shrink-0"
                  style={{ background: "var(--accent)" }}
                >
                  {currentUser.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-gurukul-ink truncate">
                    {currentUser.name}
                  </p>
                  <p
                    className="text-[9px] truncate"
                    style={{ color: "var(--faint)" }}
                  >
                    {currentUser.role}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  logout();
                  router.push("/landing");
                }}
                title="Log Out"
                className="p-1 rounded transition-colors"
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
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          </>
        )}

        {collapsed && (
          <button
            onClick={() => {
              logout();
              router.push("/landing");
            }}
            title="Log Out"
            className="w-full flex items-center justify-center p-2 rounded-md hover:bg-gurukul-soft transition-colors"
            style={{ color: "var(--faint)" }}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible on md+ */}
      <aside
        className={`${collapsed ? "w-16" : "w-60"} hidden md:flex bg-white border-r text-gurukul-ink flex-col h-screen sticky top-0 select-none z-30 transition-all duration-200`}
        style={{ borderColor: "var(--line)" }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {onMobileClose && (
        <>
          {/* Backdrop */}
          <div
            className={`mobile-sidebar-backdrop fixed inset-0 bg-black/40 z-[199] md:hidden ${mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={onMobileClose}
            aria-hidden="true"
          />
          {/* Sidebar panel */}
          <aside
            className={`mobile-sidebar-panel fixed top-0 left-0 w-60 h-full bg-white border-r text-gurukul-ink flex flex-col select-none z-[200] md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
            style={{ borderColor: "var(--line)" }}
          >
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  );
}
