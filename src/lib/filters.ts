import type { Filters, Resort } from '../types';
import { TRANSFER_BY_ATOLL } from './pricing';

export function matchesFilters(resort: Resort, f: Filters, price: number): boolean {
  if (price > f.priceMax) return false;
  if (resort.stars < f.minStars) return false;
  if (resort.rating < f.minRating) return false;
  if (f.freeCancellation && !resort.mealPlans.some((m) => m === 'BB' || m === 'HB')) return false;
  if (f.transfers.length && !f.transfers.includes(TRANSFER_BY_ATOLL[resort.atollId])) return false;
  if (f.mealPlans.length && !f.mealPlans.some((m) => resort.mealPlans.includes(m))) return false;
  if (f.amenities.length && !f.amenities.every((a) => resort.amenities.includes(a))) return false;
  if (f.view !== 'any' && !resort.villas.some((v) => v.view === f.view)) return false;
  return true;
}
