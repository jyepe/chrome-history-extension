# History Revamped

A Chrome extension (Manifest V3) that replaces the default `chrome://history` page with a dark-mode, analytics-driven React dashboard. Press **Ctrl+H** (or open the History menu) and get charts, trend buckets, top-domain rollups, and a virtualized timeline instead of the stock flat list.

## What it does

The extension registers itself as the override for `chrome://history`, so the built-in history page is replaced entirely by a single-page React app rendered inside the browser UI. It pulls directly from Chrome's own history store via the `chrome.history` API — no data leaves the browser, nothing is synced anywhere.

You get four ways to look at the same data:

- **List** — every visit from the last 30 days in a virtualized scrolling list, grouped by day.
- **Day** — one calendar day at a time with an hourly header.
- **Week** — a Sun-aligned 7-day strip with per-day activity.
- **Month** — a 6×7 calendar grid where each cell shows visit density for that day. Click a cell to pin the sidebar charts to that day while keeping the month in view.

Search is client-side, case-insensitive, debounced, and matches against URL + title.

## What it's modeled after

The layout and interaction model are inspired by **[Vivaldi's history dashboard](https://vivaldi.com/features/history/)** — a browser that treats history as something worth analyzing, not just scrolling through. Key Vivaldi-isms carried over:

- A right-hand sidebar of compact charts that re-scope based on the selected view.
- A calendar-heatmap month view with day-density coloring.
- Trend buckets that answer "when am I actually browsing?" rather than just "what did I visit?"

The visual design is a dark-first custom theme built on shadcn/ui + Tailwind v4 tokens, not a direct Vivaldi clone.

## Metrics explained

The sidebar renders three visualizations. All of them re-scope to whatever view is active (day / week / month / last 30 days).

### Browsing Activity (bar chart)

Count of visits bucketed by time:

- **Day / Month-with-day-selected views** → **Hourly Activity**: 24 one-hour buckets for the selected day.
- **Week view** → 7 daily buckets for the selected week.
- **List view** → 12 rolling buckets across the last 30 days.

Tall bars = heavy browsing windows. Useful for spotting "I doom-scrolled from 10pm to 1am" patterns.

### Link Transition Type (donut)

Breaks every visit in the current scope into **how** you got there, using Chrome's `transition` metadata from `chrome.history.getVisits()`:

- **Typed** — you typed the URL into the address bar (or used a search keyword / omnibox suggestion). High share = intentional navigation.
- **Link** — you clicked a link on another page. High share = follow-the-rabbit-hole browsing.
- **Reload** — same URL reloaded. High share = long-lived tabs, dashboards, build watchers.
- **Form** — you arrived via form submission (search results, login flows, POST redirects).

The center of the donut shows the total visit count for the scope. The ratio between Typed and Link is usually the most telling number — a day of pure "Link" visits means you didn't drive where you went.

### Top Domains

Hostnames ranked by visit count within the current scope, with a trailing count of how many other distinct domains you visited. Favicons are rendered via Chrome's built-in `_favicon` service so there's no network fetch.

### Month view density coloring

Each day cell in the calendar grid colors itself by visit count:

- Empty cell → no history that day.
- Cyan tint → low activity.
- Amber tint → heavy activity (≥5 visits).

The gradient lets you scan a month and see which days were heads-down vs. which were research sprints.

## Architecture notes

- **Manifest V3** with a minimal background service worker.
- **React 19 + TypeScript** strict mode.
- **Vite 8 + @crxjs/vite-plugin** gives HMR on the overridden page during development.
- **Tailwind CSS 4** via `@tailwindcss/vite`, using `@theme` tokens (no config file).
- **shadcn/ui** primitives under `src/components/ui/` — generated, don't hand-edit.
- **Recharts** for the activity bar chart and transition donut.
- **@tanstack/react-virtual** for the List view so 30 days of history scrolls at 60fps.
- All Chrome API access goes through a `ChromeProvider` context — hooks own data fetching, components stay pure, and tests can swap in a fake Chrome.

Permissions requested: `history`, `storage`, `favicon`, `tabs`. No host permissions, no network access.
