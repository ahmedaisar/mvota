import type { Resort, TransferType } from '../types';

export function Stars({ n, className = '' }: { n: number; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-gold-500 ${className}`} aria-label={`${n} star hotel`}>
      {Array.from({ length: n }, (_, i) => (
        <svg key={i} width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2l2.9 6.6 7.1.7-5.4 4.8 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.3l7.1-.7z" />
        </svg>
      ))}
    </span>
  );
}

export function RatingBadge({ rating, reviews, dark = false }: { rating: number; reviews?: number; dark?: boolean }) {
  const label = rating >= 9 ? 'Exceptional' : rating >= 8.5 ? 'Excellent' : rating >= 8 ? 'Very good' : 'Good';
  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-lg px-2 py-1 text-sm font-bold ${dark ? 'bg-white text-lagoon-700' : 'bg-lagoon-600 text-white'}`}
      >
        {rating.toFixed(1)}
      </span>
      <span className={`text-xs font-semibold ${dark ? 'text-ink-100' : 'text-ink-700'}`}>
        {label}
        {reviews !== undefined && <span className={`ml-1 font-normal ${dark ? 'text-ink-300' : 'text-ink-500'}`}>({reviews.toLocaleString()} reviews)</span>}
      </span>
    </div>
  );
}

const TRANSFER_ICON: Record<TransferType, string> = {
  speedboat: 'M3 17c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M5 14l2-6h10l2 6M12 8V5m-3 0h6',
  seaplane: 'M2 14h20M12 4v7M4 11l8-4 8 4M7 17h2m6 0h2',
  domestic: 'M2 12l20-6-6 14-3-5-5 3 1-6z',
};

export function TransferChip({ type, minutes, className = '' }: { type: TransferType; minutes: number; className?: string }) {
  const labels: Record<TransferType, string> = {
    speedboat: `${minutes} min speedboat`,
    seaplane: `${minutes} min seaplane`,
    domestic: `${minutes} min domestic flight`,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={TRANSFER_ICON[type]} />
      </svg>
      {labels[type]}
    </span>
  );
}

export function PriceBlock({
  resort,
  member,
  fromPrice,
  className = '',
}: {
  resort: Resort;
  member: boolean;
  fromPrice: number;
  className?: string;
}) {
  const gross = member ? Math.round(fromPrice / 0.9) : fromPrice;
  return (
    <div className={`text-right ${className}`}>
      {member && (
        <div className="text-xs text-ink-500 line-through decoration-coral-500 decoration-2">${gross.toLocaleString()}</div>
      )}
      <div className="text-2xl font-bold text-ink-950">
        ${fromPrice.toLocaleString()}
        <span className="text-sm font-medium text-ink-500"> total</span>
      </div>
      <div className="text-xs text-ink-500">
        {resort.stars}-star · {resort.island}
      </div>
      {member && <div className="text-xs font-bold text-coral-600">Member price −10%</div>}
    </div>
  );
}
