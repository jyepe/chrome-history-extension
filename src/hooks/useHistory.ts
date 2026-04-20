import { useCallback, useEffect, useState } from "react";
import { useChromeApi } from "@/components/ChromeProvider";
import { parseHost, hostLetter, hostColor } from "@/lib/domain";
import type { HistoryEntry } from "@/lib/types";
import type { ChromeHistoryItem } from "@/lib/chrome-api";

const MS_PER_DAY = 86_400_000;

function normalize(item: ChromeHistoryItem): HistoryEntry | null {
  if (!item.url) return null;
  const host = parseHost(item.url);
  const title = item.title && item.title.trim() ? item.title : host || item.url;
  return {
    id: item.id,
    url: item.url,
    title,
    host,
    hostLetter: hostLetter(host),
    hostColor: hostColor(host),
    lastVisitTime: new Date(item.lastVisitTime ?? Date.now()),
    visitCount: item.visitCount ?? 0,
    typedCount: item.typedCount ?? 0,
  };
}

export interface UseHistoryResult {
  entries: HistoryEntry[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useHistory(days: number): UseHistoryResult {
  const api = useChromeApi();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const items = await api.history.search({
          text: "",
          startTime: Date.now() - days * MS_PER_DAY,
          maxResults: 10_000,
        });
        if (cancelled) return;
        const normalized = items
          .map(normalize)
          .filter((e): e is HistoryEntry => e !== null)
          .sort(
            (a, b) => b.lastVisitTime.getTime() - a.lastVisitTime.getTime(),
          );
        setEntries(normalized);
        setError(null);
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    load();
    return () => {
      cancelled = true;
    };
  }, [api, days, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { entries, loading, error, reload };
}
