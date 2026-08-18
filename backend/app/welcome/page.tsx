"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ClipboardCheck, CalendarDays, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";

/**
 * Teacher task picker shown right after login.
 * Two choices only: take attendance, or open my timetable.
 */
export default function WelcomePage() {
  const router = useRouter();
  const { currentUser, isTeacher } = useAuth();

  // Admins don't need this screen
  useEffect(() => {
    if (currentUser && !isTeacher) router.replace("/");
  }, [currentUser, isTeacher, router]);

  if (!currentUser || !isTeacher) return null;

  const firstName = currentUser.name.split(" ").slice(-1)[0];

  const options = [
    {
      href: "/attendance/take",
      icon: ClipboardCheck,
      title: "Take Attendance",
      description:
        "Your class and today's date are pre-selected - just mark and submit.",
    },
    {
      href: "/timetable/my",
      icon: CalendarDays,
      title: "My Timetable",
      description: "See your schedule for the week or add a lecture.",
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-xl">
        <div className="text-center mb-8">
          <h1
            className="text-xl font-bold text-gurukul-ink tracking-tight"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            Good to see you, {firstName}
          </h1>
          <p className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
            What are you planning to do?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map(({ href, icon: Icon, title, description }) => (
            <Link key={href} href={href} className="card card-hover group p-6">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mb-4"
                style={{
                  background: "var(--accent-soft)",
                  border: "1px solid rgba(30, 58, 138, 0.2)",
                }}
              >
                <Icon
                  className="w-5 h-5"
                  style={{ color: "var(--accent-text)" }}
                />
              </div>
              <h2
                className="text-sm font-semibold text-gurukul-ink mb-1"
                style={{ fontFamily: "var(--font-syne)" }}
              >
                {title}
              </h2>
              <p
                className="text-xs leading-relaxed mb-4"
                style={{ color: "var(--muted)" }}
              >
                {description}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gurukul-ink">
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center mt-6">
          <Link
            href="/"
            className="text-[11px] transition-colors"
            style={{ color: "var(--faint)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "var(--ink)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "var(--faint)";
            }}
          >
            Skip — go to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}
