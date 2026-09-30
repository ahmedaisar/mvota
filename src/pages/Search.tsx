import { useEffect, useMemo, useState } from 'react';
import SearchStrip from '../components/SearchStrip';
import ResortCard from '../components/ResortCard';
import FiltersPanel from '../components/FiltersPanel';
import MapView from '../components/MapView';
import { matchesResult, distinctMealCodes } from '../lib/filters';
import { buildResults } from '../lib/results';
import { nightsBetween } from '../lib/pricing';
import { searchRates, type RateRow } from '../services/availability';
import { getContentByHotelIds, type HotelContent } from '../services/content';
import { useApp } from '../store/AppContext';
import type { Filters, SortKey } from '../types';

const defaultFilters: Filters = { priceMax: 20000, minStars: 0, mealPlans: [], amenities: [] };

type Status = 'idle' | 'loading' | 'error' | 'ready';

export default function Search() {
  const { search, member, currency } = useApp();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortKey>('featured');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [rows, setRows] = useState<RateRow[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [contentMap, setContentMap] = useState<Map<string, HotelContent>>(new Map());
  const [retry, setRetry] = useState(0);

  const guests = search.adults + search.children;
  const nights = nightsBetween(search.checkIn, search.checkOut);
  const datesValid = nights >= 1;

  useEffect(() => {
    if (!datesValid) {
      setStatus('idle');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const resp = await searchRates({
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          adults: search.adults,
          children: search.children,
          perPage: 50,
        });
        if (cancelled) return;
        setRows(resp.results);
        const contents = await getContentByHotelIds(resp.results.map((r) => r.hotel_id));
        if (cancelled) return;
        setContentMap(new Map(contents.map((c) => [c.hotelId, c])));
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
  }, [search.checkIn, search.checkOut, search.adults, search.children, datesValid, retry]);

  const built = useMemo(
    () =>
      buildResults(rows, contentMap, {
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guests,
        member: !!member,
      }),
    [rows, contentMap, search.checkIn, search.checkOut, guests, member],
  );

  const results = useMemo(() => {
    let list = built.filter((r) => {
      if (search.atollId !== 'all' && r.atollId !== search.atollId) return false;
      return matchesResult(r, filters);
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return a.total - b.total;
        case 'price_desc':
          return b.total - a.total;
        case 'stars':
          return (b.row.star_rating ?? 0) - (a.row.star_rating ?? 0);
        case 'featured':
        default:
          return 0; // portal order (its own relevance ranking)
      }
    });
    return list;
  }, [built, search.atollId, filters, sort]);

  const mealCodes = useMemo(() => distinctMealCodes(rows), [rows]);
  const amenityOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of built) for (const a of r.content?.amenities ?? []) set.add(a);
    return [...set].sort();
  }, [built]);

  const atollName = search.atollId === 'all' ? 'All atolls' : search.atollId;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-ink-900 p-5">
        <SearchStrip compact />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-950">
            {datesValid ? `${nights}-night stays` : 'Adjust your dates'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {atollName} · {search.checkIn} → {search.checkOut} · {guests} guest{guests > 1 ? 's' : ''} · prices are
            tax-inclusive totals
            {member && <span className="ml-1 font-bold text-coral-600">· member −10% applied</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="rounded-full bg-lagoon-100 px-3 py-1 text-sm font-bold text-lagoon-700">
            {status === 'ready' ? `${results.length} resort${results.length === 1 ? '' : 's'}` : '…'}
          </p>
          <div className="flex overflow-hidden rounded-full border border-sand-300 text-xs font-bold">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 ${view === 'list' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'}`}
              aria-pressed={view === 'list'}
            >
              List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 ${view === 'map' ? 'bg-ink-900 text-white' : 'bg-white text-ink-700 hover:bg-sand-100'}`}
              aria-pressed={view === 'map'}
            >
              Map
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersPanel
          filters={filters}
          setFilters={setFilters}
          sort={sort}
          setSort={setSort}
          resultCount={results.length}
          mealCodes={mealCodes}
          amenityOptions={amenityOptions}
        />

        <div>
          {!datesValid ? (
            <div className="rounded-2xl border border-coral-400 bg-coral-500/10 p-8 text-center">
              <h2 className="font-display text-xl font-semibold text-ink-950">Check-out must be after check-in</h2>
              <p className="mt-2 text-sm text-ink-700">Pick valid dates in the search bar above.</p>
            </div>
          ) : status === 'loading' ? (
            <div className="grid gap-5 xl:grid-cols-2" aria-busy="true" aria-label="Loading live rates">
              {Array.from({ length: 6 }, (_, i) => (
                <div key={i} className="animate-pulse rounded-2xl border border-sand-200 bg-white p-4">
                  <div className="h-40 rounded-xl bg-sand-100" />
                  <div className="mt-4 h-4 w-2/3 rounded bg-sand-100" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-sand-100" />
                  <div className="mt-4 h-8 w-1/2 rounded bg-sand-100" />
                </div>
              ))}
            </div>
          ) : status === 'error' ? (
            <div className="rounded-2xl border border-coral-400 bg-coral-500/10 p-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-coral-500/15 text-coral-600">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
                </svg>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink-950">Live rates are unavailable</h2>
              <p className="mt-2 text-sm text-ink-700">{error}</p>
              <button
                onClick={() => setRetry((r) => r + 1)}
                className="mt-4 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700"
              >
                Try again
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-sand-200 bg-white p-10 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sand-100 text-ink-500">
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-4-4" />
                </svg>
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-ink-950">No islands match those filters</h2>
              <p className="mt-2 text-sm text-ink-500">
                {built.length === 0
                  ? 'The portal returned no availability for these dates — try different dates.'
                  : 'Try raising the price cap or clearing the filters.'}
              </p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="mt-4 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700"
              >
                Clear filters
              </button>
            </div>
          ) : view === 'map' ? (
            <MapView results={results} currency={currency} />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {results.map((r) => (
                <ResortCard key={r.row.hotel_slug} result={r} />
              ))}
            </div>
          )}

          {status === 'ready' && results.length > 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-lagoon-400 bg-lagoon-100/50 p-5 text-sm text-ink-700">
              <strong className="text-ink-950">Price transparency:</strong> every total above already includes service
              charge (10%), TGST (17%) and green tax ($6/person/night). Transfers are priced per hotel when you open
              the deal. Signed-in members see the −10% discount baked in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
