import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { money } from '../lib/format';

/** Floating compare tray (max 3 stays) + comparison table modal. */
export default function CompareBar() {
  const { compare, toggleCompare, clearCompare, currency, search } = useApp();
  const [open, setOpen] = useState(false);
  if (!compare.length) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-700 bg-ink-950/95 px-4 py-3 text-white backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-lagoon-300">Compare</span>
          {compare.map((c) => (
            <span key={c.slug} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold">
              {c.name}
              <button
                onClick={() => toggleCompare(c)}
                aria-label={`Remove ${c.name} from compare`}
                className="text-ink-300 hover:text-coral-400"
              >
                ×
              </button>
            </span>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button onClick={clearCompare} className="text-xs font-semibold text-ink-300 hover:text-white">
              Clear
            </button>
            <button
              onClick={() => setOpen(true)}
              disabled={compare.length < 2}
              className="rounded-full bg-coral-500 px-4 py-2 text-xs font-bold text-white hover:bg-coral-600 disabled:cursor-not-allowed disabled:bg-ink-700 disabled:text-ink-400"
            >
              Compare {compare.length}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4" role="dialog" aria-modal="true" aria-label="Compare stays">
          <div className="max-h-[85vh] w-full max-w-4xl overflow-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-ink-950">Compare stays</h2>
              <button onClick={() => setOpen(false)} aria-label="Close" className="rounded-full p-1 text-ink-500 hover:bg-sand-100">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <table className="mt-5 w-full text-sm">
              <thead>
                <tr>
                  <th className="w-40 border-b border-sand-200 pb-2 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                    Stay
                  </th>
                  {compare.map((c) => (
                    <th key={c.slug} className="border-b border-sand-200 pb-2 text-left">
                      <Link to={`/resort/${c.slug}`} className="font-display text-base font-semibold text-ink-950 hover:text-lagoon-700">
                        {c.name}
                      </Link>
                      <div className="text-xs font-normal text-ink-500">{c.atollLabel}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="[&_td]:border-b [&_td]:border-sand-100 [&_td]:py-3 [&_td]:pr-4">
                <tr>
                  <td className="text-xs font-bold uppercase tracking-wide text-ink-500">Package total</td>
                  {compare.map((c) => (
                    <td key={c.slug} className="text-lg font-bold text-ink-950">{money(c.total, currency)}</td>
                  ))}
                </tr>
                <tr>
                  <td className="text-xs font-bold uppercase tracking-wide text-ink-500">Stars</td>
                  {compare.map((c) => (
                    <td key={c.slug} className="font-semibold text-ink-800">{c.stars ? `${c.stars}★` : '—'}</td>
                  ))}
                </tr>
                <tr>
                  <td className="text-xs font-bold uppercase tracking-wide text-ink-500">Meal plan</td>
                  {compare.map((c) => (
                    <td key={c.slug} className="font-semibold text-ink-800">{c.meal}</td>
                  ))}
                </tr>
                <tr>
                  <td className="text-xs font-bold uppercase tracking-wide text-ink-500">Nights</td>
                  {compare.map((c) => (
                    <td key={c.slug} className="font-semibold text-ink-800">
                      {search.checkIn} → {search.checkOut}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="text-xs font-bold uppercase tracking-wide text-ink-500">&nbsp;</td>
                  {compare.map((c) => (
                    <td key={c.slug}>
                      <Link
                        to={`/resort/${c.slug}`}
                        className="inline-block rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-lagoon-700"
                      >
                        View deal
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
            <p className="mt-4 text-xs text-ink-500">Totals include taxes & fees; transfers are priced per hotel at booking.</p>
          </div>
        </div>
      )}
    </>
  );
}
