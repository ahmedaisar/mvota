import { useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ATOLLS } from '../data/resorts';
import { nightsBetween } from '../lib/pricing';

interface Props {
  compact?: boolean;
  onSearch?: () => void;
}

export default function SearchStrip({ compact = false, onSearch }: Props) {
  const { search, setSearch } = useApp();
  const navigate = useNavigate();

  const field = 'w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm font-semibold text-ink-900 outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300';

  const submit = () => {
    const nights = nightsBetween(search.checkIn, search.checkOut);
    if (nights < 1) return;
    onSearch?.();
    navigate('/search');
  };

  return (
    <div className={compact ? 'grid gap-3 sm:grid-cols-5' : 'grid gap-3 rounded-2xl bg-white p-4 shadow-xl ring-1 ring-sand-200 sm:grid-cols-5 sm:p-5'}>
      <label className="block text-xs font-bold uppercase tracking-wide text-ink-500">
        Atoll
        <select
          className={`mt-1 ${field}`}
          value={search.atollId}
          onChange={(e) => setSearch({ ...search, atollId: e.target.value })}
          aria-label="Atoll"
        >
          <option value="all">All atolls</option>
          {ATOLLS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-xs font-bold uppercase tracking-wide text-ink-500">
        Check-in
        <input
          type="date"
          className={`mt-1 ${field}`}
          value={search.checkIn}
          min={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setSearch({ ...search, checkIn: e.target.value })}
        />
      </label>
      <label className="block text-xs font-bold uppercase tracking-wide text-ink-500">
        Check-out
        <input
          type="date"
          className={`mt-1 ${field}`}
          value={search.checkOut}
          min={search.checkIn}
          onChange={(e) => setSearch({ ...search, checkOut: e.target.value })}
        />
      </label>
      <label className="block text-xs font-bold uppercase tracking-wide text-ink-500">
        Guests
        <select
          className={`mt-1 ${field}`}
          value={`${search.adults}-${search.children}`}
          onChange={(e) => {
            const [a, c] = e.target.value.split('-').map(Number);
            setSearch({ ...search, adults: a, children: c });
          }}
          aria-label="Guests"
        >
          {[1, 2, 3, 4, 5, 6].map((a) =>
            [0, 1, 2].map((c) => (
              <option key={`${a}-${c}`} value={`${a}-${c}`}>
                {a} adult{a > 1 ? 's' : ''}, {c} child{c === 1 ? '' : 'ren'}
              </option>
            )),
          )}
        </select>
      </label>
      <div className="flex items-end">
        <button
          onClick={submit}
          className="w-full rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-coral-500/30 transition hover:bg-coral-600"
        >
          Search stays
        </button>
      </div>
    </div>
  );
}
