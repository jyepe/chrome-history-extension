import { useMemo, useState } from 'react'
import { Topbar } from '@/components/history/Topbar'
import { ColumnHeader } from '@/components/history/ColumnHeader'
import { HistoryList } from '@/components/history/HistoryList'
import { Sidebar } from '@/components/history/Sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useHistory } from '@/hooks/useHistory'
import { useVisits } from '@/hooks/useVisits'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'
import { bucketByDay, formatShortDate, startOfToday } from '@/lib/date'
import { filterEntries } from '@/lib/search'
import { topDomains } from '@/lib/topDomains'
import type { ViewId } from '@/components/history/ViewSegment'

const DAYS = 30

export default function App() {
  const { entries, loading } = useHistory(DAYS)
  const [query, setQuery] = useState('')
  const [view, setView] = useState<ViewId>('list')
  const debouncedQuery = useDebouncedValue(query, 150)
  const filtered = useMemo(() => filterEntries(entries, debouncedQuery), [entries, debouncedQuery])
  const { counts: transitions } = useVisits(entries, DAYS)

  const buckets = useMemo(() => bucketByDay(filtered, 12), [filtered])
  const { list: domains, totalDomains } = useMemo(
    () => topDomains(filtered, 6),
    [filtered],
  )

  const rangeLabel = useMemo(() => {
    const end = startOfToday()
    const start = new Date(end)
    start.setDate(end.getDate() - (DAYS - 1))
    return `${formatShortDate(start)} – ${formatShortDate(end)}`
  }, [])

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid h-screen w-screen grid-rows-[48px_1fr]">
        <Topbar
          query={query}
          onQueryChange={setQuery}
          view={view}
          onViewChange={setView}
          rangeLabel={rangeLabel}
        />
        <div className="grid min-h-0 grid-cols-[1fr_340px]">
          <section className="grid min-h-0 grid-rows-[32px_1fr] border-r border-line-0 bg-bg-0">
            <ColumnHeader />
            <div className="scroll-track overflow-y-auto overflow-x-hidden">
              <HistoryList entries={filtered} loading={loading} query={debouncedQuery} />
            </div>
          </section>
          <Sidebar
            rangeLabel={rangeLabel}
            buckets={buckets}
            transitions={transitions}
            domains={domains}
            totalDomains={totalDomains}
          />
        </div>
      </div>
    </TooltipProvider>
  )
}
