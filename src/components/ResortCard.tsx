import { Link, useNavigate } from 'react-router-dom';
import type { CompareItem } from '../types';
import { useApp } from '../store/AppContext';
import { MEAL_PLAN_MAP } from '../data/resorts';
import { toMealCode } from '../services/availability';
import { money, shortDate } from '../lib/format';
import { nightsBetween } from '../lib/pricing';
import type { RateResult } from '../lib/results';
import HotelImage from './HotelImage';
import { Stars } from './ui';

export default function ResortCard({ result }: { result: RateResult }) {
  const { search, member, currency, toggleSaved, isSaved, compare, toggleCompare } = useApp();
  const navigate = useNavigate();
  const { row, content, atollLabel, total } = result;
  const guests = search.adults + search.children;
  const nights = nightsBetween(search.checkIn, search.checkOut);
  const saved = isSaved(row.hotel_slug);
  const inCompare = compare.some((c) => c.slug === row.hotel_slug);
  const mealCode = toMealCode(row.meal_plan);
  const mealName = MEAL_PLAN_MAP[mealCode]?.short ?? row.meal_plan;
  const photo = content?.photos[0] ?? null;

  const compareItem: CompareItem = {
    slug: row.hotel_slug,
    hotelId: row.hotel_id,
    name: row.hotel_name,
    atollLabel,
    stars: row.star_rating,
    meal: mealName,
    total,
    photo,
  };

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <Link to={`/resort/${row.hotel_slug}`} aria-label={row.hotel_name}>
          <HotelImage name={row.hotel_name} photo={photo} className="h-52 w-full" />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {member && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Member −10%</span>}
          {row.availability === 'on_request' && (
            <span className="rounded-full bg-ink-950/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">On request</span>
          )}
        </div>
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            onClick={() => toggleSaved(row.hotel_slug, { hotelId: row.hotel_id, name: row.hotel_name })}
            aria-label={saved ? 'Remove from saved' : 'Save stay'}
            aria-pressed={saved}
            className="rounded-full bg-white/90 p-2 text-ink-700 shadow transition hover:scale-110 hover:text-coral-500"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
              <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Stars n={row.star_rating ?? 0} />
            <Link to={`/resort/${row.hotel_slug}`}>
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink-950 group-hover:text-lagoon-700">{row.hotel_name}</h3>
            </Link>
            <p className="text-xs text-ink-500">{atollLabel}</p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-sand-300 px-2.5 py-1 text-xs font-bold text-ink-700 hover:border-lagoon-500 hover:text-lagoon-700">
            <input
              type="checkbox"
              checked={inCompare}
              onChange={() => toggleCompare(compareItem)}
              className="size-3.5 accent-lagoon-600"
              aria-label={`Compare ${row.hotel_name}`}
            />
            Compare
          </label>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-sand-300 px-2 py-1 text-xs font-semibold text-ink-700">{mealName}</span>
          <span className="rounded-full border border-sand-300 px-2 py-1 text-xs font-semibold text-ink-700">{row.room_type}</span>
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-sand-300 pt-3">
          <div className="text-xs text-ink-500">
            <div>
              {shortDate(search.checkIn)} – {shortDate(search.checkOut)} · {nights} night{nights === 1 ? '' : 's'}
            </div>
            <div className="font-semibold text-ink-700">{row.room_type}</div>
            <div>Taxes & fees included</div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-ink-950">{money(total, currency)}</div>
            <div className="text-[11px] text-ink-500">package total · {guests} guest{guests > 1 ? 's' : ''}</div>
            <button
              onClick={() => navigate(`/resort/${row.hotel_slug}`)}
              className="mt-2 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-lagoon-700"
            >
              View deal
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
