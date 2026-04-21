import { useMemo, useState } from "react";
import { Topbar } from "@/components/history/Topbar";
import { ColumnHeader } from "@/components/history/ColumnHeader";
import { HistoryList } from "@/components/history/HistoryList";
import { DayView } from "@/components/history/DayView";
import { WeekView } from "@/components/history/WeekView";
import { MonthView } from "@/components/history/MonthView";
import { MonthEntriesPanel } from "@/components/history/MonthEntriesPanel";
import { Sidebar } from "@/components/history/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHistory } from "@/hooks/useHistory";
import { useVisits } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import {
  addDays,
  addMonths,
  bucketByDay,
  bucketByHour,
  formatDateLong,
  formatShortDate,
  isSameDay,
  isSameMonth,
  isSameWeek,
  monthLabel,
  startOfMonth,
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
  const isMonth = view === "month";

  const dayEntries = useMemo(
    () =>
      isDay || isMonth
        ? filtered.filter((e) => isSameDay(e.lastVisitTime, selectedDay))
        : filtered,
    [isDay, isMonth, filtered, selectedDay],
  );

  const weekStart = useMemo(() => startOfWeek(selectedDay), [selectedDay]);
  const weekEntries = useMemo(
    () =>
      isWeek
        ? filtered.filter((e) => isSameWeek(e.lastVisitTime, weekStart))
        : filtered,
    [isWeek, filtered, weekStart],
  );

  const monthStart = useMemo(() => startOfMonth(selectedDay), [selectedDay]);
  const monthEntries = useMemo(
    () =>
      isMonth
        ? filtered.filter((e) => isSameMonth(e.lastVisitTime, monthStart))
        : filtered,
    [isMonth, filtered, monthStart],
  );

  // Month view scopes the sidebar to the selected day so the charts + top
  // domains tell a "this day" story while the grid shows month context.
  const viewEntries =
    isDay || isMonth ? dayEntries : isWeek ? weekEntries : filtered;

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
  const dayScoped = isDay || isMonth;
  const visitWindow = dayScoped ? 1 : isWeek ? 7 : DAYS;
  const visitNowMs = dayScoped ? dayEndMs : isWeek ? weekEndMs : undefined;
  const { counts: transitions } = useVisits(
    viewEntries,
    visitWindow,
    visitNowMs,
  );

  const buckets = useMemo(
    () =>
      dayScoped
        ? bucketByHour(dayEntries, selectedDay)
        : isWeek
          ? bucketByDay(weekEntries, 7, addDays(weekStart, 6))
          : bucketByDay(filtered, 12),
    [dayScoped, isWeek, dayEntries, weekEntries, filtered, selectedDay, weekStart],
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
    if (isMonth) return monthLabel(selectedDay);
    const end = startOfToday();
    const start = new Date(end);
    start.setDate(end.getDate() - (DAYS - 1));
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }, [isDay, isWeek, isMonth, selectedDay, weekStart]);

  const activityTitle = dayScoped ? "Hourly Activity" : "Browsing Activity";

  const today = startOfToday();
  const isOnToday = isSameDay(selectedDay, today);
  const isOnThisWeek = isSameWeek(selectedDay, today);
  const isOnThisMonth = isSameMonth(selectedDay, today);
  const onPrev = isDay
    ? () => setSelectedDay((d) => addDays(d, -1))
    : isWeek
      ? () => setSelectedDay((d) => addDays(d, -7))
      : isMonth
        ? () => setSelectedDay((d) => addMonths(d, -1))
        : undefined;
  const onNext = isDay
    ? () => setSelectedDay((d) => addDays(d, 1))
    : isWeek
      ? () => setSelectedDay((d) => addDays(d, 7))
      : isMonth
        ? () => setSelectedDay((d) => addMonths(d, 1))
        : undefined;
  const onToday =
    (isDay && !isOnToday) ||
    (isWeek && !isOnThisWeek) ||
    (isMonth && !isOnToday)
      ? () => setSelectedDay(today)
      : undefined;
  const canGoNext = isDay
    ? !isOnToday
    : isWeek
      ? !isOnThisWeek
      : isMonth
        ? !isOnThisMonth
        : true;

  const hideColumnHeader = isWeek || isMonth;

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
        <div
          className={cn(
            "grid min-h-0",
            isMonth ? "grid-cols-[1fr_320px_340px]" : "grid-cols-[1fr_340px]",
          )}
        >
          <section
            className={cn(
              "grid min-h-0 border-r border-line-0 bg-bg-0",
              hideColumnHeader ? "grid-rows-[1fr]" : "grid-rows-[32px_1fr]",
            )}
          >
            {!hideColumnHeader && <ColumnHeader />}
            <div
              className={cn(
                "overflow-x-hidden",
                isMonth ? "overflow-hidden" : "scroll-track overflow-y-auto",
              )}
            >
              {isMonth ? (
                <MonthView
                  entries={monthEntries}
                  loading={loading}
                  query={debouncedQuery}
                  monthStart={monthStart}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              ) : isWeek ? (
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
          {isMonth && (
            <MonthEntriesPanel
              dayLabel={formatDateLong(selectedDay)}
              entries={dayEntries}
            />
          )}
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
