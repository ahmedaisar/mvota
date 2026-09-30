import { Link, useParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { RESORTS, ATOLL_MAP, TRANSFER_LABEL, MEAL_PLAN_MAP } from '../data/resorts';
import { TRANSFER_BY_ATOLL } from '../lib/pricing';
import { longDate, money } from '../lib/format';
import Scene from '../components/Scene';

export default function Confirmation() {
  const { code } = useParams();
  const { bookings, member } = useApp();
  const booking = bookings.find((b) => b.code === code);

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Booking not found</h1>
        <Link to="/trips" className="mt-5 inline-block rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white">
          Go to my trips
        </Link>
      </div>
    );
  }

  const resort = RESORTS.find((r) => r.id === booking.resortId);
  const transfer = resort ? TRANSFER_BY_ATOLL[resort.atollId] : 'speedboat';

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white shadow-xl">
        {resort && <Scene resort={resort} className="h-44 w-full" />}
        <div className="p-7">
          <div className="flex size-14 items-center justify-center rounded-full bg-lagoon-600 text-white">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12.5l5 5L20 6.5" />
            </svg>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold text-ink-950">You're island-bound</h1>
          <p className="mt-2 text-ink-700">
            Confirmation <strong className="text-ink-950">{booking.code}</strong> — booked under{' '}
            {booking.traveler.email || member?.email || 'your account'}.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Fact label="Stay" value={resort?.name ?? 'Resort'} />
            <Fact label="Location" value={resort ? `${resort.island} · ${ATOLL_MAP[resort.atollId]?.name}` : 'Maldives'} />
            <Fact label="Dates" value={`${longDate(booking.checkIn)} → ${longDate(booking.checkOut)} (${booking.quote.nights} nights)`} />
            <Fact label="Villa" value={resort?.villas.find((v) => v.id === booking.villaId)?.name ?? 'Villa'} />
            <Fact label="Meal plan" value={MEAL_PLAN_MAP[booking.mealPlan].name} />
            <Fact label="Transfer" value={resort ? `${TRANSFER_LABEL[transfer]} · ${resort.transferMinutes} min` : '—'} />
            <Fact label="Guests" value={`${booking.adults} adults, ${booking.children} children`} />
            <Fact label="Payment" value={booking.paymentType === 'paid' ? `Paid ${money(booking.quote.total)}` : `Pay ${money(booking.quote.total)} at resort`} />
          </div>

          <div className="mt-6 rounded-2xl bg-sand-100 p-5">
            <div className="flex items-baseline justify-between">
              <span className="font-bold text-ink-950">Total{booking.islandCashUsed > 0 ? ` (−${money(booking.islandCashUsed)} IslandCash)` : ''}</span>
              <span className="text-2xl font-bold text-ink-950">{money(booking.quote.total)}</span>
            </div>
            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-white p-3">
                <div className="font-bold text-ink-950">{booking.refundable ? 'Free cancellation' : 'Non-refundable'}</div>
                <div className="text-xs text-ink-500">
                  {booking.refundable ? 'Cancel free until 48h before arrival from Trips.' : 'This rate cannot be refunded.'}
                </div>
              </div>
              <div className="rounded-lg bg-white p-3">
                <div className="font-bold text-ink-950">Rewards</div>
                <div className="text-xs text-ink-500">
                  {money(booking.islandCashEarned)} IslandCash pending until check-out · {booking.stampsEarned} stamp
                  {booking.stampsEarned === 1 ? '' : 's'} credited after your stay
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/trips" className="rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-lagoon-700">
              View my trips
            </Link>
            <Link to="/search" className="rounded-xl border border-sand-300 px-5 py-3 text-sm font-bold text-ink-700 hover:bg-sand-50">
              Book another island
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-sand-200 p-3">
      <div className="text-xs font-bold uppercase tracking-wide text-ink-500">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-950">{value}</div>
    </div>
  );
}
