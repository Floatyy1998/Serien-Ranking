/**
 * Film-Starttermine der Watch-Region als kleiner geteilter Store: Countdown-Seite,
 * Startseiten-Banner, Widget-Sync und Film-Detailseite hängen am selben Stand.
 *
 * Erste Quelle ist der Katalog (`catalog/releases/{CC}.json`, vom Backend für alle
 * Katalog-Filme vorgerechnet). Nur was dort fehlt — gerade erst hinzugefügte oder
 * gar nicht hinzugefügte Filme — wird einzeln bei TMDB erfragt und in localStorage
 * gemerkt.
 */

import {
  daysUntilDay,
  parseCatalogRelease,
  pickRegionalRelease,
  type RegionalRelease,
  type TmdbReleaseDates,
} from '../../lib/watch/movieCountdown';
import { fetchStaticMovieReleases, subscribeCatalogChange } from '../catalog/staticCatalog';
import { watchRegion } from '../settings/region';
import { tmdbFetch } from './tmdbClient';

const STORAGE_KEY = 'movieReleaseDates:v1';
const MAX_ENTRIES = 300;
const CONCURRENCY = 4;
const HOUR_MS = 3_600_000;
const TTL_UPCOMING_MS = 24 * HOUR_MS;
const TTL_UNDATED_MS = 3 * 24 * HOUR_MS;
const TTL_PAST_MS = 30 * 24 * HOUR_MS;
const RETRY_AFTER_MS = 10 * 60_000;

type KindCode = 'c' | 'd' | '';
type Entry = [date: string, kind: KindCode, fetchedAt: number];

interface Stored {
  region: string;
  entries: Record<string, Entry>;
}

export interface MovieReleaseSnapshot {
  /** `undefined` = noch nicht aufgelöst, `null` = kein Start in der Region bekannt. */
  release: (movieId: number) => RegionalRelease | null | undefined;
  /** Aufgelöst oder vorerst gescheitert — es lohnt nicht, auf diesen Film zu warten. */
  settled: (movieId: number) => boolean;
}

const makeSnapshot = (): MovieReleaseSnapshot => ({
  release: getMovieRelease,
  settled: isMovieReleaseSettled,
});

let catalog: Record<string, string> = {};
let catalogState: 'idle' | 'loading' | 'ready' = 'idle';
const waitingForCatalog = new Set<number>();

let entries: Record<string, Entry> | null = null;
let snapshot = makeSnapshot();
const listeners = new Set<() => void>();
const queue: number[] = [];
const pending = new Set<number>();
const failedAt = new Map<number, number>();
let active = 0;

function load(): Record<string, Entry> {
  if (entries) return entries;
  entries = {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const stored = raw ? (JSON.parse(raw) as Stored) : null;
    if (stored?.region === watchRegion && stored.entries && typeof stored.entries === 'object') {
      entries = stored.entries;
    }
  } catch {
    /* kaputter oder gesperrter Speicher — dann eben ohne Cache */
  }
  return entries;
}

function persist(): void {
  const all = load();
  const ids = Object.keys(all);
  if (ids.length > MAX_ENTRIES) {
    ids
      .sort((a, b) => all[a][2] - all[b][2])
      .slice(0, ids.length - MAX_ENTRIES)
      .forEach((id) => delete all[id]);
  }
  try {
    const stored: Stored = { region: watchRegion, entries: all };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    /* Quota — der Cache ist optional */
  }
}

function isExpired(entry: Entry, now: number): boolean {
  const age = now - entry[2];
  if (!entry[0]) return age > TTL_UNDATED_MS;
  const days = daysUntilDay(entry[0], new Date(now));
  return age > (days !== null && days >= 0 ? TTL_UPCOMING_MS : TTL_PAST_MS);
}

function notify(): void {
  snapshot = makeSnapshot();
  listeners.forEach((listener) => listener());
}

async function readCatalog(): Promise<Record<string, string>> {
  try {
    return (await fetchStaticMovieReleases()) ?? {};
  } catch {
    return {};
  }
}

function loadCatalog(): void {
  if (catalogState !== 'idle') return;
  catalogState = 'loading';
  void readCatalog().then((data) => {
    catalog = data;
    catalogState = 'ready';
    const ids = [...waitingForCatalog];
    waitingForCatalog.clear();
    notify();
    ensureMovieReleases(ids);
  });
  subscribeCatalogChange(() => {
    void readCatalog().then((data) => {
      if (Object.keys(data).length === 0) return;
      catalog = data;
      notify();
    });
  });
}

async function resolve(movieId: number): Promise<void> {
  try {
    const data = await tmdbFetch<TmdbReleaseDates>(`movie/${movieId}/release_dates`, {
      language: undefined,
    });
    const release = pickRegionalRelease(data, watchRegion);
    load()[String(movieId)] = [
      release?.date ?? '',
      release ? (release.kind === 'cinema' ? 'c' : 'd') : '',
      Date.now(),
    ];
    failedAt.delete(movieId);
  } catch {
    failedAt.set(movieId, Date.now());
  }
}

function pump(): void {
  while (active < CONCURRENCY && queue.length > 0) {
    const movieId = queue.shift() as number;
    active += 1;
    void resolve(movieId).finally(() => {
      active -= 1;
      pending.delete(movieId);
      if (queue.length === 0 && active === 0) persist();
      notify();
      pump();
    });
  }
}

export function getMovieRelease(movieId: number): RegionalRelease | null | undefined {
  const fromCatalog = catalog[String(movieId)];
  if (fromCatalog !== undefined) return parseCatalogRelease(fromCatalog);
  const entry = load()[String(movieId)];
  if (!entry) return undefined;
  if (!entry[0]) return null;
  return { date: entry[0], kind: entry[1] === 'd' ? 'digital' : 'cinema' };
}

export function isMovieReleaseSettled(movieId: number): boolean {
  const key = String(movieId);
  return key in catalog || !!load()[key] || failedAt.has(movieId);
}

export function ensureMovieReleases(movieIds: number[]): void {
  if (movieIds.length === 0) return;
  loadCatalog();
  if (catalogState !== 'ready') {
    movieIds.forEach((movieId) => waitingForCatalog.add(movieId));
    return;
  }
  const now = Date.now();
  const all = load();
  let queued = false;
  for (const movieId of movieIds) {
    if (String(movieId) in catalog || pending.has(movieId)) continue;
    const entry = all[String(movieId)];
    if (entry && !isExpired(entry, now)) continue;
    const failed = failedAt.get(movieId);
    if (failed !== undefined && now - failed < RETRY_AFTER_MS) continue;
    pending.add(movieId);
    queue.push(movieId);
    queued = true;
  }
  if (!queued) return;
  notify();
  pump();
}

export function subscribeMovieReleases(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getMovieReleasesSnapshot(): MovieReleaseSnapshot {
  return snapshot;
}

export function resetMovieReleasesForTests(): void {
  catalog = {};
  catalogState = 'idle';
  waitingForCatalog.clear();
  entries = null;
  snapshot = makeSnapshot();
  queue.length = 0;
  pending.clear();
  failedAt.clear();
  active = 0;
}
