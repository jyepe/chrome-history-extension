import { useMemo } from "react";
import { DayGroup } from "./DayGroup";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";
import { groupByDay } from "@/lib/date";
import type { HistoryEntry } from "@/lib/types";

export interface HistoryListProps {
  entries: readonly HistoryEntry[];
  loading: boolean;
  query: string;
}

export function HistoryList({ entries, loading, query }: HistoryListProps) {
  const groups = useMemo(() => groupByDay(entries), [entries]);

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0) return <EmptyState variant="none" />;
  return (
    <div>
      {groups.map((g) => (
        <DayGroup key={g.date.toISOString()} group={g} />
      ))}
    </div>
  );
}
