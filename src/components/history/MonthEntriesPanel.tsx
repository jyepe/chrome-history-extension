import { memo, useMemo, type KeyboardEvent, type MouseEvent } from "react";
import { FavBadge } from "./FavBadge";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import { useChromeApi } from "@/components/ChromeProvider";
import type { HistoryEntry } from "@/lib/types";

export interface MonthEntriesPanelProps {
  dayLabel: string;
  entries: readonly HistoryEntry[];
}

export function MonthEntriesPanel({
  dayLabel,
  entries,
}: MonthEntriesPanelProps) {
  const sorted = useMemo(
    () =>
      [...entries].sort(
        (a, b) => b.lastVisitTime.getTime() - a.lastVisitTime.getTime(),
      ),
    [entries],
  );

  return (
    <aside className="scroll-track flex min-h-0 flex-col overflow-y-auto border-l border-line-0 bg-bg-0 px-[18px] pb-6 pt-4">
      <h3 className="mb-2 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
        Visited Sites <span className="text-fg-3">{sorted.length}</span>
      </h3>
      <div
        className="mb-3 font-mono text-[11px] tabular text-fg-3"
        data-testid="month-entries-day-label"
      >
        {dayLabel}
      </div>
      {sorted.length === 0 ? (
        <div className="py-2 text-[12px] text-fg-3">
          No sites visited on this day
        </div>
      ) : (
        <div className="flex flex-col">
          {sorted.map((e) => (
            <MonthEntryRow key={e.id} entry={e} />
          ))}
        </div>
      )}
    </aside>
  );
}

function MonthEntryRowImpl({ entry }: { entry: HistoryEntry }) {
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
      title={entry.url}
      aria-label={entry.title || entry.url}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        "grid grid-cols-[54px_14px_1fr_auto] items-center gap-2 rounded-[5px] px-[6px] py-[5px] text-[11px] text-fg-1 no-underline",
        "cursor-pointer hover:bg-bg-hover",
      )}
    >
      <span className="font-mono tabular text-[10px] text-fg-3">
        {formatTime(entry.lastVisitTime)}
      </span>
      <FavBadge
        host={entry.host}
        letter={entry.hostLetter}
        color={entry.hostColor}
        pageUrl={entry.url}
        size={14}
      />
      <span className="truncate text-[11px]">{entry.title || entry.url}</span>
      <span className="min-w-[18px] rounded-[3px] bg-bg-2 px-[4px] py-[1px] text-center font-mono tabular text-[10px] text-fg-3">
        {entry.visitCount}
      </span>
    </a>
  );
}

const MonthEntryRow = memo(MonthEntryRowImpl);
