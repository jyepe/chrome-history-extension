import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDateLong,
  formatShortDate,
  startOfDay,
  startOfToday,
  startOfHour,
  startOfWeek,
  isSameDay,
  isSameWeek,
  addDays,
  addWeeks,
  bucketByWeekday,
  groupByDay,
  groupByHour,
  bucketByDay,
  bucketByHour,
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

describe("startOfHour", () => {
  it("zeroes minutes/seconds/ms but keeps the hour", () => {
    const h = startOfHour(new Date(2026, 3, 14, 17, 30, 45, 123));
    expect(h.getHours()).toBe(17);
    expect(h.getMinutes()).toBe(0);
    expect(h.getSeconds()).toBe(0);
    expect(h.getMilliseconds()).toBe(0);
  });
});

describe("isSameDay", () => {
  it("is true for times on the same local calendar day", () => {
    expect(
      isSameDay(new Date(2026, 3, 14, 0, 1), new Date(2026, 3, 14, 23, 59)),
    ).toBe(true);
  });
  it("is false for times that differ in day/month/year", () => {
    expect(isSameDay(new Date(2026, 3, 14), new Date(2026, 3, 15))).toBe(false);
    expect(isSameDay(new Date(2026, 3, 14), new Date(2026, 4, 14))).toBe(false);
    expect(isSameDay(new Date(2026, 3, 14), new Date(2027, 3, 14))).toBe(false);
  });
});

describe("addDays", () => {
  it("shifts by n days and returns start-of-day", () => {
    const d = addDays(new Date(2026, 3, 14, 15, 30), 1);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(0);
  });
  it("handles negative n and month boundaries", () => {
    const d = addDays(new Date(2026, 4, 1), -1);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(30);
  });
});

describe("groupByHour", () => {
  it("groups entries by local hour, descending", () => {
    const entries = [
      entry("2026-04-14T10:10:00", 2),
      entry("2026-04-14T10:50:00", 3),
      entry("2026-04-14T09:30:00", 1),
    ];
    const groups = groupByHour(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].hour).toBe(10);
    expect(groups[0].totalViews).toBe(5);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].hour).toBe(9);
    expect(groups[1].totalViews).toBe(1);
  });
  it("returns an empty array for no entries", () => {
    expect(groupByHour([])).toEqual([]);
  });
});

describe("bucketByHour", () => {
  it("produces 24 hourly buckets labelled 00..23", () => {
    const buckets = bucketByHour([], startOfDay(new Date(2026, 3, 14)));
    expect(buckets).toHaveLength(24);
    expect(buckets[0].label).toBe("00");
    expect(buckets[9].label).toBe("09");
    expect(buckets[23].label).toBe("23");
    for (const b of buckets) {
      expect(b.pages).toBe(0);
      expect(b.views).toBe(0);
    }
  });
  it("counts pages/views only from entries on the matching day", () => {
    const dayStart = startOfDay(new Date(2026, 3, 14));
    const entries = [
      entry("2026-04-14T10:10:00", 3),
      entry("2026-04-14T10:50:00", 2),
      entry("2026-04-14T11:00:00", 1),
      entry("2026-04-13T10:00:00", 7), // different day — excluded
    ];
    const buckets = bucketByHour(entries, dayStart);
    expect(buckets[10].pages).toBe(2);
    expect(buckets[10].views).toBe(5);
    expect(buckets[11].pages).toBe(1);
    expect(buckets[11].views).toBe(1);
    expect(buckets[9].pages).toBe(0);
    expect(buckets[9].views).toBe(0);
  });
});

describe("startOfWeek", () => {
  it("returns Sunday midnight for any day in the week", () => {
    // 2026-04-14 is a Tuesday; Sunday of that week is 2026-04-12
    const s = startOfWeek(new Date(2026, 3, 14, 17, 30, 45, 123));
    expect(s.getFullYear()).toBe(2026);
    expect(s.getMonth()).toBe(3);
    expect(s.getDate()).toBe(12);
    expect(s.getHours()).toBe(0);
    expect(s.getMinutes()).toBe(0);
  });
  it("is idempotent on Sunday", () => {
    const s = startOfWeek(new Date(2026, 3, 12, 11, 0));
    expect(s.getDate()).toBe(12);
  });
  it("crosses month boundaries", () => {
    // 2026-05-01 is a Friday; Sunday of that week is 2026-04-26
    const s = startOfWeek(new Date(2026, 4, 1));
    expect(s.getMonth()).toBe(3);
    expect(s.getDate()).toBe(26);
  });
});

describe("addWeeks", () => {
  it("shifts by +1 week", () => {
    const d = addWeeks(new Date(2026, 3, 14), 1);
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(0);
  });
  it("shifts by -1 week across month boundary", () => {
    const d = addWeeks(new Date(2026, 4, 1), -1);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(24);
  });
  it("returns start-of-day at n=0", () => {
    const d = addWeeks(new Date(2026, 3, 14, 17, 30), 0);
    expect(d.getDate()).toBe(14);
    expect(d.getHours()).toBe(0);
  });
});

describe("isSameWeek", () => {
  it("is true for days in the same Sun–Sat week", () => {
    expect(
      isSameWeek(new Date(2026, 3, 12, 9, 0), new Date(2026, 3, 18, 23, 59)),
    ).toBe(true);
  });
  it("is false across a Saturday→Sunday boundary", () => {
    expect(
      isSameWeek(new Date(2026, 3, 18, 23, 59), new Date(2026, 3, 19, 0, 1)),
    ).toBe(false);
  });
});

describe("bucketByWeekday", () => {
  it("produces 7 buckets Sun→Sat with the right labels", () => {
    const weekStart = new Date(2026, 3, 12);
    const buckets = bucketByWeekday([], weekStart);
    expect(buckets).toHaveLength(7);
    expect(buckets.map((b) => b.weekdayShort)).toEqual([
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ]);
    expect(buckets[0].date.getDate()).toBe(12);
    expect(buckets[6].date.getDate()).toBe(18);
    expect(buckets[0].monthShort).toBe("Apr");
    for (const b of buckets) {
      expect(b.entries).toEqual([]);
      expect(b.totalViews).toBe(0);
    }
  });

  it("assigns entries to the correct weekday and sums views", () => {
    const weekStart = new Date(2026, 3, 12);
    const entries = [
      entry("2026-04-12T09:00:00", 2), // Sun
      entry("2026-04-12T10:00:00", 3), // Sun (same day, different URL)
      entry("2026-04-14T14:00:00", 1), // Tue
      entry("2026-04-20T10:00:00", 9), // outside week — excluded
    ];
    const buckets = bucketByWeekday(entries, weekStart);
    expect(buckets[0].entries).toHaveLength(2);
    expect(buckets[0].totalViews).toBe(5);
    expect(buckets[2].entries).toHaveLength(1);
    expect(buckets[2].totalViews).toBe(1);
    expect(buckets[1].entries).toHaveLength(0);
    // entry outside week is not assigned
    const total = buckets.reduce((n, b) => n + b.entries.length, 0);
    expect(total).toBe(3);
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
