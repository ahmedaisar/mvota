import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="text-7xl font-bold text-lagoon-600">404</div>
      <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">This island doesn't exist</h1>
      <p className="mt-2 text-ink-500">Even in the Maldives's 1,200 islands, we couldn't find that one.</p>
      <div className="mt-7 flex justify-center gap-3">
        <Link to="/" className="rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white hover:bg-lagoon-700">
          Back home
        </Link>
        <Link to="/search" className="rounded-xl border border-sand-300 px-5 py-3 text-sm font-bold text-ink-700 hover:bg-sand-50">
          Browse stays
        </Link>
      </div>
    </div>
  );
}
