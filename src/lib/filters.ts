import type { Filters, MealPlanCode } from '../types';
import type { RateResult } from './results';
import { toMealCode } from '../services/availability';

export function matchesResult(result: RateResult, f: Filters): boolean {
  if (result.total > f.priceMax) return false;
  if (f.minStars && (result.row.star_rating ?? 0) < f.minStars) return false;
  if (f.mealPlans.length) {
    const code = toMealCode(result.row.meal_plan);
    if (!f.mealPlans.includes(code)) return false;
  }
  if (f.amenities.length) {
    const have = result.content?.amenities ?? [];
    if (!f.amenities.every((a) => have.some((h) => h.toLowerCase() === a.toLowerCase()))) return false;
  }
  return true;
}

/** Portal meal codes seen in a result set, normalized for filter chips. */
export function distinctMealCodes(rows: { meal_plan: string }[]): MealPlanCode[] {
  const set = new Set<MealPlanCode>();
  for (const r of rows) set.add(toMealCode(r.meal_plan));
  return [...set].sort();
}
