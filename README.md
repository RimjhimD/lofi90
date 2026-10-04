# lofi90

**A component library in your pocket.** React + TypeScript + Tailwind components for the LofiStack 90 Day Build Challenge: everyday UI with a twist, plus tools for real automation work.

Live site: https://lofi90.vercel.app (coming soon)

## Components

| Ext | Component | Type | Page |
|---|---|---|---|
| 01 | Merge Tag Input | input | `/components/merge-tag-input` |
| 02 | Retry Countdown Loader | loader | `/components/retry-countdown-loader` |

Every component page has a live demo (375 / 768 / full width), the usage example, the full source, a props table and the final prompt that built it.

## Using a component

Each component lives in `src/library/<slug>/` and only needs React + Tailwind CSS — no other packages.

```
src/library/merge-tag-input/
  MergeTagInput.tsx         the component (copy this file)
  usage.tsx                 how to use it in a real app
  demo.tsx                  the live demo on the site
  prompt.md                 the final prompt
```

Copy the component file into your Next.js + Tailwind project and import it.

## Tech stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Vitest for logic tests
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
