import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import ResortCard from '../components/ResortCard';
import { useLiveResults } from '../hooks/useLiveResults';

const deals = [
  {
    badge: 'Stay 5, pay 4',
    title: 'Long-stay lagoon offer',
    body: 'Book 5+ nights on any half-board or all-inclusive villa and the 5th night is on us — applied automatically to the package total.',
    filter: (n: number) => n >= 5,
    accent: 'bg-coral-500',
  },
  {
    badge: 'Member −10%',
    title: 'Instant member savings',
    body: 'Sign in and every quote drops 10% on room & board before taxes — the same way One Key coupons stack at Hotels.com.',
    filter: () => true,
    accent: 'bg-lagoon-600',
  },
  {
    badge: 'Low season',
    title: 'May–September rates',
    body: 'Monsoon season means manta gatherings and 12% lower base rates. Seasonal multipliers are already inside every price you see.',
    filter: () => true,
    accent: 'bg-gold-500 text-ink-950',
  },
];

export default function Offers() {
  const { member, search, openAuth, currency } = useApp();
  const { results, status, error, retry } = useLiveResults();
  const guests = search.adults + search.children;
  const picks = [...results].sort((a, b) => a.total - b.total).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="max-w-2xl">
        <span className="rounded-full bg-coral-500/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-coral-600">
          Deals & how pricing works
        </span>
        <h1 className="mt-3 font-display text-4xl font-semibold text-ink-950">Offers worth the seaplane</h1>
        <p className="mt-2 text-ink-700">
          Maldives deals only matter if the discount survives the tax stack. Every promotion here modifies the base
          room rate <em>before</em> service charge, TGST and green tax — so what you see is what clears.
        </p>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {deals.map((d) => (
          <div key={d.title} className="rounded-3xl border border-sand-200 bg-white p-6">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white ${d.accent}`}>
              {d.badge}
            </span>
            <h2 className="mt-3 font-display text-xl font-semibold text-ink-950">{d.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-700">{d.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-12 rounded-3xl bg-ink-900 p-7 text-white">
        <h2 className="text-2xl font-semibold">The tax stack, once more, plainly</h2>
        <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Service charge', '10%', 'of room + board'],
            ['TGST', '17%', 'of room + service charge'],
            ['Green tax', '$6 / $12', 'per person, per night'],
            ['Member discount', '−10%', 'before all of the above'],
            ['Seaplane RT', '$640', 'per person, daylight only'],
            ['Speedboat RT', '$220', 'per person, any time'],
          ].map(([k, v, note]) => (
            <div key={k} className="border-b border-ink-700 pb-4">
              <div className="flex items-baseline justify-between">
                <span className="font-semibold">{k}</span>
                <span className="text-xl font-bold text-lagoon-300">{v}</span>
              </div>
              <div className="text-sm text-ink-300">{note}</div>
            </div>
          ))}
        </div>
        {!member && (
          <button
            onClick={() => openAuth('header')}
            className="mt-6 rounded-xl bg-coral-500 px-5 py-3 text-sm font-bold hover:bg-coral-600"
          >
            Sign in to unlock −10%
          </button>
        )}
      </section>

      <section className="mt-12">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl font-semibold text-ink-950">Cheapest islands right now</h2>
          <Link to="/search" className="text-sm font-bold text-lagoon-700 hover:underline">
            All stays →
          </Link>
        </div>
        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {status === 'loading' &&
            Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-sand-200 bg-white p-4">
                <div className="h-40 rounded-xl bg-sand-100" />
                <div className="mt-4 h-4 w-2/3 rounded bg-sand-100" />
              </div>
            ))}
          {status === 'error' && (
            <div className="rounded-2xl border border-coral-400 bg-coral-500/10 p-8 text-center sm:col-span-2 lg:col-span-3">
              <p className="text-sm font-semibold text-coral-600">{error ?? 'Live rates are unavailable.'}</p>
              <button onClick={retry} className="mt-3 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700">
                Try again
              </button>
            </div>
          )}
          {status === 'ready' && picks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-8 text-center text-sm text-ink-500 sm:col-span-2 lg:col-span-3">
              No availability for these dates — shift your stay to see deals.
            </div>
          )}
          {status === 'ready' && picks.map((r) => <ResortCard key={r.row.hotel_slug} result={r} />)}
        </div>
        <p className="mt-4 text-xs text-ink-500">
          Package totals shown for {guests} guest{guests > 1 ? 's' : ''} · taxes included, transfers priced per hotel ·
          shown in {currency}
        </p>
      </section>
    </div>
  );
}
