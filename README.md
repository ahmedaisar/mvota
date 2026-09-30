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
- **Full booking flow** — resort detail → villa & meal-plan selection → traveler + arrival form →
  pay-at-the-property confirmation → booking code → Trips.
- **Real accounts (Supabase Auth)** — email/password register & sign-in, RLS-backed data; bookings, saved
  stays and rewards are stored server-side and tied to the signed-in user. Booking, saving and rewards
  require an account.
- **Rewards (Supabase)** — IslandCash (2% back, posts after check-out), night stamps (10 nights → $100
  credit), pending → available state, cancellation with refundable rules; past stays auto-complete and
  credit rewards when you open Trips.
- **5th-night-free** — long-stay discount on the room component for stays of 5+ nights, applied inside the
  quote engine (before service charge/TGST), surfaced on checkout and the Home live-quote table.
- **Procedural SVG scenes** — deterministic per-resort artwork (aerial / overwater / beach / sunset), so the app
  ships with zero external image dependencies.

## Tech stack

| Layer     | Choice                                    |
| --------- | ----------------------------------------- |
| Build     | Vite 6 + TypeScript 5.8 (strict)          |
| UI        | React 19 + React Router 7                 |
| Styling   | Tailwind CSS 4 (`@theme` design tokens)   |
| Lint      | ESLint 9 flat config + typescript-eslint  |
| Auth/DB   | Supabase (Auth + Postgres, RLS)           |
| ORM       | Prisma 6 (schema + migrations)            |

## Getting started

```bash
npm install                                 # runs prisma generate (postinstall)
vercel env pull .env.development.local --environment=production   # Supabase + DB env
npm run db:setup    # prisma db push + RLS policies/trigger (scripts/db-init.mjs)
npm run dev         # http://localhost:5173
```

Environment is documented in [`.env.example`](./.env.example). The browser only ever sees
`NEXT_PUBLIC_SUPABASE_*` (anon key, enforced by RLS); Prisma uses `DATABASE_URL`/`DIRECT_URL`
(session-mode pooler for migrations).

### Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Dev server with HMR                   |
| `npm run build`     | Type-check + production build to `dist/` |
| `npm run preview`   | Serve the production build locally    |
| `npm run lint`      | ESLint (zero errors, zero warnings)   |
| `npm run typecheck` | `tsc -b` project type-check           |
| `npm run db:push`   | Sync `prisma/schema.prisma` to Supabase |
| `npm run db:init`   | RLS policies, FKs to `auth.users`, signup trigger |
| `npm run db:setup`  | `db:push` + `db:init`                 |

## Project structure

```
prisma/         schema.prisma — Profile, Reward, Booking, SavedStay (snake_case tables)
scripts/        db-init.mjs (RLS + trigger), extract-ca.mjs (pooler TLS helper)
src/
  components/    Layout (header/footer + auth modal), SearchStrip, ResortCard,
                 FiltersPanel, Scene (procedural SVG), ui (stars/rating/chips)
  data/          resorts.ts — content seam (swap for the hotel content API)
  lib/           pricing.ts (quote engine + seaplane rule + 5th-night-free),
                 filters.ts, format.ts, supabase.ts (client, fails loudly if env missing)
  pages/         Home, Search, ResortDetail, Checkout, Confirmation,
                 Trips, Offers, NotFound
  services/      bookings.ts, rewards.ts, saved.ts — Supabase data access (swap for APIs)
  store/         AppContext (auth session, bookings, saved, rewards, search)
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
3. Build command `npm run build`, output directory `dist` (defaults).
4. Required env vars (production + preview): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the rest from `.env.example` for tooling). Without them the
   app renders a configuration notice instead of running against fake data.
5. No `vercel.json` required; client-side routing works via Vercel's SPA fallback.

## Notes

- Research/education project; not affiliated with Hotels.com, Expedia Group or any listed resort.
- No card is charged anywhere: bookings are confirmed with pay-at-the-property terms only.
- Resort content is a bundled dataset (the content/availability API swap-in seam is
  `src/data/resorts.ts` + `src/lib/pricing.ts`).
