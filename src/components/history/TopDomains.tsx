import type { TopDomain } from "@/lib/types";

export function TopDomains({
  list,
  totalDomains,
}: {
  list: TopDomain[];
  totalDomains: number;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
        Top Domains{" "}
        <span className="font-normal text-fg-3">of {totalDomains} Total</span>
      </h3>
      <div>
        {list.map((d) => (
          <div
            key={d.host}
            className="grid h-[30px] grid-cols-[16px_1fr_auto] items-center gap-[10px] border-b border-dashed border-line-0 text-[12px] text-fg-1 last:border-b-0"
          >
            <span
              className="inline-flex h-[14px] w-[14px] items-center justify-center rounded font-mono text-[9px] font-bold"
              style={{ background: d.color, color: "oklch(0.2 0.02 260)" }}
            >
              {d.letter}
            </span>
            <span className="truncate font-mono text-[12px] text-fg-1">
              {d.host}
            </span>
            <span className="min-w-[24px] rounded bg-bg-2 px-[6px] py-[2px] text-center font-mono text-[11px] text-fg-2">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
