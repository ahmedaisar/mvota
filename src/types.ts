export type TransferType = 'speedboat' | 'seaplane' | 'domestic';

export type MealPlanCode = 'BB' | 'HB' | 'FB' | 'AI' | 'PAI';

export type VillaView = 'garden' | 'beach' | 'overwater';

export interface Atoll {
  id: string;
  name: string;
  group: string;
  transfer: TransferType;
}

export interface Villa {
  id: string;
  name: string;
  sizeSqm: number;
  capacity: number;
  beds: string;
  view: VillaView;
  pool: boolean;
  /** Room-only nightly base rate in USD, before taxes/fees */
  basePrice: number;
}

export interface Resort {
  id: string;
  slug: string;
  name: string;
  island: string;
  atollId: string;
  stars: number;
  /** Guest rating out of 10 */
  rating: number;
  reviews: number;
  distanceKm: number;
  transferMinutes: number;
  roomCount: number;
  mealPlans: MealPlanCode[];
  amenities: string[];
  tags: string[];
  scene: 'aerial' | 'overwater' | 'beach' | 'sunset';
  hue: number;
  summary: string;
  highlights: string[];
  villas: Villa[];
  houseReef: boolean;
  /** Promoted placement flag (mirrors Hotels.com merchandising) */
  promoted?: boolean;
}

export interface SearchParams {
  atollId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
}

export interface Filters {
  priceMax: number;
  minStars: number;
  minRating: number;
  transfers: TransferType[];
  mealPlans: MealPlanCode[];
  amenities: string[];
  view: VillaView | 'any';
  freeCancellation: boolean;
}

export type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'rating' | 'distance';

export interface Traveler {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  arrivalFlight: string;
  requests: string;
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface PriceQuote {
  nights: number;
  roomSubtotal: number;
  mealUplift: number;
  memberDiscount: number;
  serviceCharge: number;
  tgst: number;
  greenTax: number;
  transferTotal: number;
  total: number;
  perNight: number;
  perPersonNight: number;
}

export interface Booking {
  id: string;
  code: string;
  resortId: string;
  villaId: string;
  mealPlan: MealPlanCode;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  paymentType: 'pay_now' | 'pay_later';
  refundable: boolean;
  traveler: Traveler;
  quote: PriceQuote;
  status: BookingStatus;
  createdAt: string;
  islandCashUsed: number;
  islandCashEarned: number;
  stampsEarned: number;
}

export interface Member {
  name: string;
  email: string;
}

export interface Rewards {
  islandCash: number;
  pendingIslandCash: number;
  stamps: number;
}
