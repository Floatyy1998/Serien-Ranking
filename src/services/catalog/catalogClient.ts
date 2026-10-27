import { backendFetch, hasBackendSession } from '../api/backendApi';
import { cacheGet, cacheSet } from '../books/bookCache';

/**
 * Gemeinsamer Client für die statischen Kataloge auf dem eigenen Server (Bücher, Manga): Stand über eine
 * Versions-Route (Cache-Bust, die Dateien unter /catalog/ sind immutable), index.json, items/<id>.json,
 * dazu die Routen zum Aufnehmen und für Klappentexte in der App-Sprache.
 */
export const CATALOG_BACKEND =
  import.meta.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de';
const VERSION_TTL_MS = 10 * 60_000;
const DESCRIPTION_TTL_MS = 14 * 24 * 60 * 60_000;

export interface CatalogIndex<Entry> {
  v: number;
  n: number;
  items: Entry[];
}

export interface CatalogDescription {
  text: string | null;
  /** Tagesbudget der Übersetzung ist leer — nicht noch einmal anderswo übersetzen. */
  capped: boolean;
  translated: boolean;
}

export const NO_DESCRIPTION: CatalogDescription = { text: null, capped: false, translated: false };

const dayStamp = () => Number(new Date().toISOString().slice(0, 10).replace(/-/g, ''));

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`catalog ${res.status}`);
  return res.json() as Promise<T>;
}

export interface CatalogClientConfig {
  /** Ordner unter /catalog/ */
  dir: string;
  versionPath: string;
  addPath: string;
  describePath: string;
  /** Schlüssel des Eintrags im Body der Aufnahme-Route (`book`, `manga`). */
  payloadKey: string;
  /** Cache-Namensraum für Klappentexte (localStorage). */
  cacheNs: string;
}

export function createCatalogClient<Entry extends { id: string; v: number }, Item>(
  cfg: CatalogClientConfig
) {
  let versionAt = 0;
  let versionPromise: Promise<number> | null = null;

  /** Stand des Katalogs; ohne Antwort ein Tagesstempel, damit die Dateien trotzdem einmal am Tag frisch kommen. */
  function version(): Promise<number> {
    if (!versionPromise || Date.now() - versionAt > VERSION_TTL_MS) {
      versionAt = Date.now();
      versionPromise = fetchJson<{ version?: number }>(`${CATALOG_BACKEND}${cfg.versionPath}`)
        .then((data) => data.version || dayStamp())
        .catch(() => dayStamp());
    }
    return versionPromise;
  }

  let indexCache: { v: number; pending: Promise<CatalogIndex<Entry>> } | null = null;

  async function index(): Promise<CatalogIndex<Entry>> {
    const v = await version();
    if (!indexCache || indexCache.v !== v) {
      const pending = fetchJson<CatalogIndex<Entry>>(
        `${CATALOG_BACKEND}/catalog/${cfg.dir}/index.json?v=${v}`
      );
      const entry = { v, pending };
      indexCache = entry;
      pending.catch(() => {
        if (indexCache === entry) indexCache = null;
      });
    }
    return indexCache.pending;
  }

  const items = new Map<string, Promise<Item | null>>();

  /** Voller Katalog-Eintrag; `v` aus dem Index macht die URL eindeutig, sonst gilt der Katalogstand. */
  function item(id: string, v?: number): Promise<Item | null> {
    const key = `${id}@${v ?? ''}`;
    let pending = items.get(key);
    if (!pending) {
      pending = (async () => {
        const stamp = v ?? (await version());
        const url = `${CATALOG_BACKEND}/catalog/${cfg.dir}/items/${encodeURIComponent(id)}.json?v=${stamp}`;
        return fetchJson<Item>(url).catch(() => null);
      })();
      items.set(key, pending);
    }
    return pending;
  }

  const describing = new Map<string, Promise<CatalogDescription>>();

  /**
   * Klappentext in der App-Sprache; die erste Anfrage je Sprache übersetzt der Server einmal für alle.
   * `text` ist der fremdsprachige Originaltext, den die App gerade hat — der Katalog behält ihn, falls er keinen kennt.
   */
  function describe(id: string, lang: string, text?: string): Promise<CatalogDescription> {
    if (!hasBackendSession()) return Promise.resolve(NO_DESCRIPTION);
    const key = `${lang}:${id}`;
    const hit = cacheGet<CatalogDescription>(cfg.cacheNs, key, DESCRIPTION_TTL_MS);
    if (hit) return Promise.resolve(hit);
    let pending = describing.get(key);
    if (!pending) {
      pending = backendFetch(
        cfg.describePath,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(text ? { id, lang, text } : { id, lang }),
          signal: AbortSignal.timeout(30_000),
        },
        { quietStatuses: [404, 429, 503] }
      )
        .then(async (res) => {
          if (!res.ok) return NO_DESCRIPTION;
          const data = (await res.json()) as {
            text?: string | null;
            reason?: string;
            source?: string;
          };
          const value = typeof data.text === 'string' && data.text.trim() ? data.text : null;
          const out = {
            text: value,
            capped: data.reason === 'cap',
            translated: data.source === 'ai',
          };
          if (value) cacheSet(cfg.cacheNs, key, out, 60);
          return out;
        })
        .catch(() => NO_DESCRIPTION)
        .finally(() => describing.delete(key));
      describing.set(key, pending);
    }
    return pending;
  }

  /** Hinzugefügte Titel wandern in den gemeinsamen Katalog (wie Serien über /add) — best effort, ohne Rückmeldung. */
  function keep(payload: Record<string, unknown>, lang: string): void {
    if (!hasBackendSession()) return;
    void backendFetch(
      cfg.addPath,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang, [cfg.payloadKey]: payload }),
      },
      { quietStatuses: [400, 429, 503] }
    ).catch(() => undefined);
  }

  return { version, index, item, describe, keep };
}
