import type { ChromeApi } from "./chrome-api";

export interface CachedVisit {
  visitTime: number;
  transition: string;
}

const cache = new Map<string, CachedVisit[]>();

export async function fetchVisitsCached(
  api: ChromeApi,
  url: string,
): Promise<CachedVisit[]> {
  const hit = cache.get(url);
  if (hit) return hit;
  const raw = await api.history.getVisits({ url });
  const slim: CachedVisit[] = raw.map((v) => ({
    visitTime: v.visitTime ?? 0,
    transition: v.transition,
  }));
  cache.set(url, slim);
  return slim;
}

export function clearVisitsCache(): void {
  cache.clear();
}
