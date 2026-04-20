import { useMemo, useState } from "react";
import { Topbar } from "@/components/history/Topbar";
import { ColumnHeader } from "@/components/history/ColumnHeader";
import { HistoryList } from "@/components/history/HistoryList";
import { DayView } from "@/components/history/DayView";
import { WeekView } from "@/components/history/WeekView";
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
  isSameWeek,
  startOfToday,
  startOfWeek,
} from "@/lib/date";
import { filterEntries } from "@/lib/search";
import { topDomains } from "@/lib/topDomains";
import { cn } from "@/lib/utils";
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
  const isWeek = view === "week";

  const dayEntries = useMemo(
    () =>
      isDay
        ? filtered.filter((e) => isSameDay(e.lastVisitTime, selectedDay))
        : filtered,
    [isDay, filtered, selectedDay],
  );

  const weekStart = useMemo(() => startOfWeek(selectedDay), [selectedDay]);
  const weekEntries = useMemo(
    () =>
      isWeek
        ? filtered.filter((e) => isSameWeek(e.lastVisitTime, selectedDay))
        : filtered,
    [isWeek, filtered, selectedDay],
  );

  const viewEntries = isDay ? dayEntries : isWeek ? weekEntries : filtered;

  // Use calendar-day arithmetic so the window lands on the next local midnight
  // even across DST transitions (adding MS_PER_DAY to a midnight Date drifts ±1h).
  const dayEndMs = useMemo(
    () => addDays(selectedDay, 1).getTime(),
    [selectedDay],
  );
  const weekEndMs = useMemo(
    () => addDays(weekStart, 7).getTime(),
    [weekStart],
  );
  const visitWindow = isDay ? 1 : isWeek ? 7 : DAYS;
  const visitNowMs = isDay ? dayEndMs : isWeek ? weekEndMs : undefined;
  const { counts: transitions } = useVisits(
    viewEntries,
    visitWindow,
    visitNowMs,
  );

  const buckets = useMemo(
    () =>
      isDay
        ? bucketByHour(dayEntries, selectedDay)
        : isWeek
          ? bucketByDay(weekEntries, 7, addDays(weekStart, 6))
          : bucketByDay(filtered, 12),
    [isDay, isWeek, dayEntries, weekEntries, filtered, selectedDay, weekStart],
  );

  const { list: domains, totalDomains } = useMemo(
    () => topDomains(viewEntries, 6),
    [viewEntries],
  );

  const rangeLabel = useMemo(() => {
    if (isDay) return formatDateLong(selectedDay);
    if (isWeek) {
      return `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`;
    }
    const end = startOfToday();
    const start = new Date(end);
    start.setDate(end.getDate() - (DAYS - 1));
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }, [isDay, isWeek, selectedDay, weekStart]);

  const activityTitle = isDay ? "Hourly Activity" : "Browsing Activity";

  const isOnToday = isDay && isSameDay(selectedDay, startOfToday());
  const isOnThisWeek = isWeek && isSameWeek(selectedDay, startOfToday());
  const onPrev = isDay
    ? () => setSelectedDay((d) => addDays(d, -1))
    : isWeek
      ? () => setSelectedDay((d) => addDays(d, -7))
      : undefined;
  const onNext = isDay
    ? () => setSelectedDay((d) => addDays(d, 1))
    : isWeek
      ? () => setSelectedDay((d) => addDays(d, 7))
      : undefined;
  const onToday =
    (isDay && !isOnToday) || (isWeek && !isOnThisWeek)
      ? () => setSelectedDay(startOfToday())
      : undefined;
  const canGoNext = isDay
    ? !isOnToday
    : isWeek
      ? !isOnThisWeek
      : true;

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
          <section
            className={cn(
              "grid min-h-0 border-r border-line-0 bg-bg-0",
              isWeek ? "grid-rows-[1fr]" : "grid-rows-[32px_1fr]",
            )}
          >
            {!isWeek && <ColumnHeader />}
            <div className="scroll-track overflow-y-auto overflow-x-hidden">
              {isWeek ? (
                <WeekView
                  entries={weekEntries}
                  loading={loading}
                  query={debouncedQuery}
                  weekStart={weekStart}
                />
              ) : isDay ? (
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
