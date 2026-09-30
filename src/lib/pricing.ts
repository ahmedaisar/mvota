import type { PriceQuote } from '../types';

const TGST_RATE = 0.17;
const SERVICE_CHARGE_RATE = 0.1;
const MEMBER_DISCOUNT = 0.1;
export const STAMP_REWARD_NIGHTS = 10;
export const REWARD_CREDIT = 100;
export const ISLAND_CASH_RATE = 0.02;

export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + 'T00:00:00').getTime();
  const b = new Date(checkOut + 'T00:00:00').getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export function isMemberPriceEligible(member: boolean): boolean {
  return member;
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

/**
 * Live-rate quote: the portal price already includes the room, meal plan and
 * seasonal demand (and our supplier markup), so no season/meal uplift math is
 * applied here. We stack the Maldives tax model + member/long-stay discounts
 * on top of the live net price. Green tax assumes a small property ($6/person/
 * night) until CMS supplies a room count.
 */
export function buildLiveQuote(opts: {
  netPrice: number;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  member: boolean;
  /** Selected round-trip transfer total for all guests (portal options). */
  transferTotal?: number;
  islandCashApplied?: number;
}): PriceQuote {
  const nights = nightsBetween(opts.checkIn, opts.checkOut);
  const guests = opts.adults + opts.children;
  const roomSubtotal = Math.max(0, Math.round(opts.netPrice));
  const longStayDiscount = nights >= 5 ? Math.round(roomSubtotal / nights) : 0;
  const gross = roomSubtotal - longStayDiscount;
  const memberDiscount = opts.member ? Math.round(gross * MEMBER_DISCOUNT) : 0;
  const taxable = gross - memberDiscount;
  const serviceCharge = Math.round(taxable * SERVICE_CHARGE_RATE);
  const tgst = Math.round((taxable + serviceCharge) * TGST_RATE);
  const greenTax = 6 * guests * nights;
  const transfer = Math.max(0, Math.round(opts.transferTotal ?? 0));
  const cashApplied = Math.max(0, Math.min(opts.islandCashApplied ?? 0, taxable));
  const total = taxable + serviceCharge + tgst + greenTax + transfer - cashApplied;

  return {
    nights,
    roomSubtotal,
    mealUplift: 0,
    longStayDiscount,
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

/** Search-card total for a live rate: taxes & fees in, transfer not yet chosen. */
export function liveCardTotal(
  netPrice: number,
  member: boolean,
  checkIn: string,
  checkOut: string,
  guests: number,
): number {
  return buildLiveQuote({
    netPrice,
    checkIn,
    checkOut,
    adults: Math.max(1, guests),
    children: 0,
    member,
  }).total;
}
