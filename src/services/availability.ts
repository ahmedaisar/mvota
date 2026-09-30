import type { MealPlanCode } from '../types';

/**
 * Client for the lgm-express rates/availability API, reached through the
 * same-origin Vercel proxy (`/api/rates/*` → lgm-express.vercel.app).
 *
 * Live-only: there is no bundled fallback. Failures throw `RatesError` so
 * callers can render an honest error + retry state. Successful responses are
 * cached per URL in sessionStorage (30 min) with in-flight dedupe — each
 * upstream search costs several portal requests, so we never refetch lightly.
 */

const BASE = '/api/rates';
const CACHE_TTL_MS = 30 * 60 * 1000;
const SEARCH_TIMEOUT_MS = 30_000;
const QUOTE_TIMEOUT_MS = 30_000;

export type RatesErrorKind = 'timeout' | 'network' | 'http' | 'bad_json';

export class RatesError extends Error {
  kind: RatesErrorKind;
  status?: number;
  constructor(kind: RatesErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'RatesError';
    this.kind = kind;
    this.status = status;
  }
}

export interface RateRow {
  hotel_name: string;
  resort: string;
  atoll: string;
  star_rating: number | null;
  room_type: string;
  meal_plan: string;
  availability: string;
  net_price: number;
  currency: string;
  hotel_id: string;
  hotel_slug: string;
}

export interface RateSearchResponse {
  results: RateRow[];
  page: number;
  per_page: number;
  total: number;
  parts_total: number;
  availability: 'ok' | 'no_results';
}

export interface RoomRate {
  room_name: string;
  meal_plan: string;
  net_price: number | null;
  currency: string;
  occupancy: string;
  availability: string;
  cancellation_policy: unknown;
  room_features: string[];
  calculation_method: string | null;
}

export interface TransferOption {
  vehicle_type: string;
  direction: string;
  pax: string;
  net_price: number;
  currency: string;
}

export interface RateQuote {
  hotel_name: string;
  hotel_id: string;
  hotel_slug: string;
  rooms: RoomRate[];
  transfers: TransferOption[];
  availability: 'ok' | 'no_results';
}

export interface SearchQuery {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  /** Defaults to [8] per child — the portal requires an age per child. */
  childAges?: number[];
  nationality?: string;
  stars?: number;
  resort?: string;
  page?: number;
  perPage?: number;
}

export interface QuoteQuery {
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  childAges?: number[];
  nationality?: string;
}

interface CacheEntry {
  at: number;
  data: unknown;
}

const cache = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

function cacheGet<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function cacheSet(key: string, data: unknown) {
  try {
    cache.set(key, { at: Date.now(), data });
  } catch {
    /* storage unavailable — in-memory only */
  }
}

function queryString(params: Record<string, string | number | undefined>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === '') continue;
    qs.set(k, String(v));
  }
  return qs.toString();
}

async function getJson(url: string, timeoutMs: number, key: string): Promise<unknown> {
  const cached = cacheGet<unknown>(key);
  if (cached) return cached;

  const existing = inflight.get(key);
  if (existing) return existing;

  const task = (async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, headers: { accept: 'application/json' } });
      if (!res.ok) {
        let detail = `Rates service returned HTTP ${res.status}`;
        try {
          const body = (await res.json()) as { detail?: string };
          if (body?.detail) detail = body.detail;
        } catch {
          /* non-JSON error body */
        }
        throw new RatesError('http', detail, res.status);
      }
      const data = await res.json();
      cacheSet(key, data);
      return data;
    } catch (err) {
      if (err instanceof RatesError) throw err;
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new RatesError('timeout', 'The rates service took too long to respond.');
      }
      throw new RatesError('network', 'Could not reach the rates service.');
    } finally {
      clearTimeout(timer);
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

/** Live availability search for the selected dates/guests. */
export async function searchRates(q: SearchQuery): Promise<RateSearchResponse> {
  const childAges = q.childAges ?? Array.from({ length: q.children }, () => 8);
  const qs = queryString({
    date_start: q.checkIn,
    date_end: q.checkOut,
    adults: q.adults,
    childs: q.children,
    child_ages: q.children > 0 ? childAges.join(',') : undefined,
    nationality: q.nationality ?? 'USA',
    stars: q.stars,
    resort: q.resort,
    page: q.page ?? 1,
    per_page: q.perPage ?? 50,
  });
  return (await getJson(`${BASE}/search?${qs}`, SEARCH_TIMEOUT_MS, `search?${qs}`)) as RateSearchResponse;
}

/** Room-level live quote for one hotel (rooms, transfers, policies). */
export async function getRateQuote(slug: string, q: QuoteQuery): Promise<RateQuote> {
  const childAges = q.childAges ?? Array.from({ length: q.children }, () => 8);
  const qs = queryString({
    date_start: q.checkIn,
    date_end: q.checkOut,
    adults: q.adults,
    childs: q.children,
    child_ages: q.children > 0 ? childAges.join(',') : undefined,
    nationality: q.nationality ?? 'USA',
  });
  return (await getJson(`${BASE}/hotels/${encodeURIComponent(slug)}?${qs}`, QUOTE_TIMEOUT_MS, `quote?${slug}?${qs}`)) as RateQuote;
}

/** Meal code normalization: portal uses "ALL" for all-inclusive. */
export function toMealCode(raw: string): MealPlanCode {
  const code = (raw || '').trim().toUpperCase();
  if (code === 'ALL' || code === 'AI') return 'AI';
  if (code === 'RO' || code === 'BB' || code === 'HB' || code === 'FB' || code === 'PAI') return code;
  return 'BB';
}
