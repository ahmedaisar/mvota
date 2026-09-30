import type { Atoll, MealPlanCode } from '../types';

export const ATOLLS: Atoll[] = [
  { id: 'north-male', name: 'North Malé Atoll', group: 'Kaafu', transfer: 'speedboat', lat: 4.35, lng: 73.55 },
  { id: 'south-male', name: 'South Malé Atoll', group: 'Kaafu', transfer: 'speedboat', lat: 3.95, lng: 73.42 },
  { id: 'baa', name: 'Baa Atoll', group: 'Baa', transfer: 'seaplane', lat: 5.15, lng: 72.9 },
  { id: 'raa', name: 'Raa Atoll', group: 'Raa', transfer: 'seaplane', lat: 5.6, lng: 72.85 },
  { id: 'ari', name: 'Ari Atoll', group: 'Alif Alif / Alif Dhaal', transfer: 'seaplane', lat: 4.05, lng: 72.95 },
  { id: 'lhaviyani', name: 'Lhaviyani Atoll', group: 'Kaafu', transfer: 'seaplane', lat: 5.45, lng: 73.4 },
  { id: 'noonu', name: 'Noonu Atoll', group: 'Noonu', transfer: 'seaplane', lat: 5.85, lng: 73.35 },
  { id: 'vaavu', name: 'Vaavu Atoll', group: 'Faafu', transfer: 'domestic', lat: 3.6, lng: 73.5 },
  { id: 'laamu', name: 'Laamu Atoll', group: 'Laamu', transfer: 'domestic', lat: 1.95, lng: 73.4 },
  { id: 'gaafu', name: 'Gaafu Dhaalu Atoll', group: 'Gaafu', transfer: 'domestic', lat: 0.65, lng: 73.3 },
  { id: 'gaafu-alifu', name: 'Gaafu Alifu Atoll', group: 'Gaafu', transfer: 'domestic', lat: 0.9, lng: 73.1 },
  { id: 'alif-alif', name: 'Alif Alif Atoll', group: 'Alif Alif', transfer: 'seaplane', lat: 4.1, lng: 72.85 },
  { id: 'alif-dhaal', name: 'Alifu Dhaalu Atoll', group: 'Alif Dhaal', transfer: 'seaplane', lat: 3.85, lng: 72.9 },
  { id: 'haa-dhaalu', name: 'Haa Dhaalu Atoll', group: 'Haa', transfer: 'domestic', lat: 6.75, lng: 73.1 },
  { id: 'haa-alifu', name: 'Haa Alifu Atoll', group: 'Haa', transfer: 'domestic', lat: 6.9, lng: 72.9 },
  { id: 'dhaalu', name: 'Dhaalu Atoll', group: 'Dhaalu', transfer: 'domestic', lat: 2.9, lng: 73.2 },
  { id: 'faafu', name: 'Faafu Atoll', group: 'Faafu', transfer: 'domestic', lat: 3.2, lng: 73.4 },
  { id: 'meemu', name: 'Meemu Atoll', group: 'Meemu', transfer: 'domestic', lat: 2.95, lng: 73.55 },
  { id: 'addu', name: 'Addu Atoll', group: 'Addu', transfer: 'domestic', lat: -0.65, lng: 73.15 },
];

export const MEAL_PLANS: { code: MealPlanCode; name: string; short: string; includes: string; ppn: number }[] = [
  { code: 'RO', name: 'Room Only', short: 'Room only', includes: 'Accommodation only — meals extra', ppn: 0 },
  { code: 'BB', name: 'Bed & Breakfast', short: 'Breakfast', includes: 'Daily buffet breakfast', ppn: 0 },
  { code: 'HB', name: 'Half Board', short: 'Breakfast & dinner', includes: 'Breakfast plus dinner at the main restaurant', ppn: 95 },
  { code: 'FB', name: 'Full Board', short: 'Three meals', includes: 'Breakfast, lunch and dinner', ppn: 135 },
  { code: 'AI', name: 'All Inclusive', short: 'Meals & drinks', includes: 'All meals, house wine, beer, cocktails and soft drinks', ppn: 245 },
  { code: 'ALL', name: 'All Inclusive', short: 'Meals & drinks', includes: 'All meals, house wine, beer, cocktails and soft drinks', ppn: 245 },
  { code: 'PAI', name: 'Premium All Inclusive', short: 'Everything dining', includes: 'All restaurants, premium spirits, minibar and select excursions', ppn: 355 },
];

export const MEAL_PLAN_MAP = Object.fromEntries(MEAL_PLANS.map((m) => [m.code, m])) as Record<
  MealPlanCode,
  (typeof MEAL_PLANS)[number]
>;
