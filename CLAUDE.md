# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Purpose

A Chrome Extension (Manifest V3) that overrides `chrome://history` with a dark-mode React dashboard — a Vivaldi-style browsing analytics tool with list/day/week/month views, charts (Recharts), and advanced search/filtering.

## Commands

```bash
npm run dev          # Start Vite dev server (use with CRXJS for HMR in extension)
npm run build        # tsc -b && vite build → outputs to dist/
npm run lint         # ESLint
npm run lint:fix     # ESLint with auto-fix
npm run format       # Prettier write
npm run format:check # Prettier check
npm run preview      # Preview built output
```

**Loading the extension during development:**

1. Run `npm run dev` — CRXJS creates a `dist/` folder
2. Go to `chrome://extensions` → Enable Developer Mode → Load Unpacked → select `dist/`
3. Press `Ctrl+H` to open the overridden history page (HMR active)

## Architecture

This is a **full-page Chrome Extension override**, not a popup or content script. It functions as an SPA that replaces `chrome://history`.

### Key Entry Points

| File                | Role                                                                     |
| ------------------- | ------------------------------------------------------------------------ |
| `manifest.json`     | Extension config; CRXJS uses this as the Vite entry point                |
| `src/history.html`  | HTML shell that replaces `chrome://history` (via `chrome_url_overrides`) |
| `src/main.tsx`      | React mounting script                                                    |
| `src/App.tsx`       | Root component; CSS grid layout (top bar + main content + right sidebar) |
| `src/background.ts` | Manifest V3 Service Worker                                               |

### Component Organization

```
src/components/
  ui/          # shadcn/ui generated components (don't hand-edit)
  history/     # Domain components: CalendarView, Charts, HistoryList, etc.
src/lib/
  utils.ts     # cn() helper + date math utilities
```

### Chrome API Integration

- `chrome.history.search()` — bulk fetch by timestamp for list/calendar views
- `chrome.history.getVisits()` — per-URL visit details including `transition` type (needed for donut chart)
- Favicon display: `chrome-extension://<EXTENSION_ID>/_favicon/?pageUrl=<url>&size=16`
- Required manifest permissions: `"history"`, `"storage"`, `"favicon"`

### Build Configuration

The project uses **`@crxjs/vite-plugin`** (beta) which:

- Reads `manifest.json` as the Vite entry point
- Handles multi-page extension output (history page + service worker)
- Provides HMR during development

**`vite.config.ts` must include:**

```ts
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
// plugins: [react(), crx({ manifest })]
```

### Data & Visualization

Charts use **Recharts**. Data transformations before rendering:

- Activity chart: group `visitCount` by day → `BarChart`
- Transition types: tally `visit.transition` values → `PieChart`
- Top domains: extract hostnames, count, sort

## Tech Stack

- **React 19 + TypeScript** — strict mode, path alias `@/` → `src/`
- **Vite 8 + @crxjs/vite-plugin** — extension build pipeline
- **Tailwind CSS 4** — utility-first via `@tailwindcss/vite` plugin
- **shadcn/ui** (radix-nova style) — component library, dark-mode first
- **Recharts** — composable chart components
- **lucide-react** — icon library
