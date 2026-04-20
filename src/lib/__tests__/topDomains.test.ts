import { describe, it, expect } from "vitest";
import { topDomains } from "@/lib/topDomains";
import type { HistoryEntry } from "@/lib/types";

const e = (host: string, visits: number): HistoryEntry => ({
  id: host + visits,
  url: `https://${host}/`,
  title: host,
  host,
  hostLetter: host[0].toUpperCase(),
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(2026, 3, 14),
  visitCount: visits,
  typedCount: 0,
});

describe("topDomains", () => {
  it("aggregates visitCount by host and sorts descending", () => {
    const { list, totalDomains } = topDomains(
      [e("a.com", 2), e("a.com", 3), e("b.com", 1), e("c.com", 10)],
      10,
    );
    expect(list.map((d) => d.host)).toEqual(["c.com", "a.com", "b.com"]);
    expect(list.map((d) => d.count)).toEqual([10, 5, 1]);
    expect(totalDomains).toBe(3);
  });
  it("caps list at the requested limit", () => {
    const entries = Array.from({ length: 10 }, (_, i) => e(`d${i}.com`, i + 1));
    const { list, totalDomains } = topDomains(entries, 3);
    expect(list).toHaveLength(3);
    expect(totalDomains).toBe(10);
    expect(list[0].count).toBe(10);
  });
  it("returns empty + zero when given no entries", () => {
    expect(topDomains([], 6)).toEqual({ list: [], totalDomains: 0 });
  });
});
