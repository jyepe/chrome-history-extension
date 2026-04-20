# History Dashboard Slice B — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `chrome://history` with a dark-mode React dashboard showing the List view plus sidebar analytics (Activity bar chart, Transition donut, Top Domains), wired to real `chrome.history` data.

**Architecture:** One `chrome.history.search` call feeds everything; all views, charts, and filters derive from the same `HistoryEntry[]` in memory. Hooks are the only layer that touches `chrome.*` — via a `ChromeApi` context boundary so tests inject a fake. Pure utilities live in `src/lib/` and are unit-tested with Vitest.

**Tech Stack:** React 19 + TypeScript, Vite 8 + `@crxjs/vite-plugin`, Tailwind CSS v4 (`@theme inline`), shadcn/ui (Button/Input/Tooltip/ToggleGroup), Recharts, Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-04-19-history-dashboard-design.md`

**Working directory:** `C:\Users\yepej\Desktop\GIT\chrome-history-extension` (current branch: `master`). If using isolation, create a worktree before starting.

**Commit style:** one commit per completed task, using `feat:` / `test:` / `chore:` / `style:` prefixes.

---

## Phase 1 — Project setup

### Task 1: Install runtime + test dependencies, remove unused Geist font

**Files:**

- Modify: `package.json` (dependencies)
- Create: `vitest.config.ts`
- Create: `src/test-setup.ts`

- [ ] **Step 1: Audit for existing Geist imports**

Run from project root:

```bash
grep -rn "geist" src/ 2>&1 || true
```

Expected: no matches in `src/` (the dep exists but isn't imported). If any match appears, note the file — you'll delete those imports at Step 4.

- [ ] **Step 2: Uninstall unused font, install runtime deps**

```bash
npm uninstall @fontsource-variable/geist
npm install recharts @fontsource-variable/inter @fontsource-variable/jetbrains-mono
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/chrome
```

Expected: completes without peer-dep errors. If any appear, re-run with `--legacy-peer-deps`.

- [ ] **Step 3: Add test scripts to `package.json`**

Open `package.json`, replace the `"scripts"` block with:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "typecheck": "tsc -b --noEmit"
}
```

- [ ] **Step 4: Remove any Geist imports noted in Step 1**

If Step 1 found no matches, skip. Otherwise, open each file listed and delete only the `import '@fontsource-variable/geist'` line.

- [ ] **Step 5: Create `vitest.config.ts`**

Create `vitest.config.ts` with:

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test-setup.ts"],
    css: false,
  },
});
```

- [ ] **Step 6: Create `src/test-setup.ts`**

Create `src/test-setup.ts` with:

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

- [ ] **Step 7: Add a trivial passing test to verify the harness**

Create `src/__tests__/harness.test.ts`:

```ts
import { describe, it, expect } from "vitest";

describe("test harness", () => {
  it("runs", () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 8: Run the test suite**

Run:

```bash
npm test
```

Expected: `Test Files 1 passed | Tests 1 passed`.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test-setup.ts src/__tests__/harness.test.ts
git commit -m "chore: add Vitest, Recharts, Inter/JetBrains Mono; remove Geist"
```

---

### Task 2: Add shadcn components (Input, Tooltip, ToggleGroup)

**Files:**

- Create: `src/components/ui/input.tsx` (via shadcn CLI)
- Create: `src/components/ui/tooltip.tsx` (via shadcn CLI)
- Create: `src/components/ui/toggle-group.tsx` (via shadcn CLI) + `toggle.tsx` if it pulls it in

- [ ] **Step 1: Run the shadcn CLI**

```bash
npx shadcn@latest add input tooltip toggle-group
```

When prompted about overwriting, choose **no** for files that already exist.
Expected: new files under `src/components/ui/`.

- [ ] **Step 2: Verify typecheck still passes**

```bash
npm run typecheck
```

Expected: exit code 0. If Radix types clash with existing React 19 types, that's a downstream shadcn-template issue — resolve by updating the generated files as the CLI suggests.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add shadcn Input/Tooltip/ToggleGroup primitives"
```

---

### Task 3: Port design tokens into Tailwind v4 `@theme` + shadcn bridge

**Files:**

- Modify: `src/index.css` (replace the Tailwind directives block)
- Delete: `src/App.css` (unused after App rewrite — but leave it for now; Task 25 removes)

- [ ] **Step 1: Overwrite `src/index.css`**

Replace the full contents of `src/index.css` with:

```css
@import "tailwindcss";

@theme inline {
  --color-bg-0: oklch(0.17 0.008 260);
  --color-bg-1: oklch(0.205 0.009 260);
  --color-bg-2: oklch(0.235 0.01 260);
  --color-bg-3: oklch(0.275 0.011 260);
  --color-bg-hover: oklch(0.255 0.012 260);
  --color-bg-row-alt: oklch(0.195 0.009 260);

  --color-line-0: oklch(0.28 0.012 260);
  --color-line-1: oklch(0.33 0.014 260);

  --color-fg-0: oklch(0.96 0.005 260);
  --color-fg-1: oklch(0.82 0.01 260);
  --color-fg-2: oklch(0.62 0.012 260);
  --color-fg-3: oklch(0.46 0.012 260);

  --color-amber: oklch(0.78 0.14 75);
  --color-amber-dim: oklch(0.62 0.12 75);
  --color-cyan: oklch(0.78 0.12 220);
  --color-violet: oklch(0.72 0.16 295);
  --color-coral: oklch(0.72 0.16 25);
  --color-green: oklch(0.78 0.14 150);

  --color-chip: oklch(0.285 0.012 260);
  --color-chip-fg: oklch(0.78 0.01 260);

  --color-hot-bg: oklch(0.35 0.08 75);

  --font-sans:
    "Inter Variable", "Inter", system-ui, -apple-system, Segoe UI, Roboto,
    sans-serif;
  --font-mono:
    "JetBrains Mono Variable", "JetBrains Mono", ui-monospace, Menlo, monospace;

  --shadow-sm:
    0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 8px 24px rgba(0, 0, 0, 0.35);
}

/* shadcn bridge — wire the library's semantic tokens to our palette */
:root {
  --background: var(--color-bg-0);
  --foreground: var(--color-fg-0);
  --card: var(--color-bg-1);
  --card-foreground: var(--color-fg-0);
  --popover: var(--color-bg-3);
  --popover-foreground: var(--color-fg-0);
  --primary: var(--color-amber);
  --primary-foreground: oklch(0.2 0.02 75);
  --secondary: var(--color-bg-2);
  --secondary-foreground: var(--color-fg-0);
  --muted: var(--color-bg-2);
  --muted-foreground: var(--color-fg-2);
  --accent: var(--color-bg-hover);
  --accent-foreground: var(--color-fg-0);
  --destructive: oklch(0.6 0.19 25);
  --destructive-foreground: var(--color-fg-0);
  --border: var(--color-line-0);
  --input: var(--color-bg-2);
  --ring: var(--color-amber);
  --radius: 0.5rem;
}

@layer base {
  * {
    box-sizing: border-box;
  }
  html,
  body {
    height: 100%;
  }
  body {
    margin: 0;
    background: var(--color-bg-0);
    color: var(--color-fg-1);
    font-family: var(--font-sans);
    font-size: 13px;
    line-height: 1.4;
    -webkit-font-smoothing: antialiased;
    overflow: hidden;
  }
}

@layer utilities {
  .tabular {
    font-variant-numeric: tabular-nums;
  }
  .scroll-track::-webkit-scrollbar {
    width: 10px;
  }
  .scroll-track::-webkit-scrollbar-track {
    background: transparent;
  }
  .scroll-track::-webkit-scrollbar-thumb {
    background: var(--color-line-1);
    border-radius: 10px;
    border: 2px solid var(--color-bg-0);
  }
  .scroll-track::-webkit-scrollbar-thumb:hover {
    background: var(--color-fg-3);
  }
}
```

- [ ] **Step 2: Verify dev server still compiles**

```bash
npm run build
```

Expected: exit code 0. If Tailwind errors on a token, inspect the specific line.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: port design tokens into Tailwind v4 @theme + shadcn bridge"
```

---

### Task 4: Import Inter + JetBrains Mono in `main.tsx`

**Files:**

- Modify: `src/main.tsx`

- [ ] **Step 1: Add font imports**

Open `src/main.tsx`. At the top of the file, **before** any other import, add:

```ts
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "style: import Inter + JetBrains Mono variable fonts"
```

---

## Phase 2 — Pure utilities (test-first)

### Task 5: `lib/types.ts` + `lib/domain.ts`

**Files:**

- Create: `src/lib/types.ts`
- Create: `src/lib/domain.ts`
- Create: `src/lib/__tests__/domain.test.ts`

- [ ] **Step 1: Write the types**

Create `src/lib/types.ts`:

```ts
export type TransitionBucket = "typed" | "link" | "reload" | "form";

export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  host: string;
  hostLetter: string;
  hostColor: string;
  lastVisitTime: Date;
  visitCount: number;
  typedCount: number;
}

export interface DayGroup {
  date: Date;
  entries: HistoryEntry[];
  totalViews: number;
}

export interface ActivityBucket {
  date: Date;
  label: string;
  pages: number;
  views: number;
}

export interface TransitionCounts {
  typed: number;
  link: number;
  reload: number;
  form: number;
  total: number;
}

export interface TopDomain {
  host: string;
  letter: string;
  color: string;
  count: number;
}
```

- [ ] **Step 2: Write failing tests for `domain.ts`**

Create `src/lib/__tests__/domain.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { parseHost, hostLetter, hostColor } from "@/lib/domain";

describe("parseHost", () => {
  it("extracts hostname from https URL", () => {
    expect(parseHost("https://github.com/anthropics/claude-sdk")).toBe(
      "github.com",
    );
  });
  it("extracts hostname from http URL", () => {
    expect(parseHost("http://example.com:8080/path")).toBe("example.com");
  });
  it("returns empty string for invalid URL", () => {
    expect(parseHost("not a url")).toBe("");
  });
  it("strips leading www.", () => {
    expect(parseHost("https://www.udemy.com/course/x")).toBe("udemy.com");
  });
});

describe("hostLetter", () => {
  it("returns first uppercase alphanumeric character", () => {
    expect(hostLetter("github.com")).toBe("G");
    expect(hostLetter("news.ycombinator.com")).toBe("N");
    expect(hostLetter("9gag.com")).toBe("9");
  });
  it('falls back to "·" when no alphanumeric char exists', () => {
    expect(hostLetter("")).toBe("·");
    expect(hostLetter("...")).toBe("·");
  });
});

describe("hostColor", () => {
  it("returns a deterministic oklch color for the same host", () => {
    expect(hostColor("github.com")).toBe(hostColor("github.com"));
  });
  it("returns different colors for different hosts", () => {
    expect(hostColor("github.com")).not.toBe(hostColor("figma.com"));
  });
  it("always returns a valid oklch string", () => {
    expect(hostColor("github.com")).toMatch(/^oklch\([\d.]+ [\d.]+ [\d.]+\)$/);
  });
});
```

- [ ] **Step 3: Verify tests fail**

```bash
npm test -- domain
```

Expected: `Cannot find module '@/lib/domain'` or similar — all tests fail.

- [ ] **Step 4: Implement `lib/domain.ts`**

Create `src/lib/domain.ts`:

```ts
export function parseHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function hostLetter(host: string): string {
  const match = host.match(/[a-z0-9]/i);
  return match ? match[0].toUpperCase() : "·";
}

/** Seeded 32-bit hash (FNV-1a variant) — stable across runs. */
function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

/**
 * Map a host to a deterministic oklch color.
 * Lightness and chroma are fixed for visual consistency with the mock;
 * hue is derived from the hash so each domain gets its own tile color.
 */
export function hostColor(host: string): string {
  const hue = hashString(host) % 360;
  const lightness = 0.72 + ((hashString(host) >>> 9) % 10) / 100; // 0.72–0.81
  const chroma = 0.12 + ((hashString(host) >>> 17) % 5) / 100; // 0.12–0.16
  return `oklch(${lightness.toFixed(2)} ${chroma.toFixed(2)} ${hue})`;
}
```

- [ ] **Step 5: Verify tests pass**

```bash
npm test -- domain
```

Expected: all domain tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/domain.ts src/lib/__tests__/domain.test.ts
git commit -m "feat(lib): types + domain helpers (parseHost, hostLetter, hostColor)"
```

---

### Task 6: `lib/transitions.ts`

**Files:**

- Create: `src/lib/transitions.ts`
- Create: `src/lib/__tests__/transitions.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/transitions.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { bucketTransition, countTransitions } from "@/lib/transitions";

describe("bucketTransition", () => {
  it.each([
    ["typed", "typed"],
    ["keyword", "typed"],
    ["keyword_generated", "typed"],
    ["link", "link"],
    ["auto_bookmark", "link"],
    ["manual_subframe", "link"],
    ["auto_subframe", "link"],
    ["generated", "link"],
    ["reload", "reload"],
    ["form_submit", "form"],
    ["start_page", "link"],
    ["auto_toplevel", "link"],
  ] as const)("maps %s → %s", (chromeType, bucket) => {
    expect(bucketTransition(chromeType)).toBe(bucket);
  });
});

describe("countTransitions", () => {
  it("tallies a list of transitions into the 4 buckets + total", () => {
    const counts = countTransitions([
      "typed",
      "link",
      "reload",
      "form_submit",
      "link",
      "keyword",
    ]);
    expect(counts).toEqual({ typed: 2, link: 2, reload: 1, form: 1, total: 6 });
  });
  it("returns zeros for an empty list", () => {
    expect(countTransitions([])).toEqual({
      typed: 0,
      link: 0,
      reload: 0,
      form: 0,
      total: 0,
    });
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- transitions
```

Expected: module-not-found failures.

- [ ] **Step 3: Implement `lib/transitions.ts`**

Create `src/lib/transitions.ts`:

```ts
import type { TransitionBucket, TransitionCounts } from "./types";

export function bucketTransition(t: string): TransitionBucket {
  switch (t) {
    case "typed":
    case "keyword":
    case "keyword_generated":
      return "typed";
    case "reload":
      return "reload";
    case "form_submit":
      return "form";
    default:
      return "link";
  }
}

export function countTransitions(
  transitions: readonly string[],
): TransitionCounts {
  const counts: TransitionCounts = {
    typed: 0,
    link: 0,
    reload: 0,
    form: 0,
    total: 0,
  };
  for (const t of transitions) {
    counts[bucketTransition(t)] += 1;
    counts.total += 1;
  }
  return counts;
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- transitions
```

Expected: all transition tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/transitions.ts src/lib/__tests__/transitions.test.ts
git commit -m "feat(lib): transition-type bucketing (typed/link/reload/form)"
```

---

### Task 7: `lib/date.ts`

**Files:**

- Create: `src/lib/date.ts`
- Create: `src/lib/__tests__/date.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/date.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import {
  formatTime,
  formatDateLong,
  formatShortDate,
  startOfDay,
  startOfToday,
  groupByDay,
  bucketByDay,
} from "@/lib/date";
import type { HistoryEntry } from "@/lib/types";

const entry = (iso: string, views = 1): HistoryEntry => ({
  id: iso,
  url: "https://example.com/" + iso,
  title: "t",
  host: "example.com",
  hostLetter: "E",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(iso),
  visitCount: views,
  typedCount: 0,
});

describe("formatTime", () => {
  it("pads hours/minutes/seconds to 2 digits", () => {
    expect(formatTime(new Date("2026-04-14T05:07:09"))).toBe("05:07:09");
  });
});

describe("formatDateLong", () => {
  it("returns weekday + long month + day + year", () => {
    expect(formatDateLong(new Date(2026, 3, 14))).toBe(
      "Tuesday, April 14, 2026",
    );
  });
});

describe("formatShortDate", () => {
  it("returns M/D/YYYY", () => {
    expect(formatShortDate(new Date(2026, 3, 14))).toBe("4/14/2026");
  });
});

describe("startOfDay", () => {
  it("zeroes hours/minutes/seconds/ms", () => {
    const d = startOfDay(new Date(2026, 3, 14, 17, 30, 45, 123));
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
    expect(d.getSeconds()).toBe(0);
    expect(d.getMilliseconds()).toBe(0);
  });
});

describe("startOfToday", () => {
  it("returns a Date representing midnight local time", () => {
    const t = startOfToday();
    expect(t.getHours()).toBe(0);
  });
});

describe("groupByDay", () => {
  it("groups entries by local calendar day, descending", () => {
    const entries = [
      entry("2026-04-14T10:00:00", 2),
      entry("2026-04-14T12:00:00", 3),
      entry("2026-04-13T09:00:00", 1),
    ];
    const groups = groupByDay(entries);
    expect(groups).toHaveLength(2);
    expect(groups[0].date.getDate()).toBe(14);
    expect(groups[0].totalViews).toBe(5);
    expect(groups[0].entries).toHaveLength(2);
    expect(groups[1].date.getDate()).toBe(13);
    expect(groups[1].totalViews).toBe(1);
  });
  it("returns an empty array for no entries", () => {
    expect(groupByDay([])).toEqual([]);
  });
});

describe("bucketByDay", () => {
  it("produces N consecutive day-buckets ending on endDate", () => {
    const entries = [
      entry("2026-04-14T10:00:00", 3), // day 0
      entry("2026-04-14T11:00:00", 2), // day 0 (same day, different URL)
      entry("2026-04-13T09:00:00", 1), // day -1
    ];
    const endDate = startOfDay(new Date(2026, 3, 14));
    const buckets = bucketByDay(entries, 3, endDate);
    expect(buckets).toHaveLength(3);
    expect(buckets[2].date.getDate()).toBe(14);
    expect(buckets[2].pages).toBe(2);
    expect(buckets[2].views).toBe(5);
    expect(buckets[1].date.getDate()).toBe(13);
    expect(buckets[1].pages).toBe(1);
    expect(buckets[1].views).toBe(1);
    expect(buckets[0].date.getDate()).toBe(12);
    expect(buckets[0].pages).toBe(0);
    expect(buckets[0].views).toBe(0);
  });
  it('labels buckets as "Mon D"', () => {
    const endDate = startOfDay(new Date(2026, 3, 14));
    const buckets = bucketByDay([], 3, endDate);
    expect(buckets[2].label).toBe("Apr 14");
    expect(buckets[1].label).toBe("Apr 13");
    expect(buckets[0].label).toBe("Apr 12");
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- date
```

Expected: module-not-found failures.

- [ ] **Step 3: Implement `lib/date.ts`**

Create `src/lib/date.ts`:

```ts
import type { ActivityBucket, DayGroup, HistoryEntry } from "./types";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;
const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;
const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

const pad = (n: number) => String(n).padStart(2, "0");

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function formatDateLong(d: Date): string {
  return `${WEEKDAYS[d.getDay()]}, ${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatShortDate(d: Date): string {
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function startOfToday(): Date {
  return startOfDay(new Date());
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function groupByDay(entries: readonly HistoryEntry[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const e of entries) {
    const day = startOfDay(e.lastVisitTime);
    const key = dayKey(day);
    let group = map.get(key);
    if (!group) {
      group = { date: day, entries: [], totalViews: 0 };
      map.set(key, group);
    }
    group.entries.push(e);
    group.totalViews += e.visitCount;
  }
  return [...map.values()].sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function bucketByDay(
  entries: readonly HistoryEntry[],
  days: number,
  endDate: Date = startOfToday(),
): ActivityBucket[] {
  const buckets: ActivityBucket[] = [];
  const end = startOfDay(endDate);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    buckets.push({
      date: d,
      label: `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`,
      pages: 0,
      views: 0,
    });
  }
  const indexByKey = new Map(buckets.map((b, i) => [dayKey(b.date), i]));
  for (const e of entries) {
    const key = dayKey(startOfDay(e.lastVisitTime));
    const idx = indexByKey.get(key);
    if (idx === undefined) continue;
    buckets[idx].pages += 1;
    buckets[idx].views += e.visitCount;
  }
  return buckets;
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- date
```

Expected: all date tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/date.ts src/lib/__tests__/date.test.ts
git commit -m "feat(lib): date helpers (formatters, groupByDay, bucketByDay)"
```

---

### Task 8: `lib/search.ts` (filter entries)

**Files:**

- Create: `src/lib/search.ts`
- Create: `src/lib/__tests__/search.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/search.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { filterEntries } from "@/lib/search";
import type { HistoryEntry } from "@/lib/types";

const e = (
  id: string,
  title: string,
  url: string,
  host: string,
): HistoryEntry => ({
  id,
  title,
  url,
  host,
  hostLetter: host[0]?.toUpperCase() ?? "·",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(2026, 3, 14),
  visitCount: 1,
  typedCount: 0,
});

const entries: HistoryEntry[] = [
  e(
    "1",
    "Hacker News",
    "https://news.ycombinator.com/",
    "news.ycombinator.com",
  ),
  e(
    "2",
    "GitHub — anthropics/claude-sdk",
    "https://github.com/anthropics",
    "github.com",
  ),
  e(
    "3",
    "Q2 Roadmap — Google Docs",
    "https://docs.google.com/document/d/1",
    "docs.google.com",
  ),
];

describe("filterEntries", () => {
  it("returns the original reference when query is empty", () => {
    expect(filterEntries(entries, "")).toBe(entries);
  });
  it("returns the original reference when query is whitespace only", () => {
    expect(filterEntries(entries, "   ")).toBe(entries);
  });
  it("matches on title case-insensitively", () => {
    expect(filterEntries(entries, "hacker")).toHaveLength(1);
    expect(filterEntries(entries, "GITHUB")).toHaveLength(1);
  });
  it("matches on url", () => {
    expect(filterEntries(entries, "document")).toHaveLength(1);
  });
  it("matches on host", () => {
    expect(filterEntries(entries, "ycombinator")).toHaveLength(1);
  });
  it("returns empty array when nothing matches", () => {
    expect(filterEntries(entries, "nope")).toEqual([]);
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- search
```

- [ ] **Step 3: Implement `lib/search.ts`**

Create `src/lib/search.ts`:

```ts
import type { HistoryEntry } from "./types";

export function filterEntries(
  entries: readonly HistoryEntry[],
  query: string,
): readonly HistoryEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) =>
      e.title.toLowerCase().includes(q) ||
      e.url.toLowerCase().includes(q) ||
      e.host.toLowerCase().includes(q),
  );
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- search
```

Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/lib/search.ts src/lib/__tests__/search.test.ts
git commit -m "feat(lib): filterEntries for in-memory search"
```

---

### Task 9: `lib/topDomains.ts`

**Files:**

- Create: `src/lib/topDomains.ts`
- Create: `src/lib/__tests__/topDomains.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/topDomains.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import { topDomains } from "@/lib/topDomains";
import type { HistoryEntry } from "@/lib/types";

const e = (host: string, visits: number): HistoryEntry => ({
  id: host + visits,
  url: `https://${host}/`,
  title: host,
  host,
  hostLetter: host[0].toUpperCase(),
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(2026, 3, 14),
  visitCount: visits,
  typedCount: 0,
});

describe("topDomains", () => {
  it("aggregates visitCount by host and sorts descending", () => {
    const { list, totalDomains } = topDomains(
      [e("a.com", 2), e("a.com", 3), e("b.com", 1), e("c.com", 10)],
      10,
    );
    expect(list.map((d) => d.host)).toEqual(["c.com", "a.com", "b.com"]);
    expect(list.map((d) => d.count)).toEqual([10, 5, 1]);
    expect(totalDomains).toBe(3);
  });
  it("caps list at the requested limit", () => {
    const entries = Array.from({ length: 10 }, (_, i) => e(`d${i}.com`, i + 1));
    const { list, totalDomains } = topDomains(entries, 3);
    expect(list).toHaveLength(3);
    expect(totalDomains).toBe(10);
    expect(list[0].count).toBe(10);
  });
  it("returns empty + zero when given no entries", () => {
    expect(topDomains([], 6)).toEqual({ list: [], totalDomains: 0 });
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- topDomains
```

- [ ] **Step 3: Implement `lib/topDomains.ts`**

Create `src/lib/topDomains.ts`:

```ts
import type { HistoryEntry, TopDomain } from "./types";

export interface TopDomainsResult {
  list: TopDomain[];
  totalDomains: number;
}

export function topDomains(
  entries: readonly HistoryEntry[],
  limit: number,
): TopDomainsResult {
  const byHost = new Map<string, TopDomain>();
  for (const e of entries) {
    const existing = byHost.get(e.host);
    if (existing) {
      existing.count += e.visitCount;
    } else {
      byHost.set(e.host, {
        host: e.host,
        letter: e.hostLetter,
        color: e.hostColor,
        count: e.visitCount,
      });
    }
  }
  const sorted = [...byHost.values()].sort((a, b) => b.count - a.count);
  return { list: sorted.slice(0, limit), totalDomains: sorted.length };
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- topDomains
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/topDomains.ts src/lib/__tests__/topDomains.test.ts
git commit -m "feat(lib): topDomains aggregation"
```

---

### Task 10: `lib/promisePool.ts` (concurrency-capped fan-out)

**Files:**

- Create: `src/lib/promisePool.ts`
- Create: `src/lib/__tests__/promisePool.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/__tests__/promisePool.test.ts`:

```ts
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
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- promisePool
```

- [ ] **Step 3: Implement `lib/promisePool.ts`**

Create `src/lib/promisePool.ts`:

```ts
export async function promisePool<T, R>(
  items: readonly T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function run() {
    while (true) {
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
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- promisePool
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/promisePool.ts src/lib/__tests__/promisePool.test.ts
git commit -m "feat(lib): promisePool concurrency helper"
```

---

## Phase 3 — Chrome API boundary + hooks

### Task 11: `ChromeApi` abstraction + `ChromeProvider`

**Files:**

- Create: `src/lib/chrome-api.ts`
- Create: `src/components/ChromeProvider.tsx`
- Create: `src/lib/__tests__/test-chrome.ts` (test helper, not a `.test.ts`)

- [ ] **Step 1: Create the interface + real implementation**

Create `src/lib/chrome-api.ts`:

```ts
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
```

- [ ] **Step 2: Create the React provider**

Create `src/components/ChromeProvider.tsx`:

```tsx
import { createContext, useContext, type ReactNode } from "react";
import type { ChromeApi } from "@/lib/chrome-api";

const ChromeApiContext = createContext<ChromeApi | null>(null);

export function ChromeProvider({
  api,
  children,
}: {
  api: ChromeApi;
  children: ReactNode;
}) {
  return (
    <ChromeApiContext.Provider value={api}>
      {children}
    </ChromeApiContext.Provider>
  );
}

export function useChromeApi(): ChromeApi {
  const api = useContext(ChromeApiContext);
  if (!api) {
    throw new Error("useChromeApi must be used inside <ChromeProvider>");
  }
  return api;
}
```

- [ ] **Step 3: Create a test helper for fake chrome data**

Create `src/lib/__tests__/test-chrome.ts`:

```ts
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
    runtime: {
      getExtensionId: () => extensionId,
    },
  };
}
```

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck
```

Expected: exit code 0. If `chrome.*` types are missing, ensure `@types/chrome` is installed from Task 1 and that `tsconfig.app.json` includes it via `"types": ["chrome", "vite/client"]` — if not, add it.

- [ ] **Step 5: Commit**

```bash
git add src/lib/chrome-api.ts src/components/ChromeProvider.tsx src/lib/__tests__/test-chrome.ts
git commit -m "feat: ChromeApi boundary + ChromeProvider + fake test helper"
```

---

### Task 12: `hooks/useDebouncedValue.ts`

**Files:**

- Create: `src/hooks/useDebouncedValue.ts`
- Create: `src/hooks/__tests__/useDebouncedValue.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useDebouncedValue.test.ts`:

```ts
import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
  it("returns the initial value synchronously", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 100));
    expect(result.current).toBe("hello");
  });

  it("delays updates until the debounce window elapses", () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 100),
      { initialProps: { value: "a" } },
    );
    rerender({ value: "ab" });
    rerender({ value: "abc" });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(result.current).toBe("a");

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current).toBe("abc");
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- useDebouncedValue
```

- [ ] **Step 3: Implement `useDebouncedValue`**

Create `src/hooks/useDebouncedValue.ts`:

```ts
import { useEffect, useState } from "react";

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- useDebouncedValue
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useDebouncedValue.ts src/hooks/__tests__/useDebouncedValue.test.ts
git commit -m "feat(hooks): useDebouncedValue"
```

---

### Task 13: `hooks/useHistory.ts`

**Files:**

- Create: `src/hooks/useHistory.ts`
- Create: `src/hooks/__tests__/useHistory.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useHistory.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { useHistory } from "@/hooks/useHistory";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";

const visit = Date.UTC(2026, 3, 14, 10); // ms

function wrap(api: ReturnType<typeof createFakeChromeApi>) {
  return ({ children }: { children: ReactNode }) => (
    <ChromeProvider api={api}>{children}</ChromeProvider>
  );
}

describe("useHistory", () => {
  it("starts with loading=true and empty entries", () => {
    const api = createFakeChromeApi({ searchDelayMs: 20 });
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) });
    expect(result.current.loading).toBe(true);
    expect(result.current.entries).toEqual([]);
  });

  it("normalizes HistoryItem[] into HistoryEntry[]", async () => {
    const api = createFakeChromeApi({
      history: [
        {
          id: "1",
          url: "https://github.com/anthropics/claude-sdk",
          title: "anthropics/claude-sdk",
          lastVisitTime: visit,
          visitCount: 5,
          typedCount: 1,
        },
      ],
    });
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toHaveLength(1);
    const e = result.current.entries[0];
    expect(e.host).toBe("github.com");
    expect(e.hostLetter).toBe("G");
    expect(e.lastVisitTime).toBeInstanceOf(Date);
    expect(e.visitCount).toBe(5);
  });

  it("falls back to hostname when title is empty", async () => {
    const api = createFakeChromeApi({
      history: [
        {
          id: "2",
          url: "https://figma.com/file/x",
          title: "",
          lastVisitTime: visit,
          visitCount: 1,
        },
      ],
    });
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries[0].title).toBe("figma.com");
  });

  it("skips entries with no URL", async () => {
    const api = createFakeChromeApi({
      history: [
        { id: "3", url: undefined, lastVisitTime: visit, visitCount: 1 },
      ],
    });
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.entries).toEqual([]);
  });

  it("surfaces errors", async () => {
    const api = createFakeChromeApi();
    api.history.search = async () => {
      throw new Error("permission denied");
    };
    const { result } = renderHook(() => useHistory(30), { wrapper: wrap(api) });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("permission denied");
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- useHistory
```

- [ ] **Step 3: Implement `useHistory`**

Create `src/hooks/useHistory.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { useChromeApi } from "@/components/ChromeProvider";
import { parseHost, hostLetter, hostColor } from "@/lib/domain";
import type { HistoryEntry } from "@/lib/types";
import type { ChromeHistoryItem } from "@/lib/chrome-api";

const MS_PER_DAY = 86_400_000;

function normalize(item: ChromeHistoryItem): HistoryEntry | null {
  if (!item.url) return null;
  const host = parseHost(item.url);
  const title = item.title && item.title.trim() ? item.title : host || item.url;
  return {
    id: item.id,
    url: item.url,
    title,
    host,
    hostLetter: hostLetter(host),
    hostColor: hostColor(host),
    lastVisitTime: new Date(item.lastVisitTime ?? Date.now()),
    visitCount: item.visitCount ?? 0,
    typedCount: item.typedCount ?? 0,
  };
}

export interface UseHistoryResult {
  entries: HistoryEntry[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

export function useHistory(days: number): UseHistoryResult {
  const api = useChromeApi();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.history
      .search({
        text: "",
        startTime: Date.now() - days * MS_PER_DAY,
        maxResults: 10_000,
      })
      .then((items) => {
        if (cancelled) return;
        const normalized = items
          .map(normalize)
          .filter((e): e is HistoryEntry => e !== null)
          .sort(
            (a, b) => b.lastVisitTime.getTime() - a.lastVisitTime.getTime(),
          );
        setEntries(normalized);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e)));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, days, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { entries, loading, error, reload };
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- useHistory
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useHistory.ts src/hooks/__tests__/useHistory.test.tsx
git commit -m "feat(hooks): useHistory — fetch + normalize chrome.history.search"
```

---

### Task 14: `hooks/useVisits.ts`

**Files:**

- Create: `src/hooks/useVisits.ts`
- Create: `src/hooks/__tests__/useVisits.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/hooks/__tests__/useVisits.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- useVisits
```

- [ ] **Step 3: Implement `useVisits`**

Create `src/hooks/useVisits.ts`:

```ts
import { useEffect, useState } from "react";
import { useChromeApi } from "@/components/ChromeProvider";
import { promisePool } from "@/lib/promisePool";
import { countTransitions } from "@/lib/transitions";
import type { HistoryEntry, TransitionCounts } from "@/lib/types";

const MS_PER_DAY = 86_400_000;
const CONCURRENCY = 10;
const ZERO: TransitionCounts = {
  typed: 0,
  link: 0,
  reload: 0,
  form: 0,
  total: 0,
};

export interface UseVisitsResult {
  counts: TransitionCounts;
  loading: boolean;
}

export function useVisits(
  entries: readonly HistoryEntry[],
  days = 30,
  nowMs: number = Date.now(),
): UseVisitsResult {
  const api = useChromeApi();
  const [counts, setCounts] = useState<TransitionCounts>(ZERO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entries.length === 0) {
      setCounts(ZERO);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const urls = [...new Set(entries.map((e) => e.url))];
    const windowStart = nowMs - days * MS_PER_DAY;
    promisePool(urls, CONCURRENCY, async (url) => {
      const visits = await api.history.getVisits({ url });
      return visits
        .filter(
          (v) =>
            (v.visitTime ?? 0) >= windowStart && (v.visitTime ?? 0) <= nowMs,
        )
        .map((v) => v.transition);
    })
      .then((perUrl) => {
        if (cancelled) return;
        const flat = perUrl.flat();
        setCounts(countTransitions(flat));
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCounts(ZERO);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, entries, days, nowMs]);

  return { counts, loading };
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- useVisits
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useVisits.ts src/hooks/__tests__/useVisits.test.tsx
git commit -m "feat(hooks): useVisits — fan-out getVisits + bucket transitions"
```

---

## Phase 4 — Presentational components

> **Styling convention for all components below:** use Tailwind utility classes referencing our `@theme` tokens (`bg-bg-1`, `text-fg-0`, `border-line-0`, `text-amber`, `font-mono`, etc). Use `cn()` from `@/lib/utils` to combine classes. Component tests rely on Testing Library queries (`getByText`, `getByRole`) — avoid brittle class-name assertions.

### Task 15: `FavBadge` + `EmptyState` + `ListSkeleton`

**Files:**

- Create: `src/components/history/FavBadge.tsx`
- Create: `src/components/history/EmptyState.tsx`
- Create: `src/components/history/ListSkeleton.tsx`
- Create: `src/components/history/__tests__/FavBadge.test.tsx`

- [ ] **Step 1: Write failing tests for FavBadge**

Create `src/components/history/__tests__/FavBadge.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { FavBadge } from "@/components/history/FavBadge";

const renderWith = (
  ui: React.ReactNode,
  extId: string | null = "test-ext-id",
) =>
  render(
    <ChromeProvider api={createFakeChromeApi({ extensionId: extId })}>
      {ui}
    </ChromeProvider>,
  );

describe("FavBadge", () => {
  it("renders the host letter fallback", () => {
    renderWith(
      <FavBadge
        host="github.com"
        letter="G"
        color="oklch(0.7 0.1 200)"
        pageUrl="https://github.com/"
      />,
    );
    expect(screen.getByText("G")).toBeInTheDocument();
  });

  it("renders a favicon img when extension id is available", () => {
    renderWith(
      <FavBadge
        host="github.com"
        letter="G"
        color="oklch(0.7 0.1 200)"
        pageUrl="https://github.com/"
      />,
    );
    const img = screen.getByRole("img", { hidden: true });
    expect(img).toHaveAttribute(
      "src",
      expect.stringContaining(
        "chrome-extension://test-ext-id/_favicon/?pageUrl=",
      ),
    );
  });

  it("omits the favicon img when extension id is null", () => {
    renderWith(
      <FavBadge
        host="github.com"
        letter="G"
        color="oklch(0.7 0.1 200)"
        pageUrl="https://github.com/"
      />,
      null,
    );
    expect(screen.queryByRole("img", { hidden: true })).toBeNull();
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- FavBadge
```

- [ ] **Step 3: Implement `FavBadge`**

Create `src/components/history/FavBadge.tsx`:

```tsx
import { useState } from "react";
import { useChromeApi } from "@/components/ChromeProvider";
import { cn } from "@/lib/utils";

export interface FavBadgeProps {
  host: string;
  letter: string;
  color: string;
  pageUrl: string;
  size?: 14 | 16;
  className?: string;
}

export function FavBadge({
  host,
  letter,
  color,
  pageUrl,
  size = 16,
  className,
}: FavBadgeProps) {
  const { runtime } = useChromeApi();
  const extId = runtime.getExtensionId();
  const [failed, setFailed] = useState(false);
  const src =
    extId && !failed
      ? `chrome-extension://${extId}/_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=${size}`
      : null;

  return (
    <span
      aria-label={host}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded font-mono text-[10px] font-bold",
        className,
      )}
      style={{
        width: size,
        height: size,
        background: color,
        color: "oklch(0.2 0.02 260)",
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          width={size}
          height={size}
          className="rounded"
          onError={() => setFailed(true)}
        />
      ) : (
        letter
      )}
    </span>
  );
}
```

- [ ] **Step 4: Implement `EmptyState`**

Create `src/components/history/EmptyState.tsx`:

```tsx
export type EmptyStateVariant = "none" | "search";

export function EmptyState({
  variant,
  query,
}: {
  variant: EmptyStateVariant;
  query?: string;
}) {
  const message =
    variant === "search" && query
      ? `No history matches "${query}"`
      : "No browsing history in the last 30 days";
  return (
    <div className="flex items-center justify-center p-12 text-[13px] text-fg-3">
      {message}
    </div>
  );
}
```

- [ ] **Step 5: Implement `ListSkeleton`**

Create `src/components/history/ListSkeleton.tsx`:

```tsx
export function ListSkeleton() {
  return (
    <div className="space-y-px" aria-busy="true" aria-label="Loading history">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="grid h-[34px] animate-pulse grid-cols-[120px_1fr_340px_80px] items-center gap-4 px-4"
          style={{ opacity: 1 - i * 0.06 }}
        >
          <div className="h-3 w-16 rounded bg-bg-2" />
          <div className="h-3 w-48 rounded bg-bg-2" />
          <div className="h-3 w-64 rounded bg-bg-2" />
          <div className="ml-auto h-3 w-8 rounded bg-bg-2" />
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Verify all tests pass**

```bash
npm test
```

- [ ] **Step 7: Commit**

```bash
git add src/components/history/FavBadge.tsx src/components/history/EmptyState.tsx src/components/history/ListSkeleton.tsx src/components/history/__tests__/FavBadge.test.tsx
git commit -m "feat(ui): FavBadge, EmptyState, ListSkeleton"
```

---

### Task 16: `HistoryRow` + `DayGroup`

**Files:**

- Create: `src/components/history/HistoryRow.tsx`
- Create: `src/components/history/DayGroup.tsx`
- Create: `src/components/history/__tests__/HistoryRow.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/history/__tests__/HistoryRow.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { HistoryRow } from "@/components/history/HistoryRow";
import type { HistoryEntry } from "@/lib/types";

const entry: HistoryEntry = {
  id: "1",
  url: "https://github.com/anthropics/claude-sdk",
  title: "anthropics/claude-sdk",
  host: "github.com",
  hostLetter: "G",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: new Date(2026, 3, 14, 9, 30, 5),
  visitCount: 2,
  typedCount: 0,
};

const renderRow = (e: HistoryEntry) =>
  render(
    <ChromeProvider api={createFakeChromeApi()}>
      <HistoryRow entry={e} />
    </ChromeProvider>,
  );

describe("HistoryRow", () => {
  it("renders time, title, url, and view count", () => {
    renderRow(entry);
    expect(screen.getByText("09:30:05")).toBeInTheDocument();
    expect(screen.getByText("anthropics/claude-sdk")).toBeInTheDocument();
    expect(screen.getByText(/github\.com/)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it('applies the "hot" badge variant when visitCount >= 3', () => {
    const hot = { ...entry, visitCount: 4 };
    const { container } = renderRow(hot);
    const badge = container.querySelector('[data-hot="true"]');
    expect(badge).not.toBeNull();
  });

  it("applies the normal badge variant when visitCount < 3", () => {
    const { container } = renderRow(entry);
    const badge = container.querySelector('[data-hot="false"]');
    expect(badge).not.toBeNull();
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- HistoryRow
```

- [ ] **Step 3: Implement `HistoryRow`**

Create `src/components/history/HistoryRow.tsx`:

```tsx
import { FavBadge } from "./FavBadge";
import { formatTime } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HistoryEntry } from "@/lib/types";

const MAX_URL = 56;
function truncate(url: string): string {
  return url.length <= MAX_URL ? url : url.slice(0, MAX_URL - 1) + "…";
}

export function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const hot = entry.visitCount >= 3;
  return (
    <div
      className={cn(
        "grid h-[34px] grid-cols-[120px_1fr_340px_80px] items-center gap-0 border-b border-transparent px-4 text-[13px] text-fg-1",
        "hover:bg-bg-hover",
      )}
    >
      <div className="font-mono tabular text-[12px] tracking-[0.3px] text-fg-2">
        {formatTime(entry.lastVisitTime)}
      </div>
      <div className="flex min-w-0 items-center gap-[10px]">
        <FavBadge
          host={entry.host}
          letter={entry.hostLetter}
          color={entry.hostColor}
          pageUrl={entry.url}
        />
        <span className="truncate text-[13px] text-fg-0">{entry.title}</span>
      </div>
      <div className="truncate font-mono tabular text-[12px] text-fg-3">
        {truncate(entry.url)}
      </div>
      <div className="text-right font-mono tabular text-[12px] text-fg-2">
        <span
          data-hot={hot}
          className={cn(
            "inline-block min-w-[22px] rounded bg-bg-3 px-[6px] py-[2px] text-center font-medium",
            hot ? "text-amber" : "text-fg-1",
          )}
          style={hot ? { background: "var(--color-hot-bg)" } : undefined}
        >
          {entry.visitCount}
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement `DayGroup`**

Create `src/components/history/DayGroup.tsx`:

```tsx
import { HistoryRow } from "./HistoryRow";
import { formatDateLong } from "@/lib/date";
import type { DayGroup as DayGroupT } from "@/lib/types";

export function DayGroup({ group }: { group: DayGroupT }) {
  return (
    <div className="border-b border-line-0">
      <div className="sticky top-0 z-[2] grid grid-cols-[1fr_80px] items-center border-b border-line-0 bg-bg-1 px-4 pt-[10px] pb-[8px]">
        <div className="text-[13px] font-semibold tracking-[0.1px] text-fg-0">
          {formatDateLong(group.date)}
        </div>
        <div className="text-right font-mono text-[11px] text-fg-2">
          views{" "}
          <b className="ml-1 font-semibold text-fg-0">{group.totalViews}</b>
        </div>
      </div>
      {group.entries.map((e) => (
        <HistoryRow key={e.id} entry={e} />
      ))}
    </div>
  );
}
```

- [ ] **Step 5: Verify tests pass**

```bash
npm test -- HistoryRow
```

- [ ] **Step 6: Commit**

```bash
git add src/components/history/HistoryRow.tsx src/components/history/DayGroup.tsx src/components/history/__tests__/HistoryRow.test.tsx
git commit -m "feat(ui): HistoryRow + DayGroup"
```

---

### Task 17: `HistoryList`

**Files:**

- Create: `src/components/history/HistoryList.tsx`
- Create: `src/components/history/__tests__/HistoryList.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/history/__tests__/HistoryList.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChromeProvider } from "@/components/ChromeProvider";
import { createFakeChromeApi } from "@/lib/__tests__/test-chrome";
import { HistoryList } from "@/components/history/HistoryList";
import type { HistoryEntry } from "@/lib/types";

const e = (id: string, date: Date, title = id): HistoryEntry => ({
  id,
  url: `https://a.com/${id}`,
  title,
  host: "a.com",
  hostLetter: "A",
  hostColor: "oklch(0.7 0.1 200)",
  lastVisitTime: date,
  visitCount: 1,
  typedCount: 0,
});

const wrap = (ui: React.ReactNode) =>
  render(<ChromeProvider api={createFakeChromeApi()}>{ui}</ChromeProvider>);

describe("HistoryList", () => {
  it("renders a loading skeleton when loading and no entries", () => {
    wrap(<HistoryList entries={[]} loading query="" />);
    expect(screen.getByLabelText("Loading history")).toBeInTheDocument();
  });

  it('renders the "no history" empty state', () => {
    wrap(<HistoryList entries={[]} loading={false} query="" />);
    expect(screen.getByText(/No browsing history/)).toBeInTheDocument();
  });

  it('renders the "no matches" empty state', () => {
    wrap(<HistoryList entries={[]} loading={false} query="xyz" />);
    expect(screen.getByText(/No history matches "xyz"/)).toBeInTheDocument();
  });

  it("groups entries by day, descending", () => {
    const items = [
      e("a", new Date(2026, 3, 14, 10)),
      e("b", new Date(2026, 3, 14, 9)),
      e("c", new Date(2026, 3, 13, 15)),
    ];
    const { container } = wrap(
      <HistoryList entries={items} loading={false} query="" />,
    );
    const dayHeaders = container.querySelectorAll("div.sticky");
    expect(dayHeaders).toHaveLength(2);
    expect(dayHeaders[0].textContent).toMatch(/April 14, 2026/);
    expect(dayHeaders[1].textContent).toMatch(/April 13, 2026/);
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- HistoryList
```

- [ ] **Step 3: Implement `HistoryList`**

Create `src/components/history/HistoryList.tsx`:

```tsx
import { useMemo } from "react";
import { DayGroup } from "./DayGroup";
import { EmptyState } from "./EmptyState";
import { ListSkeleton } from "./ListSkeleton";
import { groupByDay } from "@/lib/date";
import type { HistoryEntry } from "@/lib/types";

export interface HistoryListProps {
  entries: readonly HistoryEntry[];
  loading: boolean;
  query: string;
}

export function HistoryList({ entries, loading, query }: HistoryListProps) {
  const groups = useMemo(() => groupByDay(entries), [entries]);

  if (loading && entries.length === 0) return <ListSkeleton />;
  if (entries.length === 0 && query)
    return <EmptyState variant="search" query={query} />;
  if (entries.length === 0) return <EmptyState variant="none" />;
  return (
    <div>
      {groups.map((g) => (
        <DayGroup key={g.date.toISOString()} group={g} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- HistoryList
```

- [ ] **Step 5: Commit**

```bash
git add src/components/history/HistoryList.tsx src/components/history/__tests__/HistoryList.test.tsx
git commit -m "feat(ui): HistoryList with loading/empty/filtered states"
```

---

### Task 18: `ColumnHeader` + `SearchInput` + `ViewSegment`

**Files:**

- Create: `src/components/history/ColumnHeader.tsx`
- Create: `src/components/history/SearchInput.tsx`
- Create: `src/components/history/ViewSegment.tsx`
- Create: `src/components/history/__tests__/ViewSegment.test.tsx`
- Create: `src/components/history/__tests__/SearchInput.test.tsx`

- [ ] **Step 1: Write failing tests for SearchInput**

Create `src/components/history/__tests__/SearchInput.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchInput } from "@/components/history/SearchInput";

describe("SearchInput", () => {
  it("renders with placeholder", () => {
    render(<SearchInput value="" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search history")).toBeInTheDocument();
  });

  it("calls onChange for every keystroke", async () => {
    const onChange = vi.fn();
    render(<SearchInput value="" onChange={onChange} />);
    await userEvent.type(screen.getByRole("searchbox"), "abc");
    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenLastCalledWith("c"); // uncontrolled from parent's POV each keystroke
  });
});
```

- [ ] **Step 2: Write failing tests for ViewSegment**

Create `src/components/history/__tests__/ViewSegment.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ViewSegment } from "@/components/history/ViewSegment";
import { TooltipProvider } from "@/components/ui/tooltip";

const renderSeg = (
  value: "list" | "day" | "week" | "month",
  onChange = () => {},
) =>
  render(
    <TooltipProvider>
      <ViewSegment value={value} onChange={onChange} />
    </TooltipProvider>,
  );

describe("ViewSegment", () => {
  it("renders all four options", () => {
    renderSeg("list");
    expect(screen.getByRole("radio", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Day" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Week" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Month" })).toBeInTheDocument();
  });

  it("disables Day/Week/Month options", () => {
    renderSeg("list");
    expect(screen.getByRole("radio", { name: "Day" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Week" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "Month" })).toBeDisabled();
    expect(screen.getByRole("radio", { name: "List" })).not.toBeDisabled();
  });

  it("does not fire onChange when a disabled option is clicked", async () => {
    const onChange = vi.fn();
    renderSeg("list", onChange);
    await userEvent.click(screen.getByRole("radio", { name: "Week" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Verify tests fail**

```bash
npm test -- SearchInput ViewSegment
```

- [ ] **Step 4: Implement `SearchInput`**

Create `src/components/history/SearchInput.tsx`:

```tsx
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps {
  value: string;
  onChange: (next: string) => void;
  className?: string;
}

export function SearchInput({ value, onChange, className }: SearchInputProps) {
  return (
    <div className={cn("relative w-[220px] max-w-[32vw]", className)}>
      <Search
        aria-hidden
        size={14}
        className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-fg-3"
      />
      <input
        type="search"
        role="searchbox"
        placeholder="Search history"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-7 w-full rounded-lg border border-line-0 bg-bg-2 py-0 pl-7 pr-2 text-[13px] text-fg-0 outline-none transition-colors",
          "placeholder:text-fg-3 focus:border-amber focus:bg-bg-1",
        )}
      />
    </div>
  );
}
```

- [ ] **Step 5: Implement `ViewSegment`**

Create `src/components/history/ViewSegment.tsx`:

```tsx
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type ViewId = "list" | "day" | "week" | "month";

interface Option {
  id: ViewId;
  label: string;
  disabled: boolean;
}

const OPTIONS: Option[] = [
  { id: "list", label: "List", disabled: false },
  { id: "day", label: "Day", disabled: true },
  { id: "week", label: "Week", disabled: true },
  { id: "month", label: "Month", disabled: true },
];

export function ViewSegment({
  value,
  onChange,
}: {
  value: ViewId;
  onChange: (next: ViewId) => void;
}) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => {
        if (v && OPTIONS.find((o) => o.id === v && !o.disabled))
          onChange(v as ViewId);
      }}
      className="inline-flex gap-[2px] rounded-[10px] border border-line-0 bg-bg-2 p-[3px]"
    >
      {OPTIONS.map((opt) => {
        const item = (
          <ToggleGroupItem
            key={opt.id}
            value={opt.id}
            aria-label={opt.label}
            disabled={opt.disabled}
            className={cn(
              "h-[22px] rounded-[7px] px-3 text-[12px] font-medium text-fg-2 transition-colors",
              "hover:text-fg-0",
              "data-[state=on]:bg-amber data-[state=on]:text-[oklch(0.2_0.02_75)]",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {opt.label}
          </ToggleGroupItem>
        );
        if (!opt.disabled) return item;
        return (
          <Tooltip key={opt.id}>
            <TooltipTrigger asChild>
              <span>{item}</span>
            </TooltipTrigger>
            <TooltipContent>Coming soon</TooltipContent>
          </Tooltip>
        );
      })}
    </ToggleGroup>
  );
}
```

- [ ] **Step 6: Implement `ColumnHeader`**

Create `src/components/history/ColumnHeader.tsx`:

```tsx
import { ChevronDown } from "lucide-react";

export function ColumnHeader() {
  return (
    <div className="grid h-8 grid-cols-[120px_1fr_340px_80px] items-center border-b border-line-0 bg-bg-1 px-4 text-[11px] font-medium uppercase tracking-[0.6px] text-fg-3">
      <div className="flex items-center gap-[6px]">
        Date <ChevronDown size={10} strokeWidth={1.2} />
      </div>
      <div>Title</div>
      <div>Address</div>
      <div className="text-right">Views</div>
    </div>
  );
}
```

- [ ] **Step 7: Verify tests pass**

```bash
npm test
```

- [ ] **Step 8: Commit**

```bash
git add src/components/history/SearchInput.tsx src/components/history/ViewSegment.tsx src/components/history/ColumnHeader.tsx src/components/history/__tests__/
git commit -m "feat(ui): SearchInput + ViewSegment + ColumnHeader"
```

---

### Task 19: `Topbar`

**Files:**

- Create: `src/components/history/Topbar.tsx`

- [ ] **Step 1: Implement `Topbar`**

Create `src/components/history/Topbar.tsx`:

```tsx
import {
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Info,
  Calendar,
  Sliders,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "./SearchInput";
import { ViewSegment, type ViewId } from "./ViewSegment";

export interface TopbarProps {
  query: string;
  onQueryChange: (next: string) => void;
  view: ViewId;
  onViewChange: (next: ViewId) => void;
  rangeLabel: string;
}

export function Topbar({
  query,
  onQueryChange,
  view,
  onViewChange,
  rangeLabel,
}: TopbarProps) {
  return (
    <header className="grid h-12 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line-0 bg-[linear-gradient(180deg,var(--color-bg-1),var(--color-bg-0))] px-[14px]">
      <div className="flex items-center gap-[10px]">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Menu"
        >
          <LayoutGrid size={16} strokeWidth={1.5} />
        </Button>
        <SearchInput value={query} onChange={onQueryChange} />
      </div>

      <div className="flex items-center gap-[10px] font-mono text-[13px] tracking-[0.2px] text-fg-0">
        {rangeLabel}
      </div>

      <div className="flex items-center justify-end gap-[10px]">
        <button
          type="button"
          className="flex h-[26px] items-center gap-[6px] rounded-full border border-line-0 bg-bg-2 px-3 text-[12px] font-medium text-fg-1 hover:bg-bg-hover hover:text-fg-0"
        >
          <Calendar size={12} strokeWidth={1.5} />
          Today
        </button>
        <div className="inline-flex gap-[2px]">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Previous"
          >
            <ChevronLeft size={14} strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Next"
          >
            <ChevronRight size={14} strokeWidth={1.5} />
          </Button>
        </div>
        <ViewSegment value={view} onChange={onViewChange} />
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Tweaks"
          disabled
        >
          <Sliders size={14} strokeWidth={1.5} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Info"
          disabled
        >
          <Info size={14} strokeWidth={1.5} />
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/history/Topbar.tsx
git commit -m "feat(ui): Topbar composition"
```

---

### Task 20: `ActivityChart`

**Files:**

- Create: `src/components/history/ActivityChart.tsx`
- Create: `src/components/history/__tests__/ActivityChart.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/history/__tests__/ActivityChart.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ActivityChart } from "@/components/history/ActivityChart";
import type { ActivityBucket } from "@/lib/types";

const bucket = (
  label: string,
  views: number,
  pages: number,
): ActivityBucket => ({
  date: new Date(2026, 3, 14),
  label,
  views,
  pages,
});

describe("ActivityChart", () => {
  it("shows the total views and pages in the legend", () => {
    const buckets = [bucket("Apr 13", 5, 2), bucket("Apr 14", 10, 3)];
    render(<ActivityChart buckets={buckets} />);
    expect(screen.getByText(/Page Views:/)).toBeInTheDocument();
    expect(screen.getByText("15")).toBeInTheDocument(); // total views
    expect(screen.getByText(/Pages:/)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument(); // total pages
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- ActivityChart
```

- [ ] **Step 3: Implement `ActivityChart`**

Create `src/components/history/ActivityChart.tsx`:

```tsx
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ActivityBucket } from "@/lib/types";

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { dataKey: string; value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const views = payload.find((p) => p.dataKey === "views")?.value ?? 0;
  const pages = payload.find((p) => p.dataKey === "pages")?.value ?? 0;
  return (
    <div className="rounded-md border border-line-1 bg-bg-3 px-2 py-[6px] font-mono text-[11px] text-fg-0 shadow-md">
      {label} · views {views} · pages {pages}
    </div>
  );
}

export function ActivityChart({ buckets }: { buckets: ActivityBucket[] }) {
  const totalViews = buckets.reduce((s, b) => s + b.views, 0);
  const totalPages = buckets.reduce((s, b) => s + b.pages, 0);

  return (
    <div>
      <div className="h-[130px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={buckets}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
            barCategoryGap={4}
            barGap={2}
          >
            <CartesianGrid
              vertical={false}
              stroke="var(--color-line-0)"
              strokeDasharray="2 3"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              interval={1}
              tick={{
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                fill: "var(--color-fg-2)",
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={28}
              tick={{
                fontSize: 9,
                fontFamily: "var(--font-mono)",
                fill: "var(--color-fg-2)",
              }}
            />
            <Tooltip
              cursor={{ fill: "var(--color-bg-hover)" }}
              content={<ChartTooltip />}
            />
            <Bar
              dataKey="views"
              fill="var(--color-amber)"
              radius={[1, 1, 0, 0]}
            />
            <Bar
              dataKey="pages"
              fill="var(--color-cyan)"
              radius={[1, 1, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-[10px] flex flex-wrap gap-[10px_14px]">
        <span className="inline-flex items-center gap-[6px] text-[11px] text-fg-2">
          <span className="h-[10px] w-[10px] rounded-[2px] bg-amber" />
          Page Views:{" "}
          <b className="ml-[2px] font-mono font-medium text-fg-0">
            {totalViews}
          </b>
        </span>
        <span className="inline-flex items-center gap-[6px] text-[11px] text-fg-2">
          <span className="h-[10px] w-[10px] rounded-[2px] bg-cyan" />
          Pages:{" "}
          <b className="ml-[2px] font-mono font-medium text-fg-0">
            {totalPages}
          </b>
        </span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify tests pass**

Recharts uses `ResponsiveContainer` which needs a parent height in jsdom. Our test wraps the chart directly and relies on the outer `div.h-[130px]` — but jsdom gives zero-height containers, so Recharts may not render SVG children. The test only checks the legend totals (rendered outside Recharts), so it should pass.

```bash
npm test -- ActivityChart
```

Expected: passes. If Recharts logs a width warning, that's fine — it's not a test failure.

- [ ] **Step 5: Commit**

```bash
git add src/components/history/ActivityChart.tsx src/components/history/__tests__/ActivityChart.test.tsx
git commit -m "feat(ui): ActivityChart (Recharts dual-bar)"
```

---

### Task 21: `TransitionDonut`

**Files:**

- Create: `src/components/history/TransitionDonut.tsx`
- Create: `src/components/history/__tests__/TransitionDonut.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/history/__tests__/TransitionDonut.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TransitionDonut } from "@/components/history/TransitionDonut";

describe("TransitionDonut", () => {
  it("renders each label + its count in the legend", () => {
    render(
      <TransitionDonut
        counts={{ typed: 3, link: 10, reload: 1, form: 2, total: 16 }}
      />,
    );
    expect(screen.getByText("Typed")).toBeInTheDocument();
    expect(screen.getByText("Link")).toBeInTheDocument();
    expect(screen.getByText("Reload")).toBeInTheDocument();
    expect(screen.getByText("Form")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("renders the total in the center", () => {
    render(
      <TransitionDonut
        counts={{ typed: 3, link: 10, reload: 1, form: 2, total: 16 }}
      />,
    );
    expect(screen.getByText("16")).toBeInTheDocument();
    expect(screen.getByText("TOTAL")).toBeInTheDocument();
  });

  it("renders a zero-state when total is 0", () => {
    render(
      <TransitionDonut
        counts={{ typed: 0, link: 0, reload: 0, form: 0, total: 0 }}
      />,
    );
    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- TransitionDonut
```

- [ ] **Step 3: Implement `TransitionDonut`**

Create `src/components/history/TransitionDonut.tsx`:

```tsx
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { TransitionCounts } from "@/lib/types";

const SLICES = [
  { key: "typed", label: "Typed", color: "var(--color-violet)" },
  { key: "link", label: "Link", color: "var(--color-coral)" },
  { key: "reload", label: "Reload", color: "var(--color-amber)" },
  { key: "form", label: "Form", color: "var(--color-cyan)" },
] as const;

export function TransitionDonut({ counts }: { counts: TransitionCounts }) {
  const data = SLICES.map((s) => ({ ...s, val: counts[s.key] }));
  const hasData = counts.total > 0;
  const pieData = hasData ? data : [{ ...data[0], val: 1 }]; // a thin placeholder ring

  return (
    <div className="grid grid-cols-[160px_1fr] items-center gap-3">
      <div className="relative h-[150px] w-[160px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="val"
              innerRadius={38}
              outerRadius={55}
              startAngle={90}
              endAngle={-270}
              stroke="var(--color-bg-0)"
              strokeWidth={1.5}
              isAnimationActive={false}
            >
              {pieData.map((d, i) => (
                <Cell key={i} fill={hasData ? d.color : "var(--color-bg-2)"} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-[18px] font-semibold text-fg-0">
            {counts.total}
          </div>
          <div className="font-mono text-[9px] tracking-[1px] text-fg-2">
            TOTAL
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        {data.map((d) => (
          <div
            key={d.key}
            className="grid grid-cols-[10px_1fr_auto] items-center gap-2 text-[11px]"
          >
            <span
              className="h-[10px] w-[10px] rounded-[2px]"
              style={{ background: d.color }}
            />
            <span className="text-fg-1">{d.label}</span>
            <span className="font-mono text-[10px] text-fg-2">{d.val}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- TransitionDonut
```

- [ ] **Step 5: Commit**

```bash
git add src/components/history/TransitionDonut.tsx src/components/history/__tests__/TransitionDonut.test.tsx
git commit -m "feat(ui): TransitionDonut (Recharts PieChart + custom legend)"
```

---

### Task 22: `TopDomains`

**Files:**

- Create: `src/components/history/TopDomains.tsx`
- Create: `src/components/history/__tests__/TopDomains.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/history/__tests__/TopDomains.test.tsx`:

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TopDomains } from "@/components/history/TopDomains";
import type { TopDomain } from "@/lib/types";

const d = (host: string, count: number): TopDomain => ({
  host,
  letter: host[0].toUpperCase(),
  color: "oklch(0.7 0.1 200)",
  count,
});

describe("TopDomains", () => {
  it("lists each host with its count", () => {
    render(
      <TopDomains
        list={[d("github.com", 12), d("figma.com", 5)]}
        totalDomains={2}
      />,
    );
    expect(screen.getByText("github.com")).toBeInTheDocument();
    expect(screen.getByText("figma.com")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows the total-of-N label", () => {
    render(<TopDomains list={[d("a.com", 1)]} totalDomains={8} />);
    expect(screen.getByText(/of 8 Total/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Verify tests fail**

```bash
npm test -- TopDomains
```

- [ ] **Step 3: Implement `TopDomains`**

Create `src/components/history/TopDomains.tsx`:

```tsx
import type { TopDomain } from "@/lib/types";

export function TopDomains({
  list,
  totalDomains,
}: {
  list: TopDomain[];
  totalDomains: number;
}) {
  return (
    <section>
      <h3 className="mb-3 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
        Top Domains{" "}
        <span className="font-normal text-fg-3">of {totalDomains} Total</span>
      </h3>
      <div>
        {list.map((d) => (
          <div
            key={d.host}
            className="grid h-[30px] grid-cols-[16px_1fr_auto] items-center gap-[10px] border-b border-dashed border-line-0 text-[12px] text-fg-1 last:border-b-0"
          >
            <span
              className="inline-flex h-[14px] w-[14px] items-center justify-center rounded font-mono text-[9px] font-bold"
              style={{ background: d.color, color: "oklch(0.2 0.02 260)" }}
            >
              {d.letter}
            </span>
            <span className="truncate font-mono text-[12px] text-fg-1">
              {d.host}
            </span>
            <span className="min-w-[24px] rounded bg-bg-2 px-[6px] py-[2px] text-center font-mono text-[11px] text-fg-2">
              {d.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- TopDomains
```

- [ ] **Step 5: Commit**

```bash
git add src/components/history/TopDomains.tsx src/components/history/__tests__/TopDomains.test.tsx
git commit -m "feat(ui): TopDomains list"
```

---

### Task 23: `Sidebar`

**Files:**

- Create: `src/components/history/Sidebar.tsx`

- [ ] **Step 1: Implement `Sidebar`**

Create `src/components/history/Sidebar.tsx`:

```tsx
import { ActivityChart } from "./ActivityChart";
import { TransitionDonut } from "./TransitionDonut";
import { TopDomains } from "./TopDomains";
import type { ActivityBucket, TopDomain, TransitionCounts } from "@/lib/types";

export interface SidebarProps {
  rangeLabel: string;
  buckets: ActivityBucket[];
  transitions: TransitionCounts;
  domains: TopDomain[];
  totalDomains: number;
}

export function Sidebar({
  rangeLabel,
  buckets,
  transitions,
  domains,
  totalDomains,
}: SidebarProps) {
  return (
    <aside className="scroll-track flex flex-col gap-6 overflow-y-auto bg-bg-0 px-[18px] pb-6 pt-4">
      <div className="mb-[2px] font-mono text-[13px] font-medium tracking-[0.2px] text-fg-0">
        {rangeLabel}
      </div>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
          Browsing Activity
        </h3>
        <ActivityChart buckets={buckets} />
      </section>

      <section>
        <h3 className="mb-3 text-[13px] font-semibold tracking-[0.1px] text-fg-0">
          Link Transition Type
        </h3>
        <TransitionDonut counts={transitions} />
      </section>

      <TopDomains list={domains} totalDomains={totalDomains} />
    </aside>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Commit**

```bash
git add src/components/history/Sidebar.tsx
git commit -m "feat(ui): Sidebar composition"
```

---

## Phase 5 — Assembly + verification

### Task 24: Wire `App.tsx` + `main.tsx` + empty `background.ts`

**Files:**

- Modify: `src/App.tsx` (full rewrite)
- Modify: `src/main.tsx`
- Modify: `src/background.ts` (make it a valid ES module)
- Delete: `src/App.css` (unused after rewrite)

- [ ] **Step 1: Rewrite `src/App.tsx`**

Overwrite `src/App.tsx` with:

```tsx
import { useMemo, useState } from "react";
import { Topbar } from "@/components/history/Topbar";
import { ColumnHeader } from "@/components/history/ColumnHeader";
import { HistoryList } from "@/components/history/HistoryList";
import { Sidebar } from "@/components/history/Sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useHistory } from "@/hooks/useHistory";
import { useVisits } from "@/hooks/useVisits";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { bucketByDay, formatShortDate, startOfToday } from "@/lib/date";
import { filterEntries } from "@/lib/search";
import { topDomains } from "@/lib/topDomains";
import type { ViewId } from "@/components/history/ViewSegment";

const DAYS = 30;

export default function App() {
  const { entries, loading } = useHistory(DAYS);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewId>("list");
  const debouncedQuery = useDebouncedValue(query, 150);
  const filtered = useMemo(
    () => filterEntries(entries, debouncedQuery),
    [entries, debouncedQuery],
  );
  const { counts: transitions } = useVisits(entries, DAYS);

  const buckets = useMemo(() => bucketByDay(filtered, 12), [filtered]);
  const { list: domains, totalDomains } = useMemo(
    () => topDomains(filtered, 6),
    [filtered],
  );

  const rangeLabel = useMemo(() => {
    const end = startOfToday();
    const start = new Date(end);
    start.setDate(end.getDate() - (DAYS - 1));
    return `${formatShortDate(start)} – ${formatShortDate(end)}`;
  }, []);

  return (
    <TooltipProvider delayDuration={150}>
      <div className="grid h-screen w-screen grid-rows-[48px_1fr]">
        <Topbar
          query={query}
          onQueryChange={setQuery}
          view={view}
          onViewChange={setView}
          rangeLabel={rangeLabel}
        />
        <div className="grid min-h-0 grid-cols-[1fr_340px]">
          <section className="grid min-h-0 grid-rows-[32px_1fr] border-r border-line-0 bg-bg-0">
            <ColumnHeader />
            <div className="scroll-track overflow-y-auto overflow-x-hidden">
              <HistoryList
                entries={filtered}
                loading={loading}
                query={debouncedQuery}
              />
            </div>
          </section>
          <Sidebar
            rangeLabel={rangeLabel}
            buckets={buckets}
            transitions={transitions}
            domains={domains}
            totalDomains={totalDomains}
          />
        </div>
      </div>
    </TooltipProvider>
  );
}
```

- [ ] **Step 2: Rewrite `src/main.tsx`**

Overwrite `src/main.tsx` with:

```tsx
import "@fontsource-variable/inter";
import "@fontsource-variable/jetbrains-mono";
import "./index.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { ChromeProvider } from "@/components/ChromeProvider";
import { realChromeApi } from "@/lib/chrome-api";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ChromeProvider api={realChromeApi}>
      <App />
    </ChromeProvider>
  </StrictMode>,
);
```

- [ ] **Step 3: Make `background.ts` a valid module**

Overwrite `src/background.ts` with:

```ts
export {};
```

- [ ] **Step 4: Delete unused `App.css`**

```bash
rm src/App.css
```

- [ ] **Step 5: Full typecheck + test + build**

```bash
npm run typecheck && npm test && npm run build
```

Expected: all three exit 0. Fix any type errors inline before committing. If `build` warns about chunk size for Recharts, that's expected — ignore.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/main.tsx src/background.ts
git rm src/App.css
git commit -m "feat: wire App shell + ChromeProvider; empty background service worker"
```

---

### Task 25: Lint + format + final verification

**Files:** none (verification only)

- [ ] **Step 1: Lint clean**

```bash
npm run lint
```

Expected: exit code 0. If any complaints appear, run `npm run lint:fix` and inspect remaining manual fixes.

- [ ] **Step 2: Format clean**

```bash
npm run format
```

Then:

```bash
npm run format:check
```

Expected: exit code 0.

- [ ] **Step 3: Commit formatting changes, if any**

```bash
git status
```

If the working tree is dirty from `npm run format`:

```bash
git add -A
git commit -m "style: prettier format pass"
```

If clean, skip.

- [ ] **Step 4: Load the extension and verify the override**

Run:

```bash
npm run build
```

Then in Chrome:

1. Navigate to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**, select the `dist/` folder
4. Open a new tab, press `Ctrl+H` (Windows/Linux) or `Cmd+Y` (Mac)

Expected: the custom dashboard loads _instead_ of Chrome's default history page. The topbar shows the date range, List is the active view, and the sidebar populates within a few seconds.

- [ ] **Step 5: Manual verification checklist**

Walk through each item and check it off:

- [ ] Page opens at `chrome://history` (not anywhere else) and shows our dashboard
- [ ] Real browsing history renders as day-grouped rows
- [ ] Day headers show `views <N>` totals that match row counts
- [ ] Search input filters the list within ~150ms of stopping typing
- [ ] Typing a nonsense query shows the "No history matches …" empty state
- [ ] Clearing the query restores the list
- [ ] Sidebar Activity chart shows 12 day-buckets with amber + cyan bars
- [ ] Hovering an Activity bar shows a tooltip with `<label> · views X · pages Y`
- [ ] Transition donut renders 4 slices (Typed/Link/Reload/Form) with the total in the center
- [ ] Top Domains shows up to 6 domains, and "of N Total" reflects the true count
- [ ] Favicon tiles render either the site's real favicon or the colored letter fallback
- [ ] Hovering a disabled view segment (Day/Week/Month) shows "Coming soon"
- [ ] Sidebar analytics update when a search query filters the list

If any item fails, open a follow-up GitHub issue describing the observed vs expected behavior before moving on. Do **not** silently fix — capture the bug.

- [ ] **Step 6: Final commit and stop**

If everything passes and no formatting changes remain:

```bash
git log --oneline -20
```

Review the commit history — it should tell a clean story from setup → utilities → hooks → components → assembly → verification. No further commits required unless fixing bugs found in Step 5.

---

## Self-review notes (author)

- **Spec coverage check:** Every in-scope item from `docs/superpowers/specs/2026-04-19-history-dashboard-design.md` §2 maps to at least one task. Topbar → Task 19; List view → Tasks 15–17; Sidebar charts → Tasks 20–23; Column header + search + view segment → Task 18; loading/empty states → Task 15, 17; `chrome.history` data flow → Tasks 11–14; tokens → Task 3; fonts → Tasks 1, 4; shadcn additions → Task 2; background → Task 24.
- **Out-of-scope guardrails:** Day/Week/Month tabs are disabled (Task 18); date-range picker omitted (range label is derived and static); settings panel omitted; sortable headers omitted (ColumnHeader has a visual chevron only).
- **Type consistency:** `HistoryEntry`, `TransitionBucket`, `TransitionCounts`, `ActivityBucket`, `DayGroup`, `TopDomain` are defined once in `lib/types.ts` and referenced consistently in `lib/*`, hooks, and components.
- **Test strategy:** Pure `lib/` functions have TDD unit tests. Hooks have tests that inject a fake `ChromeApi` via the context boundary — no `globalThis.chrome` monkey-patching. Presentational components without state branches (FavBadge, EmptyState, ListSkeleton) have only the minimum smoke tests where behavior is non-trivial; purely visual components (ColumnHeader, Topbar, Sidebar, ActivityChart's SVG body, TransitionDonut's SVG body) rely on the manual verification checklist in Task 25 rather than brittle Recharts DOM assertions.
