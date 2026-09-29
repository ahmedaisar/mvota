import type { Filters, MealPlanCode, SortKey, TransferType, VillaView } from '../types';
import { AMENITIES, MEAL_PLANS } from '../data/resorts';

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  resultCount: number;
}

const fieldset = (title: string, children: React.ReactNode, key: string) => (
  <details key={key} className="group border-b border-sand-200 py-3">
    <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-ink-900">
      {title}
      <span className="text-ink-500 transition group-open:rotate-45">+</span>
    </summary>
    <div className="mt-2.5 space-y-1.5">{children}</div>
  </details>
);

function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-700 hover:text-ink-950">
      <input type="checkbox" checked={checked} onChange={onChange} className="size-4 accent-lagoon-600" />
      {label}
    </label>
  );
}

export default function FiltersPanel({ filters, setFilters, sort, setSort, resultCount }: Props) {
  const toggleIn = <T,>(list: T[], v: T): T[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <aside className="rounded-2xl border border-sand-200 bg-white p-5" aria-label="Search filters">
      <div className="flex items-center justify-between pb-2">
        <h2 className="font-display text-lg font-semibold text-ink-950">Filters</h2>
        <span className="rounded-full bg-lagoon-100 px-2 py-0.5 text-xs font-bold text-lagoon-700">{resultCount} stays</span>
      </div>

      <label className="block border-b border-sand-200 py-3 text-sm font-bold text-ink-900">
        Sort by
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="mt-1.5 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2 font-semibold text-ink-900 outline-none focus:border-lagoon-500"
        >
          <option value="featured">Featured (Hotels.com style)</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Guest rating</option>
          <option value="distance">Distance from Malé</option>
        </select>
      </label>

      {fieldset(
        'Popular filters',
        <>
          <Check
            label="Free cancellation"
            checked={filters.freeCancellation}
            onChange={() => setFilters({ ...filters, freeCancellation: !filters.freeCancellation })}
          />
          <Check label="House reef" checked={filters.amenities.includes('House reef')} onChange={() => setFilters({ ...filters, amenities: toggleIn(filters.amenities, 'House reef') })} />
          <Check label="Private pool" checked={filters.amenities.includes('Private pool')} onChange={() => setFilters({ ...filters, amenities: toggleIn(filters.amenities, 'Private pool') })} />
        </>,
        'f1',
      )}

      {fieldset(
        'Price for whole package',
        <>
          <input
            type="range"
            min={500}
            max={20000}
            step={250}
            value={filters.priceMax}
            onChange={(e) => setFilters({ ...filters, priceMax: Number(e.target.value) })}
            className="w-full accent-lagoon-600"
            aria-label="Maximum package price"
          />
          <div className="text-sm font-semibold text-ink-700">Up to ${filters.priceMax.toLocaleString()} total</div>
        </>,
        'f2',
      )}

      {fieldset(
        'Star rating',
        [3, 4, 5].map((s) => (
          <Check
            key={s}
            label={`${s} stars`}
            checked={filters.minStars === s}
            onChange={() => setFilters({ ...filters, minStars: filters.minStars === s ? 0 : s })}
          />
        )),
        'f3',
      )}

      {fieldset(
        'Guest rating',
        [
          { v: 0, l: 'Any rating' },
          { v: 8, l: '8+ Very good' },
          { v: 8.5, l: '8.5+ Excellent' },
          { v: 9, l: '9+ Exceptional' },
        ].map((o) => (
          <Check key={o.v} label={o.l} checked={filters.minRating === o.v} onChange={() => setFilters({ ...filters, minRating: o.v })} />
        )),
        'f4',
      )}

      {fieldset(
        'Transfer from Malé',
        (['speedboat', 'seaplane', 'domestic'] as TransferType[]).map((t) => (
          <Check
            key={t}
            label={t === 'speedboat' ? 'Speedboat (any time)' : t === 'seaplane' ? 'Seaplane (daylight only)' : 'Domestic flight + boat'}
            checked={filters.transfers.includes(t)}
            onChange={() => setFilters({ ...filters, transfers: toggleIn(filters.transfers, t) })}
          />
        )),
        'f5',
      )}

      {fieldset(
        'Meal plan',
        MEAL_PLANS.map((m) => (
          <Check
            key={m.code}
            label={m.name}
            checked={filters.mealPlans.includes(m.code as MealPlanCode)}
            onChange={() => setFilters({ ...filters, mealPlans: toggleIn(filters.mealPlans, m.code as MealPlanCode) })}
          />
        )),
        'f6',
      )}

      {fieldset(
        'Villa view',
        (['any', 'beach', 'overwater', 'garden'] as (VillaView | 'any')[]).map((v) => (
          <Check
            key={v}
            label={v === 'any' ? 'Any view' : v === 'overwater' ? 'Overwater' : v === 'beach' ? 'Beachfront' : 'Garden'}
            checked={filters.view === v}
            onChange={() => setFilters({ ...filters, view: v })}
          />
        )),
        'f7',
      )}

      {fieldset(
        'Amenities',
        AMENITIES.map((a) => (
          <Check key={a} label={a} checked={filters.amenities.includes(a)} onChange={() => setFilters({ ...filters, amenities: toggleIn(filters.amenities, a) })} />
        )),
        'f8',
      )}

      <button
        onClick={() =>
          setFilters({
            priceMax: 20000,
            minStars: 0,
            minRating: 0,
            transfers: [],
            mealPlans: [],
            amenities: [],
            view: 'any',
            freeCancellation: false,
          })
        }
        className="mt-4 w-full rounded-xl border border-sand-300 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50"
      >
        Clear all
      </button>
    </aside>
  );
}
