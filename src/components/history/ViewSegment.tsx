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
      value={value}
      onValueChange={(v) => {
        if (v && OPTIONS.find((o) => o.id === v)) onChange(v as ViewId);
      }}
      className="inline-flex gap-[2px] rounded-[10px] border border-line-0 bg-bg-2 p-[3px]"
    >
      {OPTIONS.map((opt) => (
        <ToggleGroupItem
          key={opt.id}
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
      ))}
    </ToggleGroup>
  );
}
