# History Dashboard — Design Spec (Slice B)

Status: **approved, ready for implementation planning**
Date: 2026-04-19
Branch: master

## 1. Context

A Manifest V3 Chrome extension that overrides `chrome://history` with a dark-mode React dashboard inspired by Vivaldi's history UI. Design source: `History Extension-handoff/history-extension/project/History Dashboard.html` (hand-built HTML/CSS/JS prototype). Project overview: NotebookLM → "Chrome History Extension" → "Project Overview" source.

The project was scaffolded (React 19 + TS, Vite 8, `@crxjs/vite-plugin`, Tailwind v4, shadcn/ui, one shadcn Button installed) but no history-specific components exist yet.

## 2. Scope — "Slice B" vertical slice

Ship the path a user sees every time they hit `Ctrl+H`: the List view plus full sidebar analytics, wired to real `chrome.history` data. Day/Week/Month views and supporting settings ship in a later slice.

### In scope

- Full-page override of `chrome://history` via `chrome_url_overrides` (already in `manifest.json`)
- App shell: 48px topbar row + main `1fr | 340px` two-column grid, 100vh, `overflow: hidden`
- **Topbar:**
  - Menu icon button (visual only, no behavior this slice)
  - Search input, debounced 150ms
  - Centered date-range label (locked to last 30 days: `<M/D/YYYY> – <M/D/YYYY>`)
  - "Today" chip (visual only — returning to "today" is a no-op while range is locked)
  - Prev/Next arrow buttons (visual only)
  - View segment: **List** (active), **Day / Week / Month** disabled with "Coming soon" tooltip
  - Info icon button (visual only)
- **Column header row** (32px): Date | Title | Address | Views — sort affordance on hover but sorting not wired
- **List view:**
  - Real `chrome.history.search` data, last 30 days, `maxResults: 10_000`
  - Day-grouped rows with sticky day headers showing `views <N>` total
  - Row: `time | fav-letter-tile + title | url | views badge` on a 4-column grid (`120px 1fr 340px 80px`)
  - Views badge turns amber ("hot") at ≥3 views
  - Favicon-letter tile is a colored rounded square with host's first letter, color derived from a seeded hash of the hostname
  - Search filters in memory across `title | url | host`
- **Sidebar (340px):**
  - Date label (mirrors topbar range)
  - Browsing Activity chart: 12-day dual-bar (Recharts), amber = Page Views, cyan = Pages (unique visits per day)
  - Link Transition donut (Recharts `PieChart`): 4 buckets (Typed / Link / Reload / Form), center total, inline legend
  - Top Domains: sorted top-6 of N total, with fav-letter tile + host + count badge
- States: loading skeleton, error + retry, empty (no history), empty-filtered (no search matches)

### Out of scope (follow-up slices)

- Day / Week / Month views (segment buttons disabled this slice)
- Date-range picker
- Sortable column headers
- Settings / Tweaks panel (accent, density, zebra, chart style)
- Keyboard shortcuts, multi-select, delete history entries
- Clear-browsing-data, bookmarks, tabs integration
- Multi-language / i18n
- Persistence to `chrome.storage`

## 3. Architecture

### Principles

- **One chrome boundary.** Hooks in `src/hooks/` are the *only* place that calls `chrome.*`. Components receive typed props — pure render functions.
- **Fetch once, derive everything.** Single `chrome.history.search` on mount feeds all sidebar analytics and the list. Search filters happen in-memory.
- **Pure utilities.** `src/lib/` has no DOM or React imports; date math, domain parsing, transition bucketing are unit-testable.

### File structure

```
src/
  App.tsx                         # grid shell, owns view + search state
  main.tsx
  background.ts                   # empty MV3 service worker
  history.html
  index.css                       # Tailwind v4 directives + @theme tokens
  components/
    ui/                           # shadcn primitives: button (exists), input, tooltip, toggle-group
    history/
      Topbar.tsx
      ViewSegment.tsx             # shadcn ToggleGroup; 3 items disabled
      SearchInput.tsx             # debounced
      ColumnHeader.tsx
      HistoryList.tsx             # renders day groups
      DayGroup.tsx                # sticky header + rows
      HistoryRow.tsx
      FavBadge.tsx                # colored letter tile
      Sidebar.tsx                 # date label + 3 cards
      ActivityChart.tsx           # Recharts dual-bar
      TransitionDonut.tsx         # Recharts PieChart + custom center/legend
      TopDomains.tsx
      EmptyState.tsx
      ListSkeleton.tsx
  hooks/
    useHistory.ts                 # wraps chrome.history.search
    useVisits.ts                  # batches chrome.history.getVisits for transitions
    useDebouncedValue.ts
  lib/
    utils.ts                      # cn()
    date.ts                       # formatDateLong, formatTime, formatShortDate, groupByDay, bucketByDay
    domain.ts                     # parseHost, hostLetter, hostColor (seeded hash → oklch)
    transitions.ts                # chrome.TransitionType → {typed|link|reload|form}
    types.ts
```

## 4. Data flow

### `useHistory(days = 30): { entries, loading, error, reload }`

```ts
chrome.history.search({
  text: '',
  startTime: Date.now() - days * 86_400_000,
  maxResults: 10_000,
})
```

Normalizes `chrome.history.HistoryItem[]` → `HistoryEntry[]`:
```ts
type HistoryEntry = {
  id: string              // HistoryItem.id
  url: string
  title: string           // fallback: hostname if title is empty
  host: string            // parsed from url
  hostLetter: string      // first uppercase alnum of host, or '·' fallback
  hostColor: string       // seeded oklch from hash(host)
  lastVisitTime: Date     // HistoryItem.lastVisitTime → Date
  visitCount: number      // HistoryItem.visitCount
  typedCount: number
}
```

### `useVisits(entries): { counts, loading }`

- Dedupe `entries` by URL.
- Fan out `chrome.history.getVisits({ url })` with concurrency ≤ 10 (promise-pool in `lib`).
- Keep only visits whose `visitTime` falls inside the 30-day window.
- Map each visit's `transition` via `lib/transitions.ts` into one of `typed | link | reload | form`:

| Chrome `TransitionType`                                  | Bucket   |
| -------------------------------------------------------- | -------- |
| `typed`, `keyword`, `keyword_generated`                  | `typed`  |
| `link`, `auto_bookmark`, `manual_subframe`, `auto_subframe`, `generated` | `link`   |
| `reload`                                                 | `reload` |
| `form_submit`                                            | `form`   |
| everything else (`start_page`, etc.)                     | `link`   |

Returns `{ typed, link, reload, form, total }`. Its loading state is independent from `useHistory`'s — the list renders immediately while the donut shows a skeleton.

### Derivations (pure, in `lib/`)

- `groupByDay(entries)` → `{ date: Date; entries: HistoryEntry[]; totalViews: number }[]`, descending by date
- `bucketByDay(entries, days = 12, endDate = startOfToday())` → `{ date: Date; label: string; pages: number; views: number }[]` — 12 consecutive day-buckets ending on `endDate`; `pages` = unique entries that day, `views` = Σ `visitCount`
- `topDomains(entries, limit = 6)` → `{ host, letter, color, count }[]` + `totalDomains: number`
- `filterEntries(entries, q)` → case-insensitive `title | url | host` match (empty q returns original reference for memoization)

### Top-level state (in `App.tsx`)

```ts
const { entries, loading, error, reload } = useHistory(30)
const [query, setQuery] = useState('')
const debouncedQuery = useDebouncedValue(query, 150)
const filtered = useMemo(() => filterEntries(entries, debouncedQuery), [entries, debouncedQuery])
const { counts: transitions, loading: txLoading } = useVisits(entries)
```

### States

| Condition                                                | Main content                     | Sidebar                       |
| -------------------------------------------------------- | -------------------------------- | ----------------------------- |
| `loading && !entries.length`                             | `<ListSkeleton />`               | Chart skeletons               |
| `error`                                                  | Error panel with Retry button    | Empty-state placeholders      |
| `!loading && entries.length === 0`                       | `<EmptyState variant="none" />`  | "No data" placeholders        |
| `entries.length > 0 && filtered.length === 0 && query`   | `<EmptyState variant="search" />`| Charts reflect **filtered**   |
| happy path                                               | `<HistoryList groups={...} />`   | Charts reflect **filtered**   |

Sidebar always mirrors the current filter so charts + top-domains respond to search.

## 5. Theming & tokens

All tokens go into one `@theme inline` block in `src/index.css`, ported 1:1 from the mock's `:root`. Full list:

| CSS token             | Purpose                            |
| --------------------- | ---------------------------------- |
| `--color-bg-0..3`     | background ladder, darkest → lighter |
| `--color-bg-hover`    | row hover                          |
| `--color-bg-row-alt`  | (unused this slice, kept for parity) |
| `--color-line-0..1`   | borders                            |
| `--color-fg-0..3`     | foreground ladder, brightest → dim |
| `--color-amber/-dim`  | primary accent                     |
| `--color-cyan / violet / coral / green` | secondary accents    |
| `--color-chip / chip-fg` | pill chips                      |
| `--font-sans` = Inter | body                               |
| `--font-mono` = JetBrains Mono | tabular figures           |
| `--shadow-sm / -md`   | elevations                         |

Tailwind v4 exposes these as `bg-bg-0`, `text-fg-0`, `border-line-0`, `text-amber`, `font-mono`, `shadow-sm`, etc.

**shadcn bridge** — override shadcn's default tokens in `:root` so its Input / Button / Tooltip pick up our palette:
```css
:root {
  --background: var(--color-bg-0);
  --foreground: var(--color-fg-0);
  --primary: var(--color-amber);
  --primary-foreground: oklch(0.2 0.02 75);
  --border: var(--color-line-0);
  --input: var(--color-bg-2);
  --ring: var(--color-amber);
  --muted: var(--color-bg-2);
  --muted-foreground: var(--color-fg-2);
  --popover: var(--color-bg-3);
  --popover-foreground: var(--color-fg-0);
}
```

**Fonts:**
- Remove existing unused `@fontsource-variable/geist` dep + import.
- Add `@fontsource-variable/inter` and `@fontsource-variable/jetbrains-mono`.
- Import both from `main.tsx`.

**Base styles (`@layer base`):**
- `body { @apply bg-bg-0 text-fg-1 font-sans text-[13px] leading-[1.4] antialiased overflow-hidden; }`
- Custom scrollbar styling (10px webkit scrollbar, `--color-line-1` thumb with `--color-bg-0` border) applied to `.list-scroll` and `.sidebar`.
- `.tabular` utility class (`font-variant-numeric: tabular-nums`) in `@layer utilities` for mono columns.

## 6. shadcn components used

| Component     | Where                                         |
| ------------- | --------------------------------------------- |
| `Button`      | all topbar icon buttons + Today chip (`variant="ghost" size="icon"` / custom chip variant) |
| `Input`       | SearchInput                                   |
| `Tooltip`     | "Coming soon" tooltips on disabled view segment items. (Recharts has its own `Tooltip` primitive used inside charts; our custom chart-tooltip content borrows the same design tokens — `bg-bg-3 border-line-1 text-fg-0 text-[11px] font-mono rounded-md` — but doesn't import shadcn's.) |
| `ToggleGroup` | ViewSegment                                   |

Install via `npx shadcn@latest add input tooltip toggle-group`.

Deliberately **not** using: `Card`, `Badge`, `ScrollArea`, `Tabs`, `Dialog`, `Sheet`, `Popover`, `Select`, `DropdownMenu`.

## 7. Charts (Recharts)

### ActivityChart (dual-bar, 12 days)

- `<ResponsiveContainer>` inside a 130px-tall wrapper.
- `<BarChart data={bucketByDay(entries, 12)}>` with two `<Bar>` series:
  - `dataKey="views"` fill `var(--color-amber)`, offset left
  - `dataKey="pages"` fill `var(--color-cyan)`, offset right
  - `barCategoryGap={4}`, `barGap={2}`, `radius={[1,1,0,0]}`
- `<XAxis dataKey="label">` with a custom tick renderer that rotates labels -30° and shows every other bucket (+ the last).
- `<YAxis>` with 3 ticks (0, max/2, max), dashed `<CartesianGrid strokeDasharray="2 3">`, no axis lines.
- `<Tooltip content={<ChartTooltip />}>` — custom tooltip: `<label> · views <v> · pages <p>`.
- Legend rendered **outside** the chart in JSX (matches mock's `.chart-legend`), using `totalViews` / `totalPages` from bucket sum.

### TransitionDonut

- Custom wrapper around `<ResponsiveContainer>` + `<PieChart>`:
  - `<Pie data={[...4 buckets]} dataKey="val" innerRadius={38} outerRadius={55} stroke="var(--color-bg-0)" strokeWidth={1.5} startAngle={90} endAngle={-270}>` with per-slice `<Cell fill={...}>`.
- Overlay center total via absolutely-positioned JSX (not SVG text) — simpler than Recharts' customization path, matches mock's visual.
- Inline legend rendered as a grid to the right of the donut (not Recharts' built-in legend) to match mock layout: swatch | label | count per row.

### Colors (per mock)

| Bucket  | Color                      |
| ------- | -------------------------- |
| typed   | `oklch(0.72 0.16 295)` violet |
| link    | `oklch(0.72 0.15 25)` coral  |
| reload  | `oklch(0.78 0.14 75)` amber  |
| form    | `oklch(0.78 0.12 220)` cyan  |

## 8. Chrome API specifics

- **Favicons:** `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=<url>&size=16`. Used inside `<FavBadge />` as the *preferred* image, with fallback to the colored letter tile if the img errors or `chrome.runtime.id` is unavailable. Requires `"favicon"` permission (already in manifest).
- **Permissions already in manifest:** `history`, `storage`, `favicon`. No additions needed.
- **Service worker (`background.ts`):** no-op for this slice (empty file with `export {}` so TS treats it as a module). Kept for MV3 compliance and future use.
- **Dev workflow:** `npm run dev` → CRXJS emits `dist/` → load unpacked → `Ctrl+H`. HMR updates the override page in place.

## 9. Performance

- Single `chrome.history.search` call with `maxResults: 10_000`.
- `useVisits` fan-out capped at 10 concurrent requests; expected up to ~1–2k unique URLs in a busy 30-day window. If this turns out to be slow in practice, the follow-up slice can cache transition counts by URL hash in `chrome.storage.session`.
- **No list virtualization this slice.** 10k rows at 34px with minimal per-row DOM stays under ~340k pixel height; Chrome handles it. If benchmark shows jank at the p95, we add `@tanstack/react-virtual` as a follow-up rather than pre-optimizing.
- `filterEntries` is O(n) per keystroke against `title+url+host`; debounce at 150ms keeps it smooth.
- All derivations (`groupByDay`, `bucketByDay`, `topDomains`) wrapped in `useMemo` keyed on `filtered`.

## 10. Testing

- **Unit tests (Vitest)** for pure `lib/` functions: `groupByDay`, `bucketByDay`, `topDomains`, `filterEntries`, `transitions.bucket`, `domain.parseHost`, `domain.hostColor` (determinism).
- **Component smoke tests (Vitest + React Testing Library)** for state branches: loading skeleton, empty state, empty-filtered, happy path — with a mocked `chrome` global fed into the hooks via a `ChromeProvider` context boundary (so tests don't monkey-patch `globalThis.chrome`).
- **Manual verification checklist** (tracked in the implementation plan):
  1. `npm run build` succeeds, lint clean, prettier clean, typecheck clean.
  2. Load unpacked from `dist/`, `Ctrl+H` shows the override page (not default Chrome).
  3. Real browsing history renders in list; search filters live.
  4. Sidebar charts populate within a few seconds; legend totals match.
  5. Top Domains shows top 6, "of N Total" reflects true count.
  6. Disabled view segment items show "Coming soon" tooltip.
  7. Empty state appears after clearing browsing history (manually verify in a throwaway profile).
  8. Works offline (no network required after extension loads).

## 11. Dependencies to add

- `recharts`
- `@fontsource-variable/inter`
- `@fontsource-variable/jetbrains-mono`
- dev: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
- shadcn components via CLI: `input`, `tooltip`, `toggle-group`

Remove: `@fontsource-variable/geist`.

## 12. Open questions

None — all four scoping questions (scope, chart lib, tweaks panel, tokens approach) resolved during brainstorming.
