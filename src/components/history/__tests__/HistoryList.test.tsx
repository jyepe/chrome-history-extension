import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChromeProvider } from '@/components/ChromeProvider'
import { createFakeChromeApi } from '@/lib/__tests__/test-chrome'
import { HistoryList } from '@/components/history/HistoryList'
import type { HistoryEntry } from '@/lib/types'

const e = (id: string, date: Date, title = id): HistoryEntry => ({
  id,
  url: `https://a.com/${id}`,
  title,
  host: 'a.com',
  hostLetter: 'A',
  hostColor: 'oklch(0.7 0.1 200)',
  lastVisitTime: date,
  visitCount: 1,
  typedCount: 0,
})

const wrap = (ui: React.ReactNode) =>
  render(<ChromeProvider api={createFakeChromeApi()}>{ui}</ChromeProvider>)

describe('HistoryList', () => {
  it('renders a loading skeleton when loading and no entries', () => {
    wrap(<HistoryList entries={[]} loading query="" />)
    expect(screen.getByLabelText('Loading history')).toBeInTheDocument()
  })

  it('renders the "no history" empty state', () => {
    wrap(<HistoryList entries={[]} loading={false} query="" />)
    expect(screen.getByText(/No browsing history/)).toBeInTheDocument()
  })

  it('renders the "no matches" empty state', () => {
    wrap(<HistoryList entries={[]} loading={false} query="xyz" />)
    expect(screen.getByText(/No history matches "xyz"/)).toBeInTheDocument()
  })

  it('groups entries by day, descending', () => {
    const items = [
      e('a', new Date(2026, 3, 14, 10)),
      e('b', new Date(2026, 3, 14, 9)),
      e('c', new Date(2026, 3, 13, 15)),
    ]
    const { container } = wrap(<HistoryList entries={items} loading={false} query="" />)
    const dayHeaders = container.querySelectorAll('div.sticky')
    expect(dayHeaders).toHaveLength(2)
    expect(dayHeaders[0].textContent).toMatch(/April 14, 2026/)
    expect(dayHeaders[1].textContent).toMatch(/April 13, 2026/)
  })
})
