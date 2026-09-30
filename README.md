# Atoll — Maldives Resorts Booking OTA

A Maldives-only hotel/resort booking web app, reconstructed from a full product teardown of **hotels.com**
(RESEARCH_AND_IMPLEMENT mode of the `product-reverse-engineering` skill).

Every pricing rule, surface and workflow in this app is derived from the research artifacts in this repo —
not invented. See [`REVERSE_ENGINEERING_REPORT.md`](./REVERSE_ENGINEERING_REPORT.md) for the full 21-section
teardown and reconstruction spec.

## Features

- **Search across 14 Maldives resorts** in 10 atolls — filters (popular, price, stars, rating, transfer type,
  meal plan, view, amenities) and Hotels.com-style featured sorting.
- **Tax-inclusive pricing engine** — every card and quote shows the true Maldives package math:
  - member discount −10% (One Key-style) applied first
  - service charge +10%
  - TGST +17% on (room + service charge)
  - green tax $6/$12 per person per night
  - round-trip transfer per person: speedboat $220 / seaplane $640 / domestic $470
- **Seaplane daylight rule** — arrivals outside 06:00–16:00 are blocked at the detail and checkout steps with a
  corrective explanation (from research rule-maldives-transfer).
- **Full booking flow** — resort detail → villa & meal-plan selection → traveler + arrival form → payment
  (pay now / pay later) → confirmation code → Trips.
- **Account & rewards (local)** — demo sign-in (email or Google-style), saved stays, IslandCash (2% back),
  night stamps (10 nights → $100 credit), pending → available reward state, cancellation with refundable rules.
- **Procedural SVG scenes** — deterministic per-resort artwork (aerial / overwater / beach / sunset), so the app
  ships with zero external image dependencies.

## Tech stack

| Layer     | Choice                                    |
| --------- | ----------------------------------------- |
| Build     | Vite 6 + TypeScript 5.8 (strict)          |
| UI        | React 19 + React Router 7                 |
| Styling   | Tailwind CSS 4 (`@theme` design tokens)   |
| Lint      | ESLint 9 flat config + typescript-eslint  |
| Persistence | `localStorage` (bookings, member, rewards) |

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173
```

### Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server with HMR                   |
| `npm run build`     | Type-check + production build to `dist/` |
| `npm run preview`   | Serve the production build locally    |
| `npm run lint`      | ESLint (zero errors, zero warnings)   |
| `npm run typecheck` | `tsc -b` project type-check           |

## Project structure

```
src/
  components/    Layout (header/footer/auth), SearchStrip, ResortCard,
                 FiltersPanel, Scene (procedural SVG), ui (stars/rating/chips)
  data/          resorts.ts — 14 resorts, atolls, meal plans, transfer rates
  lib/           pricing.ts (quote engine + seaplane rule), filters.ts, format.ts
  pages/         Home, Search, ResortDetail, Checkout, Confirmation,
                 Trips, Offers, NotFound
  store/         AppContext (member, bookings, saved, rewards, search)
  types.ts       Domain model
```

## Research provenance

Research artifacts produced before implementation (skill Phases 0–7):

- `REVERSE_ENGINEERING_REPORT.md` — full teardown + §17 reconstruction spec + P0–P3 backlog
- `product-model.json` — machine-readable model + `reconstruction_specification`
- `.reverse-engineering/` (local, gitignored) — investigation log (JSONL), coverage matrix, 36 evidence files
  (screenshots, notes, network logs captured via Playwright against Wayback snapshots of hotels.com;
  live site was behind a DataDome bot wall — documented as `BLOCKED`)

## Deployment (Vercel)

The repo is a zero-config Vite SPA:

1. Push to GitHub (`ahmedaisar/mvota`).
2. In Vercel: **Add New Project → Import repo** — framework auto-detected as **Vite**.
3. Build command `npm run build`, output directory `dist` (defaults), no env vars needed.
4. No `vercel.json` required; client-side routing works via Vercel's SPA fallback.

## Notes

- Demo project for research/education; not affiliated with Hotels.com, Expedia Group or any listed resort.
- Prices are illustrative; no real payment is processed.
- Sign-in and bookings are stored locally in your browser only.
