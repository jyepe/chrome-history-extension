import type { HourGroup } from "@/lib/types";

const pad = (n: number) => String(n).padStart(2, "0");

export function HourHeader({ group }: { group: HourGroup }) {
  return (
    <div className="grid grid-cols-[1fr_80px] items-center border-b border-line-0 bg-bg-1 px-4 pt-[10px] pb-[8px]">
      <div className="font-mono text-[13px] font-semibold tracking-[0.1px] text-fg-0">
        {pad(group.hour)}:00
      </div>
      <div className="text-right font-mono text-[11px] text-fg-2">
        views{" "}
        <b className="ml-1 font-semibold text-fg-0">{group.totalViews}</b>
      </div>
    </div>
  );
}
