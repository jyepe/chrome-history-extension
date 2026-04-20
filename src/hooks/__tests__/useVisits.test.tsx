import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { useVisits } from "@/hooks/useVisits";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import type { HistoryEntry } from "@/lib/types";

const entry = (url: string, ms: number): HistoryEntry => ({
  id: url,
  url,
  title: url,
  host: "example.com",
  hostLetter: "E",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(ms),
  visitCount: 1,
  typedCount: 0,
});

function wrap(api: ReturnType<typeof createFakeChromeApi>) {
  return ({ children }: { children: ReactNode }) => (
    <ChromeProvider api={api}>{children}</ChromeProvider>
  );
}

const now = Date.UTC(2026, 3, 14, 12);
const withinWindow = now - 5 * 86_400_000;
const outsideWindow = now - 40 * 86_400_000;

describe("useVisits", () => {
  it("starts with loading=true and zero counts", () => {
    const api = createFakeChromeApi({ getVisitsDelayMs: 20 });
    const { result } = renderHook(
      () => useVisits([entry("https://a.com/", now)], 30, now),
      {
        wrapper: wrap(api),
      },
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.counts.total).toBe(0);
  });

  it("tallies transitions within the window only", async () => {
    const api = createFakeChromeApi({
      visitsByUrl: {
        "https://a.com/": [
          { visitId: "v1", visitTime: withinWindow, transition: "typed" },
          { visitId: "v2", visitTime: withinWindow, transition: "link" },
          { visitId: "v3", visitTime: outsideWindow, transition: "reload" },
        ],
      },
    });
    const { result } = renderHook(
      () => useVisits([entry("https://a.com/", now)], 30, now),
      {
        wrapper: wrap(api),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts).toEqual({
      typed: 1,
      link: 1,
      reload: 0,
      form: 0,
      total: 2,
    });
  });

  it("deduplicates requests per URL", async () => {
    let callCount = 0;
    const api = createFakeChromeApi({
      visitsByUrl: {
        "https://a.com/": [
          { visitId: "v1", visitTime: withinWindow, transition: "typed" },
        ],
      },
    });
    const origGetVisits = api.history.getVisits;
    api.history.getVisits = async (q) => {
      callCount += 1;
      return origGetVisits(q);
    };
    const entries = [
      entry("https://a.com/", now),
      entry("https://a.com/", now - 1000),
    ];
    const { result } = renderHook(() => useVisits(entries, 30, now), {
      wrapper: wrap(api),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(callCount).toBe(1);
  });

  it("returns zero counts and not loading when entries is empty", async () => {
    const api = createFakeChromeApi();
    const { result } = renderHook(() => useVisits([], 30, now), {
      wrapper: wrap(api),
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.counts.total).toBe(0);
  });
});
