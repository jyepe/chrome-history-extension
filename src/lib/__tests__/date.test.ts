import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatHourLabel,
  formatDateLong,
  formatShortDate,
  startOfDay,
  startOfToday,
  startOfHour,
  startOfWeek,
  startOfMonth,
  isSameDay,
  isSameWeek,
  isSameMonth,
  addDays,
  addWeeks,
  addMonths,
  clampDayToMonth,
  bucketByWeekday,
  groupByDay,
  groupByHour,
  bucketByDay,
  bucketByHour,
  monthGrid,
  monthLabel,
  monthCellStats,
  dayKey,
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
  it("renders AM times with padded minutes/seconds", () => {
    expect(formatTime(new Date("2026-04-14T05:07:09"))).toBe("5:07:09 AM");
  });
  it("renders PM times", () => {
    expect(formatTime(new Date("2026-04-14T14:05:09"))).toBe("2:05:09 PM");
  });
  it("renders midnight as 12 AM", () => {
    expect(formatTime(new Date("2026-04-14T00:00:00"))).toBe("12:00:00 AM");
  });
  it("renders noon as 12 PM", () => {
    expect(formatTime(new Date("2026-04-14T12:00:00"))).toBe("12:00:00 PM");
  });
});

describe("formatHourLabel", () => {
  it("renders midnight as 12:00 AM", () => {
    expect(formatHourLabel(0)).toBe("12:00 AM");
  });
  it("renders morning hours", () => {
    expect(formatHourLabel(9)).toBe("9:00 AM");
  });
  it("renders noon as 12:00 PM", () => {
    expect(formatHourLabel(12)).toBe("12:00 PM");
  });
  it("renders afternoon hours", () => {
    expect(formatHourLabel(14)).toBe("2:00 PM");
  });
  it("renders late evening", () => {
    expect(formatHourLabel(23)).toBe("11:00 PM");
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

describe("startOfMonth", () => {
  it("returns Y/M/1 midnight for any day in the month", () => {
    const d = startOfMonth(new Date(2026, 3, 17, 12, 34));
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(3);
    expect(d.getDate()).toBe(1);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });
});

describe("isSameMonth", () => {
  it("is true within the same month/year", () => {
    expect(
      isSameMonth(new Date(2026, 3, 1), new Date(2026, 3, 30, 23, 59)),
    ).toBe(true);
  });
  it("is false across month or year boundaries", () => {
    expect(isSameMonth(new Date(2026, 3, 30), new Date(2026, 4, 1))).toBe(
      false,
    );
    expect(isSameMonth(new Date(2025, 3, 14), new Date(2026, 3, 14))).toBe(
      false,
    );
  });
});

describe("clampDayToMonth", () => {
  it("returns the day unchanged when it fits", () => {
    expect(clampDayToMonth(15, new Date(2026, 3, 1))).toBe(15);
  });
  it("clamps to the last day of a shorter month", () => {
    // Feb 2026 has 28 days
    expect(clampDayToMonth(31, new Date(2026, 1, 1))).toBe(28);
  });
  it("clamps to 29 in a leap February", () => {
    expect(clampDayToMonth(31, new Date(2024, 1, 1))).toBe(29);
  });
});

describe("addMonths", () => {
  it("shifts by +1 month preserving day-of-month", () => {
    const d = addMonths(new Date(2026, 3, 14, 10), 1);
    expect(d.getMonth()).toBe(4);
    expect(d.getDate()).toBe(14);
  });
  it("shifts by -1 month", () => {
    const d = addMonths(new Date(2026, 3, 14), -1);
    expect(d.getMonth()).toBe(2);
    expect(d.getDate()).toBe(14);
  });
  it("rolls over the year going forward", () => {
    const d = addMonths(new Date(2026, 11, 15), 1);
    expect(d.getFullYear()).toBe(2027);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
  });
  it("clamps day-of-month when target month is shorter", () => {
    const d = addMonths(new Date(2026, 0, 31), 1); // Jan 31 + 1 → Feb
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(28);
  });
});

describe("monthLabel", () => {
  it("returns 'Month YYYY'", () => {
    expect(monthLabel(new Date(2026, 3, 14))).toBe("April 2026");
    expect(monthLabel(new Date(2026, 11, 1))).toBe("December 2026");
  });
});

describe("monthGrid", () => {
  it("returns 42 consecutive dates starting at the Sunday on/before the 1st", () => {
    // April 1, 2026 is a Wednesday → first grid cell is Sunday March 29, 2026
    const cells = monthGrid(new Date(2026, 3, 1));
    expect(cells).toHaveLength(42);
    expect(cells[0].getFullYear()).toBe(2026);
    expect(cells[0].getMonth()).toBe(2);
    expect(cells[0].getDate()).toBe(29);
    expect(cells[41].getMonth()).toBe(4); // May
    expect(cells[41].getDate()).toBe(9);
    // Cells should be consecutive days
    for (let i = 1; i < cells.length; i++) {
      const diff =
        (cells[i].getTime() - cells[i - 1].getTime()) / (1000 * 60 * 60 * 24);
      // Might not be exactly 1 across DST, but should round to 1
      expect(Math.round(diff)).toBe(1);
    }
  });
  it("is stable regardless of which day in the month is passed", () => {
    const a = monthGrid(new Date(2026, 3, 1));
    const b = monthGrid(new Date(2026, 3, 30, 23));
    expect(a.map(dayKey)).toEqual(b.map(dayKey));
  });
});

describe("monthCellStats", () => {
  it("aggregates pages/views per local calendar day for in-month entries", () => {
    const monthStart = new Date(2026, 3, 1);
    const entries = [
      entry("2026-04-14T09:00:00", 2),
      entry("2026-04-14T10:30:00", 3),
      entry("2026-04-15T09:00:00", 1),
      entry("2026-03-31T23:59:00", 9), // previous month — excluded
    ];
    const stats = monthCellStats(entries, monthStart);
    expect(stats.size).toBe(2);
    const key14 = dayKey(new Date(2026, 3, 14));
    const key15 = dayKey(new Date(2026, 3, 15));
    expect(stats.get(key14)?.pages).toBe(2);
    expect(stats.get(key14)?.views).toBe(5);
    expect(stats.get(key15)?.pages).toBe(1);
    expect(stats.get(key15)?.views).toBe(1);
    expect(stats.has(dayKey(new Date(2026, 2, 31)))).toBe(false);
  });
  it("captures up to 2 distinct domains per day in first-seen order", () => {
    const make = (iso: string, host: string): HistoryEntry => ({
      ...entry(iso, 1),
      host,
      id: `${iso}-${host}`,
    });
    const stats = monthCellStats(
      [
        make("2026-04-14T09:00:00", "a.com"),
        make("2026-04-14T09:05:00", "a.com"), // duplicate host ignored
        make("2026-04-14T09:10:00", "b.com"),
        make("2026-04-14T09:15:00", "c.com"), // third host dropped
      ],
      new Date(2026, 3, 1),
    );
    const key = dayKey(new Date(2026, 3, 14));
    expect(stats.get(key)?.domains).toEqual(["a.com", "b.com"]);
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
