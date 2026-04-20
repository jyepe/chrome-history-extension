import type {
  ChromeApi,
  ChromeHistoryItem,
  ChromeVisitItem,
} from "@/lib/chrome-api";

export interface FakeChromeOptions {
  history?: ChromeHistoryItem[];
  visitsByUrl?: Record<string, ChromeVisitItem[]>;
  extensionId?: string | null;
  searchDelayMs?: number;
  getVisitsDelayMs?: number;
  tabsCreate?: (q: { url: string; active: boolean }) => Promise<void>;
}

export function createFakeChromeApi(opts: FakeChromeOptions = {}): ChromeApi {
  const { history = [], visitsByUrl = {}, extensionId = "test-ext-id" } = opts;
  const delay = (ms = 0) => new Promise((r) => setTimeout(r, ms));
  return {
    history: {
      async search() {
        await delay(opts.searchDelayMs);
        return history;
      },
      async getVisits({ url }) {
        await delay(opts.getVisitsDelayMs);
        return visitsByUrl[url] ?? [];
      },
    },
    tabs: {
      create: opts.tabsCreate ?? (() => Promise.resolve()),
    },
    runtime: {
      getExtensionId: () => extensionId,
    },
  };
}
