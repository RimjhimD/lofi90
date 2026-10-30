# lofi90

**A component library in your pocket.** React + TypeScript + Tailwind components for the LofiStack 90 Day Build Challenge: everyday UI with a twist, plus tools for real automation work.

Live site: https://lofi90.vercel.app

## Components

| Ext | Component | Type | Page |
|---|---|---|---|
| 01 | Undo Fuse Button | button | `/components/undo-fuse-button` |
| 02 | Tape Measure Input | input | `/components/tape-measure-input` |
| 03 | Plucked String Nav | navbar | `/components/string-nav` |
| 04 | Vinyl Crate Carousel | section | `/components/vinyl-crate-carousel` |
| 05 | Island Notification | modal | `/components/island-notification` |
| 06 | Boarding Pass Card | card | `/components/boarding-pass-card` |
| 07 | Live URL Slug Input | input | `/components/url-slug-input` |
| 08 | Bug Report Widget | modal | `/components/bug-report-widget` |
| 09 | Text-Us Widget | form | `/components/text-us-widget` |
| 10 | Tab Progress Loader | loader | `/components/tab-progress-loader` |
| 11 | Scan-to-Save Contact Card | card | `/components/scan-to-save-contact-card` |
| 12 | Open-Now Hours | section | `/components/open-now-hours` |
| 13 | Polaroid Card | card | `/components/polaroid-card` |
| 14 | Offline-Aware Navbar | navbar | `/components/offline-aware-navbar` |

Every component page has a live demo (375 / 768 / full width), the usage example, the full source, a props table and the final prompt that built it.

## Using a component

Each component lives in `src/library/<slug>/` and only needs React + Tailwind CSS — no other packages.

**Requirements:** React 19 or newer (Next.js 15+) and Tailwind CSS 4. The Boarding Pass Card uses React 19's `<style href precedence>` to load its styles once, so it won't work on React 18.

```
src/library/undo-fuse-button/
  UndoFuseButton.tsx        the component (copy this file)
  usage.tsx                 how to use it in a real app
  demo.tsx                  the live demo on the site
  prompt.md                 the final prompt
```

Copy the component file into your Next.js + Tailwind project and import it.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Hosted on Vercel

## Run locally

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests
npm run typecheck
npm run lint
npm run build
```
