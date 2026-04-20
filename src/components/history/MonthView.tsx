import { memo, useMemo } from "react";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";
import {
  WEEKDAYS,
  dayKey,
  isSameDay,
  monthCellStats,
  monthLabel,
  monthGrid,
  startOfToday,
} from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

export interface MonthViewProps {
  entries: readonly HistoryEntry[];
  loading: boolean;
  query: string;
  monthStart: Date;
  selectedDay: Date;
  onSelectDay: (d: Date) => void;
}

const EMPTY_DOMAINS: readonly string[] = [];

export function MonthView({
  entries,
  loading,
  query,
  monthStart,
  selectedDay,
  onSelectDay,
}: MonthViewProps) {
  const cells = useMemo(() => monthGrid(monthStart), [monthStart]);
  const stats = useMemo(
    () => monthCellStats(entries, monthStart),
    [entries, monthStart],
  );
  // Recompute each render so the "today" marker stays correct across midnight.
  const today = startOfToday();

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0)
    return (
      <EmptyState
        variant="range"
        label={`No history in ${monthLabel(monthStart)}`}
      />
    );

  return (
    <div className="grid h-full min-h-0 grid-rows-[28px_1fr]">
      <div className="grid grid-cols-7">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="border-b border-r border-line-0 bg-bg-1 px-[10px] py-[6px] text-[10px] font-semibold uppercase tracking-[0.8px] text-fg-3 last:border-r-0"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid min-h-0 auto-rows-fr grid-cols-7">
        {cells.map((d) => {
          const inMonth = d.getMonth() === monthStart.getMonth();
          const isToday = isSameDay(d, today);
          const isSelected = isSameDay(d, selectedDay);
          const cell = stats.get(dayKey(d));
          return (
            <MonthCell
              key={d.getTime()}
              date={d}
              inMonth={inMonth}
              isToday={isToday}
              isSelected={isSelected}
              pages={cell?.pages ?? 0}
              views={cell?.views ?? 0}
              domains={cell?.domains ?? EMPTY_DOMAINS}
              onSelect={onSelectDay}
            />
          );
        })}
      </div>
    </div>
  );
}

interface MonthCellProps {
  date: Date;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  pages: number;
  views: number;
  domains: readonly string[];
  onSelect: (d: Date) => void;
}

function MonthCellImpl({
  date,
  inMonth,
  isToday,
  isSelected,
  pages,
  views,
  domains,
  onSelect,
}: MonthCellProps) {
  const hot = views >= 5;
  return (
    <button
      type="button"
      data-testid={`month-cell-${dayKey(date)}`}
      aria-pressed={isSelected}
      aria-label={date.toDateString()}
      disabled={!inMonth}
      onClick={() => onSelect(date)}
      className={cn(
        "flex flex-col gap-[6px] overflow-hidden border-b border-r border-line-0 p-2 text-left",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-amber",
        inMonth
          ? "cursor-pointer hover:bg-bg-hover"
          : "cursor-default bg-[oklch(0.16_0.008_260)] text-fg-3",
        isSelected && inMonth && "bg-bg-hover ring-1 ring-inset ring-amber",
      )}
    >
      <div
        className={cn(
          "font-mono text-[12px] font-medium tabular",
          !inMonth ? "text-fg-3" : "text-fg-1",
          isToday && "font-bold text-amber",
        )}
      >
        {date.getDate()}
      </div>
      {inMonth && views > 0 && (
        <>
          <div
            className={cn(
              "rounded-r-[4px] px-[6px] py-[4px] text-[10px] leading-[1.3] text-fg-0",
              hot
                ? "border-l-2 border-amber bg-[oklch(0.32_0.08_75)]"
                : "border-l-2 border-cyan bg-[oklch(0.3_0.06_220)]",
            )}
          >
            <b className="font-semibold text-fg-0">{views}</b> views
            <br />
            <b className="font-semibold text-fg-0">{pages}</b> pages
          </div>
          {domains.map((host) => (
            <div
              key={host}
              className="truncate font-mono text-[10px] text-fg-3"
            >
              {host}
            </div>
          ))}
        </>
      )}
    </button>
  );
}

const MonthCell = memo(MonthCellImpl);
