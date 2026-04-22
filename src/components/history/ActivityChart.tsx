import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityBucket } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const views = payload.find((p) => p.dataKey === "views")?.value ?? 0;
  const pages = payload.find((p) => p.dataKey === "pages")?.value ?? 0;
  return (
    <div className="rounded-md border border-line-1 bg-bg-3 px-2 py-[6px] font-mono text-[11px] text-fg-0 shadow-md">
      {label} · views {views} · pages {pages}
    </div>
  );
}

export function ActivityChart({ buckets }: { buckets: ActivityBucket[] }) {
  const totalViews = buckets.reduce((s, b) => s + b.views, 0);
  const totalPages = buckets.reduce((s, b) => s + b.pages, 0);

  return (
    <div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart
          data={buckets}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          barCategoryGap={1}
          barGap={0}
        >
          <CartesianGrid
            vertical={false}
            stroke="var(--color-line-0)"
            strokeDasharray="2 3"
          />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            interval={1}
            tick={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              fill: "var(--color-fg-2)",
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={28}
            tick={{
              fontSize: 9,
              fontFamily: "var(--font-mono)",
              fill: "var(--color-fg-2)",
            }}
          />
          <Tooltip
            cursor={{ fill: "var(--color-bg-hover)" }}
            content={<ChartTooltip />}
          />
          <Bar
            dataKey="views"
            fill="var(--color-amber)"
            radius={[1, 1, 0, 0]}
          />
          <Bar
            dataKey="pages"
            fill="var(--color-cyan)"
            radius={[1, 1, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-[10px] flex flex-wrap gap-[10px_14px]">
        <span className="inline-flex items-center gap-[6px] text-[11px] text-fg-2">
          <span className="h-[10px] w-[10px] rounded-[2px] bg-amber" />
          Page Views:{" "}
          <b className="ml-[2px] font-mono font-medium text-fg-0">
            {totalViews}
          </b>
        </span>
        <span className="inline-flex items-center gap-[6px] text-[11px] text-fg-2">
          <span className="h-[10px] w-[10px] rounded-[2px] bg-cyan" />
          Pages:{" "}
          <b className="ml-[2px] font-mono font-medium text-fg-0">
            {totalPages}
          </b>
        </span>
      </div>
    </div>
  );
}
