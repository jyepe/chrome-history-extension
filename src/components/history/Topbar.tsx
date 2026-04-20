import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./SearchInput";
import { ViewSegment, type ViewId } from "./ViewSegment";

export interface TopbarProps {
  query: string;
  onQueryChange: (next: string) => void;
  view: ViewId;
  onViewChange: (next: ViewId) => void;
  rangeLabel: string;
  onPrev?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  canGoNext?: boolean;
}

export function Topbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  rangeLabel,
  onPrev,
  onNext,
  onToday,
  canGoNext = true,
}: TopbarProps) {
  const prevDisabled = !onPrev;
  const nextDisabled = !onNext || !canGoNext;
  const todayDisabled = !onToday;
  return (
    <header className="grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line-0 bg-[linear-gradient(180deg,var(--color-bg-1),var(--color-bg-0))] px-[14px]">
      <div className="flex items-center gap-[10px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Menu"
        >
          <LayoutGrid size={16} strokeWidth={1.5} />
        </Button>
        <SearchInput value={query} onChange={onQueryChange} />
      </div>

      <div className="flex items-center gap-[10px] font-mono text-[13px] tracking-[0.2px] text-fg-0">
        {rangeLabel}
      </div>

      <div className="flex items-center justify-end gap-[10px]">
        <button
          type="button"
          onClick={onToday}
          disabled={todayDisabled}
          className="flex h-[26px] items-center gap-[6px] rounded-full border border-line-0 bg-bg-2 px-3 text-[12px] font-medium text-fg-1 hover:bg-bg-hover hover:text-fg-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-bg-2 disabled:hover:text-fg-1"
        >
          <Calendar size={12} strokeWidth={1.5} />
          Today
        </button>
        <div className="inline-flex gap-[2px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            aria-label="Previous"
            onClick={onPrev}
            disabled={prevDisabled}
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-pointer"
            aria-label="Next"
            onClick={onNext}
            disabled={nextDisabled}
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </Button>
        </div>
        <ViewSegment value={view} onChange={onViewChange} />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          aria-label="Tweaks"
          disabled
        >
          <Sliders size={14} strokeWidth={1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 cursor-pointer"
          aria-label="Info"
          disabled
        >
          <Info size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}
