import { Cell, Pie, PieChart } from "recharts";
import type { TransitionCounts } from "@/lib/types";

const SLICES = [
  { key: "typed", label: "Typed", color: "var(--color-violet)" },
  { key: "link", label: "Link", color: "var(--color-coral)" },
  { key: "reload", label: "Reload", color: "var(--color-amber)" },
  { key: "form", label: "Form", color: "var(--color-cyan)" },
] as const;

export function TransitionDonut({ counts }: { counts: TransitionCounts }) {
  const data = SLICES.map((s) => ({ ...s, val: counts[s.key] }));
  const hasData = counts.total > 0;
  const pieData = hasData ? data : [{ ...data[0], val: 1 }]; // a thin placeholder ring

  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-3">
      <div className="relative h-[150px] w-[160px]">
        <PieChart width={160} height={150}>
            <Pie
              data={pieData}
              dataKey="val"
              innerRadius={38}
              outerRadius={55}
              startAngle={90}
              endAngle={-270}
              stroke="var(--color-bg-0)"
              strokeWidth={1.5}
              isAnimationActive={false}
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={hasData ? d.color : "var(--color-bg-2)"} />
              ))}
            </Pie>
        </PieChart>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[18px] font-semibold text-fg-0">
            {counts.total}
          </div>
          <div className="font-mono text-[9px] tracking-[1px] text-fg-2">
            TOTAL
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div
            key={d.key}
            className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[11px]"
          >
            <span
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ background: d.color }}
            />
            <span className="text-fg-1">{d.label}</span>
            {d.val > 0 && (
              <span className="font-mono text-[10px] text-fg-2">{d.val}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
