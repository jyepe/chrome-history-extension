import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDateLong,
  formatShortDate,
  startOfDay,
  startOfToday,
  groupByDay,
  bucketByDay,
} from "@/lib/date";
import type { HistoryEntry } from "@/lib/types";

const entry = (iso: string, views = 1): HistoryEntry => ({
  id: iso,
  url: "https://example.com/" + iso,
  title: "t",
  host: "example.com",
  hostLetter: "E",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(iso),
  visitCount: views,
  typedCount: 0,
  searchKey: `t\nhttps://example.com/${iso}\nexample.com`.toLowerCase(),
});

describe("formatTime", () => {
  it("pads hours/minutes/seconds to 2 digits", () => {
    expect(formatTime(new Date("2026-04-14T05:07:09"))).toBe("05:07:09");
  });
});

describe("formatDateLong", () => {
  it("returns weekday + long month + day + year", () => {
    expect(formatDateLong(new Date(2026, 3, 14))).toBe(
      "Tuesday, April 14, 2026",
    );
  });
});

describe("formatShortDate", () => {
  it("returns M/D/YYYY", () => {
    expect(formatShortDate(new Date(2026, 3, 14))).toBe("4/14/2026");
  });
});

describe("startOfDay", () => {
  it("zeroes hours/minutes/seconds/ms", () => {
    const d = startOfDay(new Date(2026, 3, 14, 17, 30, 45, 123));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
});

describe("startOfToday", () => {
  it("returns a Date representing midnight local time", () => {
    const t = startOfToday();
    expect(t.getHours()).toBe(0);
  });
});

describe("groupByDay", () => {
  it("groups entries by local calendar day, descending", () => {
    const entries = [
      entry("2026-04-14T10:00:00", 2),
      entry("2026-04-14T12:00:00", 3),
      entry("2026-04-13T09:00:00", 1),
    ];
    const groups = groupByDay(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].date.getDate()).toBe(14);
    expect(groups[0].totalViews).toBe(5);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].date.getDate()).toBe(13);
    expect(groups[1].totalViews).toBe(1);
  });
  it("returns an empty array for no entries", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("bucketByDay", () => {
  it("produces N consecutive day-buckets ending on endDate", () => {
    const entries = [
      entry("2026-04-14T10:00:00", 3), // day 0
      entry("2026-04-14T11:00:00", 2), // day 0 (same day, different URL)
      entry("2026-04-13T09:00:00", 1), // day -1
    ];
    const endDate = startOfDay(new Date(2026, 3, 14));
    const buckets = bucketByDay(entries, 3, endDate);
    expect(buckets).toHaveLength(3);
    expect(buckets[2].date.getDate()).toBe(14);
    expect(buckets[2].pages).toBe(2);
    expect(buckets[2].views).toBe(5);
    expect(buckets[1].date.getDate()).toBe(13);
    expect(buckets[1].pages).toBe(1);
    expect(buckets[1].views).toBe(1);
    expect(buckets[0].date.getDate()).toBe(12);
    expect(buckets[0].pages).toBe(0);
    expect(buckets[0].views).toBe(0);
  });
  it('labels buckets as "Mon D"', () => {
    const endDate = startOfDay(new Date(2026, 3, 14));
    const buckets = bucketByDay([], 3, endDate);
    expect(buckets[2].label).toBe("Apr 14");
    expect(buckets[1].label).toBe("Apr 13");
    expect(buckets[0].label).toBe("Apr 12");
  });
});
