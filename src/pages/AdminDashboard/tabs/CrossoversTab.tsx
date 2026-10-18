import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { Check, DeleteOutlined, EditOutlined, SwapHoriz, UploadFile } from '@mui/icons-material';
import { CrossoverEditorSheet } from '../../../components/crossover/CrossoverEditorSheet';
import { kindLabel, partLabel } from '../../../components/crossover/crossoverLabels';
import { ADMIN_UID } from '../../../config/admin';
import { buildCrossoverIndex, normalizeEntry } from '../../../lib/crossover/crossoverIndex';
import { showToast } from '../../../lib/interaction/toast';
import {
  applyCrossoverSnapshot,
  approveCrossover,
  deleteCrossover,
  importCrossovers,
} from '../../../services/crossover/crossoverService';
import { dbRef } from '../../../services/db/ref';
import { onValue } from '../../../services/db/subscribeValue';
import type { CrossoverEntry, CrossoverMap } from '../../../types/Crossover';

type Filter = 'pruefen' | 'alle' | 'community' | 'seed';

const TONE_SEED = '#8a8a9a';
const TONE_COMMUNITY = '#f2a648';
const TONE_PENDING = '#ff5c7a';

const formatDate = (ts?: number): string => (ts ? new Date(ts).toLocaleDateString('de-DE') : '—');

/** Akzeptiert `{id: entry}` oder `[{id, ...entry}]` (Seed-Datei aus scripts/backend/data). */
function parseImport(text: string): Record<string, CrossoverEntry> {
  const raw = JSON.parse(text) as unknown;
  const out: Record<string, CrossoverEntry> = {};
  const push = (id: string, value: unknown) => {
    const entry = normalizeEntry({
      ...(value as object),
      createdBy: ADMIN_UID,
      createdAt: (value as { createdAt?: number }).createdAt || Date.now(),
      source: 'seed',
    });
    if (entry && /^[A-Za-z0-9_-]{2,120}$/.test(id)) out[id] = entry;
  };
  if (Array.isArray(raw)) {
    for (const item of raw) {
      const { id, ...rest } = (item || {}) as { id?: string };
      if (typeof id === 'string') push(id, rest);
    }
  } else if (raw && typeof raw === 'object') {
    for (const [id, value] of Object.entries(raw as Record<string, unknown>)) push(id, value);
  }
  return out;
}

export function CrossoversTab() {
  const [map, setMap] = useState<CrossoverMap | null>(null);
  const [filter, setFilter] = useState<Filter>('alle');
  const [query, setQuery] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const ref = dbRef('crossovers');
    const handler = onValue(ref, (snap) => {
      const next = (snap.val() as CrossoverMap) || {};
      setMap(next);
      applyCrossoverSnapshot(next);
    });
    return () => ref.off('value', handler);
  }, []);

  const index = useMemo(() => buildCrossoverIndex(map, { includePending: true }), [map]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return index.entries.filter(({ entry }) => {
      const isSeed = entry.source === 'seed' || entry.createdBy === ADMIN_UID;
      if (filter === 'pruefen' && entry.status !== 'pending') return false;
      if (filter === 'seed' && !isSeed) return false;
      if (filter === 'community' && isSeed) return false;
      if (!q) return true;
      const hay = [entry.title, entry.franchise, ...entry.parts.map((p) => p.t)]
        .join(' ')
        .toLowerCase();
      return hay.includes(q);
    });
  }, [index, filter, query]);

  const counts = useMemo(() => {
    let seed = 0;
    let pending = 0;
    for (const { entry } of index.entries) {
      if (entry.source === 'seed' || entry.createdBy === ADMIN_UID) seed++;
      if (entry.status === 'pending') pending++;
    }
    return { total: index.entries.length, seed, community: index.entries.length - seed, pending };
  }, [index]);

  // Mit offenen Einreichungen startet der Tab direkt in der Prüf-Ansicht.
  const [autoFilterDone, setAutoFilterDone] = useState(false);
  useEffect(() => {
    if (autoFilterDone || map === null) return;
    setAutoFilterDone(true);
    if (counts.pending > 0) setFilter('pruefen');
  }, [autoFilterDone, map, counts.pending]);

  const approve = async (id: string) => {
    setBusy(true);
    try {
      await approveCrossover(id);
      showToast('Freigegeben');
    } catch (e) {
      showToast(`Freigabe fehlgeschlagen: ${(e as Error)?.message || 'unbekannt'}`, 5000, 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      return;
    }
    setBusy(true);
    try {
      await deleteCrossover(id);
      showToast('Crossover gelöscht');
    } catch (e) {
      showToast(`Löschen fehlgeschlagen: ${(e as Error)?.message || 'unbekannt'}`, 5000, 'error');
    } finally {
      setBusy(false);
      setConfirmId(null);
    }
  };

  const importFile = async (file: File) => {
    setBusy(true);
    try {
      const entries = parseImport(await file.text());
      const n = Object.keys(entries).length;
      if (!n) {
        showToast('Keine gültigen Einträge in der Datei', 4000, 'error');
        return;
      }
      await importCrossovers(entries);
      showToast(`${n} Crossover importiert`);
    } catch (e) {
      showToast(`Import fehlgeschlagen: ${(e as Error)?.message || 'unbekannt'}`, 5000, 'error');
    } finally {
      setBusy(false);
    }
  };

  const editEntry = editId ? (index.entries.find((e) => e.id === editId)?.entry ?? null) : null;

  if (map === null) return <div className="adm-empty">Lade Crossover…</div>;

  return (
    <div className="adm-stack">
      <div className="adm-card">
        <div className="adm-card__head">
          <div className="adm-card__title">
            <SwapHoriz style={{ fontSize: 18 }} /> Crossover-Datenbank
          </div>
          <div className="adm-card__meta" style={{ display: 'flex', gap: 8 }}>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void importFile(f);
                e.target.value = '';
              }}
            />
            <button
              type="button"
              className="adm-btn adm-btn--primary"
              disabled={busy}
              onClick={() => fileRef.current?.click()}
            >
              <UploadFile style={{ fontSize: 16 }} /> Seed-JSON importieren
            </button>
            <button
              type="button"
              className="adm-btn"
              disabled={busy}
              onClick={() => {
                setEditId(null);
                setEditOpen(true);
              }}
            >
              Neu
            </button>
          </div>
        </div>
        <div className="adm-stats">
          <div className="adm-stat">
            <div className="adm-stat__value">{counts.total}</div>
            <div className="adm-stat__label">Gesamt</div>
          </div>
          <div className="adm-stat adm-tone-info">
            <div className="adm-stat__value">{counts.seed}</div>
            <div className="adm-stat__label">Seed</div>
          </div>
          <div className={`adm-stat ${counts.community ? 'adm-tone-warn' : ''}`}>
            <div className="adm-stat__value">{counts.community}</div>
            <div className="adm-stat__label">Community</div>
          </div>
          <div className={`adm-stat ${counts.pending ? 'adm-tone-bad' : 'adm-tone-ok'}`}>
            <div className="adm-stat__value">{counts.pending}</div>
            <div className="adm-stat__label">Zu prüfen</div>
          </div>
        </div>
        <div className="adm-note">
          Gemeinsamer Knoten <code>crossovers/$id</code>: Nutzer reichen Einträge ein, sichtbar
          werden sie erst nach Freigabe hier. Ändern kann freigegebene Einträge nur der Admin
          (Speichern im Editor gibt gleich mit frei). Der Import nimmt die Datei
          <code> scripts/backend/data/crossovers-seed.json</code> (gleiche IDs werden
          überschrieben).
        </div>
      </div>

      <div className="adm-chips">
        {(
          [
            ['pruefen', 'Zu prüfen', counts.pending],
            ['alle', 'Alle', counts.total],
            ['community', 'Community', counts.community],
            ['seed', 'Seed', counts.seed],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            className={`adm-chip${filter === id ? ' adm-chip--on' : ''}`}
            onClick={() => setFilter(id)}
          >
            {label}
            <span className="adm-chip__count">{n}</span>
          </button>
        ))}
        <input
          className="adm-input"
          placeholder="Suchen (Titel, Franchise, Serie)…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ marginLeft: 'auto', maxWidth: 320 }}
        />
      </div>

      {rows.length === 0 ? (
        <div className="adm-empty">
          <div className="adm-empty__t">Keine Crossover</div>
          <div className="adm-empty__s">Seed importieren oder einen Eintrag anlegen.</div>
        </div>
      ) : (
        rows.map(({ id, entry }) => {
          const isSeed = entry.source === 'seed' || entry.createdBy === ADMIN_UID;
          const pending = entry.status === 'pending';
          const tone = pending ? TONE_PENDING : isSeed ? TONE_SEED : TONE_COMMUNITY;
          return (
            <div key={id} className="adm-row" style={{ '--adm-tone': tone } as CSSProperties}>
              <div className="adm-row__head" style={{ cursor: 'default' }}>
                <div className="adm-row__bar" />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="adm-row__title">{entry.title}</div>
                  <div className="adm-row__meta">
                    {pending ? <span style={{ color: TONE_PENDING }}>Zu prüfen</span> : null}
                    <span>{kindLabel(entry.kind)}</span>
                    {entry.year ? <span>{entry.year}</span> : null}
                    {entry.franchise ? <span>{entry.franchise}</span> : null}
                    <span>{isSeed ? 'Seed' : `Community · ${entry.createdBy.slice(0, 8)}`}</span>
                    <span>{formatDate(entry.updatedAt || entry.createdAt)}</span>
                    <span style={{ opacity: 0.6 }}>{id}</span>
                  </div>
                  <div className="adm-chips" style={{ marginTop: 8 }}>
                    {entry.parts.map((part, i) => (
                      <span key={`${part.id}-${i}`} className="adm-tag">
                        {i + 1}. {part.t} · {partLabel(part)}
                      </span>
                    ))}
                  </div>
                  {entry.note ? (
                    <div style={{ marginTop: 6, fontSize: 12.5, opacity: 0.8 }}>{entry.note}</div>
                  ) : null}
                </div>
                <div className="adm-row__acts">
                  {pending && (
                    <button
                      type="button"
                      className="adm-icon-btn"
                      title="Freigeben"
                      disabled={busy}
                      onClick={() => void approve(id)}
                      style={{ color: 'var(--adm-ok)' }}
                    >
                      <Check style={{ fontSize: 16 }} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="adm-icon-btn"
                    title="Bearbeiten"
                    disabled={busy}
                    onClick={() => {
                      setEditId(id);
                      setEditOpen(true);
                    }}
                  >
                    <EditOutlined style={{ fontSize: 16 }} />
                  </button>
                  <button
                    type="button"
                    className="adm-icon-btn"
                    title={confirmId === id ? 'Wirklich löschen?' : 'Löschen'}
                    disabled={busy}
                    onClick={() => void remove(id)}
                    style={confirmId === id ? { color: 'var(--adm-bad)' } : undefined}
                  >
                    <DeleteOutlined style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          );
        })
      )}

      <CrossoverEditorSheet
        isOpen={editOpen}
        id={editId}
        initial={editEntry}
        onClose={() => setEditOpen(false)}
      />
    </div>
  );
}
