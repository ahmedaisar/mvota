import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp, type AuthReason } from '../store/AppContext';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors ${isActive ? 'text-lagoon-600' : 'text-ink-700 hover:text-lagoon-600'}`;

const input =
  'mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2.5 font-normal outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300';

function AuthModal({ reason, onClose }: { reason: AuthReason; onClose: () => void }) {
  const { signIn, register } = useApp();
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const afterSuccess = () => {
    onClose();
    if (reason === 'trips') navigate('/trips');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'signin') {
        const err = await signIn(email.trim(), password);
        if (err) setError(err);
        else afterSuccess();
      } else {
        if (!name.trim()) {
          setError('Enter your full name.');
          return;
        }
        const res = await register(name.trim(), email.trim(), password);
        if (res.error) setError(res.error);
        else if (res.needsConfirm) {
          setNotice(`Almost there — we sent a confirmation link to ${res.email}. Confirm your email, then sign in.`);
          setMode('signin');
        } else afterSuccess();
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-label="Account">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl animate-rise">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">
              {mode === 'signin' ? 'Sign in to Atoll' : 'Create your account'}
            </h2>
            <p className="mt-1 text-sm text-ink-500">
              {mode === 'signin'
                ? 'Member prices, IslandCash rewards and your trips.'
                : 'Free — unlocks −10% member prices and 2% IslandCash on every stay.'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink-500 hover:bg-sand-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-4 flex gap-1 rounded-xl bg-sand-100 p-1">
          {(['signin', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setError(null);
                setNotice(null);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${
                mode === m ? 'bg-white text-ink-950 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              }`}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {notice && (
          <div className="mt-4 rounded-xl border border-lagoon-500 bg-lagoon-100/60 p-3 text-sm font-semibold text-lagoon-800">
            {notice}
          </div>
        )}
        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-coral-500 bg-coral-500/10 p-3 text-sm font-semibold text-coral-600">
            {error}
          </div>
        )}

        <form className="mt-4 space-y-3" onSubmit={submit}>
          {mode === 'register' && (
            <label className="block text-sm font-semibold text-ink-700">
              Full name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
                placeholder="Aisha Rahman"
                autoComplete="name"
              />
            </label>
          )}
          <label className="block text-sm font-semibold text-ink-700">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={input}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>
          <label className="block text-sm font-semibold text-ink-700">
            Password
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              placeholder="At least 6 characters"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-ink-900 py-3 font-semibold text-white transition hover:bg-lagoon-700 disabled:opacity-60"
          >
            {busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="mt-4 rounded-xl bg-sand-100 p-3 text-xs text-ink-700">
          Signed-in members get −10% on every quote. IslandCash (2% back) posts after each stay; every 10 nights stamps
          unlock a $100 credit.
        </div>
        {!notice && (
          <p className="mt-3 text-center text-xs text-ink-500">
            {mode === 'signin' ? 'New here? ' : 'Already have an account? '}
            <button
              className="font-bold text-lagoon-700 hover:underline"
              onClick={() => {
                setMode(mode === 'signin' ? 'register' : 'signin');
                setError(null);
                setNotice(null);
              }}
            >
              {mode === 'signin' ? 'Create a free account' : 'Sign in'}
            </button>
          </p>
        )}
        {reason === 'save' && (
          <p className="mt-1 text-center text-xs text-ink-500">Sign in to save islands to your list.</p>
        )}
      </div>
    </div>
  );
}

export default function Layout() {
  const { member, signOut, rewards, saved, bookings, authModal, openAuth, closeAuth } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-sand-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2" aria-label="Atoll home">
            <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden="true">
              <circle cx="16" cy="16" r="14" fill="#0e9490" />
              <path d="M4 18c3 2 6 2 9 0s6-2 9 0 5 1.5 6 .5" stroke="#faf7f0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
              <circle cx="16" cy="12" r="4.5" fill="#d9a441" />
            </svg>
            <span className="font-display text-xl font-semibold tracking-tight text-ink-950">atoll</span>
            <span className="hidden rounded-full bg-lagoon-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-lagoon-700 sm:inline">Maldives only</span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex" aria-label="Primary">
            <NavLink to="/search" className={navLink}>Stays</NavLink>
            <NavLink to="/offers" className={navLink}>Deals</NavLink>
            <NavLink to="/trips" className={navLink}>Trips</NavLink>
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <Link to="/trips" className="relative hidden text-ink-700 hover:text-lagoon-600 sm:block" aria-label={`Saved and trips: ${saved.length} saved`}>
              <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M6 4h12a1 1 0 0 1 1 1v16l-7-4-7 4V5a1 1 0 0 1 1-1z" />
              </svg>
              {saved.length > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-coral-500 px-1.5 text-[10px] font-bold text-white">{saved.length}</span>
              )}
            </Link>
            {member ? (
              <div className="flex items-center gap-2">
                <span className="hidden text-sm font-semibold text-ink-700 sm:block">
                  {member.name.split(' ')[0]} · <span className="text-gold-500">${rewards.islandCash}</span>
                </span>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/');
                  }}
                  className="rounded-full border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-sand-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuth('header')}
                className="rounded-full bg-ink-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-lagoon-700"
              >
                Sign in
              </button>
            )}
            <button
              className="rounded-lg p-1.5 text-ink-700 hover:bg-sand-100 md:hidden"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d={menuOpen ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'} />
              </svg>
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-sand-200 bg-white px-4 py-3 md:hidden" aria-label="Mobile">
            {[
              ['/search', 'Stays'],
              ['/offers', 'Deals'],
              ['/trips', `Trips${bookings.length ? ` (${bookings.length})` : ''}`],
            ].map(([to, label]) => (
              <NavLink key={to} to={to} className="block py-2 text-sm font-semibold text-ink-700" onClick={() => setMenuOpen(false)}>
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 bg-ink-950 text-ink-100">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true">
                <circle cx="16" cy="16" r="14" fill="#12a5a0" />
                <path d="M4 18c3 2 6 2 9 0s6-2 9 0 5 1.5 6 .5" stroke="#faf7f0" strokeWidth="2.2" fill="none" strokeLinecap="round" />
                <circle cx="16" cy="12" r="4.5" fill="#d9a441" />
              </svg>
              <span className="font-display text-lg font-semibold text-white">atoll</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-300">
              One country, 1,200 islands. Atoll books Maldives resorts with tax-inclusive pricing and transfers included —
              no surprise fees at checkout.
            </p>
          </div>
          {[
            { title: 'Explore', links: [['All stays', '/search'], ['Deals', '/offers'], ['Seaplane escapes', '/search?transfer=seaplane']] },
            { title: 'Trips', links: [['My trips', '/trips'], ['Saved stays', '/trips?tab=saved'], ['Sign in', '/trips']] },
            { title: 'About', links: [['How pricing works', '/offers'], ['Contact', '/trips']] },
          ].map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-lagoon-400">{col.title}</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map(([label, to]) => (
                  <li key={label}>
                    <Link to={to} className="text-ink-100 hover:text-lagoon-300">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-ink-800 px-4 py-5 text-center text-xs text-ink-500">
          Reconstructed for research from a hotels.com teardown (see REVERSE_ENGINEERING_REPORT.md). Not affiliated with
          Hotels.com, Expedia Group or any listed resort.
        </div>
      </footer>

      {authModal.open && <AuthModal reason={authModal.reason} onClose={closeAuth} />}
    </div>
  );
}
