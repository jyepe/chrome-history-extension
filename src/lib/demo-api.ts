/// <reference types="chrome" />
/**
 * Curated, deterministic fake ChromeApi for taking marketing screenshots
 * without exposing the developer's real browsing history.
 *
 * Activated by building with VITE_DEMO=1. The whole module is tree-shaken
 * out of production bundles via the dynamic import in main.tsx.
 */
import type {
  ChromeApi,
  ChromeHistoryItem,
  ChromeVisitItem,
} from "./chrome-api";

interface DemoSite {
  url: string;
  title: string;
  /** Approx. visits per 30 days. Higher = appears more often + ranks higher in Top Domains. */
  popularity: number;
  /** Probability weights for chrome transition types. Should roughly sum to 1. */
  mix: { typed?: number; link?: number; reload?: number; form?: number };
}

const SITES: DemoSite[] = [
  // High-traffic dev sites — anchor the Top Domains list
  { url: "https://github.com/", title: "GitHub", popularity: 8, mix: { typed: 0.7, link: 0.2, reload: 0.1 } },
  { url: "https://github.com/anthropics/claude-code", title: "anthropics/claude-code", popularity: 14, mix: { typed: 0.3, link: 0.6, reload: 0.1 } },
  { url: "https://github.com/facebook/react", title: "facebook/react", popularity: 9, mix: { typed: 0.2, link: 0.7, reload: 0.1 } },
  { url: "https://github.com/microsoft/TypeScript", title: "microsoft/TypeScript", popularity: 7, mix: { typed: 0.2, link: 0.7, reload: 0.1 } },
  { url: "https://github.com/vitejs/vite", title: "vitejs/vite", popularity: 6, mix: { typed: 0.2, link: 0.7, reload: 0.1 } },

  { url: "https://stackoverflow.com/", title: "Stack Overflow - Where Developers Learn, Share, & Build Careers", popularity: 6, mix: { typed: 0.5, link: 0.4, reload: 0.1 } },
  { url: "https://stackoverflow.com/questions/tagged/typescript", title: "Newest 'typescript' Questions - Stack Overflow", popularity: 8, mix: { typed: 0.1, link: 0.85, form: 0.05 } },
  { url: "https://stackoverflow.com/questions/tagged/reactjs", title: "Newest 'reactjs' Questions - Stack Overflow", popularity: 7, mix: { typed: 0.1, link: 0.85, form: 0.05 } },

  // Documentation — heavy "link" share
  { url: "https://react.dev/reference/react", title: "API Reference – React", popularity: 12, mix: { typed: 0.2, link: 0.8 } },
  { url: "https://react.dev/learn", title: "Quick Start – React", popularity: 6, mix: { typed: 0.4, link: 0.6 } },
  { url: "https://www.typescriptlang.org/docs/", title: "Documentation - TypeScript", popularity: 9, mix: { typed: 0.3, link: 0.7 } },
  { url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript", title: "JavaScript | MDN", popularity: 10, mix: { typed: 0.2, link: 0.8 } },
  { url: "https://developer.mozilla.org/en-US/docs/Web/CSS/grid", title: "grid - CSS | MDN", popularity: 5, mix: { typed: 0.1, link: 0.9 } },
  { url: "https://tailwindcss.com/docs/installation", title: "Installation - Tailwind CSS", popularity: 6, mix: { typed: 0.4, link: 0.6 } },
  { url: "https://vitejs.dev/guide/", title: "Getting Started | Vite", popularity: 5, mix: { typed: 0.4, link: 0.6 } },
  { url: "https://www.npmjs.com/package/react", title: "react - npm", popularity: 5, mix: { typed: 0.2, link: 0.8 } },

  // News / community — almost all "link"
  { url: "https://news.ycombinator.com/", title: "Hacker News", popularity: 14, mix: { typed: 0.6, link: 0.3, reload: 0.1 } },
  { url: "https://www.reddit.com/r/programming/", title: "r/programming", popularity: 9, mix: { typed: 0.3, link: 0.6, reload: 0.1 } },
  { url: "https://dev.to/", title: "DEV Community", popularity: 5, mix: { typed: 0.3, link: 0.7 } },

  // Search — almost all "typed" / "form"
  { url: "https://www.google.com/", title: "Google", popularity: 18, mix: { typed: 0.85, link: 0.05, reload: 0.1 } },
  { url: "https://www.google.com/search?q=react+useeffect+cleanup", title: "react useeffect cleanup - Google Search", popularity: 4, mix: { form: 0.9, link: 0.1 } },
  { url: "https://www.google.com/search?q=tailwind+grid+template+columns", title: "tailwind grid template columns - Google Search", popularity: 3, mix: { form: 0.9, link: 0.1 } },

  // AI tools
  { url: "https://claude.ai/", title: "Claude", popularity: 16, mix: { typed: 0.7, link: 0.1, reload: 0.2 } },
  { url: "https://www.anthropic.com/news", title: "News \\ Anthropic", popularity: 4, mix: { typed: 0.3, link: 0.7 } },

  // General use
  { url: "https://www.youtube.com/", title: "YouTube", popularity: 8, mix: { typed: 0.7, link: 0.2, reload: 0.1 } },
  { url: "https://en.wikipedia.org/wiki/Chrome_Extension", title: "Chrome Extension - Wikipedia", popularity: 3, mix: { typed: 0.1, link: 0.9 } },

  // Long-running tabs — bump up the "reload" share
  { url: "https://vercel.com/dashboard", title: "Vercel Dashboard", popularity: 7, mix: { typed: 0.4, link: 0.2, reload: 0.4 } },
  { url: "https://app.figma.com/files/recent", title: "Recent files – Figma", popularity: 5, mix: { typed: 0.5, link: 0.1, reload: 0.4 } },
];

const TRANSITION_NAMES = ["typed", "link", "reload", "form_submit"] as const;

function mulberry32(seed: number): () => number {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickTransition(rand: () => number, mix: DemoSite["mix"]): string {
  const weights = [mix.typed ?? 0, mix.link ?? 0, mix.reload ?? 0, mix.form ?? 0];
  const total = weights.reduce((a, b) => a + b, 0) || 1;
  let r = rand() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return TRANSITION_NAMES[i];
  }
  return "link";
}

interface GeneratedVisit {
  url: string;
  title: string;
  visitTime: number;
  transition: string;
}

/**
 * Generate a deterministic browsing history anchored to "now".
 * Same inputs → same shape, with timestamps shifted forward each day so
 * "today" is always populated for the Day view.
 */
function generateVisits(now: number): GeneratedVisit[] {
  const rand = mulberry32(0x5eed_42);
  const visits: GeneratedVisit[] = [];
  const MS_PER_DAY = 86_400_000;

  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const dayStart = now - dayOffset * MS_PER_DAY;
    const date = new Date(dayStart);
    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    const dayMultiplier = isWeekend
      ? 0.3 + rand() * 0.4 // 0.3–0.7
      : 0.7 + rand() * 0.6; // 0.7–1.3

    for (const site of SITES) {
      // Visits per site for this day, scaled.
      const expected = (site.popularity / 30) * dayMultiplier;
      // Small random integer count around the expected value.
      const count = Math.floor(expected + rand());
      for (let i = 0; i < count; i++) {
        // Time-of-day distribution: peak 9–18, late evening bump.
        const hourRoll = rand();
        let hour: number;
        if (hourRoll < 0.65) hour = 9 + Math.floor(rand() * 9); // 9–17
        else if (hourRoll < 0.9) hour = 19 + Math.floor(rand() * 4); // 19–22
        else hour = Math.floor(rand() * 24);

        // For "today", clip the hour to a value <= current hour so we don't
        // generate visits in the future.
        if (dayOffset === 0) {
          const nowHour = new Date(now).getHours();
          if (hour > nowHour) hour = Math.floor(rand() * (nowHour + 1));
        }

        const minute = Math.floor(rand() * 60);
        const second = Math.floor(rand() * 60);
        const visitTime =
          new Date(date).setHours(hour, minute, second, 0);

        visits.push({
          url: site.url,
          title: site.title,
          visitTime,
          transition: pickTransition(rand, site.mix),
        });
      }
    }
  }
  return visits;
}

// Build the seed once at module load. Anchored to "now" so dates are always fresh.
const NOW = Date.now();
const ALL_VISITS = generateVisits(NOW);

// Group visits by URL for fast lookup.
const VISITS_BY_URL = new Map<string, GeneratedVisit[]>();
for (const v of ALL_VISITS) {
  const list = VISITS_BY_URL.get(v.url);
  if (list) list.push(v);
  else VISITS_BY_URL.set(v.url, [v]);
}
for (const list of VISITS_BY_URL.values()) {
  list.sort((a, b) => b.visitTime - a.visitTime);
}

// One ChromeHistoryItem per URL, modeled on chrome.history.search() output.
const HISTORY_ITEMS: ChromeHistoryItem[] = Array.from(
  VISITS_BY_URL.entries(),
).map(([url, visits], idx) => {
  const first = visits[0];
  return {
    id: `demo-${idx}`,
    url,
    title: first.title,
    lastVisitTime: first.visitTime,
    visitCount: visits.length,
    typedCount: visits.filter((v) => v.transition === "typed").length,
  };
});

export const demoChromeApi: ChromeApi = {
  history: {
    search: (q) =>
      Promise.resolve(
        HISTORY_ITEMS.filter((item) => {
          if (q.startTime != null && (item.lastVisitTime ?? 0) < q.startTime)
            return false;
          if (q.endTime != null && (item.lastVisitTime ?? 0) > q.endTime)
            return false;
          if (q.text) {
            const needle = q.text.toLowerCase();
            const hay =
              `${item.title ?? ""} ${item.url ?? ""}`.toLowerCase();
            if (!hay.includes(needle)) return false;
          }
          return true;
        }).slice(0, q.maxResults ?? 10_000),
      ),
    getVisits: (q) => {
      const list = VISITS_BY_URL.get(q.url) ?? [];
      const items: ChromeVisitItem[] = list.map((v, i) => ({
        visitId: `${q.url}#${i}`,
        visitTime: v.visitTime,
        transition: v.transition,
      }));
      return Promise.resolve(items);
    },
  },
  tabs: {
    // Open the real public URL — useful if the screenshot operator clicks a row.
    create: (q) => {
      window.open(q.url, "_blank", "noopener,noreferrer");
      return Promise.resolve();
    },
  },
  runtime: {
    // Still loaded as an unpacked extension, so chrome.runtime.id is available
    // and favicons render through the normal _favicon route.
    getExtensionId: () => {
      if (typeof chrome === "undefined") return null;
      return chrome.runtime?.id ?? null;
    },
  },
};
