import { useCallback, useMemo, useRef, useState } from "react";
import {
  defaultRangeExtractor,
  useVirtualizer,
  type Range,
} from "@tanstack/react-virtual";
import { DayHeader } from "./DayHeader";
import { HistoryRow } from "./HistoryRow";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";
import { groupByDay } from "@/lib/date";
import type { DayGroup as DayGroupT, HistoryEntry } from "@/lib/types";

export interface HistoryListProps {
  entries: readonly HistoryEntry[];
  loading: boolean;
  query: string;
}

type VirtualRow =
  | { kind: "header"; group: DayGroupT; collapsed: boolean }
  | { kind: "row"; entry: HistoryEntry };

const HEADER_HEIGHT = 38;
const ROW_HEIGHT = 34;

export function HistoryList({ entries, loading, query }: HistoryListProps) {
  const groups = useMemo(() => groupByDay(entries), [entries]);

  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  const toggleDay = useCallback((key: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  const allCollapsed =
    groups.length > 0 &&
    groups.every((g) => collapsedDays.has(g.date.toDateString()));

  function collapseAll() {
    setCollapsedDays(new Set(groups.map((g) => g.date.toDateString())));
  }

  function expandAll() {
    setCollapsedDays(new Set());
  }

  const items = useMemo<VirtualRow[]>(() => {
    const list: VirtualRow[] = [];
    for (const g of groups) {
      const key = g.date.toDateString();
      const collapsed = collapsedDays.has(key);
      list.push({ kind: "header", group: g, collapsed });
      if (!collapsed) {
        for (const e of g.entries) list.push({ kind: "row", entry: e });
      }
    }
    return list;
  }, [groups, collapsedDays]);

  const headerIndices = useMemo<number[]>(
    () =>
      items.reduce<number[]>((acc, it, i) => {
        if (it.kind === "header") acc.push(i);
        return acc;
      }, []),
    [items],
  );

  const activeStickyIndexRef = useRef<number>(-1);
  const parentRef = useRef<HTMLDivElement>(null);

  const isHeader = useCallback(
    (i: number) => items[i]?.kind === "header",
    [items],
  );

  const rangeExtractor = useCallback(
    (range: Range) => {
      // Most recent header at or above the top of the viewport sticks.
      let active = -1;
      for (const h of headerIndices) {
        if (h <= range.startIndex) active = h;
        else break;
      }
      activeStickyIndexRef.current = active;
      const base = defaultRangeExtractor(range);
      if (active === -1 || base.includes(active)) return base;
      return [active, ...base].sort((a, b) => a - b);
    },
    [headerIndices],
  );

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) =>
      items[i]?.kind === "header" ? HEADER_HEIGHT : ROW_HEIGHT,
    overscan: 8,
    rangeExtractor,
  });

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0) return <EmptyState variant="none" />;

  const virtualItems = virtualizer.getVirtualItems();
  const activeStickyIndex = activeStickyIndexRef.current;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-[36px] items-center justify-end border-b border-line-0 bg-bg-1 px-4">
        <button
          type="button"
          aria-expanded={!allCollapsed}
          onClick={allCollapsed ? expandAll : collapseAll}
          className="text-[12px] text-fg-2 hover:text-fg-0 transition-colors"
        >
          {allCollapsed ? "Expand all" : "Collapse all"}
        </button>
      </div>
      <div
        ref={parentRef}
        className="scroll-track flex-1 overflow-x-hidden overflow-y-auto"
      >
        <div
          style={{
            height: virtualizer.getTotalSize(),
            position: "relative",
            width: "100%",
          }}
        >
          {virtualItems.map((v) => {
            const item = items[v.index];
            const sticky = v.index === activeStickyIndex && isHeader(v.index);
            const style: React.CSSProperties = sticky
              ? {
                  position: "sticky",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 2,
                }
              : {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${v.start}px)`,
                };
            return (
              <div key={v.key} data-index={v.index} style={style}>
                {item.kind === "header" ? (
                  <DayHeader
                    group={item.group}
                    collapsed={item.collapsed}
                    onToggle={() => toggleDay(item.group.date.toDateString())}
                  />
                ) : (
                  <HistoryRow entry={item.entry} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
