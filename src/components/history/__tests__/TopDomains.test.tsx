import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TopDomains } from '@/components/history/TopDomains'
import type { TopDomain } from '@/lib/types'

const d = (host: string, count: number): TopDomain => ({
  host,
  letter: host[0].toUpperCase(),
  color: 'oklch(0.7 0.1 200)',
  count,
})

describe('TopDomains', () => {
  it('lists each host with its count', () => {
    render(
      <TopDomains list={[d('github.com', 12), d('figma.com', 5)]} totalDomains={2} />,
    )
    expect(screen.getByText('github.com')).toBeInTheDocument()
    expect(screen.getByText('figma.com')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('shows the total-of-N label', () => {
    render(
      <TopDomains list={[d('a.com', 1)]} totalDomains={8} />,
    )
    expect(screen.getByText(/of 8 Total/)).toBeInTheDocument()
  })
})
