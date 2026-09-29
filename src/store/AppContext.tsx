import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Booking, Member, Rewards, SearchParams } from '../types';
import { addDays, today } from '../lib/format';
import { REWARD_CREDIT, STAMP_REWARD_NIGHTS } from '../lib/pricing';

const KEYS = {
  member: 'atoll.member',
  bookings: 'atoll.bookings',
  saved: 'atoll.saved',
  rewards: 'atoll.rewards',
  search: 'atoll.search',
};

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

const defaultSearch: SearchParams = {
  atollId: 'all',
  checkIn: addDays(today(), 30),
  checkOut: addDays(today(), 37),
  adults: 2,
  children: 0,
  rooms: 1,
};

interface AppStore {
  member: Member | null;
  signIn: (m: Member) => void;
  signOut: () => void;
  bookings: Booking[];
  addBooking: (b: Booking) => void;
  cancelBooking: (id: string) => void;
  saved: string[];
  toggleSaved: (slug: string) => void;
  isSaved: (slug: string) => boolean;
  rewards: Rewards;
  redeemIslandCash: (amount: number) => void;
  postStayRewards: (booking: Booking) => void;
  search: SearchParams;
  setSearch: (s: SearchParams) => void;
}

const AppContext = createContext<AppStore | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(() => load<Member | null>(KEYS.member, null));
  const [bookings, setBookings] = useState<Booking[]>(() => load<Booking[]>(KEYS.bookings, []));
  const [saved, setSaved] = useState<string[]>(() => load<string[]>(KEYS.saved, []));
  const [rewards, setRewards] = useState<Rewards>(() => load<Rewards>(KEYS.rewards, { islandCash: 0, pendingIslandCash: 0, stamps: 0 }));
  const [search, setSearchState] = useState<SearchParams>(() => load<SearchParams>(KEYS.search, defaultSearch));

  useEffect(() => save(KEYS.member, member), [member]);
  useEffect(() => save(KEYS.bookings, bookings), [bookings]);
  useEffect(() => save(KEYS.saved, saved), [saved]);
  useEffect(() => save(KEYS.rewards, rewards), [rewards]);
  useEffect(() => save(KEYS.search, search), [search]);

  const signIn = useCallback((m: Member) => setMember(m), []);
  const signOut = useCallback(() => setMember(null), []);

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => [b, ...prev]);
    setRewards((prev) => ({
      islandCash: prev.islandCash,
      pendingIslandCash: prev.pendingIslandCash + (b.paymentType === 'pay_now' ? b.islandCashEarned : 0),
      stamps: prev.stamps,
    }));
  }, []);

  const cancelBooking = useCallback((id: string) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.id === id && b.status === 'confirmed' && b.refundable
          ? {
              ...b,
              status: 'cancelled',
              islandCashEarned: 0,
              stampsEarned: 0,
            }
          : b,
      ),
    );
  }, []);

  const toggleSaved = useCallback((slug: string) => {
    setSaved((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const redeemIslandCash = useCallback((amount: number) => {
    setRewards((prev) => ({ ...prev, islandCash: Math.max(0, prev.islandCash - amount) }));
  }, []);

  /** Rewards post after the stay completes (mirrors pending → available rule). */
  const postStayRewards = useCallback((booking: Booking) => {
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: 'completed' } : b)));
    setRewards((prev) => {
      const stamps = prev.stamps + booking.stampsEarned;
      const earnedCash = Math.round(booking.quote.total * 0.02);
      let islandCash = prev.islandCash + prev.pendingIslandCash + earnedCash;
      let newStamps = stamps;
      let bonus = 0;
      if (stamps >= STAMP_REWARD_NIGHTS) {
        bonus = REWARD_CREDIT;
        islandCash += bonus;
        newStamps = stamps - STAMP_REWARD_NIGHTS;
      }
      return { islandCash, pendingIslandCash: 0, stamps: newStamps };
    });
  }, []);

  const setSearch = useCallback((s: SearchParams) => setSearchState(s), []);

  const value = useMemo<AppStore>(
    () => ({
      member,
      signIn,
      signOut,
      bookings,
      addBooking,
      cancelBooking,
      saved,
      toggleSaved,
      isSaved: (slug: string) => saved.includes(slug),
      rewards,
      redeemIslandCash,
      postStayRewards,
      search,
      setSearch,
    }),
    [member, signIn, signOut, bookings, addBooking, cancelBooking, saved, toggleSaved, rewards, redeemIslandCash, postStayRewards, search, setSearch],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook co-located with its provider is the standard React pattern
export function useApp(): AppStore {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
