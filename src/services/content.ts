import { getDb } from '../lib/supabase';

/**
 * CMS content: admin-managed hotel records stored in Supabase
 * (`hotel_content`), joined to the rates API by hotel_id. Public read via RLS;
 * writes require profiles.role = 'admin'.
 */

export interface HotelContent {
  id: string;
  hotelId: string;
  portalSlug: string | null;
  name: string;
  description: string | null;
  atoll: string | null;
  stars: number | null;
  photos: string[];
  amenities: string[];
  website: string | null;
  lat: number | null;
  lng: number | null;
  checkInFrom: string | null;
  checkInNotes: string | null;
  checkOutUntil: string | null;
  cancellation: string | null;
  childPolicies: string | null;
  cotExtraBed: string | null;
  petsAllowed: boolean | null;
  petsNotes: string | null;
  paymentMethods: string[];
  finePrint: string | null;
  updatedAt: string;
}

/** Admin input shape (id assigned by the database on create). */
export type HotelContentInput = Omit<HotelContent, 'id' | 'updatedAt'> & { id?: string };

interface ContentRow {
  id: string;
  hotel_id: string;
  portal_slug: string | null;
  name: string;
  description: string | null;
  atoll: string | null;
  stars: number | null;
  photos: string[] | null;
  amenities: string[] | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
  check_in_from: string | null;
  check_in_notes: string | null;
  check_out_until: string | null;
  cancellation: string | null;
  child_policies: string | null;
  cot_extra_bed: string | null;
  pets_allowed: boolean | null;
  pets_notes: string | null;
  payment_methods: string[] | null;
  fine_print: string | null;
  updated_at: string;
}

function rowToContent(r: ContentRow): HotelContent {
  return {
    id: r.id,
    hotelId: r.hotel_id,
    portalSlug: r.portal_slug,
    name: r.name,
    description: r.description,
    atoll: r.atoll,
    stars: r.stars,
    photos: r.photos ?? [],
    amenities: r.amenities ?? [],
    website: r.website,
    lat: r.lat,
    lng: r.lng,
    checkInFrom: r.check_in_from,
    checkInNotes: r.check_in_notes,
    checkOutUntil: r.check_out_until,
    cancellation: r.cancellation,
    childPolicies: r.child_policies,
    cotExtraBed: r.cot_extra_bed,
    petsAllowed: r.pets_allowed,
    petsNotes: r.pets_notes,
    paymentMethods: r.payment_methods ?? [],
    finePrint: r.fine_print,
    updatedAt: r.updated_at,
  };
}

function inputToRow(input: HotelContentInput): Record<string, unknown> {
  return {
    ...(input.id ? { id: input.id } : {}),
    hotel_id: input.hotelId,
    portal_slug: input.portalSlug,
    name: input.name,
    description: input.description,
    atoll: input.atoll,
    stars: input.stars,
    photos: input.photos,
    amenities: input.amenities,
    website: input.website,
    lat: input.lat,
    lng: input.lng,
    check_in_from: input.checkInFrom,
    check_in_notes: input.checkInNotes,
    check_out_until: input.checkOutUntil,
    cancellation: input.cancellation,
    child_policies: input.childPolicies,
    cot_extra_bed: input.cotExtraBed,
    pets_allowed: input.petsAllowed,
    pets_notes: input.petsNotes,
    payment_methods: input.paymentMethods,
    fine_print: input.finePrint,
  };
}

const CHUNK = 80;

/** Content for a batch of hotel_ids (chunked `in.` queries). */
export async function getContentByHotelIds(ids: string[]): Promise<HotelContent[]> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return [];
  const out: HotelContent[] = [];
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const { data, error } = await getDb()
      .from('hotel_content')
      .select('*')
      .in('hotel_id', slice);
    if (error) throw new Error(error.message);
    out.push(...((data ?? []) as unknown as ContentRow[]).map(rowToContent));
  }
  return out;
}

export async function getContentByHotelId(hotelId: string): Promise<HotelContent | null> {
  const { data, error } = await getDb()
    .from('hotel_content')
    .select('*')
    .eq('hotel_id', hotelId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? rowToContent(data as unknown as ContentRow) : null;
}

/** Admin: full list, newest first. */
export async function listContent(): Promise<HotelContent[]> {
  const { data, error } = await getDb()
    .from('hotel_content')
    .select('*')
    .order('updated_at', { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as ContentRow[]).map(rowToContent);
}

/** Admin: create or update by hotel_id (the API join key is unique). */
export async function upsertContent(input: HotelContentInput): Promise<HotelContent> {
  const { data, error } = await getDb()
    .from('hotel_content')
    .upsert(inputToRow(input), { onConflict: 'hotel_id' })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return rowToContent(data as unknown as ContentRow);
}

export async function deleteContent(id: string): Promise<void> {
  const { error } = await getDb().from('hotel_content').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
