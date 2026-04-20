import { FavBadge } from './FavBadge'
import { formatTime } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { HistoryEntry } from '@/lib/types'

const MAX_URL = 56
function truncate(url: string): string {
  return url.length <= MAX_URL ? url : url.slice(0, MAX_URL - 1) + '…'
}

export function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const hot = entry.visitCount >= 3
  return (
    <div
      className={cn(
        'grid h-[34px] grid-cols-[120px_1fr_340px_80px] items-center gap-0 border-b border-transparent px-4 text-[13px] text-fg-1',
        'hover:bg-bg-hover',
      )}
    >
      <div className="font-mono tabular text-[12px] tracking-[0.3px] text-fg-2">
        {formatTime(entry.lastVisitTime)}
      </div>
      <div className="flex min-w-0 items-center gap-[10px]">
        <FavBadge
          host={entry.host}
          letter={entry.hostLetter}
          color={entry.hostColor}
          pageUrl={entry.url}
        />
        <span className="truncate text-[13px] text-fg-0">{entry.title}</span>
      </div>
      <div className="truncate font-mono tabular text-[12px] text-fg-3">
        {truncate(entry.url)}
      </div>
      <div className="text-right font-mono tabular text-[12px] text-fg-2">
        <span
          data-hot={hot}
          className={cn(
            'inline-block min-w-[22px] rounded bg-bg-3 px-[6px] py-[2px] text-center font-medium',
            hot ? 'text-amber' : 'text-fg-1',
          )}
          style={hot ? { background: 'var(--color-hot-bg)' } : undefined}
        >
          {entry.visitCount}
        </span>
      </div>
    </div>
  )
}
