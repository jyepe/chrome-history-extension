import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export type ViewId = 'list' | 'day' | 'week' | 'month'

interface Option {
  id: ViewId
  label: string
  disabled: boolean
}

const OPTIONS: Option[] = [
  { id: 'list', label: 'List', disabled: false },
  { id: 'day', label: 'Day', disabled: true },
  { id: 'week', label: 'Week', disabled: true },
  { id: 'month', label: 'Month', disabled: true },
]

export function ViewSegment({
  value,
  onChange,
}: {
  value: ViewId
  onChange: (next: ViewId) => void
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v && OPTIONS.find((o) => o.id === v && !o.disabled)) onChange(v as ViewId)
      }}
      className="inline-flex gap-[2px] rounded-[10px] border border-line-0 bg-bg-2 p-[3px]"
    >
      {OPTIONS.map((opt) => {
        const item = (
          <ToggleGroupItem
            key={opt.id}
            value={opt.id}
            aria-label={opt.label}
            disabled={opt.disabled}
            className={cn(
              'h-[22px] rounded-[7px] px-3 text-[12px] font-medium text-fg-2 transition-colors',
              'hover:text-fg-0',
              'data-[state=on]:bg-amber data-[state=on]:text-[oklch(0.2_0.02_75)]',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            {opt.label}
          </ToggleGroupItem>
        )
        if (!opt.disabled) return item
        return (
          <Tooltip key={opt.id}>
            <TooltipTrigger asChild>
              <span>{item}</span>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        )
      })}
    </ToggleGroup>
  )
}
