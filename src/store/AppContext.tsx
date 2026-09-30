import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import type { Booking, Member, Rewards, SearchParams } from '../types';
import { addDays, today } from '../lib/format';
import { REWARD_CREDIT, STAMP_REWARD_NIGHTS } from '../lib/pricing';
import { getDb, supabaseConfigError } from '../lib/supabase';
import * as bookingsApi from '../services/bookings';
import * as rewardsApi from '../services/rewards';
import * as savedApi from '../services/saved';

const SEARCH_KEY = 'atoll.search';
const LEGACY_KEYS = ['atoll.member', 'atoll.bookings', 'atoll.saved', 'atoll.rewards'];

export type AuthReason = 'header' | 'trips' | 'checkout' | 'save';

export interface AuthResult {
  error?: string;
  /** True when Supabase requires email confirmation before sign-in works. */
  needsConfirm?: boolean;
  email?: string;
}

const defaultSearch: SearchParams = {
  atollId: 'all',
  checkIn: addDays(today(), 30),
  checkOut: addDays(today(), 37),
  adults: 2,
  children: 0,
  rooms: 1,
};

const zeroRewards: Rewards = { islandCash: 0, pendingIslandCash: 0, stamps: 0 };

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — app still works in-memory */
  }
}

function memberOf(user: User): Member {
  const email = user.email ?? '';
  const fullName = String(user.user_metadata?.full_name ?? '').trim();
  const name = fullName || email.split('@')[0] || 'Traveler';
  return { name, email };
}

function friendlyAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Wrong email or password.';
  if (message.includes('already registered')) return 'An account with this email already exists — sign in instead.';
  if (message.includes('Password should be at least')) return 'Password must be at least 6 characters.';
  if (message.includes('Email not confirmed')) return 'Confirm your email first — open the link we sent you, then sign in.';
  if (message.includes('rate limit')) return 'Too many attempts — wait a minute and try again.';
  if (message.includes('Signup requires a valid password')) return 'Password must be at least 6 characters.';
  return message;
}

interface AppStore {
  authReady: boolean;
  session: Session | null;
  member: Member | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  authModal: { open: boolean; reason: AuthReason };
  openAuth: (reason?: AuthReason) => void;
  closeAuth: () => void;
  bookings: Booking[];
  addBooking: (b: Booking) => Promise<void>;
  cancelBooking: (id: string) => Promise<void>;
  saved: string[];
  toggleSaved: (slug: string) => Promise<void>;
  isSaved: (slug: string) => boolean;
  rewards: Rewards;
  redeemIslandCash: (amount: number) => Promise<void>;
  refresh: () => Promise<void>;
  dataLoading: boolean;
  search: SearchParams;
  setSearch: (s: SearchParams) => void;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [saved, setSaved] = useState<string[]>([]);
  const [rewards, setRewards] = useState<Rewards>(zeroRewards);
  const [dataLoading, setDataLoading] = useState(false);
  const [authModal, setAuthModal] = useState<{ open: boolean; reason: AuthReason }>({ open: false, reason: 'header' });
  const [search, setSearchState] = useState<SearchParams>(() => load<SearchParams>(SEARCH_KEY, defaultSearch));

  const sessionRef = useRef<Session | null>(null);
  const rewardsRef = useRef<Rewards>(zeroRewards);
  const loadedFor = useRef<string | null>(null);

  sessionRef.current = session;
  rewardsRef.current = rewards;

  useEffect(() => save(SEARCH_KEY, search), [search]);

  useEffect(() => {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  }, []);

  const refresh = useCallback(async () => {
    const user = sessionRef.current?.user;
    if (!user) return;
    setDataLoading(true);
    try {
      let rewardState = await rewardsApi.getRewards(user.id);
      const completed = await bookingsApi.completePastBookings(user.id);
      if (completed.length > 0) {
        let { islandCash, pendingIslandCash, stamps } = rewardState;
        for (const b of completed) {
          pendingIslandCash = Math.max(0, pendingIslandCash - b.islandCashEarned);
          islandCash += b.islandCashEarned;
          stamps += b.stampsEarned;
        }
        while (stamps >= STAMP_REWARD_NIGHTS) {
          islandCash += REWARD_CREDIT;
          stamps -= STAMP_REWARD_NIGHTS;
        }
        rewardState = { islandCash, pendingIslandCash, stamps };
        await rewardsApi.setRewards(user.id, rewardState);
      }
      const [bookingRows, savedRows] = await Promise.all([
        bookingsApi.listBookings(user.id),
        savedApi.listSaved(user.id),
      ]);
      setRewards(rewardState);
      setBookings(bookingRows);
      setSaved(savedRows);
      loadedFor.current = user.id;
    } catch (e) {
      console.error('Failed to load account data', e);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    const db = getDb();
    db.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setAuthReady(true);
      if (!next) {
        loadedFor.current = null;
        setBookings([]);
        setSaved([]);
        setRewards(zeroRewards);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id ?? null;
    if (userId && loadedFor.current !== userId) void refresh();
  }, [session, refresh]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    const { error } = await getDb().auth.signInWithPassword({ email, password });
    return error ? friendlyAuthError(error.message) : null;
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await getDb().auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    });
    if (error) return { error: friendlyAuthError(error.message) };
    if (!data.session) return { needsConfirm: true, email };
    return {};
  }, []);

  const signOut = useCallback(async () => {
    await getDb().auth.signOut();
  }, []);

  const openAuth = useCallback((reason: AuthReason = 'header') => setAuthModal({ open: true, reason }), []);
  const closeAuth = useCallback(() => setAuthModal((m) => ({ ...m, open: false })), []);

  const addBooking = useCallback(async (b: Booking) => {
    const user = sessionRef.current?.user;
    if (!user) throw new Error('Sign in required to book.');
    await bookingsApi.insertBooking(user.id, b);
    const current = rewardsRef.current;
    const next: Rewards = {
      islandCash: Math.max(0, current.islandCash - b.islandCashUsed),
      pendingIslandCash: current.pendingIslandCash + b.islandCashEarned,
      stamps: current.stamps,
    };
    await rewardsApi.setRewards(user.id, next);
    setRewards(next);
    setBookings((prev) => [b, ...prev]);
  }, []);

  const cancelBooking = useCallback(async (id: string) => {
    const user = sessionRef.current?.user;
    const booking = bookings.find((b) => b.id === id);
    if (!user || !booking || booking.status !== 'confirmed' || !booking.refundable || booking.checkOut < today()) return;
    await bookingsApi.cancelBookingRow(user.id, id);
    const current = rewardsRef.current;
    const next: Rewards = {
      ...current,
      pendingIslandCash: Math.max(0, current.pendingIslandCash - booking.islandCashEarned),
      islandCash: Math.max(0, current.islandCash + booking.islandCashUsed),
    };
    await rewardsApi.setRewards(user.id, next);
    setRewards(next);
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'cancelled', islandCashEarned: 0, stampsEarned: 0 } : b)));
  }, [bookings]);

  const toggleSaved = useCallback(
    async (slug: string) => {
      const user = sessionRef.current?.user;
      if (!user) {
        openAuth('save');
        return;
      }
      const isCurrentlySaved = saved.includes(slug);
      setSaved((prev) => (isCurrentlySaved ? prev.filter((s) => s !== slug) : [slug, ...prev]));
      try {
        if (isCurrentlySaved) await savedApi.unsaveStay(user.id, slug);
        else await savedApi.saveStay(user.id, slug);
      } catch (e) {
        console.error('Failed to update saved stays', e);
        setSaved((prev) => (isCurrentlySaved ? [slug, ...prev] : prev.filter((s) => s !== slug)));
      }
    },
    [saved, openAuth],
  );

  const redeemIslandCash = useCallback(async (amount: number) => {
    const user = sessionRef.current?.user;
    if (!user || amount <= 0) return;
    const current = rewardsRef.current;
    const next: Rewards = { ...current, islandCash: Math.max(0, current.islandCash - amount) };
    await rewardsApi.setRewards(user.id, next);
    setRewards(next);
  }, []);

  const member = useMemo(() => (session ? memberOf(session.user) : null), [session]);

  const value = useMemo<AppStore>(
    () => ({
      authReady,
      session,
      member,
      signIn,
      register,
      signOut,
      authModal,
      openAuth,
      closeAuth,
      bookings,
      addBooking,
      cancelBooking,
      saved,
      toggleSaved,
      isSaved: (slug: string) => saved.includes(slug),
      rewards,
      redeemIslandCash,
      refresh,
      dataLoading,
      search,
      setSearch: setSearchState,
    }),
    [
      authReady, session, member, signIn, register, signOut, authModal, openAuth, closeAuth,
      bookings, addBooking, cancelBooking, saved, toggleSaved, rewards, redeemIslandCash, refresh, dataLoading, search,
    ],
  );

  if (supabaseConfigError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950 p-6">
        <div className="max-w-lg rounded-2xl bg-white p-7 shadow-2xl">
          <h1 className="font-display text-xl font-semibold text-ink-950">Configuration needed</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-700">{supabaseConfigError}</p>
        </div>
      </div>
    );
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="size-8 animate-spin rounded-full border-4 border-lagoon-500 border-t-transparent" />
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider is the standard React pattern
export function useApp(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
