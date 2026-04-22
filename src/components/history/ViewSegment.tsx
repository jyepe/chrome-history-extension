import { Fragment } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export type ViewId = "list" | "day" | "week" | "month";

interface Option {
  id: ViewId;
  label: string;
}

const OPTIONS: Option[] = [
  { id: "list", label: "List" },
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
];

export function ViewSegment({
  value,
  onChange,
}: {
  value: ViewId;
  onChange: (next: ViewId) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      spacing={1}
      value={value}
      onValueChange={(v) => {
        if (v && OPTIONS.find((o) => o.id === v)) onChange(v as ViewId);
      }}
      className="inline-flex gap-[2px] rounded-[10px] border border-line-0 bg-bg-2 p-[3px]"
    >
      {OPTIONS.map((opt, i) => (
        <Fragment key={opt.id}>
          {i > 0 && (
            <span
              aria-hidden
              className="h-3 w-px self-center bg-line-0 [[data-state=on]+&]:opacity-0 [&:has(+[data-state=on])]:opacity-0"
            />
          )}
          <ToggleGroupItem
            value={opt.id}
            aria-label={opt.label}
            className={cn(
              "h-[22px] rounded-[7px] px-3 text-[12px] font-medium text-fg-2 transition-colors",
              "hover:text-fg-0",
              "data-[state=on]:bg-amber data-[state=on]:text-[oklch(0.2_0.02_75)]",
            )}
          >
            {opt.label}
          </ToggleGroupItem>
        </Fragment>
      ))}
    </ToggleGroup>
  );
}
