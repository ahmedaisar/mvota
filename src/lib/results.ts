import type { HotelContent } from '../services/content';
import type { RateRow } from '../services/availability';
import { liveCardTotal } from './pricing';
import { regionLabel, regionToAtollId } from './regions';

/** A search result joined with CMS content and priced for display. */
export interface RateResult {
  row: RateRow;
  content: HotelContent | null;
  /** Canonical atoll id ('other' when the portal region is unrecognized). */
  atollId: string;
  /** English region label for display. */
  atollLabel: string;
  /** Tax-inclusive package total in USD (transfer excluded until chosen). */
  total: number;
}

export function buildResults(
  rows: RateRow[],
  contentByHotelId: Map<string, HotelContent>,
  opts: { checkIn: string; checkOut: string; guests: number; member: boolean },
): RateResult[] {
  return rows.map((row) => {
    const content = contentByHotelId.get(row.hotel_id) ?? null;
    return {
      row,
      content,
      atollId: regionToAtollId(row.atoll) ?? 'other',
      atollLabel: content?.atoll || regionLabel(row.atoll),
      total: liveCardTotal(row.net_price, opts.member, opts.checkIn, opts.checkOut, opts.guests),
    };
  });
}
