import { formatDateLong } from "@/lib/date";
import type { DayGroup as DayGroupT } from "@/lib/types";

interface DayHeaderProps {
  group: DayGroupT;
  collapsed: boolean;
  onToggle: () => void;
}

export function DayHeader({ group, collapsed, onToggle }: DayHeaderProps) {
  return (
    <div className="grid grid-cols-[16px_1fr_80px] items-center border-b border-line-0 bg-bg-1 px-4 pt-[10px] pb-[8px]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={collapsed ? "Expand group" : "Collapse group"}
        className="flex items-center justify-center text-fg-2 transition-transform duration-150 cursor-pointer"
        style={{ transform: collapsed ? "rotate(0deg)" : "rotate(90deg)" }}
      >
        ▶
      </button>
      <div className="text-[13px] font-semibold tracking-[0.1px] text-fg-0">
        {formatDateLong(group.date)}
      </div>
      <div className="text-right font-mono text-[11px] text-fg-2">
        views{" "}
        <b className="ml-1 font-semibold text-fg-0">{group.totalViews}</b>
      </div>
    </div>
  );
}
