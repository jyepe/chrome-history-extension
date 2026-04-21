export interface PromisePoolOptions {
  signal?: AbortSignal;
}

export async function promisePool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  options: PromisePoolOptions = {},
): Promise<R[]> {
  const { signal } = options;
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
      if (signal?.aborted) return;
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  }

  const runners = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => run(),
  );
  await Promise.all(runners);
  return results;
}
