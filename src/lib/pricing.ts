import type { MealPlanCode, PriceQuote, Resort, Villa } from '../types';
import { MEAL_PLAN_MAP, TRANSFER_RATE } from '../data/resorts';

const TGST_RATE = 0.17;
const SERVICE_CHARGE_RATE = 0.1;
const MEMBER_DISCOUNT = 0.1;
export const STAMP_REWARD_NIGHTS = 10;
export const REWARD_CREDIT = 100;
export const ISLAND_CASH_RATE = 0.02;

type Season = { label: string; multiplier: number };

function seasonFor(checkIn: string): Season {
  const d = new Date(checkIn + 'T00:00:00');
  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (md >= '12-22' || md <= '01-05') return { label: 'Festive', multiplier: 1.45 };
  if ((md >= '01-06' && md <= '04-15') || (md >= '11-01' && md <= '12-21')) return { label: 'High season', multiplier: 1.18 };
  if (md >= '05-01' && md <= '09-30') return { label: 'Low season', multiplier: 0.88 };
  return { label: 'Shoulder', multiplier: 1 };
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00').getTime();
  const b = new Date(checkOut + 'T00:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function isMemberPriceEligible(member: boolean): boolean {
  return member;
}

/**
 * Maldives package quote (see REVERSE_ENGINEERING_REPORT.md rule-maldives-tax-stack):
 * taxable = room + meal plan uplift (member discount applied first)
 * service charge 10% of taxable
 * TGST 17% of (taxable + service charge)
 * Green Tax flat per person per night ($6 <50 rooms, $12 >=50)
 * transfer round-trip per person
 */
export function buildQuote(opts: {
  resort: Resort;
  villa: Villa;
  mealPlan: MealPlanCode;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  member: boolean;
  islandCashApplied?: number;
}): PriceQuote {
  const { resort, villa, mealPlan, checkIn, checkOut, adults, children, member } = opts;
  const nights = nightsBetween(checkIn, checkOut);
  const guests = adults + children;
  const season = seasonFor(checkIn);

  const roomSubtotal = Math.round(villa.basePrice * season.multiplier * nights);
  const mealUplift = Math.round(MEAL_PLAN_MAP[mealPlan].ppn * guests * nights);
  const gross = roomSubtotal + mealUplift;
  const memberDiscount = member && isMemberPriceEligible(member) ? Math.round(gross * MEMBER_DISCOUNT) : 0;
  const taxable = gross - memberDiscount;
  const serviceCharge = Math.round(taxable * SERVICE_CHARGE_RATE);
  const tgst = Math.round((taxable + serviceCharge) * TGST_RATE);
  const greenTaxPerPersonNight = resort.roomCount >= 50 ? 12 : 6;
  const greenTax = greenTaxPerPersonNight * guests * nights;
  const transfer = resort ? TRANSFER_RATE[transferTypeOf(resort)] * guests : 0;
  const cashApplied = Math.max(0, Math.min(opts.islandCashApplied ?? 0, taxable));
  const total = taxable + serviceCharge + tgst + greenTax + transfer - cashApplied;

  return {
    nights,
    roomSubtotal,
    mealUplift,
    memberDiscount,
    serviceCharge,
    tgst,
    greenTax,
    transferTotal: transfer,
    total: Math.max(0, total),
    perNight: nights ? Math.round(total / nights) : 0,
    perPersonNight: nights && guests ? Math.round(total / (nights * guests)) : 0,
  };
}

export function transferTypeOf(resort: Resort): 'speedboat' | 'seaplane' | 'domestic' {
  return TRANSFER_BY_ATOLL[resort.atollId];
}

/** Transfer type is fixed by atoll geography (EVID-021) — users cannot choose it. */
export const TRANSFER_BY_ATOLL: Record<string, 'speedboat' | 'seaplane' | 'domestic'> = {
  'north-male': 'speedboat',
  'south-male': 'speedboat',
  baa: 'seaplane',
  raa: 'seaplane',
  ari: 'seaplane',
  lhaviyani: 'seaplane',
  noonu: 'seaplane',
  vaavu: 'domestic',
  laamu: 'domestic',
  gaafu: 'domestic',
};

/** Cheapest villa drives the search card price (Hotels.com-style "from" pricing). */
export function fromPrice(resort: Resort, member: boolean, checkIn: string, checkOut: string, guests: number): number {
  const cheapest = [...resort.villas].sort((a, b) => a.basePrice - b.basePrice)[0];
  const bestPlan: MealPlanCode = resort.mealPlans.includes('BB') ? 'BB' : resort.mealPlans[0];
  const q = buildQuote({
    resort,
    villa: cheapest,
    mealPlan: bestPlan,
    checkIn,
    checkOut,
    adults: Math.max(1, guests),
    children: 0,
    member,
  });
  return q.total;
}

/** Arrival cutoff for seaplane transfers: flights stop at 16:00 (EVID-021). */
export function seaplaneArrivalWarning(arrivalTime: string, transfer: string): string | null {
  if (transfer !== 'seaplane' || !arrivalTime) return null;
  const [h, m] = arrivalTime.split(':').map(Number);
  const minutes = h * 60 + m;
  if (minutes >= 15 * 60) {
    return 'Seaplanes land only between 06:00 and 16:00. This arrival misses the last transfer — you would overnight in Malé at your own cost. Choose a morning arrival or a speedboat resort.';
  }
  if (minutes < 6 * 60) {
    return 'Seaplanes do not fly before 06:00. The resort lounge at Velana airport opens for early arrivals, but the transfer departs after sunrise.';
  }
  return null;
}
