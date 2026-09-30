import { getDb } from '../lib/supabase';
import type { SavedEntry } from '../types';

interface SavedRow {
  resort_slug: string;
  hotel_id: string | null;
  hotel_name: string | null;
}

export async function listSaved(userId: string): Promise<SavedEntry[]> {
  const { data, error } = await getDb()
    .from('saved_stays')
    .select('resort_slug, hotel_id, hotel_name')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as SavedRow[]).map((r) => ({
    slug: r.resort_slug,
    hotelId: r.hotel_id,
    name: r.hotel_name,
  }));
}

export async function saveStay(
  userId: string,
  resortSlug: string,
  meta?: { hotelId?: string; name?: string },
): Promise<void> {
  const { error } = await getDb()
    .from('saved_stays')
    .insert({
      user_id: userId,
      resort_slug: resortSlug,
      hotel_id: meta?.hotelId ?? null,
      hotel_name: meta?.name ?? null,
    });
  if (error && error.code !== '23505') throw new Error(error.message);
}

export async function unsaveStay(userId: string, resortSlug: string): Promise<void> {
  const { error } = await getDb()
    .from('saved_stays')
    .delete()
    .eq('user_id', userId)
    .eq('resort_slug', resortSlug);
  if (error) throw new Error(error.message);
}
