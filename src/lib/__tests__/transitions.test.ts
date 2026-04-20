import { describe, it, expect } from 'vitest'
import { bucketTransition, countTransitions } from '@/lib/transitions'

describe('bucketTransition', () => {
  it.each([
    ['typed', 'typed'],
    ['keyword', 'typed'],
    ['keyword_generated', 'typed'],
    ['link', 'link'],
    ['auto_bookmark', 'link'],
    ['manual_subframe', 'link'],
    ['auto_subframe', 'link'],
    ['generated', 'link'],
    ['reload', 'reload'],
    ['form_submit', 'form'],
    ['start_page', 'link'],
    ['auto_toplevel', 'link'],
  ] as const)('maps %s → %s', (chromeType, bucket) => {
    expect(bucketTransition(chromeType)).toBe(bucket)
  })
})

describe('countTransitions', () => {
  it('tallies a list of transitions into the 4 buckets + total', () => {
    const counts = countTransitions(['typed', 'link', 'reload', 'form_submit', 'link', 'keyword'])
    expect(counts).toEqual({ typed: 2, link: 2, reload: 1, form: 1, total: 6 })
  })
  it('returns zeros for an empty list', () => {
    expect(countTransitions([])).toEqual({ typed: 0, link: 0, reload: 0, form: 0, total: 0 })
  })
})
