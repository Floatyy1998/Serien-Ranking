import { dbGet } from '../db/ref';
import type { PublicDirectoryEntry } from '../../types/PublicDirectory';

const CACHE_TTL_MS = 5 * 60 * 1000;
let cache: { ts: number; entries: PublicDirectoryEntry[] } | null = null;

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value.trim() : null;
const count = (value: unknown): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0;

function parseEntry(raw: unknown): PublicDirectoryEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const uid = text(r.uid);
  const publicId = text(r.publicId);
  if (!uid || !publicId) return null;
  return {
    uid,
    publicId,
    displayName: text(r.displayName) || text(r.username) || 'Unbekannt',
    username: text(r.username),
    photoURL: text(r.photoURL),
    series: count(r.series),
    movies: count(r.movies),
    watchtimeMinutes: count(r.watchtimeMinutes),
  };
}

/** Liest den vom Backend alle 15 Min geschriebenen Snapshot, ein kleiner Read. */
export async function fetchPublicDirectory(force = false): Promise<PublicDirectoryEntry[]> {
  if (!force && cache && Date.now() - cache.ts < CACHE_TTL_MS) return cache.entries;
  const snapshot = await dbGet<{ entries?: unknown }>('publicProfileDirectory');
  const rawEntries = snapshot?.entries;
  const list = Array.isArray(rawEntries)
    ? rawEntries
    : rawEntries && typeof rawEntries === 'object'
      ? Object.values(rawEntries)
      : [];
  const entries = list.map(parseEntry).filter((entry): entry is PublicDirectoryEntry => !!entry);
  cache = { ts: Date.now(), entries };
  return entries;
}
