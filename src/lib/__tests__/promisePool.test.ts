import { describe, it, expect } from "vitest";
import { promisePool } from "@/lib/promisePool";

describe("promisePool", () => {
  it("resolves results in input order", async () => {
    const results = await promisePool([1, 2, 3, 4], 2, async (n) => n * 10);
    expect(results).toEqual([10, 20, 30, 40]);
  });
  it("never exceeds the concurrency cap", async () => {
    let active = 0;
    let maxActive = 0;
    await promisePool(
      Array.from({ length: 10 }, (_, i) => i),
      3,
      async (n) => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 5));
        active -= 1;
        return n;
      },
    );
    expect(maxActive).toBeLessThanOrEqual(3);
  });
  it("returns an empty array for empty input", async () => {
    expect(await promisePool([], 5, async (x) => x)).toEqual([]);
  });
  it("stops launching new work when the signal is aborted", async () => {
    let callCount = 0;
    const controller = new AbortController();
    const items = Array.from({ length: 30 }, (_, i) => i);
    await promisePool(
      items,
      5,
      async (n) => {
        callCount += 1;
        if (n === 0) controller.abort();
        await new Promise((r) => setTimeout(r, 5));
        return n;
      },
      { signal: controller.signal },
    );
    // With concurrency 5, the first batch of 5 fires before abort takes effect.
    // Nothing past that first batch should have been launched.
    expect(callCount).toBeLessThanOrEqual(5);
  });
});
