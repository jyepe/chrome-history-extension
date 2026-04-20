import { ActivityChart } from "./ActivityChart";
import { TransitionDonut } from "./TransitionDonut";
import { TopDomains } from "./TopDomains";
import { MonthEntriesPanel } from "./MonthEntriesPanel";
import type {
  ActivityBucket,
  HistoryEntry,
  TopDomain,
  TransitionCounts,
} from "@/lib/types";

export interface SidebarProps {
  rangeLabel: string;
  buckets: ActivityBucket[];
  transitions: TransitionCounts;
  domains: TopDomain[];
  totalDomains: number;
  activityTitle?: string;
  /** When provided, render a "Visited Sites" panel for the given day above the charts. */
  entriesForDay?: readonly HistoryEntry[];
  entriesDayLabel?: string;
}

export function Sidebar({
  rangeLabel,
  buckets,
  transitions,
  domains,
  totalDomains,
  activityTitle = "Browsing Activity",
  entriesForDay,
  entriesDayLabel,
}: SidebarProps) {
  return (
    <aside className="scroll-track flex flex-col gap-6 overflow-y-auto bg-bg-0 px-[18px] pb-6 pt-4">
      <div className="mb-[2px] font-mono text-[13px] font-medium tracking-[0.2px] text-fg-0">
        {rangeLabel}
      </div>

      {entriesForDay && entriesDayLabel && (
        <MonthEntriesPanel
          dayLabel={entriesDayLabel}
          entries={entriesForDay}
        />
      )}

      <section>
        <h3 className="mb-3 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
          {activityTitle}
        </h3>
        <ActivityChart buckets={buckets} />
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
          Link Transition Type
        </h3>
        <TransitionDonut counts={transitions} />
      </section>

      <TopDomains list={domains} totalDomains={totalDomains} />
    </aside>
  );
}
