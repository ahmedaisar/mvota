import { useMemo, useState } from 'react';
import SearchStrip from '../components/SearchStrip';
import ResortCard from '../components/ResortCard';
import FiltersPanel from '../components/FiltersPanel';
import { matchesFilters } from '../lib/filters';
import { RESORTS, ATOLL_MAP } from '../data/resorts';
import { fromPrice, nightsBetween } from '../lib/pricing';
import { useApp } from '../store/AppContext';
import type { Filters, SortKey } from '../types';

const defaultFilters: Filters = {
  priceMax: 20000,
  minStars: 0,
  minRating: 0,
  transfers: [],
  mealPlans: [],
  amenities: [],
  view: 'any',
  freeCancellation: false,
};

export default function Search() {
  const { search, member } = useApp();
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortKey>('featured');
  const guests = search.adults + search.children;
  const nights = nightsBetween(search.checkIn, search.checkOut);

  const priced = useMemo(
    () =>
      RESORTS.map((r) => ({
        resort: r,
        price: fromPrice(r, !!member, search.checkIn, search.checkOut, guests),
      })),
    [member, search.checkIn, search.checkOut, guests],
  );

  const results = useMemo(() => {
    let list = priced.filter(({ resort, price }) => {
      if (search.atollId !== 'all' && resort.atollId !== search.atollId) return false;
      if (nights < 1) return false;
      return matchesFilters(resort, filters, price);
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'price_asc':
          return a.price - b.price;
        case 'price_desc':
          return b.price - a.price;
        case 'rating':
          return b.resort.rating - a.resort.rating;
        case 'distance':
          return a.resort.distanceKm - b.resort.distanceKm;
        case 'featured':
        default: {
          const score = (x: typeof a) =>
            (x.resort.promoted ? 100 : 0) + x.resort.rating * 10 + Math.min(20, x.resort.reviews / 150) - x.price / 800;
          return score(b) - score(a);
        }
      }
    });
    return list;
  }, [priced, search.atollId, filters, sort, nights]);

  const atollName = search.atollId === 'all' ? 'All atolls' : ATOLL_MAP[search.atollId]?.name;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="rounded-2xl bg-ink-900 p-5">
        <SearchStrip compact />
      </div>

      <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-950">
            {nights > 0 ? `${nights}-night stays` : 'Adjust your dates'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            {atollName} · {search.checkIn} → {search.checkOut} · {guests} guest{guests > 1 ? 's' : ''} · prices are
            tax-inclusive totals
            {member && <span className="ml-1 font-bold text-coral-600">· member −10% applied</span>}
          </p>
        </div>
        <p className="rounded-full bg-lagoon-100 px-3 py-1 text-sm font-bold text-lagoon-700">
          {results.length} resort{results.length === 1 ? '' : 's'}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <FiltersPanel filters={filters} setFilters={setFilters} sort={sort} setSort={setSort} resultCount={results.length} />

        <div>
          {nights < 1 ? (
            <div className="rounded-2xl border border-coral-400 bg-coral-500/10 p-8 text-center">
              <h2 className="font-display text-xl font-semibold text-ink-950">Check-out must be after check-in</h2>
              <p className="mt-2 text-sm text-ink-700">Pick valid dates in the search bar above.</p>
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
              <p className="mt-2 text-sm text-ink-500">Try raising the price cap or clearing the amenity filters.</p>
              <button
                onClick={() => setFilters(defaultFilters)}
                className="mt-4 rounded-xl bg-ink-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {results.map(({ resort }) => (
                <ResortCard key={resort.id} resort={resort} />
              ))}
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-6 rounded-2xl border border-dashed border-lagoon-400 bg-lagoon-100/50 p-5 text-sm text-ink-700">
              <strong className="text-ink-950">Price transparency demo:</strong> every total above already includes
              service charge (10%), TGST (17%), green tax ($6–$12/person/night) and the round-trip transfer. Signed-in
              members see the −10% discount baked in.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
