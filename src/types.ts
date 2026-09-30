export type TransferType = 'speedboat' | 'seaplane' | 'domestic';

export type MealPlanCode = 'BB' | 'HB' | 'FB' | 'AI' | 'PAI' | 'RO' | 'ALL';

export type VillaView = 'garden' | 'beach' | 'overwater';

export interface Atoll {
  id: string;
  name: string;
  group: string;
  transfer: TransferType;
  /** Approximate atoll-centroid coordinates for the map view */
  lat: number;
  lng: number;
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
  mealPlans: MealPlanCode[];
  /** CMS amenity tags — only amenities present in the result set apply. */
  amenities: string[];
}

export type SortKey = 'featured' | 'price_asc' | 'price_desc' | 'stars';

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
  /** 5th-night-free discount on the room component (5+ night stays) */
  longStayDiscount: number;
  memberDiscount: number;
  serviceCharge: number;
  tgst: number;
  greenTax: number;
  transferTotal: number;
  /** Display label of the chosen portal transfer (snapshot on the quote). */
  transferLabel?: string;
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
  /** Live-rate identity of the booked hotel/room (portal slug + display names). */
  hotelSlug?: string;
  hotelName?: string;
  roomName?: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  rooms: number;
  paymentType: 'pay_at_property' | 'paid';
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

/** A stay saved by the user, with enough metadata to render without a lookup. */
export interface SavedEntry {
  slug: string;
  hotelId?: string | null;
  name?: string | null;
}

/** Compare slot (max 3) — populated from search result cards. */
export interface CompareItem {
  slug: string;
  hotelId: string;
  name: string;
  atollLabel: string;
  stars: number | null;
  meal: string;
  total: number;
  photo?: string | null;
}

export interface Rewards {
  islandCash: number;
  pendingIslandCash: number;
  stamps: number;
}
