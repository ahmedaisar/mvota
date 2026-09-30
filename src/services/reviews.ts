import { getDb } from '../lib/supabase';

/** Guest reviews keyed to hotel_id. Public read; authors manage their own. */

export interface Review {
  id: string;
  hotelId: string;
  userId: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}

interface ReviewRow {
  id: string;
  hotel_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  body: string;
  created_at: string;
}

function rowToReview(r: ReviewRow): Review {
  return {
    id: r.id,
    hotelId: r.hotel_id,
    userId: r.user_id,
    rating: r.rating,
    title: r.title,
    body: r.body,
    createdAt: r.created_at,
  };
}

export async function listReviews(hotelId: string): Promise<Review[]> {
  const { data, error } = await getDb()
    .from('reviews')
    .select('*')
    .eq('hotel_id', hotelId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ReviewRow[]).map(rowToReview);
}

/** Insert or update the caller's review for this hotel (unique per user+hotel). */
export async function saveReview(
  userId: string,
  hotelId: string,
  input: { rating: number; title?: string; body: string },
): Promise<Review> {
  const { data, error } = await getDb()
    .from('reviews')
    .upsert(
      {
        hotel_id: hotelId,
        user_id: userId,
        rating: input.rating,
        title: input.title?.trim() || null,
        body: input.body.trim(),
      },
      { onConflict: 'hotel_id,user_id' },
    )
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToReview(data as unknown as ReviewRow);
}

export async function deleteReview(userId: string, reviewId: string): Promise<void> {
  const { error } = await getDb()
    .from('reviews')
    .delete()
    .eq('id', reviewId)
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
