import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ATOLLS } from '../data/resorts';
import { money } from '../lib/format';
import type { RateResult } from '../lib/results';

interface Props {
  results: RateResult[];
  currency: string;
}

/**
 * Atoll-level map view: pins sit at approximate atoll centroids (portal data
 * carries no coordinates), clusters count matching stays, popups list them.
 */
export default function MapView({ results, currency }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);

  // Map is created once; results update through the effect below.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([3.2, 73.2], 7);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();

    const byAtoll = new Map<string, RateResult[]>();
    for (const r of results) {
      if (r.atollId === 'other') continue;
      const list = byAtoll.get(r.atollId) ?? [];
      list.push(r);
      byAtoll.set(r.atollId, list);
    }

    const bounds: L.LatLng[] = [];
    for (const [atollId, items] of byAtoll) {
      const atoll = ATOLLS.find((a) => a.id === atollId);
      if (!atoll) continue;
      const latlng = L.latLng(atoll.lat, atoll.lng);
      bounds.push(latlng);
      const cheapest = Math.min(...items.map((i) => i.total));
      const rowsHtml = items
        .slice(0, 6)
        .map(
          (i) =>
            `<li style="margin:2px 0"><a href="/resort/${i.row.hotel_slug}" style="color:#0e7490;font-weight:600">${i.row.hotel_name}</a> <span style="color:#475569">${money(i.total, currency)}</span></li>`,
        )
        .join('');
      const more = items.length > 6 ? `<li style="color:#64748b">+${items.length - 6} more</li>` : '';
      const icon = L.divIcon({
        className: '',
        html: `<div style="transform:translate(-50%,-50%);background:#0f172a;color:#fff;border:2px solid #fff;border-radius:999px;padding:4px 10px;font:700 12px/1.4 system-ui;box-shadow:0 2px 8px rgba(0,0,0,.35);white-space:nowrap">${items.length} · ${money(cheapest, currency)}+</div>`,
        iconSize: [0, 0],
      });
      L.marker(latlng, { icon })
        .bindPopup(
          `<div style="min-width:200px"><b style="font:700 14px system-ui">${atoll.name}</b><ul style="list-style:none;padding:0;margin:6px 0 0;font:12px system-ui">${rowsHtml}${more}</ul></div>`,
        )
        .addTo(layer);
    }

    if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.35), { maxZoom: 9 });
  }, [results, currency]);

  return (
    <div className="overflow-hidden rounded-2xl border border-sand-200 bg-white">
      <div ref={containerRef} className="h-[560px] w-full" aria-label="Map of stays" />
      <p className="border-t border-sand-200 px-4 py-2 text-xs text-ink-500">
        Pins are placed at approximate atoll locations. {results.filter((r) => r.atollId === 'other').length > 0 &&
          `${results.filter((r) => r.atollId === 'other').length} stays in unrecognised regions only appear in list view.`}
      </p>
    </div>
  );
}
