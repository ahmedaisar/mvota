import { Link } from 'react-router-dom';
import SearchStrip from '../components/SearchStrip';
import ResortCard from '../components/ResortCard';
import { RESORTS, MEAL_PLANS } from '../data/resorts';
import { buildQuote, fromPrice } from '../lib/pricing';
import { money } from '../lib/format';
import { useApp } from '../store/AppContext';

const valueProps = [
  {
    title: 'One tax-inclusive price',
    body: 'Service charge 10%, TGST 17% and green tax are shown in the search card — no surprise at checkout.',
    icon: 'M12 2v20M17 6.5c0-1.9-2.2-3-5-3s-5 1.1-5 3 1.8 2.6 5 3.2 5 1.5 5 3.5-2.2 3-5 3-5-1.1-5-3',
  },
  {
    title: 'Transfers priced upfront',
    body: 'Seaplane, speedboat or domestic flight — a fixed round-trip per person, calculated with your quote.',
    icon: 'M2 16h20M12 5v8M5 12l7-4 7 4M7 20h2m6 0h2',
  },
  {
    title: 'Daylight seaplane check',
    body: 'Seaplanes only fly 06:00–16:00. We warn you at checkout before you book a late arrival.',
    icon: 'M12 3a9 9 0 1 0 9 9M12 7v5l3 2',
  },
];

export default function Home() {
  const { member, session, search, openAuth } = useApp();
  const featured = RESORTS.filter((r) => r.promoted);
  const guests = search.adults + search.children;

  const sampleResort = RESORTS.find((r) => r.slug === 'azure-shore-north-male')!;
  const sampleVilla = sampleResort.villas.find((v) => v.name === 'Lagoon Water Villa')!;
  const sampleQuote = buildQuote({
    resort: sampleResort,
    villa: sampleVilla,
    mealPlan: 'AI',
    checkIn: search.checkIn,
    checkOut: search.checkOut,
    adults: 2,
    children: 0,
    member: !!session,
  });

  const sampleRows: [string, string, boolean?][] = [
    ['Villa (seasonal)', money(sampleQuote.roomSubtotal)],
    ['Meal plan uplift', money(sampleQuote.mealUplift)],
    ['5th night free', `−${money(sampleQuote.longStayDiscount)}`, sampleQuote.longStayDiscount > 0],
    ['Member −10%', `−${money(sampleQuote.memberDiscount)}`, sampleQuote.memberDiscount > 0],
    ['Service charge 10%', money(sampleQuote.serviceCharge)],
    ['TGST 17%', money(sampleQuote.tgst)],
    ['Green tax ×2 guests', money(sampleQuote.greenTax)],
    ['Speedboat RT ×2', money(sampleQuote.transferTotal)],
  ];

  return (
    <div>
      <section className="relative overflow-hidden bg-ink-950">
        <div className="absolute inset-0">
          <svg viewBox="0 0 1440 560" className="h-full w-full" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <defs>
              <linearGradient id="heroSky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#0d3541" />
                <stop offset="0.6" stopColor="#17505f" />
                <stop offset="1" stopColor="#0e9490" />
              </linearGradient>
              <linearGradient id="heroSea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#12a5a0" />
                <stop offset="1" stopColor="#08252e" />
              </linearGradient>
            </defs>
            <rect width="1440" height="380" fill="url(#heroSky)" />
            <rect y="360" width="1440" height="200" fill="url(#heroSea)" />
            <circle cx="1140" cy="150" r="70" fill="#ffe9a8" opacity="0.9" />
            <path d="M0 372 Q360 356 720 368 T1440 360 L1440 392 L0 392 Z" fill="#ded2b6" opacity="0.35" />
            <g fill="#05171d" opacity="0.7">
              <g transform="translate(1080 356)">
                <rect x="-90" y="-70" width="200" height="62" rx="6" />
                <path d="M-108,-70 L132,-70 L108,-104 L-84,-104 Z" />
                {[-70, -44, -16, 12, 40, 68, 94].map((dx) => (
                  <rect key={dx} x={dx} y="-8" width="6" height="42" />
                ))}
              </g>
              <g transform="translate(240 368)">
                <rect x="-4" y="-84" width="8" height="86" />
                <path d="M0,-86 C-42,-104 -60,-80 -70,-62 C-46,-78 -18,-84 0,-86 Z" />
                <path d="M0,-86 C42,-104 60,-80 70,-62 C46,-78 18,-84 0,-86 Z" />
                <path d="M0,-92 C-10,-118 18,-120 32,-106 C12,-104 0,-98 0,-92 Z" />
              </g>
              <g transform="translate(700 350)">
                <rect x="-60" y="-46" width="130" height="42" rx="5" />
                <path d="M-74,-46 L92,-46 L74,-72 L-56,-72 Z" />
              </g>
            </g>
            <g opacity="0.4" stroke="#7fded8" strokeWidth="3" strokeLinecap="round">
              <path d="M80 420 h90 M300 440 h70 M560 418 h100 M900 444 h80 M1180 424 h110 M1320 460 h60" />
            </g>
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-16 sm:px-6 sm:pt-20">
          <div className="max-w-2xl animate-rise">
            <span className="rounded-full bg-coral-500/90 px-3 py-1 text-xs font-bold uppercase tracking-widest text-white">
              100% Maldives · 100% tax-inclusive
            </span>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.05] text-white sm:text-6xl">
              Book the island,
              <br />
              <span className="text-lagoon-300">not the surprise fees.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-100 sm:text-lg">
              Villa, meal plan and transfer in one quote — service charge, TGST, green tax and seaplane legs priced before
              you pay.
            </p>
          </div>

          <div className="mt-8 max-w-5xl">
            <SearchStrip />
            <p className="mt-3 text-xs font-semibold text-ink-100/90">
              Try: {featured[0].name} from {money(fromPrice(featured[0], !!session, search.checkIn, search.checkOut, guests))} — all
              taxes and transfer included
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto -mt-7 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {valueProps.map((v) => (
            <div key={v.title} className="rounded-2xl border border-sand-200 bg-white p-5 shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-xl bg-lagoon-100 text-lagoon-700">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={v.icon} />
                </svg>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold text-ink-950">{v.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-ink-700">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-semibold text-ink-950">Featured islands</h2>
            <p className="mt-1 text-ink-500">Handpicked stays with the cleanest reviews and best house reefs.</p>
          </div>
          <Link to="/search" className="text-sm font-bold text-lagoon-700 hover:text-lagoon-600">
            See all {RESORTS.length} stays →
          </Link>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[...featured, ...RESORTS.filter((r) => !r.promoted).slice(0, 3)].slice(0, 6).map((r) => (
            <ResortCard key={r.id} resort={r} />
          ))}
        </div>
      </section>

      <section className="mt-16 bg-ink-900 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold">How the Maldives math works</h2>
              <p className="mt-3 max-w-lg leading-relaxed text-ink-100">
                Most OTAs hide the tax stack until the last screen. Here is every line item we compute — the same engine
                prices every card, villa page and checkout.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  ['Base villa + meal plan', 'nightly rate × nights, seasonal multiplier applied'],
                  ['Member discount', '−10% for signed-in members (One Key style)'],
                  ['Service charge', '+10% of room & board'],
                  ['TGST (Goods & Services Tax)', '+17% of (room + service charge)'],
                  ['Green tax', '$6 or $12 per person per night'],
                  ['Round-trip transfer', 'per person: speedboat / seaplane / domestic'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-start gap-3 border-b border-ink-700 pb-3 text-sm">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-lagoon-400" />
                    <div>
                      <div className="font-bold">{k}</div>
                      <div className="text-ink-300">{v}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Link to="/offers" className="mt-6 inline-block rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold hover:bg-coral-600">
                See current deals
              </Link>
            </div>

            <div className="rounded-2xl bg-ink-950 p-6 ring-1 ring-ink-700">
              <h3 className="text-xl font-semibold">
                Live quote: {sampleQuote.nights} nights, 2 adults
              </h3>
              <p className="mt-1 text-sm text-ink-300">
                Azure Shore · Lagoon Water Villa · All Inclusive · speedboat
              </p>
              <table className="mt-4 w-full text-sm">
                <tbody className="[&_td]:py-2 [&_td]:border-b [&_td]:border-ink-800">
                  {sampleRows.filter(([, , show]) => show !== false).map(([k, v]) => (
                    <tr key={k}>
                      <td className="text-ink-300">{k}</td>
                      <td className="text-right font-semibold tabular-nums">{v}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="pt-4 text-base font-bold">Total</td>
                    <td className="pt-4 text-right text-xl font-bold text-lagoon-300 tabular-nums">
                      {money(sampleQuote.total)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <p className="mt-3 text-xs text-ink-500">
                Priced by the same engine as search and checkout — it recomputes with your dates and guests.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
        <h2 className="text-3xl font-semibold text-ink-950">Pick your pace of dining</h2>
        <p className="mt-1 text-ink-500">Meal plans drive up to 40% of a Maldives package — choose knowingly.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {MEAL_PLANS.map((m) => (
            <div key={m.code} className="rounded-2xl border border-sand-200 bg-white p-4">
              <div className="text-xs font-bold uppercase tracking-widest text-lagoon-700">{m.code}</div>
              <div className="mt-1 font-display text-lg font-semibold text-ink-950">{m.name}</div>
              <div className="mt-1 text-sm text-ink-700">{m.includes}</div>
              <div className="mt-3 text-sm font-bold text-ink-950">
                {m.ppn === 0 ? 'Included' : `+$${m.ppn}/person/day`}
              </div>
            </div>
          ))}
        </div>
      </section>

      {!member && (
        <section className="mx-auto mt-16 max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-gradient-to-r from-lagoon-600 to-lagoon-700 p-7 text-white sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-semibold">Members save 10% — and earn IslandCash</h2>
              <p className="mt-1 text-sm text-lagoon-100">
                2% back on stays, plus a $100 credit every 10 nights. Creating an account takes seconds.
              </p>
            </div>
            <button
              onClick={() => openAuth('header')}
              className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-lagoon-700 hover:bg-sand-100"
            >
              Join free
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
