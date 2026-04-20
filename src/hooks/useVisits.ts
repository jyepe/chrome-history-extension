import { useEffect, useMemo, useState } from "react";
import { useChromeApi } from "@/components/ChromeProvider";
import { promisePool } from "@/lib/promisePool";
import { countTransitions } from "@/lib/transitions";
import type { HistoryEntry, TransitionCounts } from "@/lib/types";

const MS_PER_DAY = 86_400_000;
const CONCURRENCY = 10;
const ZERO: TransitionCounts = {
  typed: 0,
  link: 0,
  reload: 0,
  form: 0,
  total: 0,
};

export interface UseVisitsResult {
  counts: TransitionCounts;
  loading: boolean;
}

export function useVisits(
  entries: readonly HistoryEntry[],
  days = 30,
  nowMs?: number,
): UseVisitsResult {
  const api = useChromeApi();
  const [counts, setCounts] = useState<TransitionCounts>(ZERO);
  const [loading, setLoading] = useState(true);

  // Stable content-derived dependency: re-run only when the set of URLs changes.
  // Sorting keeps the key stable regardless of caller-side ordering.
  const urls = useMemo(
    () => [...new Set(entries.map((e) => e.url))].sort(),
    [entries],
  );
  const urlKey = urls.join("|");

  useEffect(() => {
    const now = nowMs ?? Date.now();
    if (urls.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCounts(ZERO);
      setLoading(false);
      return;
    }
    let cancelled = false;
    const windowStart = now - days * MS_PER_DAY;
    promisePool(urls, CONCURRENCY, async (url) => {
      const visits = await api.history.getVisits({ url });
      return visits
        .filter(
          (v) => (v.visitTime ?? 0) >= windowStart && (v.visitTime ?? 0) <= now,
        )
        .map((v) => v.transition);
    })
      .then((perUrl) => {
        if (cancelled) return;
        const flat = perUrl.flat();
        setCounts(countTransitions(flat));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCounts(ZERO);
        setLoading(false);
      });
    setLoading(true);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, urlKey, days, nowMs]);

  return { counts, loading };
}
