import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Scene from '../components/Scene';
import { ATOLL_MAP, MEAL_PLAN_MAP, RESORT_BY_SLUG, TRANSFER_LABEL } from '../data/resorts';
import { TRANSFER_BY_ATOLL, buildQuote, seaplaneArrivalWarning } from '../lib/pricing';
import { bookingCode, longDate, money } from '../lib/format';
import { useApp } from '../store/AppContext';
import type { Booking, Traveler } from '../types';

const emptyTraveler: Traveler = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  arrivalFlight: '',
  requests: '',
};

export default function Checkout() {
  const [params] = useSearchParams();
  const resort = RESORT_BY_SLUG[params.get('resort') ?? ''];
  const villaId = params.get('villa') ?? '';
  const planParam = params.get('plan');
  const villa = resort?.villas.find((v) => v.id === villaId);

  const { search, member, rewards, addBooking, redeemIslandCash } = useApp();
  const navigate = useNavigate();

  const plan = planParam && resort?.mealPlans.includes(planParam as keyof typeof MEAL_PLAN_MAP)
    ? (planParam as keyof typeof MEAL_PLAN_MAP)
    : resort?.mealPlans[0];

  const [traveler, setTraveler] = useState<Traveler>(() => ({
    ...emptyTraveler,
    email: member?.email ?? '',
    firstName: member?.name.split(' ')[0] ?? '',
    lastName: member?.name.split(' ').slice(1).join(' ') ?? '',
  }));
  const [paymentType, setPaymentType] = useState<'pay_now' | 'pay_later'>('pay_now');
  const [useCash, setUseCash] = useState(false);
  const [arrival, setArrival] = useState('');

  const cashApplied = useCash && member ? Math.min(rewards.islandCash, 2000) : 0;

  const quote = useMemo(() => {
    if (!resort || !villa || !plan) return null;
    return buildQuote({
      resort,
      villa,
      mealPlan: plan,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      children: search.children,
      member: !!member,
      islandCashApplied: cashApplied,
    });
  }, [resort, villa, plan, search, member, cashApplied]);

  if (!resort || !villa || !plan || !quote) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Your session expired</h1>
        <p className="mt-2 text-ink-500">Pick a resort again to rebuild your quote.</p>
        <Link to="/search" className="mt-5 inline-block rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white">
          Back to search
        </Link>
      </div>
    );
  }

  const transfer = TRANSFER_BY_ATOLL[resort.atollId];
  const warning = seaplaneArrivalWarning(arrival, transfer);
  const refundable = quote.nights >= 5;
  const stampProgress = rewards.stamps;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (warning) return;
    const id = `${Date.now()}`;
    const total = quote.total;
    const booking: Booking = {
      id,
      code: bookingCode(id + villa.id + search.checkIn),
      resortId: resort.id,
      villaId: villa.id,
      mealPlan: plan,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      children: search.children,
      rooms: search.rooms,
      paymentType,
      refundable,
      traveler: { ...traveler, arrivalFlight: traveler.arrivalFlight || arrival },
      quote,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      islandCashUsed: cashApplied,
      islandCashEarned: member && paymentType === 'pay_now' ? Math.round(total * 0.02) : 0,
      stampsEarned: quote.nights,
    };
    addBooking(booking);
    if (cashApplied) redeemIslandCash(cashApplied);
    navigate(`/confirmation/${booking.code}`);
  };

  const field = 'mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to={`/resort/${resort.slug}`} className="text-sm font-semibold text-lagoon-700 hover:underline">
        ← Back to {resort.name}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">Checkout</h1>
      <p className="mt-1 text-sm text-ink-500">
        {longDate(search.checkIn)} → {longDate(search.checkOut)} · {quote.nights} nights
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <form onSubmit={submit} className="space-y-6">
          <section className="rounded-3xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-ink-950">Lead traveler</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-ink-700">
                First name
                <input required value={traveler.firstName} onChange={(e) => setTraveler({ ...traveler, firstName: e.target.value })} className={field} autoComplete="given-name" />
              </label>
              <label className="text-sm font-bold text-ink-700">
                Last name
                <input required value={traveler.lastName} onChange={(e) => setTraveler({ ...traveler, lastName: e.target.value })} className={field} autoComplete="family-name" />
              </label>
              <label className="text-sm font-bold text-ink-700">
                Email
                <input required type="email" value={traveler.email} onChange={(e) => setTraveler({ ...traveler, email: e.target.value })} className={field} autoComplete="email" />
              </label>
              <label className="text-sm font-bold text-ink-700">
                Phone (for transfer ops)
                <input required type="tel" placeholder="+960 …" value={traveler.phone} onChange={(e) => setTraveler({ ...traveler, phone: e.target.value })} className={field} autoComplete="tel" />
              </label>
            </div>

            <h2 className="mt-6 font-display text-xl font-semibold text-ink-950">Arrival</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-bold text-ink-700">
                Arrival flight number
                <input value={traveler.arrivalFlight} onChange={(e) => setTraveler({ ...traveler, arrivalFlight: e.target.value })} placeholder="QR6764 / EK656" className={field} />
              </label>
              <label className="text-sm font-bold text-ink-700">
                Landing time at Velana (MLE)
                <input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} className={field} />
              </label>
            </div>
            {warning && (
              <div role="alert" className="mt-3 rounded-xl border border-coral-500 bg-coral-500/10 p-4 text-sm font-semibold text-coral-600">
                {warning}
              </div>
            )}
            <label className="mt-4 block text-sm font-bold text-ink-700">
              Special requests
              <textarea
                rows={3}
                value={traveler.requests}
                onChange={(e) => setTraveler({ ...traveler, requests: e.target.value })}
                placeholder="Honeymoon setup, dietary needs, late transfer…"
                className={field}
              />
            </label>
          </section>

          <section className="rounded-3xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-xl font-semibold text-ink-950">Payment</h2>
            <div className="mt-4 space-y-3">
              {([
                { id: 'pay_now', title: 'Pay now', note: 'Card charged today · earn 2% IslandCash immediately' },
                { id: 'pay_later', title: 'Pay at the resort', note: 'Hold with card, settle on arrival · rewards post after stay' },
              ] as const).map((opt) => (
                <label
                  key={opt.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${paymentType === opt.id ? 'border-lagoon-500 bg-lagoon-100/40 ring-2 ring-lagoon-300' : 'border-sand-200 hover:border-lagoon-400'}`}
                >
                  <input type="radio" name="pay" checked={paymentType === opt.id} onChange={() => setPaymentType(opt.id)} className="mt-1 size-4 accent-lagoon-600" />
                  <span>
                    <span className="block font-bold text-ink-950">{opt.title}</span>
                    <span className="block text-sm text-ink-500">{opt.note}</span>
                  </span>
                </label>
              ))}
            </div>

            {member && rewards.islandCash > 0 && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-gold-500 bg-gold-500/10 p-4">
                <input type="checkbox" checked={useCash} onChange={(e) => setUseCash(e.target.checked)} className="mt-1 size-4 accent-gold-500" />
                <span>
                  <span className="block font-bold text-ink-950">Use IslandCash — ${Math.min(rewards.islandCash, 2000)} available</span>
                  <span className="block text-sm text-ink-700">Applies to the room & board subtotal before taxes.</span>
                </span>
              </label>
            )}

            <div className="mt-4 rounded-xl bg-sand-100 p-3 text-xs text-ink-700">
              Demo checkout — no real card is collected. Submitting creates a local booking visible under Trips.
            </div>
          </section>

          <button
            type="submit"
            disabled={!!warning}
            className="w-full rounded-xl bg-coral-500 py-4 text-base font-bold text-white shadow-lg shadow-coral-500/30 transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
          >
            {paymentType === 'pay_now' ? `Confirm & pay ${money(quote.total)}` : `Confirm — pay ${money(quote.total)} at resort`}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-xl">
            <Scene resort={resort} className="h-40 w-full" />
            <div className="p-5">
              <div className="font-display text-lg font-semibold text-ink-950">{resort.name}</div>
              <div className="text-xs text-ink-500">
                {ATOLL_MAP[resort.atollId]?.name} · {TRANSFER_LABEL[transfer]} {resort.transferMinutes} min
              </div>
              <div className="mt-3 rounded-xl bg-sand-100 p-3 text-sm">
                <div className="font-bold text-ink-950">{villa.name}</div>
                <div className="text-ink-700">
                  {MEAL_PLAN_MAP[plan].name} · {search.adults + search.children} guests · {search.rooms} room
                  {search.rooms > 1 ? 's' : ''}
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label={`Villa × ${quote.nights} nights`} value={money(quote.roomSubtotal)} />
                <Row label="Meal plan" value={money(quote.mealUplift)} />
                {quote.memberDiscount > 0 && <Row label="Member −10%" value={`−${money(quote.memberDiscount)}`} accent />}
                {cashApplied > 0 && <Row label="IslandCash applied" value={`−${money(cashApplied)}`} accent />}
                <Row label="Service charge (10%)" value={money(quote.serviceCharge)} />
                <Row label="TGST (17%)" value={money(quote.tgst)} />
                <Row label="Green tax" value={money(quote.greenTax)} />
                <Row label={TRANSFER_LABEL[transfer]} value={money(quote.transferTotal)} />
              </dl>

              <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-sand-300 pt-3">
                <span className="font-bold text-ink-950">Total</span>
                <span className="text-3xl font-bold text-ink-950">{money(quote.total)}</span>
              </div>
              <div className="text-right text-xs text-ink-500">{money(quote.perPersonNight)} per person / night, all in</div>

              <div className="mt-4 space-y-1.5 rounded-xl bg-lagoon-100/60 p-3 text-xs font-semibold text-lagoon-700">
                <div>✓ {refundable ? 'Free cancellation until 48h before arrival' : 'Non-refundable rate'}</div>
                <div>✓ Earn {member && paymentType === 'pay_now' ? money(Math.round(quote.total * 0.02)) : '$—'} IslandCash</div>
                <div>
                  ✓ Stamp progress: {stampProgress % 10}/10 nights → $100 credit
                </div>
                {transfer === 'seaplane' && <div>✓ Seaplane window 06:00–16:00 enforced above</div>}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-700">{label}</dt>
      <dd className={`font-semibold tabular-nums ${accent ? 'text-coral-600' : 'text-ink-950'}`}>{value}</dd>
    </div>
  );
}
