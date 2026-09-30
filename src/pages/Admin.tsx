import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { deleteContent, listContent, upsertContent, type HotelContent, type HotelContentInput } from '../services/content';

type Status = 'loading' | 'ready' | 'error';

const blank: HotelContentInput = {
  hotelId: '',
  portalSlug: null,
  name: '',
  description: null,
  atoll: null,
  stars: null,
  photos: [],
  amenities: [],
  website: null,
  lat: null,
  lng: null,
  checkInFrom: null,
  checkInNotes: null,
  checkOutUntil: null,
  cancellation: null,
  childPolicies: null,
  cotExtraBed: null,
  petsAllowed: null,
  petsNotes: null,
  paymentMethods: [],
  finePrint: null,
};

function lines(text: string): string[] {
  return text
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function Admin() {
  const { role, session } = useApp();
  const [status, setStatus] = useState<Status>('loading');
  const [rows, setRows] = useState<HotelContent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<HotelContentInput | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  // form state (kept separate from HotelContentInput for textarea round-trips)
  const [photosText, setPhotosText] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('');

  const isAdmin = role === 'admin';

  const load = async () => {
    setStatus('loading');
    setError(null);
    try {
      setRows(await listContent());
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load CMS content.');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (isAdmin) void load();
  }, [isAdmin]);

  if (!session || !isAdmin) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-2xl font-semibold text-ink-950">Admins only</h1>
        <p className="mt-2 text-sm text-ink-500">
          The content manager is available to signed-in editors with the admin role.
        </p>
        <Link to="/" className="mt-5 inline-block rounded-xl bg-ink-900 px-5 py-3 text-sm font-bold text-white">
          Back home
        </Link>
      </div>
    );
  }

  const openNew = () => {
    setEditing({ ...blank });
    setPhotosText('');
    setAmenitiesText('');
    setNotice(null);
  };

  const openEdit = (c: HotelContent) => {
    setEditing({
      id: c.id,
      hotelId: c.hotelId,
      portalSlug: c.portalSlug,
      name: c.name,
      description: c.description,
      atoll: c.atoll,
      stars: c.stars,
      photos: c.photos,
      amenities: c.amenities,
      website: c.website,
      lat: c.lat,
      lng: c.lng,
      checkInFrom: c.checkInFrom,
      checkInNotes: c.checkInNotes,
      checkOutUntil: c.checkOutUntil,
      cancellation: c.cancellation,
      childPolicies: c.childPolicies,
      cotExtraBed: c.cotExtraBed,
      petsAllowed: c.petsAllowed,
      petsNotes: c.petsNotes,
      paymentMethods: c.paymentMethods,
      finePrint: c.finePrint,
    });
    setPhotosText(c.photos.join('\n'));
    setAmenitiesText(c.amenities.join('\n'));
    setNotice(null);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true);
    setNotice(null);
    try {
      await upsertContent({
        ...editing,
        name: editing.name.trim(),
        description: editing.description?.trim() || null,
        photos: lines(photosText),
        amenities: lines(amenitiesText),
      });
      setEditing(null);
      setNotice('Saved.');
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Save failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: HotelContent) => {
    if (!window.confirm(`Delete CMS content for "${c.name}" (${c.hotelId})?`)) return;
    try {
      await deleteContent(c.id);
      setNotice(`Deleted ${c.name}.`);
      await load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const filtered = rows.filter(
    (r) => r.name.toLowerCase().includes(query.toLowerCase()) || r.hotelId.includes(query),
  );

  const field = 'mt-1 w-full rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-lagoon-500 focus:ring-2 focus:ring-lagoon-300';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-lagoon-100 px-3 py-1 text-xs font-bold uppercase tracking-widest text-lagoon-700">
            Admin · content manager
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ink-950">Hotel content</h1>
          <p className="mt-1 text-sm text-ink-500">
            Joined to live rates by <code className="font-mono">hotel_id</code> — edits show up on search cards and hotel pages.
          </p>
        </div>
        <button onClick={openNew} className="rounded-xl bg-coral-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-coral-600">
          + New hotel content
        </button>
      </div>

      {notice && (
        <div className="mt-4 rounded-xl border border-lagoon-500 bg-lagoon-100/60 px-4 py-3 text-sm font-semibold text-lagoon-700">
          {notice}
        </div>
      )}

      {editing && (
        <form onSubmit={save} className="mt-6 rounded-3xl border border-sand-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-ink-950">
              {editing.id ? `Edit ${editing.name}` : 'New hotel content'}
            </h2>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-bold text-ink-500 hover:text-ink-900">
              Cancel
            </button>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-bold text-ink-700">
              hotel_id (rates API key) *
              <input
                required
                value={editing.hotelId}
                disabled={!!editing.id}
                onChange={(e) => setEditing({ ...editing, hotelId: e.target.value })}
                className={field}
                placeholder="portal hotel id"
              />
            </label>
            <label className="text-sm font-bold text-ink-700">
              Display name *
              <input required value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={field} />
            </label>
            <label className="text-sm font-bold text-ink-700">
              Atoll / region label
              <input value={editing.atoll ?? ''} onChange={(e) => setEditing({ ...editing, atoll: e.target.value || null })} className={field} />
            </label>
            <label className="text-sm font-bold text-ink-700">
              Stars (0–5)
              <input
                type="number"
                min={0}
                max={5}
                value={editing.stars ?? ''}
                onChange={(e) => setEditing({ ...editing, stars: e.target.value === '' ? null : Number(e.target.value) })}
                className={field}
              />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Website
              <input value={editing.website ?? ''} onChange={(e) => setEditing({ ...editing, website: e.target.value || null })} className={field} placeholder="https://…" />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Description
              <textarea rows={4} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value || null })} className={field} />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Photos (one URL per line)
              <textarea rows={4} value={photosText} onChange={(e) => setPhotosText(e.target.value)} className={field} placeholder="https://…/1.jpg&#10;https://…/2.jpg" />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Amenities (one per line)
              <textarea rows={3} value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} className={field} placeholder="House reef&#10;Infinity pool" />
            </label>
            <label className="text-sm font-bold text-ink-700">
              Check-in from
              <input value={editing.checkInFrom ?? ''} onChange={(e) => setEditing({ ...editing, checkInFrom: e.target.value || null })} className={field} placeholder="14:00" />
            </label>
            <label className="text-sm font-bold text-ink-700">
              Check-out until
              <input value={editing.checkOutUntil ?? ''} onChange={(e) => setEditing({ ...editing, checkOutUntil: e.target.value || null })} className={field} placeholder="12:00" />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Cancellation policy
              <textarea rows={2} value={editing.cancellation ?? ''} onChange={(e) => setEditing({ ...editing, cancellation: e.target.value || null })} className={field} />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Children policy
              <textarea rows={2} value={editing.childPolicies ?? ''} onChange={(e) => setEditing({ ...editing, childPolicies: e.target.value || null })} className={field} />
            </label>
            <label className="text-sm font-bold text-ink-700 sm:col-span-2">
              Fine print
              <textarea rows={2} value={editing.finePrint ?? ''} onChange={(e) => setEditing({ ...editing, finePrint: e.target.value || null })} className={field} />
            </label>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button type="submit" disabled={busy} className="rounded-xl bg-ink-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-lagoon-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save content'}
            </button>
            <button type="button" onClick={() => setEditing(null)} className="text-sm font-bold text-ink-500 hover:text-ink-900">
              Discard
            </button>
          </div>
        </form>
      )}

      <div className="mt-8 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or hotel_id…"
          className="w-full max-w-sm rounded-xl border border-sand-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-lagoon-500"
          aria-label="Search content"
        />
        <p className="text-sm font-semibold text-ink-500">{filtered.length} record{filtered.length === 1 ? '' : 's'}</p>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-sand-200 bg-white">
        {status === 'loading' && <div className="animate-pulse space-y-3 p-5"><div className="h-4 rounded bg-sand-100" /><div className="h-4 rounded bg-sand-100" /><div className="h-4 rounded bg-sand-100" /></div>}
        {status === 'error' && (
          <div className="p-8 text-center text-sm font-semibold text-coral-600">
            {error}
            <div className="mt-3">
              <button onClick={() => void load()} className="rounded-lg bg-ink-900 px-4 py-2 text-xs font-bold text-white">
                Retry
              </button>
            </div>
          </div>
        )}
        {status === 'ready' && filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-ink-500">
            {rows.length === 0 ? 'No content yet — add your first hotel record.' : 'No records match that search.'}
          </div>
        )}
        {status === 'ready' && filtered.length > 0 && (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-sand-200 text-left text-xs font-bold uppercase tracking-wide text-ink-500">
                <th className="p-4">hotel_id</th>
                <th className="p-4">Name</th>
                <th className="p-4">Region</th>
                <th className="p-4">Photos</th>
                <th className="p-4">Updated</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-sand-100 last:border-0">
                  <td className="p-4 font-mono text-xs text-ink-500">{c.hotelId}</td>
                  <td className="p-4 font-semibold text-ink-950">{c.name}</td>
                  <td className="p-4 text-ink-700">{c.atoll ?? '—'}</td>
                  <td className="p-4 text-ink-700">{c.photos.length}</td>
                  <td className="p-4 text-xs text-ink-500">{c.updatedAt.slice(0, 10)}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(c)} className="rounded-lg border border-sand-300 px-3 py-1.5 text-xs font-bold text-ink-700 hover:border-lagoon-500 hover:text-lagoon-700">
                        Edit
                      </button>
                      <button onClick={() => void remove(c)} className="rounded-lg border border-coral-500 px-3 py-1.5 text-xs font-bold text-coral-600 hover:bg-coral-500 hover:text-white">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
