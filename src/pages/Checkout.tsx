import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import HotelImage from '../components/HotelImage';
import { MEAL_PLAN_MAP } from '../data/resorts';
import { ISLAND_CASH_RATE, buildLiveQuote, nightsBetween, seaplaneArrivalWarning } from '../lib/pricing';
import { bookingCode, longDate, money } from '../lib/format';
import { useApp } from '../store/AppContext';
import type { Booking, Traveler } from '../types';
import { getRateQuote, toMealCode, type RateQuote } from '../services/availability';
import { getContentByHotelId, type HotelContent } from '../services/content';

const emptyTraveler: Traveler = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  arrivalFlight: '',
  requests: '',
};

type Status = 'loading' | 'error' | 'ready';

export default function Checkout() {
  const [params] = useSearchParams();
  const slug = params.get('resort') ?? '';
  const roomName = params.get('room') ?? '';
  const planRaw = params.get('plan') ?? '';
  const transferParam = Number(params.get('transfer') ?? '0');
  const transferLabelParam = params.get('tlabel') ?? '';

  const { search, member, session, rewards, addBooking, redeemIslandCash, openAuth, currency } = useApp();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<RateQuote | null>(null);
  const [content, setContent] = useState<HotelContent | null>(null);
  const [retry, setRetry] = useState(0);

  const [traveler, setTraveler] = useState<Traveler>(() => ({
    ...emptyTraveler,
    email: member?.email ?? '',
    firstName: member?.name.split(' ')[0] ?? '',
    lastName: member?.name.split(' ').slice(1).join(' ') ?? '',
  }));
  const [useCash, setUseCash] = useState(false);
  const [arrival, setArrival] = useState(params.get('arrival') ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug || !roomName) {
      setStatus('error');
      setError('This checkout link is missing a room — pick your stay again.');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const q = await getRateQuote(slug, {
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          adults: search.adults,
          children: search.children,
        });
        if (cancelled) return;
        setQuote(q);
        const c = await getContentByHotelId(q.hotel_id).catch(() => null);
        if (cancelled) return;
        setContent(c);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Rates are unavailable right now.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, roomName, search.checkIn, search.checkOut, search.adults, search.children, retry]);

  const selectedRoom = useMemo(
    () => quote?.rooms.find((r) => r.room_name === roomName && r.meal_plan === planRaw),
    [quote, roomName, planRaw],
  );
  const netPrice = selectedRoom?.net_price ?? null;
  const mealCode = toMealCode(planRaw);
  const cashApplied = useCash && session ? Math.min(rewards.islandCash, 2000) : 0;

  const priceQuote = useMemo(() => {
    if (netPrice === null) return null;
    return buildLiveQuote({
      netPrice,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      children: search.children,
      member: !!session,
      transferTotal: Number.isFinite(transferParam) ? transferParam : 0,
      islandCashApplied: cashApplied,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- transfer snapshot comes from the link
  }, [netPrice, search, session, cashApplied]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6">
        <div className="h-6 w-56 rounded bg-sand-100" />
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <div className="h-96 rounded-3xl bg-sand-100" />
          <div className="h-96 rounded-3xl bg-sand-100" />
        </div>
      </div>
    );
  }

  if (status === 'error' || !quote || !selectedRoom || !priceQuote) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Rates unavailable</h1>
        <p className="mt-2 text-sm text-ink-500">{error ?? 'That room is no longer offered for your dates.'}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => setRetry((r) => r + 1)}
            className="rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-lagoon-700"
          >
            Try again
          </button>
          <Link to="/search" className="rounded-xl border border-sand-300 px-5 py-3 text-sm font-bold text-ink-700 hover:bg-sand-50">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const isSeaplane = /seaplane/i.test(transferLabelParam);
  const warning = seaplaneArrivalWarning(arrival, isSeaplane ? 'seaplane' : '');
  const refundable = !/non.?refund/i.test(String(selectedRoom.cancellation_policy ?? ''));
  const nights = nightsBetween(search.checkIn, search.checkOut);
  const earnedCash = Math.round(priceQuote.total * ISLAND_CASH_RATE);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (warning || submitting) return;
    if (!session) {
      openAuth('checkout');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const id = crypto.randomUUID();
      const booking: Booking = {
        id,
        code: bookingCode(id + roomName + search.checkIn),
        resortId: quote.hotel_id,
        villaId: `${roomName}|${planRaw}`,
        mealPlan: mealCode,
        hotelSlug: quote.hotel_slug,
        hotelName: quote.hotel_name,
        roomName: selectedRoom.room_name,
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        adults: search.adults,
        children: search.children,
        rooms: search.rooms,
        paymentType: 'pay_at_property',
        refundable,
        traveler: { ...traveler, arrivalFlight: traveler.arrivalFlight || arrival },
        quote: { ...priceQuote, transferLabel: transferLabelParam },
        status: 'confirmed',
        createdAt: new Date().toISOString(),
        islandCashUsed: cashApplied,
        islandCashEarned: earnedCash,
        stampsEarned: nights,
      };
      await addBooking(booking);
      if (cashApplied) await redeemIslandCash(cashApplied);
      navigate(`/confirmation/${booking.code}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Booking failed — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const field = 'mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <Link to={`/resort/${quote.hotel_slug}`} className="text-sm font-semibold text-lagoon-700 hover:underline">
        ← Back to {quote.hotel_name}
      </Link>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">Checkout</h1>
      <p className="mt-1 text-sm text-ink-500">
        {longDate(search.checkIn)} → {longDate(search.checkOut)} · {priceQuote.nights} nights
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
            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-lagoon-500 bg-lagoon-100/40 p-4 ring-2 ring-lagoon-300">
              <svg className="mt-0.5 shrink-0 text-lagoon-600" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="6" width="18" height="13" rx="2" />
                <path d="M3 10h18" />
              </svg>
              <span>
                <span className="block font-bold text-ink-950">Pay at the resort</span>
                <span className="block text-sm text-ink-500">
                  Your card is only held for the booking — settle {money(priceQuote.total, currency)} at check-in.
                  IslandCash and stamps post after check-out.
                </span>
              </span>
            </div>

            {session && rewards.islandCash > 0 && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-gold-500 bg-gold-500/10 p-4">
                <input type="checkbox" checked={useCash} onChange={(e) => setUseCash(e.target.checked)} className="mt-1 size-4 accent-gold-500" />
                <span>
                  <span className="block font-bold text-ink-950">Use IslandCash — ${Math.min(rewards.islandCash, 2000)} available</span>
                  <span className="block text-sm text-ink-700">Applies to the room & board subtotal before taxes.</span>
                </span>
              </label>
            )}

            {!session && (
              <div className="mt-4 rounded-2xl border border-sand-300 bg-sand-100 p-4">
                <p className="text-sm font-semibold text-ink-950">Sign in to complete your booking</p>
                <p className="mt-1 text-sm text-ink-700">
                  Booking requires an account — your trips and rewards are tied to it. Unsaved form details stay put.
                </p>
                <button
                  type="button"
                  onClick={() => openAuth('checkout')}
                  className="mt-3 w-full rounded-xl bg-ink-900 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700"
                >
                  Sign in or create account
                </button>
              </div>
            )}
          </section>

          {submitError && (
            <div role="alert" className="rounded-2xl border border-coral-500 bg-coral-500/10 p-4 text-sm font-semibold text-coral-600">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={!!warning || submitting}
            className="w-full rounded-xl bg-coral-500 py-4 text-base font-bold text-white shadow-lg shadow-coral-500/30 transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
          >
            {submitting ? 'Confirming…' : !session ? 'Sign in to book' : `Confirm — pay ${money(priceQuote.total, currency)} at resort`}
          </button>
        </form>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-xl">
            <HotelImage name={quote.hotel_name} photo={content?.photos[0] ?? null} className="h-40 w-full" />
            <div className="p-5">
              <div className="font-display text-lg font-semibold text-ink-950">{quote.hotel_name}</div>
              <div className="text-xs text-ink-500">
                {content?.atoll || 'Maldives'} · {transferLabelParam || 'Transfer arranged at booking'}
              </div>
              <div className="mt-3 rounded-xl bg-sand-100 p-3 text-sm">
                <div className="font-bold text-ink-950">{selectedRoom.room_name}</div>
                <div className="text-ink-700">
                  {MEAL_PLAN_MAP[mealCode]?.name ?? planRaw} · {search.adults + search.children} guests · {search.rooms} room
                  {search.rooms > 1 ? 's' : ''}
                </div>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <Row label={`Room × ${priceQuote.nights} nights`} value={money(priceQuote.roomSubtotal, currency)} />
                {priceQuote.longStayDiscount > 0 && <Row label="5th night free" value={`−${money(priceQuote.longStayDiscount, currency)}`} accent />}
                {priceQuote.memberDiscount > 0 && <Row label="Member −10%" value={`−${money(priceQuote.memberDiscount, currency)}`} accent />}
                {cashApplied > 0 && <Row label="IslandCash applied" value={`−${money(cashApplied, currency)}`} accent />}
                <Row label="Service charge (10%)" value={money(priceQuote.serviceCharge, currency)} />
                <Row label="TGST (17%)" value={money(priceQuote.tgst, currency)} />
                <Row label="Green tax" value={money(priceQuote.greenTax, currency)} />
                {priceQuote.transferTotal > 0 && (
                  <Row label={transferLabelParam || 'Transfer'} value={money(priceQuote.transferTotal, currency)} />
                )}
              </dl>

              <div className="mt-3 flex items-baseline justify-between border-t border-dashed border-sand-300 pt-3">
                <span className="font-bold text-ink-950">Total</span>
                <span className="text-3xl font-bold text-ink-950">{money(priceQuote.total, currency)}</span>
              </div>
              <div className="text-right text-xs text-ink-500">
                {money(priceQuote.perPersonNight, currency)} per person / night, all in
              </div>

              <div className="mt-4 space-y-1.5 rounded-xl bg-lagoon-100/60 p-3 text-xs font-semibold text-lagoon-700">
                <div>✓ {refundable ? 'Free cancellation per rate conditions' : 'Non-refundable rate'}</div>
                <div>✓ Earn {money(earnedCash, currency)} IslandCash after check-out</div>
                <div>✓ Stamp progress: {rewards.stamps % 10}/10 nights → $100 credit</div>
                {isSeaplane && <div>✓ Seaplane window 06:00–16:00 enforced above</div>}
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
