"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  Users,
  GraduationCap,
  UserCheck,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";
import { SkeletonDashboard } from "@/components/ui/loaders";

function DashboardContent() {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const metrics = [
    {
      label: "Total Students",
      value: "342",
      detail: "40 Grade 10A",
      icon: GraduationCap,
      iconClass: "g-metric-icon-accent",
    },
    {
      label: "Staff Utilization",
      value: "91.5%",
      detail: "4 Max Periods/Day",
      icon: Users,
      iconClass: "g-metric-icon-green",
    },
    {
      label: "Today's Attendance",
      value: "96.4%",
      detail: "37 Present / 3 Absent",
      icon: UserCheck,
      iconClass: "g-metric-icon-amber",
    },
    {
      label: "Pending Reviews",
      value: "1",
      detail: "78.5% OCR Score",
      icon: FileText,
      iconClass: "g-metric-icon-accent",
    },
  ];

  const chartData = [
    { day: "Mon", attendance: 95, room: 88 },
    { day: "Tue", attendance: 98, room: 92 },
    { day: "Wed", attendance: 94, room: 85 },
    { day: "Thu", attendance: 96, room: 90 },
    { day: "Fri", attendance: 97, room: 94 },
  ];

  const activity = [
    {
      dotClass: "g-dot-green",
      title: "Grade 10A Attendance Submitted",
      detail: "37 Present / 3 Absent",
      time: "10:15 AM",
    },
    {
      dotClass: "g-dot-amber",
      title: "OCR Document Ingested",
      detail: "Admission form (78.5%)",
      time: "09:45 AM",
    },
    {
      dotClass: "g-dot-red",
      title: "Timetable Conflict Detected",
      detail: "Turing double booked Mon P1",
      time: "09:00 AM",
    },
  ];

  return (
    <div className="gurukul-dash space-y-6 pb-16 animate-fade-in">
      {/* Welcome Banner */}
      <section className="g-hero">
        <div className="g-hero-inner">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <p className="g-hero-meta">
                {currentUser?.role} &middot; {currentUser?.name}
              </p>
              <h1 className="g-hero-title">Dashboard</h1>
              <p className="g-hero-sub">
                Overview of school operations and key metrics.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link href="/attendance" className="btn-primary btn-sm">
                <UserCheck className="w-3.5 h-3.5" />
                <span>Attendance</span>
              </Link>
              <Link href="/timetable" className="btn-secondary btn-sm">
                <Calendar className="w-3.5 h-3.5" />
                <span>Timetable</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="card card-hover g-metric">
            <div className="flex items-start justify-between">
              <div>
                <p className="g-metric-label">{metric.label}</p>
                <h3 className="g-metric-value">{metric.value}</h3>
                <p className="g-metric-detail">{metric.detail}</p>
              </div>
              <div className={`g-metric-icon ${metric.iconClass}`}>
                <metric.icon className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 card g-chart-card">
          <div className="g-chart-header">
            <div>
              <h3 className="g-section-title">Weekly Trends</h3>
              <p className="g-section-sub">Attendance vs room utilization.</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="g-legend">
                <span className="g-legend-dot g-legend-dot-accent" />
                <span className="g-legend-text">Attendance</span>
              </div>
              <div className="g-legend">
                <span className="g-legend-dot g-legend-dot-soft" />
                <span className="g-legend-text">Room Util.</span>
              </div>
            </div>
          </div>

          <div className="g-chart-body">
            <div className="g-chart-grid">
              {[100, 75, 50, 25].map((lvl) => (
                <div key={lvl} className="g-chart-grid-line">
                  <span className="g-chart-grid-label">{lvl}%</span>
                </div>
              ))}
            </div>
            <div className="g-chart-bars">
              {chartData.map((d) => (
                <div key={d.day} className="g-chart-bar-col">
                  <div className="g-chart-bar-stack">
                    <div
                      className="g-bar g-bar-accent"
                      style={{ height: `${d.attendance}%` }}
                    />
                    <div
                      className="g-bar g-bar-soft"
                      style={{ height: `${d.room}%` }}
                    />
                  </div>
                  <span className="g-chart-bar-label">{d.day}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 card g-activity-card">
          <div className="g-activity-header">
            <h3 className="g-section-title">Recent Activity</h3>
          </div>

          <div className="g-activity-list">
            {activity.map((item) => (
              <div key={item.title} className="g-activity-item">
                <span className={`g-dot ${item.dotClass}`} />
                <div className="min-w-0">
                  <p className="g-activity-title">{item.title}</p>
                  <p className="g-activity-detail">{item.detail}</p>
                  <p className="g-activity-time">{item.time}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="g-activity-footer">
            <Link href="/admin/roles" className="g-link-arrow">
              <span>View security audit</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .gurukul-dash .g-hero {
          background: linear-gradient(180deg, #fbfbfc 0%, #f5f5f7 100%);
          border: 1px solid var(--line);
          border-radius: 16px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 0 0 0.5px rgba(15, 23, 42, 0.04);
        }
        .gurukul-dash .g-hero::before {
          content: "";
          position: absolute;
          top: -40%;
          right: -8%;
          width: 55%;
          height: 180%;
          background: radial-gradient(
            circle at 50% 50%,
            var(--accent-glow),
            transparent 60%
          );
          pointer-events: none;
        }
        .gurukul-dash .g-hero-inner {
          position: relative;
          padding: 24px 28px;
          z-index: 1;
        }
        .gurukul-dash .g-hero-meta {
          font-size: 12px;
          color: var(--muted);
          margin: 0 0 6px 0;
          font-weight: 500;
          text-transform: capitalize;
        }
        .gurukul-dash .g-hero-title {
          font-family: var(--font-syne);
          font-size: 26px;
          font-weight: 700;
          line-height: 1.1;
          margin: 0;
          color: var(--ink);
          letter-spacing: -0.012em;
        }
        .gurukul-dash .g-hero-sub {
          margin-top: 6px;
          font-size: 12.5px;
          color: var(--muted);
          line-height: 1.5;
        }
        .gurukul-dash .g-metric {
          padding: 18px;
        }
        .gurukul-dash .g-metric-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--faint);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .gurukul-dash .g-metric-value {
          font-family: var(--font-syne);
          font-size: 24px;
          font-weight: 700;
          color: var(--ink);
          margin: 7px 0 2px 0;
          line-height: 1;
          letter-spacing: -0.02em;
        }
        .gurukul-dash .g-metric-detail {
          font-size: 11px;
          color: var(--muted);
        }
        .gurukul-dash .g-metric-icon {
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .gurukul-dash .g-metric-icon-accent {
          background: var(--accent-soft);
          color: var(--accent-text);
        }
        .gurukul-dash .g-metric-icon-green {
          background: var(--green-soft);
          color: var(--green-text);
        }
        .gurukul-dash .g-metric-icon-amber {
          background: var(--amber-soft);
          color: var(--amber-text);
        }
        .gurukul-dash .card-hover:hover .g-metric-icon {
          transform: scale(1.04);
        }
        .gurukul-dash .g-chart-card {
          padding: 20px 22px;
        }
        .gurukul-dash .g-chart-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          margin-bottom: 18px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--line);
        }
        .gurukul-dash .g-section-title {
          font-family: var(--font-syne);
          font-size: 13px;
          font-weight: 600;
          color: var(--ink);
          margin: 0;
        }
        .gurukul-dash .g-section-sub {
          font-size: 11px;
          color: var(--faint);
          margin: 3px 0 0 0;
        }
        .gurukul-dash .g-legend {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .gurukul-dash .g-legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 3px;
        }
        .gurukul-dash .g-legend-dot-accent {
          background: var(--accent);
        }
        .gurukul-dash .g-legend-dot-soft {
          background: #b1bcca;
        }
        .gurukul-dash .g-legend-text {
          font-size: 11px;
          color: var(--muted);
          font-weight: 500;
        }
        .gurukul-dash .g-chart-body {
          position: relative;
          height: 220px;
          padding: 12px 4px 0 4px;
        }
        .gurukul-dash .g-chart-grid {
          position: absolute;
          inset: 12px 0 28px 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          pointer-events: none;
        }
        .gurukul-dash .g-chart-grid-line {
          position: relative;
          border-bottom: 1px dashed rgba(17, 19, 18, 0.06);
          height: 0;
        }
        .gurukul-dash .g-chart-grid-label {
          position: absolute;
          left: 0;
          top: -7px;
          font-size: 9px;
          color: var(--faint);
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          background: var(--surface);
          padding: 0 4px;
        }
        .gurukul-dash .g-chart-bars {
          position: relative;
          z-index: 1;
          height: 100%;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 14px;
          padding-left: 32px;
        }
        .gurukul-dash .g-chart-bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          height: 100%;
        }
        .gurukul-dash .g-chart-bar-stack {
          width: 100%;
          height: 160px;
          display: flex;
          justify-content: center;
          align-items: flex-end;
          gap: 6px;
        }
        .gurukul-dash .g-bar {
          width: 18px;
          border-radius: 5px 5px 0 0;
          transition: height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .gurukul-dash .g-bar-accent {
          background: linear-gradient(
            180deg,
            #2a4ba0 0%,
            var(--accent) 50%,
            var(--accent-text) 100%
          );
          box-shadow: 0 2px 6px rgba(30, 58, 138, 0.18);
        }
        .gurukul-dash .g-bar-soft {
          background: linear-gradient(180deg, #d2d8e6 0%, #b8c0d0 100%);
        }
        .gurukul-dash .g-chart-bar-label {
          font-size: 10.5px;
          color: var(--muted);
          font-weight: 500;
        }
        .gurukul-dash .g-activity-card {
          padding: 20px 20px 16px 20px;
          display: flex;
          flex-direction: column;
        }
        .gurukul-dash .g-activity-header {
          padding-bottom: 12px;
          margin-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }
        .gurukul-dash .g-activity-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 13px;
        }
        .gurukul-dash .g-activity-item {
          display: flex;
          gap: 11px;
          align-items: flex-start;
        }
        .gurukul-dash .g-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 5px;
          position: relative;
        }
        .gurukul-dash .g-dot::after {
          content: "";
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: currentColor;
          opacity: 0.18;
        }
        .gurukul-dash .g-dot-green {
          background: var(--green);
          color: var(--green);
        }
        .gurukul-dash .g-dot-amber {
          background: var(--amber);
          color: var(--amber);
        }
        .gurukul-dash .g-dot-red {
          background: var(--red);
          color: var(--red);
        }
        .gurukul-dash .g-activity-title {
          font-size: 12px;
          font-weight: 600;
          color: var(--ink);
          line-height: 1.35;
          margin: 0;
        }
        .gurukul-dash .g-activity-detail {
          font-size: 11px;
          color: var(--muted);
          margin: 3px 0 0 0;
          line-height: 1.4;
        }
        .gurukul-dash .g-activity-time {
          font-size: 9.5px;
          color: var(--faint);
          font-family: ui-monospace, "SF Mono", Menlo, monospace;
          margin: 5px 0 0 0;
          letter-spacing: 0.02em;
        }
        .gurukul-dash .g-activity-footer {
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
        }
        .gurukul-dash .g-link-arrow {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: 10.5px;
          font-weight: 500;
          color: var(--muted);
          transition: color 0.15s ease;
        }
        .gurukul-dash .g-link-arrow:hover {
          color: var(--accent);
        }
        .gurukul-dash .g-link-arrow svg {
          transition: transform 0.15s ease;
        }
        .gurukul-dash .g-link-arrow:hover svg {
          transform: translateX(2px);
        }
        @media (max-width: 640px) {
          .gurukul-dash .g-hero-inner {
            padding: 20px 18px;
          }
          .gurukul-dash .g-hero-title {
            font-size: 22px;
          }
          .gurukul-dash .g-chart-card,
          .gurukul-dash .g-activity-card {
            padding: 16px 14px;
          }
          .gurukul-dash .g-bar {
            width: 14px;
          }
          .gurukul-dash .g-chart-bars {
            gap: 8px;
            padding-left: 28px;
          }
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<SkeletonDashboard />}>
      <DashboardContent />
    </Suspense>
  );
}
