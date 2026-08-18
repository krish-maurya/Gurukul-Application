"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth/session-context";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { ChatDrawer } from "@/components/copilot/chat-drawer";

function AppShellContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isTeacher } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.documentElement.setAttribute("data-mobile-sidebar-open", "");
    } else {
      document.documentElement.removeAttribute("data-mobile-sidebar-open");
    }
    return () =>
      document.documentElement.removeAttribute("data-mobile-sidebar-open");
  }, [mobileSidebarOpen]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  // These are intentional distraction-free workflows, not dashboard pages.
  const isFocusPage =
    pathname === "/welcome" ||
    pathname === "/attendance/take" ||
    pathname === "/timetable/my";
  const isPublicPage =
    pathname === "/login" ||
    pathname === "/landing" ||
    pathname.startsWith("/p/") ||
    pathname.startsWith("/invite/");
  const isTeacherRestrictedPage =
    isTeacher && (pathname === "/staff" || pathname.startsWith("/staff/"));

  useEffect(() => {
    if (isTeacherRestrictedPage) router.replace("/students");
  }, [isTeacherRestrictedPage, router]);

  if (isPublicPage || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gurukul-canvas text-gurukul-ink font-sans">
        {children}
        <ChatDrawer />
      </div>
    );
  }

  if (isTeacherRestrictedPage) {
    return null;
  }

  // Welcome and teacher attendance must have no dashboard chrome, sidebar, or Copilot.
  if (isFocusPage) {
    return (
      <div className="min-h-screen bg-gurukul-canvas text-gurukul-ink antialiased">
        {children}
      </div>
    );
  }

  return (
    <div
      className="flex min-h-screen bg-gurukul-canvas text-gurukul-ink antialiased"
      style={
        {
          "--sidebar-width": sidebarCollapsed ? "4rem" : "15rem",
        } as React.CSSProperties
      }
    >
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setMobileSidebarOpen(true)} />
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">{children}</main>
      </div>
      <ChatDrawer />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AppShellContent>{children}</AppShellContent>
    </AuthProvider>
  );
}
