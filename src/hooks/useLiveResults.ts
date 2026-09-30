import { useEffect, useMemo, useState } from 'react';
import { searchRates, type RateRow } from '../services/availability';
import { getContentByHotelIds, type HotelContent } from '../services/content';
import { buildResults } from '../lib/results';
import { nightsBetween } from '../lib/pricing';
import { useApp } from '../store/AppContext';

type Status = 'loading' | 'error' | 'ready';

/**
 * Live search results for the current stay params (shared by Search-adjacent
 * pages). Cached per URL by the availability service, so Home/Offers/Search
 * only ever trigger one portal search per stay.
 */
export function useLiveResults() {
  const { search, member } = useApp();
  const [rows, setRows] = useState<RateRow[]>([]);
  const [contentMap, setContentMap] = useState<Map<string, HotelContent>>(new Map());
  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  const guests = search.adults + search.children;
  const datesValid = nightsBetween(search.checkIn, search.checkOut) >= 1;

  useEffect(() => {
    if (!datesValid) {
      setStatus('error');
      setError('Check-out must be after check-in.');
      return;
    }
    let cancelled = false;
    setStatus('loading');
    setError(null);
    (async () => {
      try {
        const resp = await searchRates({
          checkIn: search.checkIn,
          checkOut: search.checkOut,
          adults: search.adults,
          children: search.children,
          perPage: 50,
        });
        if (cancelled) return;
        setRows(resp.results);
        const contents = await getContentByHotelIds(resp.results.map((r) => r.hotel_id));
        if (cancelled) return;
        setContentMap(new Map(contents.map((c) => [c.hotelId, c])));
        setStatus('ready');
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Rates are unavailable right now.');
        setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [search.checkIn, search.checkOut, search.adults, search.children, datesValid, retry]);

  const results = useMemo(
    () =>
      buildResults(rows, contentMap, {
        checkIn: search.checkIn,
        checkOut: search.checkOut,
        guests,
        member: !!member,
      }),
    [rows, contentMap, search.checkIn, search.checkOut, guests, member],
  );

  return { results, status, error, retry: () => setRetry((r) => r + 1) };
}
