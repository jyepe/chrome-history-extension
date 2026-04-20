import type { ActivityBucket, DayGroup, HistoryEntry } from "./types";

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
