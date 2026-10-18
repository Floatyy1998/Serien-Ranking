import type { CrossoverEntry, CrossoverMap, CrossoverPart } from '../../types/Crossover';
import { CROSSOVER_KINDS } from '../../types/Crossover';

export interface CrossoverRef {
  id: string;
  entry: CrossoverEntry;
  /** Index des Teils, über den diese Serie/Folge im Crossover hängt. */
  partIndex: number;
}

export interface CrossoverIndex {
  entries: Array<{ id: string; entry: CrossoverEntry }>;
  bySeries: Map<number, CrossoverRef[]>;
  /** Schlüssel: `${seriesId}:s${s}-e${e}` (1-basiert). */
  byEpisode: Map<string, CrossoverRef[]>;
}

export const crossoverEpisodeKey = (seriesId: number, season: number, episode: number): string =>
  `${seriesId}:s${season}-e${episode}`;

/** Lookup-Schlüssel innerhalb einer Serie — gleiches Format wie `fillerLookupKey`. */
export const crossoverSeasonKey = (season: number, episode: number): string =>
  `s${season}-e${episode}`;

const num = (v: unknown): number | undefined => {
  const n = typeof v === 'string' ? Number(v) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : undefined;
};

/** RTDB liefert Arrays auch als Objekte mit Zahlen-Schlüsseln; hier wird beides zur Liste. */
export function normalizeParts(raw: unknown): CrossoverPart[] {
  const list: unknown[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object'
      ? Object.keys(raw as object)
          .map((k) => [Number(k), (raw as Record<string, unknown>)[k]] as const)
          .filter(([k]) => Number.isFinite(k))
          .sort((a, b) => a[0] - b[0])
          .map(([, v]) => v)
      : [];
  const parts: CrossoverPart[] = [];
  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const p = item as Record<string, unknown>;
    const id = num(p.id);
    if (!id) continue;
    const part: CrossoverPart = { id, t: typeof p.t === 'string' ? p.t : '' };
    const s = num(p.s);
    const e = num(p.e);
    if (s !== undefined) part.s = s;
    if (e !== undefined) part.e = e;
    if (typeof p.n === 'string' && p.n) part.n = p.n;
    if (typeof p.p === 'string' && p.p) part.p = p.p;
    parts.push(part);
  }
  return parts;
}

export function normalizeEntry(raw: unknown): CrossoverEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const title = typeof r.title === 'string' ? r.title.trim() : '';
  const parts = normalizeParts(r.parts);
  if (!title || parts.length === 0) return null;
  const kind = CROSSOVER_KINDS.includes(r.kind as CrossoverEntry['kind'])
    ? (r.kind as CrossoverEntry['kind'])
    : 'crossover';
  const entry: CrossoverEntry = {
    title,
    kind,
    parts,
    createdBy: typeof r.createdBy === 'string' ? r.createdBy : '',
    createdAt: num(r.createdAt) ?? 0,
  };
  if (typeof r.franchise === 'string' && r.franchise) entry.franchise = r.franchise;
  const year = num(r.year);
  if (year) entry.year = year;
  if (typeof r.note === 'string' && r.note) entry.note = r.note;
  if (r.noteL && typeof r.noteL === 'object') entry.noteL = r.noteL as CrossoverEntry['noteL'];
  const updatedAt = num(r.updatedAt);
  if (updatedAt) entry.updatedAt = updatedAt;
  if (r.source === 'seed' || r.source === 'community') entry.source = r.source;
  if (r.status === 'pending' || r.status === 'approved') entry.status = r.status;
  return entry;
}

/** Sichtbar für alle: freigegeben oder aus der Zeit vor der Freigabe (ohne Status). */
export const isApproved = (entry: Pick<CrossoverEntry, 'status'>): boolean =>
  entry.status !== 'pending';

const compareEntries = (
  a: { id: string; entry: CrossoverEntry },
  b: { id: string; entry: CrossoverEntry }
): number =>
  (b.entry.year ?? 0) - (a.entry.year ?? 0) || a.entry.title.localeCompare(b.entry.title);

export function buildCrossoverIndex(
  map: CrossoverMap | null | undefined,
  { includePending = false }: { includePending?: boolean } = {}
): CrossoverIndex {
  const entries: CrossoverIndex['entries'] = [];
  const bySeries = new Map<number, CrossoverRef[]>();
  const byEpisode = new Map<string, CrossoverRef[]>();
  for (const [id, raw] of Object.entries(map || {})) {
    const entry = normalizeEntry(raw);
    if (!entry) continue;
    if (!includePending && !isApproved(entry)) continue;
    entries.push({ id, entry });
    const seenSeries = new Set<number>();
    entry.parts.forEach((part, partIndex) => {
      const ref: CrossoverRef = { id, entry, partIndex };
      if (!seenSeries.has(part.id)) {
        seenSeries.add(part.id);
        const list = bySeries.get(part.id) || [];
        list.push(ref);
        bySeries.set(part.id, list);
      }
      if (part.s !== undefined && part.e !== undefined) {
        const key = crossoverEpisodeKey(part.id, part.s, part.e);
        const list = byEpisode.get(key) || [];
        list.push(ref);
        byEpisode.set(key, list);
      }
    });
  }
  entries.sort(compareEntries);
  for (const list of bySeries.values()) {
    list.sort((a, b) => compareEntries({ id: a.id, entry: a.entry }, { id: b.id, entry: b.entry }));
  }
  return { entries, bySeries, byEpisode };
}

/** Folgen-Lookup einer Serie, geschlüsselt wie `fillerLookupKey` (`s1-e9`). */
export function crossoverKeysForSeries(
  index: CrossoverIndex | null | undefined,
  seriesId: number | undefined
): Map<string, CrossoverRef[]> {
  const out = new Map<string, CrossoverRef[]>();
  if (!index || !seriesId) return out;
  for (const ref of index.bySeries.get(seriesId) || []) {
    ref.entry.parts.forEach((part, partIndex) => {
      if (part.id !== seriesId || part.s === undefined || part.e === undefined) return;
      const key = crossoverSeasonKey(part.s, part.e);
      const list = out.get(key) || [];
      list.push({ ...ref, partIndex });
      out.set(key, list);
    });
  }
  return out;
}

export type PartWatchState = 'watched' | 'unwatched' | 'not-in-list' | 'unknown';

interface SeriesLike {
  id: number;
  seasons?: Array<{
    seasonNumber: number;
    episodes?: Array<{ watched?: boolean; episode_number?: number }>;
  }>;
}

/** Gesehen-Status eines Teils aus der eigenen Liste. */
export function partWatchState(part: CrossoverPart, seriesList: SeriesLike[]): PartWatchState {
  const series = seriesList.find((s) => s.id === part.id);
  if (!series) return 'not-in-list';
  if (part.s === undefined) return 'unknown';
  const season = series.seasons?.find((s) => s.seasonNumber === (part.s as number) - 1);
  if (!season?.episodes?.length) return 'unknown';
  if (part.e === undefined) {
    return season.episodes.every((ep) => ep.watched) ? 'watched' : 'unwatched';
  }
  // Position in der Staffel, wie überall in der App (Episodenliste, Routen) — nicht episode_number.
  const episode = season.episodes[(part.e as number) - 1];
  if (!episode) return 'unknown';
  return episode.watched ? 'watched' : 'unwatched';
}

/** Kurzform eines Teils wie „S5 E9“ — ohne Nummern „ganze Serie“ (Übersetzung macht der Aufrufer). */
export function partCode(part: CrossoverPart): string | null {
  if (part.s === undefined) return null;
  return part.e === undefined ? `S${part.s}` : `S${part.s} E${part.e}`;
}

/** Entfernt `undefined`-Felder, damit RTDB-Writes nicht an ihnen scheitern. */
export function compactEntry(entry: CrossoverEntry): CrossoverEntry {
  const strip = <T extends object>(obj: T): T =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== '')) as T;
  return strip({
    ...entry,
    title: entry.title.trim(),
    parts: entry.parts.map((p) => strip({ ...p, t: p.t.trim() })),
  });
}
