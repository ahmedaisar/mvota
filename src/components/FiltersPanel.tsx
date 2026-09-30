import type { Filters, MealPlanCode, SortKey } from '../types';
import { MEAL_PLAN_MAP } from '../data/resorts';

interface Props {
  filters: Filters;
  setFilters: (f: Filters) => void;
  sort: SortKey;
  setSort: (s: SortKey) => void;
  resultCount: number;
  /** Meal codes present in the live result set. */
  mealCodes: MealPlanCode[];
  /** CMS amenity tags present in the live result set. */
  amenityOptions: string[];
}

const defaultFilters: Filters = { priceMax: 20000, minStars: 0, mealPlans: [], amenities: [] };

const fieldset = (title: string, children: React.ReactNode, key: string) => (
  <details key={key} className="group border-b border-sand-200 py-3" open>
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

export default function FiltersPanel({ filters, setFilters, sort, setSort, resultCount, mealCodes, amenityOptions }: Props) {
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
          <option value="featured">Recommended</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="stars">Star rating</option>
        </select>
      </label>

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

      {mealCodes.length > 0 &&
        fieldset(
          'Meal plan',
          mealCodes.map((code) => (
            <Check
              key={code}
              label={MEAL_PLAN_MAP[code]?.name ?? code}
              checked={filters.mealPlans.includes(code)}
              onChange={() => setFilters({ ...filters, mealPlans: toggleIn(filters.mealPlans, code) })}
            />
          )),
          'f6',
        )}

      {amenityOptions.length > 0 &&
        fieldset(
          'Amenities',
          amenityOptions.slice(0, 12).map((a) => (
            <Check
              key={a}
              label={a}
              checked={filters.amenities.includes(a)}
              onChange={() => setFilters({ ...filters, amenities: toggleIn(filters.amenities, a) })}
            />
          )),
          'f8',
        )}

      <button
        onClick={() => setFilters(defaultFilters)}
        className="mt-4 w-full rounded-xl border border-sand-300 py-2 text-sm font-semibold text-ink-700 hover:bg-sand-50"
      >
        Clear all
      </button>
    </aside>
  );
}
