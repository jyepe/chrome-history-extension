import { useMemo, useState } from "react";
import { Topbar } from "@/components/history/Topbar";
import { ColumnHeader } from "@/components/history/ColumnHeader";
import { HistoryList } from "@/components/history/HistoryList";
import { DayView } from "@/components/history/DayView";
import { Sidebar } from "@/components/history/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHistory } from "@/hooks/useHistory";
import { useVisits } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  addDays,
  bucketByDay,
  bucketByHour,
  formatDateLong,
  formatShortDate,
  isSameDay,
  startOfToday,
} from "@/lib/date";
import { filterEntries } from "@/lib/search";
import { topDomains } from "@/lib/topDomains";
import type { ViewId } from "@/components/history/ViewSegment";

const DAYS = 30;

export default function App() {
  const { entries, loading } = useHistory(DAYS);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewId>("list");
  const [selectedDay, setSelectedDay] = useState<Date>(() => startOfToday());
  const debouncedQuery = useDebouncedValue(query, 150);
  const filtered = useMemo(
    () => filterEntries(entries, debouncedQuery),
    [entries, debouncedQuery],
  );

  const isDay = view === "day";

  const dayEntries = useMemo(
    () =>
      isDay
        ? filtered.filter((e) => isSameDay(e.lastVisitTime, selectedDay))
        : filtered,
    [isDay, filtered, selectedDay],
  );

  const viewEntries = isDay ? dayEntries : filtered;

  // Use calendar-day arithmetic so the window lands on the next local midnight
  // even across DST transitions (adding MS_PER_DAY to a midnight Date drifts ±1h).
  const dayEndMs = useMemo(
    () => addDays(selectedDay, 1).getTime(),
    [selectedDay],
  );
  const { counts: transitions } = useVisits(
    viewEntries,
    isDay ? 1 : DAYS,
    isDay ? dayEndMs : undefined,
  );

  const buckets = useMemo(
    () =>
      isDay
        ? bucketByHour(dayEntries, selectedDay)
        : bucketByDay(filtered, 12),
    [isDay, dayEntries, filtered, selectedDay],
  );

  const { list: domains, totalDomains } = useMemo(
    () => topDomains(viewEntries, 6),
    [viewEntries],
  );

  const rangeLabel = useMemo(() => {
    if (isDay) return formatDateLong(selectedDay);
    const end = startOfToday();
    const start = new Date(end);
    start.setDate(end.getDate() - (DAYS - 1));
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }, [isDay, selectedDay]);

  const activityTitle = isDay ? "Hourly Activity" : "Browsing Activity";

  const isOnToday = isDay && isSameDay(selectedDay, startOfToday());
  const onPrev = isDay
    ? () => setSelectedDay((d) => addDays(d, -1))
    : undefined;
  const onNext = isDay
    ? () => setSelectedDay((d) => addDays(d, 1))
    : undefined;
  const onToday =
    isDay && !isOnToday ? () => setSelectedDay(startOfToday()) : undefined;
  const canGoNext = isDay ? !isOnToday : true;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid h-screen w-screen grid-rows-[48px_1fr]">
        <Topbar
          query={query}
          onQueryChange={setQuery}
          view={view}
          onViewChange={setView}
          rangeLabel={rangeLabel}
          onPrev={onPrev}
          onNext={onNext}
          onToday={onToday}
          canGoNext={canGoNext}
        />
        <div className="grid min-h-0 grid-cols-[1fr_340px]">
          <section className="grid min-h-0 grid-rows-[32px_1fr] border-r border-line-0 bg-bg-0">
            <ColumnHeader />
            <div className="scroll-track overflow-y-auto overflow-x-hidden">
              {isDay ? (
                <DayView
                  entries={dayEntries}
                  loading={loading}
                  query={debouncedQuery}
                  selectedDay={selectedDay}
                />
              ) : (
                <HistoryList
                  entries={filtered}
                  loading={loading}
                  query={debouncedQuery}
                />
              )}
            </div>
          </section>
          <Sidebar
            rangeLabel={rangeLabel}
            buckets={buckets}
            transitions={transitions}
            domains={domains}
            totalDomains={totalDomains}
            activityTitle={activityTitle}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
