"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Calendar,
  FileText,
  UserCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gurukul-ink font-sans">
      {/* Navigation Header */}
      <header
        className="border-b sticky top-0 z-50 bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold tracking-wider"
              style={{ background: "var(--accent)" }}
            >
              G
            </div>
            <span
              className="font-semibold text-sm tracking-tight"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Gurukul
            </span>
          </div>

          <nav
            className="hidden md:flex items-center gap-6 text-xs font-medium"
            style={{ color: "var(--muted)" }}
          >
            <a
              href="#features"
              className="transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              Features
            </a>
            <a
              href="#roles"
              className="transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              Roles
            </a>
            <a
              href="#copilot"
              className="transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              AI Copilot
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--muted)")
              }
            >
              Sign in
            </Link>
            <Link
              href="/login"
              className="text-xs font-medium text-white px-4 py-2 rounded-lg transition-all"
              style={{ background: "var(--accent)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-text)";
                e.currentTarget.style.boxShadow =
                  "0 6px 16px rgba(30, 58, 138, 0.22)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-24 pb-20 px-6 relative overflow-hidden">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at 50% 50%, var(--accent-glow), transparent 60%)",
          }}
        />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-medium mb-6"
            style={{
              background: "var(--accent-soft)",
              color: "var(--accent-text)",
              border: "1px solid rgba(30, 58, 138, 0.18)",
            }}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI-first School Operating System</span>
          </div>

          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-gurukul-ink leading-[1.15]"
            style={{ fontFamily: "var(--font-syne)" }}
          >
            The intelligent way to
            <br />
            run your school
          </h1>

          <p
            className="mt-5 text-sm sm:text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: "var(--muted)" }}
          >
            Automated attendance tracking, document OCR processing, timetable
            conflict resolution, and natural language AI — all in one minimal
            interface.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/login" className="btn-primary w-full sm:w-auto">
              <span>Sign in to system</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <button className="btn-secondary w-full sm:w-auto">
              <span>Explore features</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 pb-20">
        <div className="max-w-4xl mx-auto">
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-px rounded-xl overflow-hidden"
            style={{ background: "var(--line)" }}
          >
            {[
              {
                icon: UserCheck,
                title: "Grid Attendance",
                description:
                  "40-student batch roll call with one-tap toggle. Track daily presence instantly.",
              },
              {
                icon: FileText,
                title: "Document OCR",
                description:
                  "Upload scanned admission forms. Tesseract extracts 21+ fields with confidence scoring.",
              },
              {
                icon: Calendar,
                title: "Timetable Solver",
                description:
                  "Constraint-based scheduling detects teacher and room conflicts. AI suggests fixes.",
              },
              {
                icon: Sparkles,
                title: "AI Copilot",
                description:
                  "Natural language queries across students, attendance, and staff. Persistent chat drawer.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-white p-6 transition-colors"
                style={{ background: "#ffffff" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--hover)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                }}
              >
                <feature.icon
                  className="w-5 h-5 mb-3"
                  style={{ color: "var(--accent)" }}
                />
                <h3
                  className="text-sm font-semibold text-gurukul-ink"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {feature.title}
                </h3>
                <p
                  className="text-xs mt-1.5 leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section
        id="roles"
        className="px-6 pb-20 py-20 border-y"
        style={{ background: "var(--soft)", borderColor: "var(--line)" }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2
              className="text-xl font-bold tracking-tight text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Built for two roles
            </h2>
            <p
              className="text-xs mt-2 max-w-md mx-auto"
              style={{ color: "var(--muted)" }}
            >
              Role-based access ensures administrators maintain oversight while
              teachers manage daily tasks.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                role: "Administrator",
                badge: "Executive",
                description:
                  "Full governance, audit logs, RBAC permissions, global attendance oversight, and timetable configuration.",
                features: [
                  "Audit & Access Control",
                  "Document Review & Verification",
                  "Executive Analytics",
                ],
                icon: ShieldCheck,
              },
              {
                role: "Teacher",
                badge: "Faculty",
                description:
                  "Streamlined batch attendance, personal timetable view, student registry, and AI Copilot assistance.",
                features: [
                  "Batch Grid Attendance",
                  "Timetable Schedule View",
                  "Interactive AI Copilot",
                ],
                icon: UserCheck,
              },
            ].map((item) => (
              <div key={item.role} className="card p-6">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-4"
                  style={{
                    background: "var(--accent-soft)",
                    color: "var(--accent-text)",
                  }}
                >
                  <item.icon className="w-4 h-4" />
                </div>
                <span className="badge-dark">{item.badge}</span>
                <h3
                  className="text-base font-semibold text-gurukul-ink mt-3"
                  style={{ fontFamily: "var(--font-syne)" }}
                >
                  {item.role}
                </h3>
                <p
                  className="text-xs mt-2 leading-relaxed"
                  style={{ color: "var(--muted)" }}
                >
                  {item.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {item.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs"
                      style={{ color: "var(--muted)" }}
                    >
                      <CheckCircle2
                        className="w-3.5 h-3.5"
                        style={{ color: "var(--faint)" }}
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t py-8 px-6 bg-white"
        style={{ borderColor: "var(--line)" }}
      >
        <div
          className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs gap-3"
          style={{ color: "var(--faint)" }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-white font-bold text-[9px]"
              style={{ background: "var(--accent)" }}
            >
              G
            </div>
            <span
              className="font-medium text-gurukul-ink"
              style={{ fontFamily: "var(--font-syne)" }}
            >
              Gurukul
            </span>
          </div>
          <p>&copy; 2026 Gurukul Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
