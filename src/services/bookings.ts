import { getDb } from '../lib/supabase';
import type { Booking, BookingStatus, MealPlanCode, PriceQuote, Traveler } from '../types';

interface BookingRow {
  id: string;
  code: string;
  resort_id: string;
  villa_id: string;
  meal_plan: string;
  check_in: string;
  check_out: string;
  adults: number;
  children: number;
  rooms: number;
  payment_type: string;
  refundable: boolean;
  traveler: Traveler;
  quote: PriceQuote;
  status: string;
  island_cash_used: number | string;
  island_cash_earned: number | string;
  stamps_earned: number;
  created_at: string;
}

function rowToBooking(r: BookingRow): Booking {
  return {
    id: r.id,
    code: r.code,
    resortId: r.resort_id,
    villaId: r.villa_id,
    mealPlan: r.meal_plan as MealPlanCode,
    checkIn: r.check_in.slice(0, 10),
    checkOut: r.check_out.slice(0, 10),
    adults: r.adults,
    children: r.children,
    rooms: r.rooms,
    paymentType: r.payment_type as Booking['paymentType'],
    refundable: r.refundable,
    traveler: r.traveler,
    quote: r.quote,
    status: r.status as BookingStatus,
    createdAt: r.created_at,
    islandCashUsed: Number(r.island_cash_used),
    islandCashEarned: Number(r.island_cash_earned),
    stampsEarned: r.stamps_earned,
  };
}

export async function listBookings(userId: string): Promise<Booking[]> {
  const { data, error } = await getDb()
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as BookingRow[]).map(rowToBooking);
}

export async function insertBooking(userId: string, b: Booking): Promise<void> {
  const { error } = await getDb()
    .from('bookings')
    .insert({
      id: b.id,
      code: b.code,
      user_id: userId,
      resort_id: b.resortId,
      villa_id: b.villaId,
      meal_plan: b.mealPlan,
      check_in: b.checkIn,
      check_out: b.checkOut,
      adults: b.adults,
      children: b.children,
      rooms: b.rooms,
      payment_type: b.paymentType,
      refundable: b.refundable,
      traveler: b.traveler,
      quote: b.quote,
      status: b.status,
      island_cash_used: b.islandCashUsed,
      island_cash_earned: b.islandCashEarned,
      stamps_earned: b.stampsEarned,
      created_at: b.createdAt,
    });
  if (error) throw new Error(error.message);
}

export async function cancelBookingRow(userId: string, bookingId: string): Promise<void> {
  const { error } = await getDb()
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('id', bookingId)
    .eq('status', 'confirmed');
  if (error) throw new Error(error.message);
}

/** Marks every confirmed booking whose check-out has passed as completed; returns them for reward crediting. */
export async function completePastBookings(userId: string): Promise<Booking[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await getDb()
    .from('bookings')
    .update({ status: 'completed' })
    .eq('user_id', userId)
    .eq('status', 'confirmed')
    .lt('check_out', today)
    .select();
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as BookingRow[]).map(rowToBooking);
}
