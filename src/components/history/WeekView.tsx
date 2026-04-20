import { memo, useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { FavBadge } from "./FavBadge";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";
import { bucketByWeekday } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useChromeApi } from "@/components/ChromeProvider";
import type { HistoryEntry } from "@/lib/types";

export interface WeekViewProps {
  entries: readonly HistoryEntry[];
  loading: boolean;
  query: string;
  weekStart: Date;
}

export function WeekView({ entries, loading, query, weekStart }: WeekViewProps) {
  const buckets = useMemo(
    () => bucketByWeekday(entries, weekStart),
    [entries, weekStart],
  );

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0)
    return (
      <div className="flex items-center justify-center p-12 text-[13px] text-fg-3">
        No history this week
      </div>
    );

  return (
    <div className="grid h-full min-h-0 grid-cols-7">
      {buckets.map((b) => (
        <div
          key={b.date.getTime()}
          className="flex min-h-0 flex-col border-r border-line-0 last:border-r-0"
        >
          <div className="border-b border-line-0 bg-bg-1 px-3 py-[10px] text-[11px] font-semibold text-fg-2">
            <b className="mr-[6px] font-semibold text-fg-0">{b.weekdayShort}</b>
            {b.monthShort} {b.date.getDate()}
          </div>
          <div className="scroll-track min-h-0 flex-1 overflow-y-auto px-2 py-[6px]">
            {b.entries.map((e) => (
              <WeekItem key={e.id} entry={e} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeekItemImpl({ entry }: { entry: HistoryEntry }) {
  const api = useChromeApi();

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    api.tabs.create({ url: entry.url, active: true });
  }

  function handleKeyDown(e: KeyboardEvent<HTMLAnchorElement>) {
    if (e.key === " ") {
      e.preventDefault();
      api.tabs.create({ url: entry.url, active: true });
    }
  }

  return (
    <a
      href={entry.url}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "mb-[2px] grid grid-cols-[14px_1fr_auto] items-center gap-2 rounded-[5px] px-[6px] py-[5px] text-[11px] text-fg-1 no-underline",
        "cursor-pointer hover:bg-bg-hover",
      )}
    >
      <FavBadge
        host={entry.host}
        letter={entry.hostLetter}
        color={entry.hostColor}
        pageUrl={entry.url}
        size={14}
      />
      <span className="truncate text-[11px]">{entry.title}</span>
      <span className="min-w-[18px] rounded-[3px] bg-bg-2 px-[4px] py-[1px] text-center font-mono tabular text-[10px] text-fg-3">
        {entry.visitCount}
      </span>
    </a>
  );
}

const WeekItem = memo(WeekItemImpl);
