import { Link, useNavigate } from 'react-router-dom';
import type { MealPlanCode, Resort } from '../types';
import { useApp } from '../store/AppContext';
import { ATOLL_MAP, MEAL_PLAN_MAP, TRANSFER_LABEL } from '../data/resorts';
import { TRANSFER_BY_ATOLL, fromPrice } from '../lib/pricing';
import { shortDate } from '../lib/format';
import Scene from './Scene';
import { RatingBadge, Stars, TransferChip } from './ui';

export default function ResortCard({ resort }: { resort: Resort }) {
  const { search, member, toggleSaved, isSaved } = useApp();
  const navigate = useNavigate();
  const guests = search.adults + search.children;
  const total = fromPrice(resort, !!member, search.checkIn, search.checkOut, guests);
  const transfer = TRANSFER_BY_ATOLL[resort.atollId];
  const saved = isSaved(resort.slug);
  const nights = Math.max(1, Math.round((+new Date(search.checkOut) - +new Date(search.checkIn)) / 86_400_000));
  const cheapestVilla = [...resort.villas].sort((a, b) => a.basePrice - b.basePrice)[0];

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-sand-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="relative">
        <Link to={`/resort/${resort.slug}`} aria-label={resort.name}>
          <Scene resort={resort} className="h-52 w-full object-cover" />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {resort.promoted && <span className="rounded-full bg-gold-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-950">Featured</span>}
          {member && <span className="rounded-full bg-coral-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Member −10%</span>}
          {resort.houseReef && <span className="rounded-full bg-ink-950/70 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">House reef</span>}
        </div>
        <button
          onClick={() => toggleSaved(resort.slug)}
          aria-label={saved ? 'Remove from saved' : 'Save stay'}
          aria-pressed={saved}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink-700 shadow transition hover:scale-110 hover:text-coral-500"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Stars n={resort.stars} />
            <Link to={`/resort/${resort.slug}`}>
              <h3 className="mt-1 font-display text-lg font-semibold leading-snug text-ink-950 group-hover:text-lagoon-700">{resort.name}</h3>
            </Link>
            <p className="text-xs text-ink-500">
              {resort.island} · {ATOLL_MAP[resort.atollId]?.name}
            </p>
          </div>
          <RatingBadge rating={resort.rating} reviews={resort.reviews} />
        </div>

        <div className="flex flex-wrap gap-1.5">
          <TransferChip type={transfer} minutes={resort.transferMinutes} />
          {resort.mealPlans.slice(0, 3).map((m) => (
            <span key={m} className="rounded-full border border-sand-300 px-2 py-1 text-xs font-semibold text-ink-700">
              {MEAL_PLAN_MAP[m as MealPlanCode].short}
            </span>
          ))}
        </div>

        <p className="line-clamp-2 text-sm leading-relaxed text-ink-700">{resort.summary}</p>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-sand-300 pt-3">
          <div className="text-xs text-ink-500">
            <div>
              {shortDate(search.checkIn)} – {shortDate(search.checkOut)} · {nights} nights
            </div>
            <div className="font-semibold text-ink-700">
              {cheapestVilla.name} · {TRANSFER_LABEL[transfer]}
            </div>
            <div>All taxes included</div>
          </div>
          <div className="text-right">
            {member && <div className="text-xs text-ink-500 line-through">${Math.round(total / 0.9).toLocaleString()}</div>}
            <div className="text-2xl font-bold text-ink-950">
              ${total.toLocaleString()}
            </div>
            <div className="text-[11px] text-ink-500">package total · {guests} guest{guests > 1 ? 's' : ''}</div>
            <button
              onClick={() => navigate(`/resort/${resort.slug}`)}
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
