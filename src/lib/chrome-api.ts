/// <reference types="chrome" />
export interface ChromeHistorySearchQuery {
  text: string;
  startTime?: number;
  endTime?: number;
  maxResults?: number;
}

export interface ChromeHistoryItem {
  id: string;
  url?: string;
  title?: string;
  lastVisitTime?: number;
  visitCount?: number;
  typedCount?: number;
}

export interface ChromeVisitItem {
  visitId: string;
  visitTime?: number;
  transition: string;
}

export interface ChromeApi {
  history: {
    search(q: ChromeHistorySearchQuery): Promise<ChromeHistoryItem[]>;
    getVisits(q: { url: string }): Promise<ChromeVisitItem[]>;
  };
  runtime: {
    getExtensionId(): string | null;
  };
}

/**
 * Real implementation — calls chrome.* directly.
 * Promisifies the callback-based APIs (Chrome's promise variants exist in MV3,
 * but callback form is universally supported and avoids version-specific typing).
 */
export const realChromeApi: ChromeApi = {
  history: {
    search: (q) =>
      new Promise((resolve) => {
        chrome.history.search(q, (items) =>
          resolve(items as ChromeHistoryItem[]),
        );
      }),
    getVisits: (q) =>
      new Promise((resolve) => {
        chrome.history.getVisits(q, (items) =>
          resolve(items as ChromeVisitItem[]),
        );
      }),
  },
  runtime: {
    getExtensionId: () => {
      if (typeof chrome === "undefined") return null;
      return chrome.runtime?.id ?? null;
    },
  },
};
