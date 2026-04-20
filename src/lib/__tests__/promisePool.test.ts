import { describe, it, expect } from 'vitest'
import { promisePool } from '@/lib/promisePool'

describe('promisePool', () => {
  it('resolves results in input order', async () => {
    const results = await promisePool([1, 2, 3, 4], 2, async (n) => n * 10)
    expect(results).toEqual([10, 20, 30, 40])
  })
  it('never exceeds the concurrency cap', async () => {
    let active = 0
    let maxActive = 0
    await promisePool(Array.from({ length: 10 }, (_, i) => i), 3, async (n) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((r) => setTimeout(r, 5))
      active -= 1
      return n
    })
    expect(maxActive).toBeLessThanOrEqual(3)
  })
  it('returns an empty array for empty input', async () => {
    expect(await promisePool([], 5, async (x) => x)).toEqual([])
  })
})
