import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-semibold transition-colors ${isActive ? 'text-lagoon-600' : 'text-ink-700 hover:text-lagoon-600'}`;

function SignInModal({ onClose }: { onClose: () => void }) {
  const { signIn, rewards } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-label="Sign in">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl animate-rise">
        <div className="mb-1 flex items-start justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink-950">Sign in to Atoll</h2>
            <p className="mt-1 text-sm text-ink-500">Unlock member prices (10% off), IslandCash rewards and your trips.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-1 text-ink-500 hover:bg-sand-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <form
          className="mt-5 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim() || !email.trim()) return;
            signIn({ name: name.trim(), email: email.trim() });
            onClose();
            navigate('/trips');
          }}
        >
          <label className="block text-sm font-semibold text-ink-700">
            Full name
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2.5 font-normal outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300"
              placeholder="Aisha Rahman"
            />
          </label>
          <label className="block text-sm font-semibold text-ink-700">
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-sand-300 bg-sand-50 px-3 py-2.5 font-normal outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300"
              placeholder="you@example.com"
            />
          </label>
          <button type="submit" className="w-full rounded-xl bg-ink-900 py-3 font-semibold text-white transition hover:bg-lagoon-700">
            Continue
          </button>
        </form>
        <div className="mt-4 rounded-xl bg-sand-100 p-3 text-xs text-ink-700">
          Demo sign-in — no password. First stay earns 2% IslandCash; every {10} nights stamps unlock $100. Your balance:{' '}
          <strong>${rewards.islandCash}</strong>.
        </div>
        <button
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-sand-300 py-2.5 text-sm font-semibold text-ink-700 hover:bg-sand-50"
          onClick={() => {
            signIn({ name: 'Google Guest', email: 'guest@gmail.com' });
            onClose();
            navigate('/trips');
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2a5.3 5.3 0 0 1-2.3 3.5v2.9h3.7c2.2-2 3.4-5 3.4-8.6z" />
            <path fill="#34A853" d="M12 24c3.1 0 5.7-1 7.6-2.8l-3.7-2.9c-1 .7-2.3 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v3A11.5 11.5 0 0 0 12 24z" />
            <path fill="#FBBC05" d="M5.6 14.7a6.9 6.9 0 0 1 0-4.4v-3H1.8a11.5 11.5 0 0 0 0 10.4l3.8-3z" />
            <path fill="#EA4335" d="M12 4.8c1.7 0 3.2.6 4.4 1.7l3.3-3.3A11.5 11.5 0 0 0 1.8 7.3l3.8 3c.9-2.8 3.4-4.8 6.4-4.8z" />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function Layout() {
  const { member, signOut, rewards, saved, bookings } = useApp();
  const [authOpen, setAuthOpen] = useState(false);
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
                  onClick={() => {
                    signOut();
                    navigate('/');
                  }}
                  className="rounded-full border border-sand-300 px-3 py-1.5 text-xs font-semibold text-ink-700 hover:bg-sand-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
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
          Demo project reconstructed from the hotels.com teardown (see REVERSE_ENGINEERING_REPORT.md). Not affiliated with
          Hotels.com, Expedia Group or any listed resort. Prices are illustrative.
        </div>
      </footer>

      {authOpen && <SignInModal onClose={() => setAuthOpen(false)} />}
    </div>
  );
}
