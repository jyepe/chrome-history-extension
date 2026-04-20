import type { HistoryEntry, TopDomain } from "./types";

export interface TopDomainsResult {
  list: TopDomain[];
  totalDomains: number;
}

export function topDomains(
  entries: readonly HistoryEntry[],
  limit: number,
): TopDomainsResult {
  const byHost = new Map<string, TopDomain>();
  for (const e of entries) {
    const existing = byHost.get(e.host);
    if (existing) {
      existing.count += e.visitCount;
    } else {
      byHost.set(e.host, {
        host: e.host,
        letter: e.hostLetter,
        color: e.hostColor,
        count: e.visitCount,
      });
    }
  }
  const sorted = [...byHost.values()].sort((a, b) => b.count - a.count);
  return { list: sorted.slice(0, limit), totalDomains: sorted.length };
}
