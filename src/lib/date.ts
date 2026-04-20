import type {
  ActivityBucket,
  DayGroup,
  HistoryEntry,
  HourGroup,
  WeekdayBucket,
} from "./types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateLong(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfToday(): Date {
  return startOfDay(new Date());
}

export function startOfHour(d: Date): Date {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    0,
    0,
    0,
  );
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, n: number): Date {
  const result = startOfDay(d);
  result.setDate(result.getDate() + n);
  return result;
}

export function startOfWeek(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay());
}

export function addWeeks(d: Date, n: number): Date {
  return addDays(d, n * 7);
}

export function isSameWeek(a: Date, b: Date): boolean {
  return startOfWeek(a).getTime() === startOfWeek(b).getTime();
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function groupByDay(entries: readonly HistoryEntry[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const e of entries) {
    const day = startOfDay(e.lastVisitTime);
    const key = dayKey(day);
    let group = map.get(key);
    if (!group) {
      group = { date: day, entries: [], totalViews: 0 };
      map.set(key, group);
    }
    group.entries.push(e);
    group.totalViews += e.visitCount;
  }
  return [...map.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function groupByHour(entries: readonly HistoryEntry[]): HourGroup[] {
  const map = new Map<number, HourGroup>();
  for (const e of entries) {
    const hourDate = startOfHour(e.lastVisitTime);
    const key = hourDate.getTime();
    let group = map.get(key);
    if (!group) {
      group = {
        hour: hourDate.getHours(),
        date: hourDate,
        entries: [],
        totalViews: 0,
      };
      map.set(key, group);
    }
    group.entries.push(e);
    group.totalViews += e.visitCount;
  }
  return [...map.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function bucketByHour(
  entries: readonly HistoryEntry[],
  dayStart: Date,
): ActivityBucket[] {
  const start = startOfDay(dayStart);
  const buckets: ActivityBucket[] = [];
  for (let h = 0; h < 24; h++) {
    const d = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      h,
      0,
      0,
      0,
    );
    buckets.push({
      date: d,
      label: pad(h),
      pages: 0,
      views: 0,
    });
  }
  for (const e of entries) {
    if (!isSameDay(e.lastVisitTime, start)) continue;
    const h = e.lastVisitTime.getHours();
    buckets[h].pages += 1;
    buckets[h].views += e.visitCount;
  }
  return buckets;
}

export function bucketByWeekday(
  entries: readonly HistoryEntry[],
  weekStart: Date,
): WeekdayBucket[] {
  const start = startOfDay(weekStart);
  const buckets: WeekdayBucket[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets.push({
      date: d,
      weekdayShort: WEEKDAYS[d.getDay()].slice(0, 3),
      monthShort: MONTHS_SHORT[d.getMonth()],
      entries: [],
      totalViews: 0,
    });
  }
  for (const e of entries) {
    for (const b of buckets) {
      if (isSameDay(e.lastVisitTime, b.date)) {
        b.entries.push(e);
        b.totalViews += e.visitCount;
        break;
      }
    }
  }
  return buckets;
}

export function bucketByDay(
  entries: readonly HistoryEntry[],
  days: number,
  endDate: Date = startOfToday(),
): ActivityBucket[] {
  const buckets: ActivityBucket[] = [];
  const end = startOfDay(endDate);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    buckets.push({
      date: d,
      label: `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`,
      pages: 0,
      views: 0,
    });
  }
  const indexByKey = new Map(buckets.map((b, i) => [dayKey(b.date), i]));
  for (const e of entries) {
    const key = dayKey(startOfDay(e.lastVisitTime));
    const idx = indexByKey.get(key);
    if (idx === undefined) continue;
    buckets[idx].pages += 1;
    buckets[idx].views += e.visitCount;
  }
  return buckets;
}
