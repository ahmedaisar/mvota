import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SearchStrip from '../components/SearchStrip';
import HotelImage from '../components/HotelImage';
import { MEAL_PLAN_MAP } from '../data/resorts';
import { getRateQuote, toMealCode, type RateQuote, type RoomRate } from '../services/availability';
import { getContentByHotelId, type HotelContent } from '../services/content';
import { deleteReview, listReviews, saveReview, type Review } from '../services/reviews';
import { regionLabel } from '../lib/regions';
import { buildLiveQuote, seaplaneArrivalWarning } from '../lib/pricing';
import { longDate, money, shortDate } from '../lib/format';
import { useApp } from '../store/AppContext';
import { Stars } from '../components/ui';

type Status = 'loading' | 'error' | 'ready';

function roomKey(r: RoomRate): string {
  return `${r.room_name}|${r.meal_plan}`;
}

function policyText(policy: unknown): string | null {
  if (!policy) return null;
  if (typeof policy === 'string') return policy.trim() || null;
  if (typeof policy === 'object') {
    const o = policy as Record<string, unknown>;
    for (const k of ['text', 'description', 'policy', 'name']) {
      const v = o[k];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return null;
}

function AvailabilityChip({ value }: { value: string }) {
  const onReq = value === 'on_request';
  const label = onReq ? 'On request' : value === 'available' ? 'Available' : value.replace(/_/g, ' ');
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
        onReq ? 'bg-gold-500/20 text-gold-700' : 'bg-lagoon-100 text-lagoon-700'
      }`}
    >
      {label}
    </span>
  );
}

export default function ResortDetail() {
  const { slug = '' } = useParams();
  const { search, member, currency, session, toggleSaved, isSaved, openAuth } = useApp();
  const navigate = useNavigate();

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<RateQuote | null>(null);
  const [content, setContent] = useState<HotelContent | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [retry, setRetry] = useState(0);

  const [roomIdx, setRoomIdx] = useState(0);
  const [arrivalIdx, setArrivalIdx] = useState(0);
  const [departureIdx, setDepartureIdx] = useState(0);
  const [arrivalTime, setArrivalTime] = useState('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const guests = search.adults + search.children;
  const saved = isSaved(slug);

  useEffect(() => {
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
        setRoomIdx(0);
        const [c, rv] = await Promise.all([
          getContentByHotelId(q.hotel_id).catch(() => null),
          listReviews(q.hotel_id).catch(() => [] as Review[]),
        ]);
        if (cancelled) return;
        setContent(c);
        setReviews(rv);
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'This hotel is unavailable right now.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, search.checkIn, search.checkOut, search.adults, search.children, retry]);

  const arrivalOptions = useMemo(
    () => (quote?.transfers ?? []).filter((t) => t.direction.toLowerCase().includes('arrival')),
    [quote],
  );
  const departureOptions = useMemo(
    () => (quote?.transfers ?? []).filter((t) => t.direction.toLowerCase().includes('departure')),
    [quote],
  );
  const arrival = arrivalOptions[arrivalIdx] ?? arrivalOptions[0];
  const departure = departureOptions[departureIdx] ?? departureOptions[0];

  const selectedRoom = quote?.rooms[roomIdx];
  const netPrice = selectedRoom?.net_price ?? null;
  const transferTotal = (arrival?.net_price ?? 0) + (departure?.net_price ?? 0);
  const transferLabel = [arrival?.vehicle_type, departure?.vehicle_type].filter(Boolean).join(' + ') || 'No transfer';

  const isSeaplaneArrival = /seaplane/i.test(arrival?.vehicle_type ?? '');
  const warning = seaplaneArrivalWarning(arrivalTime, isSeaplaneArrival ? 'seaplane' : '');

  const quoteBox = useMemo(() => {
    if (netPrice === null) return null;
    return buildLiveQuote({
      netPrice,
      checkIn: search.checkIn,
      checkOut: search.checkOut,
      adults: search.adults,
      children: search.children,
      member: !!member,
      transferTotal,
    });
  }, [netPrice, search, member, transferTotal]);

  if (status === 'loading') {
    return (
      <div className="mx-auto max-w-7xl animate-pulse px-4 py-6 sm:px-6">
        <div className="h-8 w-64 rounded bg-sand-100" />
        <div className="mt-4 h-96 rounded-3xl bg-sand-100" />
      </div>
    );
  }

  if (status === 'error' || !quote) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Rates unavailable for this hotel</h1>
        <p className="mt-2 text-sm text-ink-500">{error}</p>
        <div className="mt-5 flex justify-center gap-3">
          <button
            onClick={() => setRetry((r) => r + 1)}
            className="rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700"
          >
            Try again
          </button>
          <Link to="/search" className="rounded-xl border border-sand-300 px-5 py-2.5 text-sm font-bold text-ink-700 hover:bg-sand-50">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const locationLabel = content?.atoll || regionLabel('');
  const photos = content?.photos ?? [];
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  const reserve = () => {
    if (warning || !selectedRoom || netPrice === null) return;
    const qs = new URLSearchParams({
      resort: slug,
      room: selectedRoom.room_name,
      plan: selectedRoom.meal_plan,
      transfer: String(transferTotal),
      tlabel: transferLabel,
    });
    if (arrivalTime) qs.set('arrival', arrivalTime);
    navigate(`/checkout?${qs.toString()}`);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) {
      openAuth('header');
      return;
    }
    setReviewBusy(true);
    setReviewError(null);
    try {
      const savedReview = await saveReview(session.user.id, quote.hotel_id, {
        rating: reviewRating,
        title: reviewTitle,
        body: reviewBody,
      });
      setReviews((prev) => [savedReview, ...prev.filter((r) => r.userId !== savedReview.userId)]);
      setReviewOpen(false);
      setReviewTitle('');
      setReviewBody('');
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not save your review.');
    } finally {
      setReviewBusy(false);
    }
  };

  const removeReview = async (reviewId: string) => {
    if (!session) return;
    try {
      await deleteReview(session.user.id, reviewId);
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      setReviewError(err instanceof Error ? err.message : 'Could not delete the review.');
    }
  };

  const policyRows: [string, string][] = [
    ...(content?.checkInFrom ? ([['Check-in from', content.checkInFrom]] as [string, string][]) : []),
    ...(content?.checkOutUntil ? ([['Check-out until', content.checkOutUntil]] as [string, string][]) : []),
    ...(content?.cancellation ? ([['Cancellation', content.cancellation]] as [string, string][]) : []),
    ...(content?.childPolicies ? ([['Children', content.childPolicies]] as [string, string][]) : []),
    ...(content?.cotExtraBed ? ([['Cots & extra beds', content.cotExtraBed]] as [string, string][]) : []),
    ...(content?.petsAllowed !== null && content?.petsAllowed !== undefined
      ? ([[content.petsAllowed ? 'Pets allowed' : 'No pets', content.petsNotes ?? ''] ] as [string, string][])
      : []),
    ...(content?.paymentMethods.length ? ([['Payment methods', content.paymentMethods.join(', ')]] as [string, string][]) : []),
    ...(content?.finePrint ? ([['Fine print', content.finePrint]] as [string, string][]) : []),
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="mb-4 text-sm text-ink-500" aria-label="Breadcrumb">
        <Link to="/search" className="font-semibold text-lagoon-700 hover:underline">
          Search results
        </Link>{' '}
        / {quote.hotel_name}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div>
          {/* Gallery */}
          {photos.length > 0 ? (
            <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
              <button onClick={() => setLightbox(0)} className="overflow-hidden rounded-3xl border border-sand-200" aria-label="Open gallery">
                <HotelImage name={quote.hotel_name} photo={photos[0]} className="h-72 w-full sm:h-96" />
              </button>
              <div className="grid gap-2">
                {photos.slice(1, 3).map((p, i) => (
                  <button
                    key={p}
                    onClick={() => setLightbox(i + 1)}
                    className="overflow-hidden rounded-3xl border border-sand-200"
                    aria-label={`Open photo ${i + 2}`}
                  >
                    <HotelImage name={quote.hotel_name} photo={p} className="h-32 w-full sm:h-[188px]" />
                  </button>
                ))}
                {photos.length === 1 && (
                  <div className="flex items-center justify-center rounded-3xl border border-dashed border-sand-300 bg-sand-50 p-6 text-center text-xs font-semibold text-ink-500">
                    More photos coming soon
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white">
              <HotelImage name={quote.hotel_name} photo={null} className="h-56 w-full sm:h-72" />
            </div>
          )}

          <div className="mt-5 overflow-hidden rounded-3xl border border-sand-200 bg-white">
            <div className="flex flex-wrap items-start justify-between gap-4 p-5">
              <div>
                <Stars n={content?.stars ?? 0} />
                <h1 className="mt-1 font-display text-3xl font-semibold text-ink-950">{quote.hotel_name}</h1>
                <p className="mt-1 text-sm text-ink-500">
                  {locationLabel || 'Maldives'}
                  {content?.website && (
                    <>
                      {' · '}
                      <a href={content.website} target="_blank" rel="noreferrer" className="font-semibold text-lagoon-700 hover:underline">
                        Official site
                      </a>
                    </>
                  )}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AvailabilityChip value={selectedRoom?.availability ?? 'unknown'} />
                  <span className="rounded-full border border-sand-300 px-2.5 py-1 text-xs font-semibold text-ink-700">
                    {quote.rooms.length} rate option{quote.rooms.length === 1 ? '' : 's'}
                  </span>
                  {avgRating !== null && (
                    <span className="rounded-full bg-lagoon-600 px-2.5 py-1 text-xs font-bold text-white">
                      {avgRating.toFixed(1)} / 5 · {reviews.length} review{reviews.length === 1 ? '' : 's'}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => toggleSaved(slug, { hotelId: quote.hotel_id, name: quote.hotel_name })}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition ${saved ? 'border-coral-500 bg-coral-500 text-white' : 'border-sand-300 text-ink-700 hover:border-coral-500 hover:text-coral-500'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                  <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
                </svg>
                {saved ? 'Saved' : 'Save'}
              </button>
            </div>
          </div>

          {content?.description && (
            <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6">
              <p className="text-base leading-relaxed text-ink-700">{content.description}</p>
              {content.amenities.length > 0 && (
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {content.amenities.map((a) => (
                    <div key={a} className="rounded-xl bg-sand-100 p-3 text-sm font-semibold text-ink-800">
                      <span className="mr-1.5 text-lagoon-600">✓</span>
                      {a}
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* Rooms & rate plans */}
          <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6" aria-labelledby="rooms-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="rooms-heading" className="font-display text-2xl font-semibold text-ink-950">
                Choose your room
              </h2>
              <div className="rounded-full bg-sand-100 px-3 py-1 text-xs font-semibold text-ink-700">
                {shortDate(search.checkIn)} – {shortDate(search.checkOut)} ·{' '}
                {Math.max(0, Math.round((+new Date(search.checkOut) - +new Date(search.checkIn)) / 86_400_000))} nights
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {quote.rooms.map((r, i) => {
                const active = i === roomIdx;
                const priced = r.net_price !== null;
                return (
                  <label
                    key={`${roomKey(r)}-${i}`}
                    className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                      !priced
                        ? 'cursor-not-allowed border-sand-200 opacity-60'
                        : active
                          ? 'border-lagoon-500 bg-lagoon-100/40 ring-2 ring-lagoon-300'
                          : 'border-sand-200 hover:border-lagoon-400'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="room"
                        checked={active && priced}
                        disabled={!priced}
                        onChange={() => setRoomIdx(i)}
                        className="mt-1 size-4 accent-lagoon-600"
                      />
                      <div>
                        <div className="font-bold text-ink-950">{r.room_name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-500">
                          <span>{MEAL_PLAN_MAP[toMealCode(r.meal_plan)]?.name ?? (r.meal_plan || 'Room only')}</span>
                          <span>·</span>
                          <span>{r.occupancy}</span>
                          <AvailabilityChip value={r.availability} />
                        </div>
                        {r.room_features.length > 0 && (
                          <div className="mt-1 text-xs text-ink-500">{r.room_features.slice(0, 3).join(' · ')}</div>
                        )}
                        {policyText(r.cancellation_policy) && (
                          <div className="mt-1 text-xs text-lagoon-700">{policyText(r.cancellation_policy)}</div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {priced ? (
                        <>
                          <div className="text-lg font-bold text-ink-950">{money(r.net_price!, currency)}</div>
                          <div className="text-xs text-ink-500">stay total</div>
                        </>
                      ) : (
                        <div className="text-sm font-semibold text-ink-500">Price on request</div>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Transfers */}
            {(arrivalOptions.length > 0 || departureOptions.length > 0) && (
              <>
                <h3 className="mt-6 font-display text-xl font-semibold text-ink-950">Transfer & arrival</h3>
                <div className="mt-3 grid gap-4 sm:grid-cols-2">
                  {arrivalOptions.length > 0 && (
                    <div className="rounded-xl bg-sand-100 p-4 text-sm">
                      <div className="font-bold text-ink-950">To the island</div>
                      <div className="mt-2 space-y-1.5">
                        {arrivalOptions.map((t, i) => (
                          <label key={`a-${i}`} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-sand-200 bg-white px-3 py-2">
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="arrival"
                                checked={i === arrivalIdx}
                                onChange={() => setArrivalIdx(i)}
                                className="size-3.5 accent-lagoon-600"
                              />
                              <span className="font-semibold text-ink-800">{t.vehicle_type}</span>
                            </span>
                            <span className="font-bold text-ink-950">{money(t.net_price, currency)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {departureOptions.length > 0 && (
                    <div className="rounded-xl bg-sand-100 p-4 text-sm">
                      <div className="font-bold text-ink-950">Back to Malé</div>
                      <div className="mt-2 space-y-1.5">
                        {departureOptions.map((t, i) => (
                          <label key={`d-${i}`} className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-sand-200 bg-white px-3 py-2">
                            <span className="flex items-center gap-2">
                              <input
                                type="radio"
                                name="departure"
                                checked={i === departureIdx}
                                onChange={() => setDepartureIdx(i)}
                                className="size-3.5 accent-lagoon-600"
                              />
                              <span className="font-semibold text-ink-800">{t.vehicle_type}</span>
                            </span>
                            <span className="font-bold text-ink-950">{money(t.net_price, currency)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <label className="mt-4 block text-sm font-bold text-ink-700">
                  Arrival time at Velana (MLE)
                  <input
                    type="time"
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300"
                  />
                </label>
                {isSeaplaneArrival && !warning && (
                  <p className="mt-2 text-xs font-semibold text-coral-600">
                    Seaplanes fly 06:00–16:00 only. Enter your arrival flight to check compatibility.
                  </p>
                )}
                {warning && (
                  <div role="alert" className="mt-3 rounded-xl border border-coral-500 bg-coral-500/10 p-4 text-sm font-semibold text-coral-600">
                    {warning}
                  </div>
                )}
              </>
            )}
          </section>

          {/* Policies */}
          <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6">
            <h2 className="font-display text-2xl font-semibold text-ink-950">Good to know</h2>
            {policyRows.length > 0 ? (
              <dl className="mt-4 space-y-3 text-sm">
                {policyRows.map(([k, v]) => (
                  <div key={k}>
                    <dt className="font-bold text-ink-950">{k}</dt>
                    <dd className="mt-0.5 leading-relaxed text-ink-700">{v || '—'}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="mt-3 text-sm text-ink-500">
                House policies aren’t in our content library yet — the rate conditions on each room above apply.
              </p>
            )}
          </section>

          {/* Reviews */}
          <section className="mt-6 rounded-3xl border border-sand-200 bg-white p-6" aria-labelledby="reviews-heading">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="reviews-heading" className="font-display text-2xl font-semibold text-ink-950">
                Guest reviews
              </h2>
              <button
                onClick={() => (session ? setReviewOpen((v) => !v) : openAuth('header'))}
                className="rounded-xl bg-ink-900 px-4 py-2 text-xs font-bold text-white hover:bg-lagoon-700"
              >
                {session ? (reviewOpen ? 'Close' : 'Write a review') : 'Sign in to review'}
              </button>
            </div>

            {reviewOpen && session && (
              <form onSubmit={submitReview} className="mt-4 rounded-2xl border border-sand-200 bg-sand-50 p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <label className="text-sm font-bold text-ink-700">
                    Rating
                    <select
                      value={reviewRating}
                      onChange={(e) => setReviewRating(Number(e.target.value))}
                      className="mt-1 ml-2 rounded-xl border border-sand-300 bg-white px-3 py-2 font-semibold outline-none focus:border-lagoon-500"
                    >
                      {[5, 4, 3, 2, 1].map((n) => (
                        <option key={n} value={n}>
                          {n}/5
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex-1 text-sm font-bold text-ink-700">
                    Title (optional)
                    <input
                      value={reviewTitle}
                      onChange={(e) => setReviewTitle(e.target.value)}
                      placeholder="Quiet island, superb reef"
                      className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal outline-none focus:border-lagoon-500"
                    />
                  </label>
                </div>
                <label className="mt-3 block text-sm font-bold text-ink-700">
                  Your review
                  <textarea
                    required
                    rows={3}
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    placeholder="What stood out — room, food, transfer, house reef…"
                    className="mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2 font-normal outline-none focus:border-lagoon-500"
                  />
                </label>
                {reviewError && <p className="mt-2 text-sm font-semibold text-coral-600">{reviewError}</p>}
                <button
                  type="submit"
                  disabled={reviewBusy}
                  className="mt-3 rounded-xl bg-coral-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-coral-600 disabled:opacity-60"
                >
                  {reviewBusy ? 'Saving…' : 'Post review'}
                </button>
              </form>
            )}

            <div className="mt-4 space-y-4">
              {reviews.length === 0 ? (
                <p className="rounded-2xl bg-sand-50 p-5 text-sm text-ink-500">
                  No reviews yet for this stay — be the first after your trip.
                </p>
              ) : (
                reviews.map((r) => (
                  <article key={r.id} className="rounded-2xl border border-sand-200 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-lg bg-lagoon-600 px-2 py-1 text-sm font-bold text-white">{r.rating}/5</span>
                        {r.title && <span className="font-bold text-ink-950">{r.title}</span>}
                      </div>
                      <span className="text-xs text-ink-500">{shortDate(r.createdAt.slice(0, 10))}</span>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-ink-700">{r.body}</p>
                    {session?.user.id === r.userId && (
                      <button
                        onClick={() => removeReview(r.id)}
                        className="mt-2 text-xs font-semibold text-coral-600 hover:underline"
                      >
                        Delete my review
                      </button>
                    )}
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Booking sidebar */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-sand-200 bg-white p-5 shadow-xl">
            <div className="rounded-2xl bg-ink-900 p-3">
              <SearchStrip compact />
            </div>

            <div className="mt-4 flex items-baseline justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wide text-ink-500">Package total</div>
                <div className="text-4xl font-bold text-ink-950">
                  {quoteBox ? money(quoteBox.total, currency) : '—'}
                </div>
                <div className="text-xs text-ink-500">
                  {quoteBox ? `${quoteBox.nights} nights · ${guests} guests · ${money(quoteBox.perPersonNight, currency)}/person/night` : 'Select a priced room'}
                </div>
              </div>
              {member && <span className="rounded-full bg-coral-500 px-2.5 py-1 text-xs font-bold text-white">Member −10%</span>}
            </div>

            {quoteBox && (
              <dl className="mt-4 space-y-2 border-t border-dashed border-sand-300 pt-4 text-sm">
                <Row label={`${selectedRoom?.room_name} × ${quoteBox.nights} nights`} value={money(quoteBox.roomSubtotal, currency)} hint="live rate" />
                {quoteBox.longStayDiscount > 0 && <Row label="5th night free" value={`−${money(quoteBox.longStayDiscount, currency)}`} />}
                {quoteBox.memberDiscount > 0 && <Row label="Member discount" value={`−${money(quoteBox.memberDiscount, currency)}`} hint="signed-in members" />}
                <Row label="Service charge 10%" value={money(quoteBox.serviceCharge, currency)} />
                <Row label="TGST 17%" value={money(quoteBox.tgst, currency)} />
                <Row label="Green tax" value={money(quoteBox.greenTax, currency)} hint="$6/person/night" />
                {transferTotal > 0 && <Row label={transferLabel} value={money(quoteBox.transferTotal, currency)} hint="round trip" />}
              </dl>
            )}

            <button
              onClick={reserve}
              disabled={!!warning || netPrice === null}
              className="mt-4 w-full rounded-xl bg-coral-500 py-3.5 font-bold text-white shadow-lg shadow-coral-500/30 transition hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-300 disabled:shadow-none"
            >
              {warning ? 'Fix transfer conflict' : netPrice === null ? 'Room unavailable' : 'Reserve — go to checkout'}
            </button>
            <p className="mt-2 text-center text-xs text-ink-500">
              {selectedRoom?.availability === 'on_request'
                ? 'On-request rate — confirmation within 24h'
                : 'Free cancellation until 48h before arrival'}
            </p>

            <div className="mt-4 rounded-xl bg-sand-100 p-3 text-xs text-ink-700">
              <div className="font-bold text-ink-950">Stay summary</div>
              <div className="mt-1">{longDate(search.checkIn)} → {longDate(search.checkOut)}</div>
              <div>
                {selectedRoom?.room_name} ·                 {MEAL_PLAN_MAP[toMealCode(selectedRoom?.meal_plan ?? '')]?.name ?? (selectedRoom?.meal_plan || '')}
              </div>
              <div className="mt-1 text-ink-500">Transfer: {transferLabel}</div>
            </div>
          </div>
        </aside>
      </div>

      {/* Lightbox */}
      {lightbox !== null && photos.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            aria-label="Close gallery"
            className="absolute right-5 top-5 rounded-full bg-white/10 p-2 text-white hover:bg-white/25"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => ((i ?? 0) - 1 + photos.length) % photos.length);
            }}
            aria-label="Previous photo"
            className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
          >
            ‹
          </button>
          <img
            src={photos[lightbox]}
            alt={`${quote.hotel_name} photo ${lightbox + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((i) => ((i ?? 0) + 1) % photos.length);
            }}
            aria-label="Next photo"
            className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/25"
          >
            ›
          </button>
          <span className="absolute bottom-5 text-xs font-semibold text-white/70">
            {lightbox + 1} / {photos.length}
          </span>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink-700">
        {label}
        {hint && <span className="block text-xs text-ink-500">{hint}</span>}
      </dt>
      <dd className="font-semibold tabular-nums text-ink-950">{value}</dd>
    </div>
  );
}
