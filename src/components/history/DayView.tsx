import { useMemo } from "react";
import { HourHeader } from "./HourHeader";
import { HistoryRow } from "./HistoryRow";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";
import { formatDateLong, groupByHour } from "@/lib/date";
import type { HistoryEntry } from "@/lib/types";

export interface DayViewProps {
  entries: readonly HistoryEntry[];
  loading: boolean;
  query: string;
  selectedDay: Date;
}

export function DayView({ entries, loading, query, selectedDay }: DayViewProps) {
  const groups = useMemo(() => groupByHour(entries), [entries]);

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0)
    return (
      <div className="flex items-center justify-center p-12 text-[13px] text-fg-3">
        No history on {formatDateLong(selectedDay)}
      </div>
    );

  return (
    <div>
      {groups.map((g) => (
        <div key={g.date.getTime()}>
          <HourHeader group={g} />
          {g.entries.map((e) => (
            <HistoryRow key={e.id} entry={e} />
          ))}
        </div>
      ))}
    </div>
  );
}
