"use client";

import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Search, GraduationCap, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/session-context";

type SearchResult = {
  id: string;
  name: string;
  type: "student" | "teacher";
  detail: string;
};

export function GlobalPersonSearch() {
  const router = useRouter();
  const { isTeacher } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults([]);
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const peopleScope = isTeacher ? "&people=students" : "";
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmedQuery)}${peopleScope}`,
          {
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data.results);
        setIsOpen(true);
        setActiveIndex(-1);
      } catch (error) {
        if ((error as Error).name !== "AbortError") {
          setResults([]);
          setIsOpen(true);
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, isTeacher]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const selectResult = (result: SearchResult) => {
    setIsOpen(false);
    setQuery("");
    router.push(
      result.type === "student"
        ? `/students?sel=${result.id}`
        : `/staff?sel=${result.id}`,
    );
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsOpen(false);
      return;
    }
    if (!isOpen || results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? results.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectResult(results[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <Search
        className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2"
        style={{ color: "var(--faint)" }}
      />
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => query.trim() && setIsOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={isTeacher ? "Search students..." : "Search people..."}
        role="combobox"
        aria-label={
          isTeacher ? "Search students" : "Search students and teachers"
        }
        aria-autocomplete="list"
        aria-controls="global-person-search-results"
        aria-expanded={isOpen}
        className="w-full rounded-lg pl-8 pr-3 py-1.5 text-xs transition-all"
        style={{
          background: "var(--hover)",
          border: "1px solid var(--line)",
          color: "var(--ink)",
        }}
      />

      {isOpen && (
        <div
          className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-xl bg-white shadow-floating z-50 custom-scrollbar"
          style={{ border: "1px solid var(--line)" }}
        >
          {isLoading ? (
            <div
              className="px-3 py-3 text-xs flex items-center gap-2"
              style={{ color: "var(--faint)" }}
            >
              <div
                className="w-3 h-3 rounded-full animate-spin"
                style={{
                  border: "2px solid var(--line)",
                  borderTopColor: "var(--accent)",
                }}
              />
              <span>Searching...</span>
            </div>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-xs" style={{ color: "var(--faint)" }}>
              No results found.
            </p>
          ) : (
            <ul
              id="global-person-search-results"
              role="listbox"
              aria-label="Search results"
              className="py-1"
            >
              {results.map((result, index) => {
                const Icon = result.type === "student" ? GraduationCap : Users;
                const isActive = activeIndex === index;
                return (
                  <li
                    key={`${result.type}-${result.id}`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <button
                      type="button"
                      onClick={() => selectResult(result)}
                      className="w-full px-3 py-2 text-left flex items-center gap-2.5 transition-colors"
                      style={
                        isActive
                          ? { background: "var(--accent-soft)" }
                          : { background: "transparent" }
                      }
                      onMouseEnter={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "var(--hover)";
                        else
                          e.currentTarget.style.background =
                            "var(--accent-soft)";
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive)
                          e.currentTarget.style.background = "transparent";
                        else
                          e.currentTarget.style.background =
                            "var(--accent-soft)";
                      }}
                    >
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={
                          result.type === "student"
                            ? {
                                background: "var(--soft)",
                                color: "var(--muted)",
                              }
                            : { background: "var(--accent)", color: "#ffffff" }
                        }
                      >
                        <Icon className="w-3 h-3" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-gurukul-ink truncate">
                          {result.name}
                          <span
                            className="font-normal"
                            style={{ color: "var(--faint)" }}
                          >
                            {" "}
                            —{" "}
                            {result.type === "student" ? "Student" : "Teacher"}
                          </span>
                        </span>
                        <span
                          className="block text-[10px] truncate"
                          style={{ color: "var(--faint)" }}
                        >
                          {result.detail}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
