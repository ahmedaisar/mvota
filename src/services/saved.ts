import { getDb } from '../lib/supabase';

export async function listSaved(userId: string): Promise<string[]> {
  const { data, error } = await getDb()
    .from('saved_stays')
    .select('resort_slug')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => String((r as { resort_slug: string }).resort_slug));
}

export async function saveStay(userId: string, resortSlug: string): Promise<void> {
  const { error } = await getDb().from('saved_stays').insert({ user_id: userId, resort_slug: resortSlug });
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
