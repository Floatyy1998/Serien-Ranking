/**
 * Zentraler TMDB-Client. Ersetzt ~27 Stellen mit rohem
 * `fetch('https://api.themoviedb.org/3/…?api_key=…&language=de-DE')`.
 *
 * - `api_key` + `language=de-DE` werden zentral gesetzt (Sprache pro Call
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

const TMDB_BASE = 'https://api.themoviedb.org/3';

export type TmdbParams = Record<string, string | number | boolean | undefined | null>;

export function getTmdbApiKey(): string {
  return (import.meta.env.VITE_API_TMDB as string) || '';
}

/** Baut die vollständige TMDB-URL (api_key + Default-Sprache + Params). */
export function buildTmdbUrl(path: string, params: TmdbParams = {}): string {
  const url = new URL(`${TMDB_BASE}/${path.replace(/^\/+/, '')}`);
  url.searchParams.set('api_key', getTmdbApiKey());
  const merged: TmdbParams = { language: 'de-DE', ...params };
  for (const [key, value] of Object.entries(merged)) {
    if (value === undefined || value === null || value === '') continue;
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

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
  const res = await fetch(buildTmdbUrl(path, params), init);
  if (!res.ok) throw new Error(`TMDB ${res.status} für ${path}`);
  return res.json() as Promise<T>;
}
