import { describe, it, expect } from "vitest";
import { filterEntries } from "@/lib/search";
import type { HistoryEntry } from "@/lib/types";

const e = (
  id: string,
  title: string,
  url: string,
  host: string,
): HistoryEntry => ({
  id,
  title,
  url,
  host,
  hostLetter: host[0]?.toUpperCase() ?? "·",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(2026, 3, 14),
  visitCount: 1,
  typedCount: 0,
});

const entries: HistoryEntry[] = [
  e(
    "1",
    "Hacker News",
    "https://news.ycombinator.com/",
    "news.ycombinator.com",
  ),
  e(
    "2",
    "GitHub — anthropics/claude-sdk",
    "https://github.com/anthropics",
    "github.com",
  ),
  e(
    "3",
    "Q2 Roadmap — Google Docs",
    "https://docs.google.com/document/d/1",
    "docs.google.com",
  ),
];

describe("filterEntries", () => {
  it("returns the original reference when query is empty", () => {
    expect(filterEntries(entries, "")).toBe(entries);
  });
  it("returns the original reference when query is whitespace only", () => {
    expect(filterEntries(entries, "   ")).toBe(entries);
  });
  it("matches on title case-insensitively", () => {
    expect(filterEntries(entries, "hacker")).toHaveLength(1);
    expect(filterEntries(entries, "GITHUB")).toHaveLength(1);
  });
  it("matches on url", () => {
    expect(filterEntries(entries, "document")).toHaveLength(1);
  });
  it("matches on host", () => {
    expect(filterEntries(entries, "ycombinator")).toHaveLength(1);
  });
  it("returns empty array when nothing matches", () => {
    expect(filterEntries(entries, "nope")).toEqual([]);
  });
});
