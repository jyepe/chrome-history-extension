import { useCallback, useMemo, useState } from "react";
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

export function DayView({
  entries,
  loading,
  query,
  selectedDay,
}: DayViewProps) {
  const groups = useMemo(() => groupByHour(entries), [entries]);

  const [collapsedHours, setCollapsedHours] = useState<Set<number>>(new Set());

  const toggleHour = useCallback((key: number) => {
    setCollapsedHours((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const allCollapsed =
    groups.length > 0 &&
    groups.every((g) => collapsedHours.has(g.date.getTime()));

  const collapseAll = () =>
    setCollapsedHours(new Set(groups.map((g) => g.date.getTime())));
  const expandAll = () => setCollapsedHours(new Set());

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0)
    return (
      <EmptyState
        variant="range"
        label={`No history on ${formatDateLong(selectedDay)}`}
      />
    );

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[36px] items-center justify-end border-b border-line-0 bg-bg-1 px-4">
        <button
          type="button"
          aria-expanded={!allCollapsed}
          onClick={allCollapsed ? expandAll : collapseAll}
          className="text-[12px] text-fg-2 hover:text-fg-0 transition-colors cursor-pointer"
        >
          {allCollapsed ? "Expand all" : "Collapse all"}
        </button>
      </div>
      <div className="flex-1">
        {groups.map((g) => {
          const key = g.date.getTime();
          const collapsed = collapsedHours.has(key);
          return (
            <div key={key}>
              <HourHeader
                group={g}
                collapsed={collapsed}
                onToggle={() => toggleHour(key)}
              />
              {!collapsed &&
                g.entries.map((e) => <HistoryRow key={e.id} entry={e} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
