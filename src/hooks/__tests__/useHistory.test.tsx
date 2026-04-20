import { describe, it, expect } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { ChromeProvider } from '@/components/ChromeProvider'
import { useHistory } from '@/hooks/useHistory'
import { createFakeChromeApi } from '@/lib/__tests__/test-chrome'

const visit = Date.UTC(2026, 3, 14, 10) // ms

function wrap(api: ReturnType<typeof createFakeChromeApi>) {
  return ({ children }: { children: ReactNode }) => (
    <ChromeProvider api={api}>{children}</ChromeProvider>
  )
}

describe('useHistory', () => {
  it('starts with loading=true and empty entries', () => {
    const api = createFakeChromeApi({ searchDelayMs: 20 })
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) })
    expect(result.current.loading).toBe(true)
    expect(result.current.entries).toEqual([])
  })

  it('normalizes HistoryItem[] into HistoryEntry[]', async () => {
    const api = createFakeChromeApi({
      history: [
        {
          id: '1',
          url: 'https://github.com/anthropics/claude-sdk',
          title: 'anthropics/claude-sdk',
          lastVisitTime: visit,
          visitCount: 5,
          typedCount: 1,
        },
      ],
    })
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toHaveLength(1)
    const e = result.current.entries[0]
    expect(e.host).toBe('github.com')
    expect(e.hostLetter).toBe('G')
    expect(e.lastVisitTime).toBeInstanceOf(Date)
    expect(e.visitCount).toBe(5)
  })

  it('falls back to hostname when title is empty', async () => {
    const api = createFakeChromeApi({
      history: [
        {
          id: '2',
          url: 'https://figma.com/file/x',
          title: '',
          lastVisitTime: visit,
          visitCount: 1,
        },
      ],
    })
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries[0].title).toBe('figma.com')
  })

  it('skips entries with no URL', async () => {
    const api = createFakeChromeApi({
      history: [{ id: '3', url: undefined, lastVisitTime: visit, visitCount: 1 }],
    })
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.entries).toEqual([])
  })

  it('surfaces errors', async () => {
    const api = createFakeChromeApi()
    api.history.search = async () => {
      throw new Error('permission denied')
    }
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) })
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error?.message).toBe('permission denied')
  })
})
