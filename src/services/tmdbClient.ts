/**
 * Zentraler TMDB-Client. Ersetzt ~27 Stellen mit rohem
 * `fetch('https://api.themoviedb.org/3/…?api_key=…&language=de-DE')`.
 *
 * - `api_key` + Sprache (de-DE, bei englischer App-Sprache en-US) werden
 *   zentral gesetzt (Sprache pro Call
 *   überschreibbar via `{ language: 'en-US' }` oder abschaltbar via
 *   `{ language: undefined }` — z.B. `watch/providers`).
 * - `undefined`/`null`/`''`-Params werden weggelassen.
 * - `tmdbFetch` wirft bei fehlendem Key oder `!res.ok`; die Aufrufer behalten
 *   ihr eigenes `try/catch` bzw. `.catch()` (viele TMDB-Reads sind bewusst
 *   „best-effort"-Anreicherung).
 *
 * Layer: services/ (I/O). Reines Provider-Normalisieren bleibt in
 * `lib/providerName.ts`.
 */

import { isEnglish } from './i18n';

const TMDB_BASE = 'https://api.themoviedb.org/3';

export type TmdbParams = Record<string, string | number | boolean | undefined | null>;

export function getTmdbApiKey(): string {
  return (import.meta.env.VITE_API_TMDB as string) || '';
}

/** Baut die vollständige TMDB-URL (api_key + Default-Sprache + Params). */
export function buildTmdbUrl(path: string, params: TmdbParams = {}): string {
  const url = new URL(`${TMDB_BASE}/${path.replace(/^\/+/, '')}`);
  url.searchParams.set('api_key', getTmdbApiKey());
  const merged: TmdbParams = { language: isEnglish() ? 'en-US' : 'de-DE', ...params };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

// Kurzlebiger Antwort-Cache + In-Flight-Dedup: alle Clients teilen sich EINEN
// TMDB-API-Key (~50 req/s global) — identische Requests innerhalb weniger
// Minuten (Tipp-Suche, Tab-Wechsel, parallele Hooks) dürfen den Key nicht
// mehrfach belasten.
const CACHE_TTL_MS = 5 * 60_000;
const CACHE_MAX = 300;
// Im Test-Modus deaktiviert — Tests mocken fetch pro Fall und dürfen keine
// gecachten Antworten aus vorherigen Tests sehen.
const CACHE_ENABLED = import.meta.env.MODE !== 'test';
const responseCache = new Map<string, { ts: number; data: unknown }>();
const inFlight = new Map<string, Promise<unknown>>();

/**
 * Fetcht einen TMDB-Endpunkt und gibt das geparste JSON zurück.
 * Wirft bei fehlendem API-Key oder HTTP-Fehler.
 */
export async function tmdbFetch<T = unknown>(
  path: string,
  params: TmdbParams = {},
  init?: RequestInit
): Promise<T> {
  if (!getTmdbApiKey()) throw new Error('VITE_API_TMDB fehlt');
  const url = buildTmdbUrl(path, params);

  // Abortable Requests nicht dedupen/cachen — ein geteiltes Promise würde
  // beim Abort des einen Aufrufers auch alle anderen mit abbrechen.
  if (init?.signal || !CACHE_ENABLED) {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`TMDB ${res.status} für ${path}`);
    return res.json() as Promise<T>;
  }

  const cached = responseCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.data as T;

  const pending = inFlight.get(url);
  if (pending) return pending as Promise<T>;

  const promise = (async () => {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`TMDB ${res.status} für ${path}`);
    const data = (await res.json()) as T;
    if (responseCache.size >= CACHE_MAX) {
      const oldest = responseCache.keys().next().value;
      if (oldest) responseCache.delete(oldest);
    }
    responseCache.set(url, { ts: Date.now(), data });
    return data;
  })();
  inFlight.set(url, promise);
  try {
    return await promise;
  } finally {
    inFlight.delete(url);
  }
}
