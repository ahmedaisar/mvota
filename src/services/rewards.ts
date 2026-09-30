import { getDb } from '../lib/supabase';
import type { Rewards } from '../types';

interface RewardsRow {
  island_cash: number | string;
  pending_island_cash: number | string;
  stamps: number;
}

function rowToRewards(r: RewardsRow): Rewards {
  return {
    islandCash: Number(r.island_cash),
    pendingIslandCash: Number(r.pending_island_cash),
    stamps: r.stamps,
  };
}

export async function getRewards(userId: string): Promise<Rewards> {
  const { data, error } = await getDb().from('rewards').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToRewards(data as unknown as RewardsRow) : { islandCash: 0, pendingIslandCash: 0, stamps: 0 };
}

export async function setRewards(userId: string, rewards: Rewards): Promise<void> {
  const { error } = await getDb()
    .from('rewards')
    .update({
      island_cash: rewards.islandCash,
      pending_island_cash: rewards.pendingIslandCash,
      stamps: rewards.stamps,
    })
    .eq('user_id', userId);
  if (error) throw new Error(error.message);
}
