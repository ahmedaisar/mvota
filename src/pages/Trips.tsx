import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { longDate, money } from '../lib/format';

type Tab = 'upcoming' | 'past' | 'saved' | 'rewards';

export default function Trips() {
  const { session, member, bookings, cancelBooking, saved, rewards, refresh, dataLoading, openAuth } = useApp();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'upcoming';
  const [showAllStays, setShowAllStays] = useState(false);

  useEffect(() => {
    if (session) void refresh();
  }, [session, refresh]);

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set('tab', t);
    setParams(next, { replace: true });
  };

  if (!member) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-lagoon-100 text-lagoon-700">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
          </svg>
        </div>
        <h1 className="mt-5 font-display text-3xl font-semibold text-ink-950">Your trips live here</h1>
        <p className="mt-2 text-ink-500">
          Sign in to see bookings, saved islands and IslandCash — all synced to your account.
        </p>
        <button
          onClick={() => openAuth('trips')}
          className="mt-6 rounded-xl bg-ink-900 px-6 py-3 text-sm font-bold text-white hover:bg-lagoon-700"
        >
          Sign in or create account
        </button>
        <div className="mt-4">
          <Link to="/search" className="text-sm font-bold text-lagoon-700 hover:underline">
            Browse stays instead →
          </Link>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.checkOut >= today);
  const past = bookings.filter((b) => b.status !== 'confirmed' || b.checkOut < today);
  const progress = rewards.stamps % 10;

  const tabs: [Tab, string, number][] = [
    ['upcoming', 'Upcoming', upcoming.length],
    ['past', 'Past & cancelled', past.length],
    ['saved', 'Saved', saved.length],
    ['rewards', 'Rewards', 0],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink-950">Hello, {member.name.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-ink-500">{member.email} · IslandCash ${rewards.islandCash} · {progress}/10 stamps</p>
        </div>
        <Link to="/search" className="rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-coral-600">
          Book a stay
        </Link>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-sand-200" aria-label="Trips tabs">
        {tabs.map(([id, label, count]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-bold transition ${tab === id ? 'border-lagoon-600 text-lagoon-700' : 'border-transparent text-ink-500 hover:text-ink-900'}`}
            aria-current={tab === id ? 'page' : undefined}
          >
            {label}
            {count > 0 && <span className="ml-1.5 rounded-full bg-sand-200 px-1.5 text-xs">{count}</span>}
          </button>
        ))}
      </nav>

      <div className="mt-6">
        {tab === 'upcoming' && (
          <div className="space-y-4">
            {dataLoading && bookings.length === 0 && <Empty text="Loading your bookings…" />}
            {!dataLoading && upcoming.length === 0 && <Empty text="No upcoming island trips yet — your quote engine is waiting." />}
            {upcoming.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={() => cancelBooking(b.id)} />
            ))}
          </div>
        )}

        {tab === 'past' && (
          <div className="space-y-4">
            {past.length === 0 && <Empty text="Nothing here yet — completed and cancelled stays will appear." />}
            {past.map((b) => (
              <BookingCard key={b.id} booking={b} onCancel={() => cancelBooking(b.id)} />
            ))}
          </div>
        )}

        {tab === 'saved' && (
          <div className="grid gap-5 sm:grid-cols-2">
            {saved.length === 0 && <div className="sm:col-span-2"><Empty text="Tap the bookmark on any resort to save it for later." /></div>}
            {saved.slice(0, showAllStays ? undefined : 4).map((s) => (
              <article key={s.slug} className="flex items-center justify-between gap-4 rounded-2xl border border-sand-200 bg-white p-5">
                <div>
                  <div className="font-display text-lg font-semibold text-ink-950">{s.name ?? s.slug}</div>
                  <div className="text-xs text-ink-500">{s.hotelId ? `Hotel ${s.hotelId}` : 'Saved stay'}</div>
                </div>
                <Link
                  to={`/resort/${s.slug}`}
                  className="rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-lagoon-700"
                >
                  View live rates
                </Link>
              </article>
            ))}
          </div>
        )}

        {tab === 'rewards' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-br from-ink-900 to-ink-950 p-6 text-white">
              <div className="text-xs font-bold uppercase tracking-widest text-lagoon-400">IslandCash</div>
              <div className="mt-2 text-5xl font-bold">${rewards.islandCash}</div>
              <p className="mt-2 text-sm text-ink-300">
                {rewards.pendingIslandCash > 0 && <>${rewards.pendingIslandCash} pending after stays · </>}
                Earn 2% on every paid stay, spend up to $2,000 per booking.
              </p>
            </div>
            <div className="rounded-3xl border border-sand-200 bg-white p-6">
              <div className="text-xs font-bold uppercase tracking-widest text-lagoon-700">Night stamps</div>
              <div className="mt-3 flex gap-2">
                {Array.from({ length: 10 }, (_, i) => (
                  <span
                    key={i}
                    className={`size-8 rounded-full border-2 ${i < progress ? 'border-gold-500 bg-gold-500' : 'border-sand-300 bg-sand-100'}`}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="mt-3 text-sm text-ink-700">
                {10 - progress} more night{10 - progress === 1 ? '' : 's'} until a <strong>$100 credit</strong>. Collected{' '}
                {rewards.stamps} stamps total.
              </p>
              <div className="mt-4 rounded-xl bg-lagoon-100 p-3 text-xs font-semibold text-lagoon-700">
                Members also get −10% on every quote automatically.
              </div>
            </div>
          </div>
        )}
      </div>

      {saved.length > 0 && tab === 'saved' && saved.length > 4 && (
        <button onClick={() => setShowAllStays((v) => !v)} className="mt-4 text-sm font-bold text-lagoon-700">
          {showAllStays ? 'Show less' : `Show all ${saved.length}`}
        </button>
      )}
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-sand-300 bg-white p-10 text-center text-sm text-ink-500">
      {text}
    </div>
  );
}

function BookingCard({ booking, onCancel }: { booking: import('../types').Booking; onCancel: () => void }) {
  const { currency } = useApp();
  const cancelled = booking.status === 'cancelled';
  const hotelName = booking.hotelName ?? 'Resort stay';
  const roomName = booking.roomName ?? booking.villaId.split('|')[0] ?? 'Room';
  const transferLabel = booking.quote.transferLabel ?? 'Transfer arranged at booking';
  return (
    <div className={`rounded-2xl border bg-white p-5 ${cancelled ? 'border-sand-200 opacity-70' : 'border-sand-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-bold uppercase tracking-widest text-lagoon-700">{booking.code}</div>
          <h3 className="mt-1 font-display text-xl font-semibold text-ink-950">{hotelName}</h3>
          <p className="text-sm text-ink-500">Maldives · live-rate booking</p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${cancelled ? 'bg-sand-200 text-ink-700' : booking.status === 'completed' ? 'bg-lagoon-100 text-lagoon-700' : 'bg-lagoon-600 text-white'}`}
        >
          {cancelled ? 'Cancelled' : booking.status === 'completed' ? 'Completed' : 'Confirmed'}
        </span>
      </div>
      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
        <div>
          <div className="text-xs font-bold uppercase text-ink-500">Dates</div>
          {longDate(booking.checkIn)} → {longDate(booking.checkOut)}
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-ink-500">Room & plan</div>
          {roomName} · {booking.mealPlan}
        </div>
        <div>
          <div className="text-xs font-bold uppercase text-ink-500">Transfer</div>
          {transferLabel}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-sand-300 pt-3">
        <div className="text-sm">
          <span className="font-bold text-ink-950">{money(booking.quote.total, currency)}</span>
          <span className="text-ink-500"> · {booking.paymentType === 'paid' ? 'paid' : 'pay at resort'}</span>
        </div>
        {!cancelled && booking.status === 'confirmed' && booking.refundable && (
          <button onClick={onCancel} className="rounded-lg border border-coral-500 px-3 py-1.5 text-xs font-bold text-coral-600 hover:bg-coral-500 hover:text-white">
            Cancel free
          </button>
        )}
        {!cancelled && (!booking.refundable || booking.checkOut < new Date().toISOString().slice(0, 10)) && (
          <span className="text-xs font-semibold text-ink-500">
            {booking.refundable ? 'Stay in progress / past' : 'Non-refundable — contact support'}
          </span>
        )}
      </div>
    </div>
  );
}
