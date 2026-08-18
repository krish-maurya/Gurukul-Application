"use client";

import React, { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ArrowUp,
  Loader2,
  Minus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth/session-context";
import type { AssistantResponse } from "@/lib/copilot/types";
import { StructuredResults } from "./structured-results";

type Message = {
  id: string;
  sender: "user" | "copilot";
  text: string;
  response?: AssistantResponse;
};

const SUGGESTIONS = [
  { label: "Grade 10A timetable", icon: "📋" },
  { label: "Who is absent today?", icon: "🔍" },
  { label: "Timetable conflicts?", icon: "⚠️" },
  { label: "Students at risk", icon: "📊" },
];

export function ChatDrawer() {
  const { currentUser, isAuthenticated } = useAuth();
  const pathname = usePathname();
  // On the regular attendance page, lift the floating assistant above the fixed action bar.
  const clearsAttendanceBar = pathname === "/attendance";
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [animateIn, setAnimateIn] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setAnimateIn(true));
      textareaRef.current?.focus();
    } else {
      setAnimateIn(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [open, messages, loading]);

  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "0px";
    node.style.height = `${Math.min(node.scrollHeight, 104)}px`;
  }, [input]);

  async function send(value = input) {
    const query = value.trim();
    if (!query || loading) return;
    setMessages((items) => [
      ...items,
      { id: `user-${Date.now()}`, sender: "user", text: query },
    ]);
    setInput("");
    setLoading(true);
    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
        intent: m.response?.intent,
      }));
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, history }),
      });
      const response = (await res.json()) as AssistantResponse;
      setMessages((items) => [
        ...items,
        {
          id: `assistant-${Date.now()}`,
          sender: "copilot",
          text: response.message || "I couldn't complete that request.",
          response,
        },
      ]);
    } catch {
      setMessages((items) => [
        ...items,
        {
          id: `error-${Date.now()}`,
          sender: "copilot",
          text: "I couldn't connect just now. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clear() {
    setMessages([]);
    setInput("");
    textareaRef.current?.focus();
  }

  function handleClose() {
    setAnimateIn(false);
    setTimeout(() => setOpen(false), 250);
  }

  if (!isAuthenticated) return null;

  return (
    <div
      className={`fixed right-4 z-20 font-sans transition-[bottom] duration-200 ${clearsAttendanceBar ? "bottom-24" : "bottom-4"}`}
    >
      {/* FAB */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Assistant"
          className="copilot-fab group relative"
        >
          <span className="copilot-fab-ring" />
          <span className="copilot-fab-icon">
            <Sparkles className="h-4 w-4 text-white" strokeWidth={2} />
          </span>
          <span className="copilot-fab-label">
            <span className="copilot-fab-title">Ask AI</span>
            <span className="copilot-fab-subtitle">Ask anything</span>
          </span>
        </button>
      )}

      {/* Chat Panel */}
      {open && (
        <section
          aria-label="GURUKUL Assistant"
          className={`copilot-panel ${animateIn ? "copilot-panel-open" : "copilot-panel-closed"}`}
        >
          {/* Header */}
          <header className="copilot-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="copilot-header-avatar">
                  <Sparkles
                    className="h-3.5 w-3.5 text-neutral-500"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <h2 className="text-[12px] font-semibold tracking-tight text-gurukul-dark">
                    Gurukul Assistant
                  </h2>
                  <p className="mt-0.5 flex items-center gap-1 text-[10px] text-neutral-400">
                    <span className="copilot-status-dot" />
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  aria-label="New conversation"
                  title="New conversation"
                  onClick={clear}
                  className="copilot-header-btn"
                >
                  <RotateCcw className="h-3 w-3" />
                </button>
                <button
                  aria-label="Minimize"
                  title="Minimize"
                  onClick={handleClose}
                  className="copilot-header-btn"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <button
                  aria-label="Close"
                  title="Close"
                  onClick={handleClose}
                  className="copilot-header-btn"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* User badge */}
            <div className="mt-2 flex items-center justify-between">
              <span className="text-[9px] text-neutral-400">
                {currentUser?.name}
              </span>
              <span className="copilot-role-badge">{currentUser?.role}</span>
            </div>
          </header>

          {/* Messages */}
          <main className="copilot-messages">
            {messages.length === 0 ? (
              <div className="copilot-empty-state">
                <div className="copilot-empty-icon">
                  <Sparkles className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <h3 className="mt-4 text-[13px] font-semibold tracking-tight text-gurukul-dark">
                  How can I help?
                </h3>
                <p className="mt-1 text-[10px] leading-relaxed text-neutral-400">
                  Ask about students, attendance, timetables, or faculty.
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-1.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => send(s.label)}
                      className="copilot-chip"
                    >
                      <span className="copilot-chip-icon">{s.icon}</span>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message, idx) => (
                  <div
                    key={message.id}
                    className={`copilot-msg-row ${message.sender === "user" ? "copilot-msg-user" : "copilot-msg-bot"}`}
                    style={{ animationDelay: `${Math.min(idx * 30, 150)}ms` }}
                  >
                    {message.sender === "user" ? (
                      <div className="copilot-bubble-user">{message.text}</div>
                    ) : (
                      <div className="copilot-bubble-wrapper">
                        <div className="copilot-bot-avatar">
                          <Sparkles
                            className="h-2 w-2 text-neutral-400"
                            strokeWidth={2.5}
                          />
                        </div>
                        <div className="copilot-bubble-bot">
                          <p
                            className="whitespace-pre-line"
                            dangerouslySetInnerHTML={{
                              __html: message.text
                                .replace(/&/g, "&amp;")
                                .replace(/</g, "&lt;")
                                .replace(/>/g, "&gt;")
                                .replace(
                                  /\*\*(.+?)\*\*/g,
                                  "<strong>$1</strong>",
                                )
                                .replace(/\*(.+?)\*/g, "<em>$1</em>"),
                            }}
                          />
                          {message.response && (
                            <StructuredResults response={message.response} />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Typing */}
            {loading && (
              <div className="copilot-typing">
                <div className="copilot-bot-avatar">
                  <Sparkles
                    className="h-2 w-2 text-neutral-400"
                    strokeWidth={2.5}
                  />
                </div>
                <div className="copilot-typing-dots">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </main>

          {/* Footer */}
          <footer className="copilot-footer">
            <div className="copilot-input-wrapper">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Ask about Gurukul..."
                className="copilot-input"
              />
              <button
                aria-label="Send message"
                onClick={() => send()}
                disabled={loading || !input.trim()}
                className="copilot-send-btn"
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />
                )}
              </button>
            </div>
            <div className="copilot-footer-meta">
              <span className="text-[9px] text-neutral-400">
                <kbd className="copilot-kbd">↵</kbd> Send
              </span>
              <span className="flex items-center gap-1 text-[9px] text-neutral-400">
                <ShieldCheck className="h-2.5 w-2.5 text-emerald-500" />
                Verified
              </span>
            </div>
          </footer>
        </section>
      )}
    </div>
  );
}
