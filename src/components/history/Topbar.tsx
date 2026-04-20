import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Sliders,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchInput } from './SearchInput'
import { ViewSegment, type ViewId } from './ViewSegment'

export interface TopbarProps {
  query: string
  onQueryChange: (next: string) => void
  view: ViewId
  onViewChange: (next: ViewId) => void
  rangeLabel: string
}

export function Topbar({ query, onQueryChange, view, onViewChange, rangeLabel }: TopbarProps) {
  return (
    <header className="grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line-0 bg-[linear-gradient(180deg,var(--color-bg-1),var(--color-bg-0))] px-[14px]">
      <div className="flex items-center gap-[10px]">
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Menu">
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
          className="flex h-[26px] items-center gap-[6px] rounded-full border border-line-0 bg-bg-2 px-3 text-[12px] font-medium text-fg-1 hover:bg-bg-hover hover:text-fg-0"
        >
          <Calendar size={12} strokeWidth={1.5} />
          Today
        </button>
        <div className="inline-flex gap-[2px]">
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Previous">
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Next">
            <ChevronRight size={14} strokeWidth={1.5} />
          </Button>
        </div>
        <ViewSegment value={view} onChange={onViewChange} />
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Tweaks" disabled>
          <Sliders size={14} strokeWidth={1.5} />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Info" disabled>
          <Info size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  )
}
