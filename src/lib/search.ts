import type { HistoryEntry } from "./types";

export function filterEntries(
  entries: readonly HistoryEntry[],
  query: string,
): readonly HistoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter((e) => e.searchKey.includes(q));
}
