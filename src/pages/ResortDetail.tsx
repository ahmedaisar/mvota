import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Scene from '../components/Scene';
import SearchStrip from '../components/SearchStrip';
import { ATOLL_MAP, MEAL_PLANS, RESORT_BY_SLUG, TRANSFER_LABEL, TRANSFER_RATE } from '../data/resorts';
import { TRANSFER_BY_ATOLL, buildQuote, seaplaneArrivalWarning } from '../lib/pricing';
import { longDate, shortDate } from '../lib/format';
import { useApp } from '../store/AppContext';
import { RatingBadge, Stars, TransferChip } from '../components/ui';
import NotFound from './NotFound';

export default function ResortDetail() {
  const { slug = '' } = useParams();
  const resort = RESORT_BY_SLUG[slug];
  const { search, member, toggleSaved, isSaved } = useApp();
  const navigate = useNavigate();

  const [villaId, setVillaId] = useState(resort?.villas[1]?.id ?? resort?.villas[0]?.id ?? '');
  const [plan, setPlan] = useState(resort?.mealPlans.includes('AI') ? 'AI' : resort?.mealPlans[0] ?? 'BB');
  const [arrival, setArrival] = useState('');

  const villa = resort?.villas.find((v) => v.id === villaId) ?? resort?.villas[0];

  const quote = useMemo(() => {
    if (!resort || !villa) return null;
    return buildQuote({
      resort,
      villa,
      mealPlan: plan,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      children: search.children,
      member: !!member,
    });
  }, [resort, villa, plan, search, member]);

  if (!resort || !villa || !quote) return <NotFound />;

  const transfer = TRANSFER_BY_ATOLL[resort.atollId];
  const warning = seaplaneArrivalWarning(arrival, transfer);
  const saved = isSaved(resort.slug);

  const reserve = () => {
    if (warning) return;
    const qs = new URLSearchParams({ resort: resort.slug, villa: villa.id, plan });
    if (arrival) qs.set('arrival', arrival);
    navigate(`/checkout?${qs.toString()}`);
  };

  const breakdown: [string, string, string?][] = [
    [`${villa.name} × ${quote.nights} nights`, `$${quote.roomSubtotal.toLocaleString()}`, 'seasonal rate applied'],
    [`${MEAL_PLANS.find((m) => m.code === plan)?.name} × ${search.adults + search.children} guests`, `$${quote.mealUplift.toLocaleString()}`, 'per person / night'],
    ...(quote.memberDiscount ? ([['Member discount', `−$${quote.memberDiscount.toLocaleString()}`, 'signed-in members'] ] as [string, string, string][]) : []),
    ['Service charge 10%', `$${quote.serviceCharge.toLocaleString()}`],
    ['TGST 17%', `$${quote.tgst.toLocaleString()}`],
    ['Green tax', `$${quote.greenTax.toLocaleString()}`, `$${resort.roomCount >= 50 ? 12 : 6}/person/night`],
    [TRANSFER_LABEL[transfer], `$${quote.transferTotal.toLocaleString()}`, 'round trip / person'],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-4 text-sm text-ink-500" aria-label="Breadcrumb">
        <Link to="/search" className="font-semibold text-lagoon-700 hover:underline">
          Search results
        </Link>{' '}
        / {resort.name}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white">
            <Scene resort={resort} className="h-72 w-full sm:h-96" />
            <div className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div>
                <Stars n={resort.stars} />
                <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">{resort.name}</h1>
                <p className="mt-1 text-sm text-ink-500">
                  {resort.island} · {ATOLL_MAP[resort.atollId]?.name} · {resort.roomCount} rooms
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TransferChip type={transfer} minutes={resort.transferMinutes} />
                  <span className="rounded-full border border-sand-300 px-2.5 py-1 text-xs font-semibold text-ink-700">
                    {resort.distanceKm} km from Velana (MLE)
                  </span>
                  {resort.houseReef && (
                    <span className="rounded-full bg-lagoon-100 px-2.5 py-1 text-xs font-bold text-lagoon-700">House reef</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <RatingBadge rating={resort.rating} reviews={resort.reviews} />
                <button
                  onClick={() => toggleSaved(resort.slug)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${saved ? 'border-coral-500 bg-coral-500 text-white' : 'border-sand-300 text-ink-700 hover:border-coral-500 hover:text-coral-500'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
                  </svg>
                  {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>

          <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6">
            <p className="text-base leading-relaxed text-ink-700">{resort.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {resort.highlights.map((h) => (
                <div key={h} className="rounded-xl bg-sand-100 p-3 text-sm font-semibold text-ink-800">
                  <span className="mr-1.5 text-lagoon-600">✓</span>
                  {h}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6" aria-labelledby="villas-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="villas-heading" className="font-display text-2xl font-semibold text-ink-950">
                Choose your villa
              </h2>
              <div className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">
                {shortDate(search.checkIn)} – {shortDate(search.checkOut)} · {quote.nights} nights
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {resort.villas.map((v) => {
                const active = v.id === villaId;
                return (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${active ? 'border-lagoon-500 bg-lagoon-100/40 ring-2 ring-lagoon-300' : 'border-sand-200 hover:border-lagoon-400'}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="villa"
                        checked={active}
                        onChange={() => setVillaId(v.id)}
                        className="mt-1 size-4 accent-lagoon-600"
                      />
                      <div>
                        <div className="font-bold text-ink-950">{v.name}</div>
                        <div className="mt-0.5 text-sm text-ink-500">
                          {v.sizeSqm} m² · sleeps {v.capacity} · {v.beds} · {v.view} view{v.pool ? ' · private pool' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-ink-950">${v.basePrice.toLocaleString()}</div>
                      <div className="text-xs text-ink-500">base / night</div>
                    </div>
                  </label>
                );
              })}
            </div>

            <h3 className="mt-6 font-display text-xl font-semibold text-ink-950">Meal plan</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MEAL_PLANS.filter((m) => resort.mealPlans.includes(m.code)).map((m) => {
                const active = m.code === plan;
                return (
                  <button
                    key={m.code}
                    onClick={() => setPlan(m.code)}
                    className={`rounded-xl border p-3 text-left transition ${active ? 'border-lagoon-500 bg-lagoon-100/50 ring-2 ring-lagoon-300' : 'border-sand-200 hover:border-lagoon-400'}`}
                    aria-pressed={active}
                  >
                    <div className="text-xs font-bold uppercase tracking-wide text-lagoon-700">{m.code}</div>
                    <div className="font-semibold text-ink-950">{m.name}</div>
                    <div className="text-xs text-ink-500">{m.ppn === 0 ? 'included in rate' : `+$${m.ppn}/person/day`}</div>
                  </button>
                );
              })}
            </div>

            <h3 className="mt-6 font-display text-xl font-semibold text-ink-950">Transfer & arrival</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-sand-100 p-4 text-sm">
                <div className="font-bold text-ink-950">{TRANSFER_LABEL[transfer]}</div>
                <div className="mt-1 text-ink-700">
                  {resort.transferMinutes} minutes · ${TRANSFER_RATE[transfer]} per person round trip — included in your
                  quote as <strong>${quote.transferTotal.toLocaleString()}</strong> for all guests.
                </div>
                {transfer === 'seaplane' && (
                  <div className="mt-2 text-xs font-semibold text-coral-600">
                    Seaplanes fly 06:00–16:00 only. Enter your arrival flight to check compatibility.
                  </div>
                )}
              </div>
              <label className="text-sm font-bold text-ink-700">
                Arrival time at Velana (MLE)
                <input
                  type="time"
                  value={arrival}
                  onChange={(e) => setArrival(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300"
                />
              </label>
            </div>
            {warning && (
              <div role="alert" className="mt-3 rounded-xl border border-coral-500 bg-coral-500/10 p-4 text-sm font-semibold text-coral-600">
                {warning}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold text-ink-950">Amenities</h2>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {resort.amenities.map((a) => (
                <div key={a} className="flex items-center gap-2 rounded-lg bg-sand-100 px-3 py-2 text-sm font-semibold text-ink-800">
                  <span className="text-lagoon-600">●</span>
                  {a}
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-xl">
            <div className="rounded-2xl bg-ink-900 p-3">
              <SearchStrip compact />
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Package total</div>
                <div className="text-4xl font-bold text-ink-950">
                  ${quote.total.toLocaleString()}
                </div>
                <div className="text-xs text-ink-500">
                  {quote.nights} nights · {search.adults + search.children} guests · ${quote.perPersonNight}/person/night
                </div>
              </div>
              {member && <span className="rounded-full bg-coral-500 px-2.5 py-1 text-xs font-bold text-white">Member −10%</span>}
            </div>

            <dl className="mt-4 space-y-2 border-t border-dashed border-sand-300 pt-4 text-sm">
              {breakdown.map(([k, v, hint]) => (
                <div key={k} className="flex items-start justify-between gap-3">
                  <dt className="text-ink-700">
                    {k}
                    {hint && <span className="block text-xs text-ink-500">{hint}</span>}
                  </dt>
                  <dd className="font-semibold tabular-nums text-ink-950">{v}</dd>
                </div>
              ))}
            </dl>

            <button
              onClick={reserve}
              disabled={!!warning}
              className="mt-4 w-full rounded-xl bg-coral-500 py-3.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
            >
              {warning ? 'Fix transfer conflict' : 'Reserve — go to checkout'}
            </button>
            <p className="mt-2 text-center text-xs text-ink-500">
              {quote.nights >= 5 ? 'Free cancellation until 48h before arrival' : 'Non-refundable rate · pay now or later'}
            </p>

            <div className="mt-4 rounded-xl bg-sand-100 p-3 text-xs text-ink-700">
              <div className="font-bold text-ink-950">Stay summary</div>
              <div className="mt-1">
                {longDate(search.checkIn)} → {longDate(search.checkOut)}
              </div>
              <div>
                {villa.name} · {MEAL_PLANS.find((m) => m.code === plan)?.name}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
