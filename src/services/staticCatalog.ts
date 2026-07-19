/**
 * Static Catalog Loader
 *
 * Laedt das "catalog/*"-Tree ueber statische JSON-Files vom eigenen Server
 * statt von Firebase. Catalog ist read-only Metadaten (~15 MB), die aktuell
 * den Groessteil des Firebase-Download-Egress verursachen.
 *
 * Infrastruktur:
 *   - Server-Cron (SerienApi index.js) schreibt catalog/*-Subtrees als
 *     JSON-Files nach /home/serien/SerienApi/public/catalog/
 *   - nginx served das unter https://serienapi.konrad-dinges.de/catalog/
 *     mit gzip-Kompression + 24h Cache-Control
 *
 * Caching-Strategie (Stale-While-Revalidate):
 *   1. In-Memory-Cache pro Tab — sofortige Returns waehrend Session
 *   2. IndexedDB-Cache — wird bei Cache-Hit SOFORT ausgeliefert, der
 *      Versions-Check laeuft asynchron im Hintergrund. Erst wenn der
 *      Server eine neue Version meldet, werden Caches invalidiert; der
 *      naechste Aufruf (bzw. der naechste visibilitychange-Poll im
 *      Provider) holt frisch.
 *   3. Bei Fehler / leerem Cache: direkter Fetch vom Server
 *   4. Fetch-Timeout (15s) verhindert haengende Requests
 */

import type { CatalogSeries, CatalogMovie, CatalogSeason } from '../types/CatalogTypes';
import {
  idbGetVersioned,
  idbGetAny,
  idbSetVersioned,
  idbRemove,
  idbRemovePrefix,
} from './catalogIDB';
import { isEnglish } from './i18n';
import { watchRegion } from './region';

// Vite injiziert process.env.VITE_* via define() in vite.config.ts
declare const process: { env: Record<string, string | undefined> };

const CATALOG_BASE_URL =
  (process.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de') + '/catalog';

const LS_PREFIX = 'catalog-static:';
const LS_VERSION_KEY = LS_PREFIX + 'version';
const LS_META_KEY = LS_PREFIX + 'seriesMeta';
const LS_MOVIES_KEY = LS_PREFIX + 'moviesMeta';
const LS_SEASONS_PREFIX = LS_PREFIX + 'seasons:';
const LS_SEASONS_BULK_KEY = LS_PREFIX + 'seasonsBulk';
const LS_SEASONAL_ANIME_KEY = LS_PREFIX + 'seasonalAnime';
const LS_ANIME_FILLER_KEY = LS_PREFIX + 'animeFiller';
const LS_ANIME_MANGA_KEY = LS_PREFIX + 'animeManga';
const LS_TV_PREMIERES_KEY = LS_PREFIX + 'tvPremieres';
const LS_EN_OVERLAY_KEY = LS_PREFIX + 'enOverlay';
const LS_EN_EPISODES_KEY = LS_PREFIX + 'enEpisodes';
const LS_REGION_PROVIDERS_PREFIX = LS_PREFIX + 'regionProviders:';

// Default-Timeout fuer alle Catalog-Fetches: 15s. Verhindert dass ein
// haengender Request die UI ewig blockiert (catalogLoading bleibt sonst true).
const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

// Einmalige Migration: Alte localStorage-Eintraege mit catalog-static:*-
// Prefix entfernen. Wichtig fuer Bestands-User, deren localStorage durch
// die alte Strategie voll ist und dadurch andere setItem-Aufrufe (Theme,
// HomeConfig, Watch-Next-Settings) blockiert.
let lsMigrationDone = false;
function migrateLocalStorageOnce(): void {
  if (lsMigrationDone) return;
  lsMigrationDone = true;
  try {
    const ls = typeof localStorage !== 'undefined' ? localStorage : null;
    if (!ls) return;
    const toRemove: string[] = [];
    for (let i = 0; i < ls.length; i++) {
      const k = ls.key(i);
      if (k && k.startsWith(LS_PREFIX)) toRemove.push(k);
    }
    for (const k of toRemove) {
      try {
        ls.removeItem(k);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore
  }
}

interface VersionResponse {
  version: number;
  updatedAt: string;
}

let memoryMeta: Record<string, CatalogSeries> | null = null;
let memoryMovies: Record<string, CatalogMovie> | null = null;
const memorySeasons = new Map<string, Record<string, CatalogSeason>>();
let memorySeasonsBulk: Record<string, Record<string, CatalogSeason>> | null = null;
let memorySeasonalAnime: Record<string, SeasonalAnimeStaticEntry> | null = null;
let memoryAnimeFiller: Record<string, AnimeFillerStaticEntry> | null = null;
let memoryAnimeManga: Record<string, AnimeMangaStaticEntry> | null = null;
let memoryTvPremieres: TvPremiereStaticEntry[] | null = null;
let memoryEnOverlay: EnOverlay | null | undefined = undefined;
let memoryEnEpisodes: EnEpisodeNames | null | undefined = undefined;
let memoryRegionProviders: RegionProvidersOverlay | null | undefined = undefined;
let cachedVersion: number | null = null;
let versionFetchPromise: Promise<number | null> | null = null;

async function fetchJson<T>(
  path: string,
  opts?: { noStore?: boolean; version?: number | null; timeoutMs?: number }
): Promise<T> {
  // Version-basierter Cache-Bust fuer Catalog-Files (seriesMeta, moviesMeta,
  // seasons/*). Der Browser-HTTP-Cache respektiert `max-age=86400` auch wenn
  // serverseitig neue Daten stehen — das umgehen wir, indem jede Version eine
  // eigene URL bekommt. So liegt alte Version 24h im Cache, neue Version ist
  // ein neuer URL-Key und wird vom Netz geholt.
  const query = opts?.version != null ? `?v=${opts.version}` : '';
  const url = `${CATALOG_BASE_URL}/${path}${query}`;
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'omit',
      // version.json selbst muss immer frisch sein (sonst sehen wir den Bump nie),
      // deshalb no-store. Die grossen Files duerfen 24h gecacht bleiben, weil
      // ihre URL durch den ?v=-Query automatisch invalidiert wird.
      cache: opts?.noStore ? 'no-store' : 'default',
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`static catalog fetch failed ${res.status} ${url}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Holt die aktuelle Catalog-Version vom Server.
 * Wird von allen fetch*-Funktionen verwendet, um zu entscheiden, ob ein
 * gecachter Wert noch gueltig ist.
 */
async function getRemoteVersion(): Promise<number | null> {
  if (cachedVersion !== null) return cachedVersion;
  if (versionFetchPromise) return versionFetchPromise;
  versionFetchPromise = (async () => {
    try {
      const v = await fetchJson<VersionResponse>('version.json', {
        noStore: true,
        // version.json ist 100 Bytes — kurzer Timeout reicht und verhindert
        // dass der ganze Stale-While-Revalidate-Check ewig haengt
        timeoutMs: 5_000,
      });
      cachedVersion = typeof v?.version === 'number' ? v.version : null;
      return cachedVersion;
    } catch (e) {
      console.warn('[staticCatalog] version fetch failed', e);
      return null;
    } finally {
      versionFetchPromise = null;
    }
  })();
  return versionFetchPromise;
}

// Lokal gespeicherte Catalog-Version (in IDB). In-Memory gespiegelt damit
// die meisten Aufrufe synchron sind.
let localVersionCache: number | null | undefined = undefined;
const LOCAL_VERSION_KEY = LS_VERSION_KEY; // wiederverwenden als IDB-Key

async function getLocalVersion(): Promise<number | null> {
  if (localVersionCache !== undefined) return localVersionCache;
  // Stable sentinel-Version 0, damit idbGetVersioned den Wert mit jeder
  // erwarteten Version 0 ausliefert (wir interessieren uns hier nicht fuer
  // einen separaten Versions-Check, der "Wert" ist die Version selbst).
  const stored = await idbGetVersioned<number>(LOCAL_VERSION_KEY, 0);
  localVersionCache = typeof stored === 'number' ? stored : null;
  return localVersionCache;
}

async function setLocalVersion(v: number): Promise<void> {
  localVersionCache = v;
  await idbSetVersioned<number>(LOCAL_VERSION_KEY, 0, v);
}

async function invalidateLocalCaches(opts?: { keepSeasonsBulk?: boolean }): Promise<void> {
  await Promise.all([
    idbRemove(LS_META_KEY),
    idbRemove(LS_MOVIES_KEY),
    ...(opts?.keepSeasonsBulk ? [] : [idbRemove(LS_SEASONS_BULK_KEY)]),
    idbRemove(LS_SEASONAL_ANIME_KEY),
    idbRemove(LS_ANIME_FILLER_KEY),
    idbRemove(LS_ANIME_MANGA_KEY),
    idbRemove(LS_TV_PREMIERES_KEY),
    idbRemove(LS_EN_OVERLAY_KEY),
    idbRemove(LS_EN_EPISODES_KEY),
    idbRemovePrefix(LS_REGION_PROVIDERS_PREFIX),
    idbRemovePrefix(LS_SEASONS_PREFIX),
  ]);
}

// Delta-Refetch fuer das Seasons-Bulk: seasonsAll.json ist das mit Abstand
// groesste Katalog-File und waechst mit dem Katalog unbegrenzt. Statt es bei
// jedem Versions-Bump komplett neu zu laden, holen wir seasons-index.json
// (tmdbId → Version der letzten Aenderung), diffen gegen unsere lokale Version
// und laden NUR die geaenderten Season-Files nach. Ab DELTA_MAX_FILES
// Aenderungen ist der Bulk-Download billiger (Request-Overhead) → Voll-Refetch.
const DELTA_MAX_FILES = 60;

interface SeasonsIndexResponse {
  version?: number;
  ids?: Record<string, number>;
}

async function applySeasonsDelta(localV: number | null, remote: number): Promise<boolean> {
  if (localV === null) return false;

  // Nur auf einem Cache-Stand delta-mergen, der exakt zur lokalen Version
  // gehoert — sonst drohen inkonsistente Teilzustaende.
  const cached =
    await idbGetAny<Record<string, Record<string, CatalogSeason>>>(LS_SEASONS_BULK_KEY);
  if (!cached || cached.v !== localV || !cached.data) return false;
  const bulk = cached.data;

  let index: SeasonsIndexResponse;
  try {
    index = await fetchJson<SeasonsIndexResponse>('seasons-index.json', { version: remote });
  } catch {
    // Index fehlt (404 = aelteres Backend) oder Fetch-Fehler → Voll-Refetch
    return false;
  }
  // Der Index muss zur Ziel-Version gehoeren (schuetzt vor einem stale File
  // unter frischer ?v-URL, z.B. wenn der Index-Write serverseitig fehlschlug).
  if (!index || index.version !== remote || !index.ids || typeof index.ids !== 'object') {
    return false;
  }
  const ids = index.ids;

  const changed = Object.keys(ids).filter((id) => ids[id] > localV);
  if (changed.length > DELTA_MAX_FILES) return false;

  const next: Record<string, Record<string, CatalogSeason>> = { ...bulk };
  for (const key of Object.keys(next)) {
    if (!(key in ids)) delete next[key];
  }
  try {
    const results = await Promise.all(
      changed.map(async (id) => {
        const data = await fetchJson<Record<string, CatalogSeason>>(`seasons/${id}.json`, {
          version: remote,
        });
        return [id, data] as const;
      })
    );
    for (const [id, data] of results) {
      if (data) next[id] = data;
    }
  } catch {
    // Ein Teil-Fetch schlug fehl → kein Teilzustand persistieren, Voll-Refetch
    return false;
  }

  memorySeasonsBulk = (await withEnEpisodeBulk(next)) ?? next;
  memorySeasons.clear();
  await idbSetVersioned(LS_SEASONS_BULK_KEY, remote, next);
  return true;
}

/**
 * Gemeinsame Bump-Behandlung: versucht erst den Seasons-Delta-Merge, dann
 * werden die restlichen (kleinen) Caches invalidiert und die lokale Version
 * nachgezogen. Gelingt der Delta, bleibt das grosse Seasons-Bulk erhalten.
 */
async function handleVersionBump(localV: number | null, remote: number): Promise<void> {
  let seasonsDeltaOk: boolean;
  try {
    seasonsDeltaOk = await applySeasonsDelta(localV, remote);
  } catch {
    seasonsDeltaOk = false;
  }
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  if (!seasonsDeltaOk) memorySeasonsBulk = null;
  memorySeasonalAnime = null;
  memoryAnimeFiller = null;
  memoryAnimeManga = null;
  memoryTvPremieres = null;
  memoryEnOverlay = undefined;
  memoryEnEpisodes = undefined;
  memoryRegionProviders = undefined;
  await invalidateLocalCaches({ keepSeasonsBulk: seasonsDeltaOk });
  await setLocalVersion(remote);
}

/**
 * Hintergrund-Versionscheck: vergleicht Remote-Version mit der lokal
 * gespeicherten Version. Bei Mismatch werden die Caches invalidiert (Seasons
 * wenn moeglich per Delta aktualisiert), damit der naechste Aufruf frisch holt.
 *
 * Diese Funktion wird im Stale-While-Revalidate-Pfad ohne `await` aufgerufen
 * — UI bekommt die gecachten Daten sofort, der Refresh kommt beim naechsten
 * Tick (z.B. via checkForCatalogVersionBump()).
 */
async function revalidateInBackground(localV: number | null): Promise<void> {
  migrateLocalStorageOnce();
  const remote = await getRemoteVersion();
  if (remote === null) return;
  if (localV !== null && localV === remote) {
    // Nichts zu tun — Cache ist aktuell
    return;
  }
  await handleVersionBump(localV, remote);
}

async function ensureVersionFresh(): Promise<number | null> {
  migrateLocalStorageOnce();
  const remote = await getRemoteVersion();
  if (remote === null) return null;
  const local = await getLocalVersion();
  if (local !== null && local !== remote) {
    await invalidateLocalCaches();
  }
  await setLocalVersion(remote);
  return remote;
}

// Englisch-Overlay: catalog/en/overlay.json (Backend-Export) mappt tmdbId auf
// {t: Titel, o: Beschreibung} für Serien und Filme. Wird NUR bei englischer
// App-Sprache geladen und über die deutschen Meta-Felder gelegt — fehlt die
// Datei (404) oder ein Eintrag, bleibt der deutsche Text stehen. Deutsche
// Nutzer laden die Datei nie (0 Mehrkosten).

interface EnOverlayEntry {
  t?: string;
  o?: string;
}

interface EnOverlay {
  series?: Record<string, EnOverlayEntry>;
  movies?: Record<string, EnOverlayEntry>;
}

async function getEnOverlay(): Promise<EnOverlay | null> {
  if (!isEnglish()) return null;
  if (memoryEnOverlay !== undefined) return memoryEnOverlay;

  const cached = await idbGetAny<EnOverlay>(LS_EN_OVERLAY_KEY);
  if (cached) {
    memoryEnOverlay = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<EnOverlay>('en/overlay.json', { version });
    memoryEnOverlay = data && typeof data === 'object' ? data : null;
    if (memoryEnOverlay) void idbSetVersioned(LS_EN_OVERLAY_KEY, version, memoryEnOverlay);
    return memoryEnOverlay;
  } catch (e) {
    // 404 = Backend-Export existiert noch nicht — deutscher Text bleibt.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] en-overlay fetch failed', e);
    }
    memoryEnOverlay = null;
    return null;
  }
}

function applyEnOverlay<T extends { title: string; beschreibung?: string }>(
  data: Record<string, T>,
  entries: Record<string, EnOverlayEntry> | undefined
): Record<string, T> {
  if (!entries) return data;
  const out: Record<string, T> = {};
  for (const key in data) {
    const en = entries[key];
    out[key] = en
      ? {
          ...data[key],
          title: en.t || data[key].title,
          beschreibung: en.o || data[key].beschreibung,
        }
      : data[key];
  }
  return out;
}

async function withEnOverlay<T extends { title: string; beschreibung?: string }>(
  data: Record<string, T> | null,
  kind: 'series' | 'movies'
): Promise<Record<string, T> | null> {
  if (!data || !isEnglish()) return data;
  const overlay = await getEnOverlay();
  if (!overlay) return data;
  return applyEnOverlay(data, kind === 'series' ? overlay.series : overlay.movies);
}

// Region-Provider-Overlay: catalog/providers/{CC}.json (Backend-Export) mappt
// tmdbId auf die Flatrate-Provider des gewaehlten Streaming-Landes. Die im
// Katalog gebackenen Provider sind DE — fuer jede andere Watch-Region werden
// sie hier ersetzt. Fehlt die Datei oder ein Eintrag, werden die Provider
// geleert statt falsche DE-Anbieter (RTL+, Joyn, …) anzuzeigen; Detailseiten
// holen ihre Provider ohnehin live von TMDB.

interface RegionProviderEntry {
  id: number;
  logo: string;
  name: string;
}

interface RegionProvidersOverlay {
  series?: Record<string, RegionProviderEntry[]>;
  movies?: Record<string, RegionProviderEntry[]>;
}

async function getRegionProviders(): Promise<RegionProvidersOverlay | null> {
  if (watchRegion === 'DE') return null;
  if (memoryRegionProviders !== undefined) return memoryRegionProviders;

  const idbKey = LS_REGION_PROVIDERS_PREFIX + watchRegion;
  const cached = await idbGetAny<RegionProvidersOverlay>(idbKey);
  if (cached) {
    memoryRegionProviders = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<RegionProvidersOverlay>(`providers/${watchRegion}.json`, {
      version,
    });
    memoryRegionProviders = data && typeof data === 'object' ? data : null;
    if (memoryRegionProviders) void idbSetVersioned(idbKey, version, memoryRegionProviders);
    return memoryRegionProviders;
  } catch (e) {
    // 404 = Region (noch) nicht exportiert — dann lieber keine Provider als DE.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] region-providers fetch failed', e);
    }
    memoryRegionProviders = null;
    return null;
  }
}

function applyRegionProviders<T extends { providers: RegionProviderEntry[] }>(
  data: Record<string, T>,
  entries: Record<string, RegionProviderEntry[]> | undefined
): Record<string, T> {
  const out: Record<string, T> = {};
  for (const key in data) {
    out[key] = { ...data[key], providers: entries?.[key] ?? [] };
  }
  return out;
}

async function withRegionProviders<T extends { providers: RegionProviderEntry[] }>(
  data: Record<string, T> | null,
  kind: 'series' | 'movies'
): Promise<Record<string, T> | null> {
  if (!data || watchRegion === 'DE') return data;
  const overlay = await getRegionProviders();
  return applyRegionProviders(data, kind === 'series' ? overlay?.series : overlay?.movies);
}

/** Beide Katalog-Overlays (Sprache + Streaming-Land) in einem Schritt. */
async function withOverlays<
  T extends { title: string; beschreibung?: string; providers: RegionProviderEntry[] },
>(data: Record<string, T> | null, kind: 'series' | 'movies'): Promise<Record<string, T> | null> {
  return withRegionProviders(await withEnOverlay(data, kind), kind);
}

// Englische Episodennamen: catalog/en/episodes.json (Backend-Export) mappt
// seriesId -> { episodeId -> englischer Name }. Wird NUR bei englischer
// App-Sprache geladen und beim Ausliefern der Season-Daten im Speicher
// angewendet — die IDB-Caches bleiben bewusst deutsch (Sprachwechsel = Reload,
// kein Cache-Invalidieren noetig). Fehlt die Datei oder ein Eintrag, bleibt
// der deutsche Episodenname stehen.

interface EnEpisodeNames {
  series?: Record<string, Record<string, string>>;
}

async function getEnEpisodeNames(): Promise<EnEpisodeNames | null> {
  if (!isEnglish()) return null;
  if (memoryEnEpisodes !== undefined) return memoryEnEpisodes;

  const cached = await idbGetAny<EnEpisodeNames>(LS_EN_EPISODES_KEY);
  if (cached) {
    memoryEnEpisodes = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<EnEpisodeNames>('en/episodes.json', { version });
    memoryEnEpisodes = data && typeof data === 'object' ? data : null;
    if (memoryEnEpisodes) void idbSetVersioned(LS_EN_EPISODES_KEY, version, memoryEnEpisodes);
    return memoryEnEpisodes;
  } catch (e) {
    // 404 = Backend-Export existiert noch nicht — deutsche Namen bleiben.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] en-episodes fetch failed', e);
    }
    memoryEnEpisodes = null;
    return null;
  }
}

function applyEnEpisodeNames(
  seasons: Record<string, CatalogSeason>,
  names: Record<string, string> | undefined
): Record<string, CatalogSeason> {
  if (!names) return seasons;
  const out: Record<string, CatalogSeason> = {};
  for (const key in seasons) {
    const season = seasons[key];
    const episodes = Array.isArray(season?.episodes)
      ? season.episodes.map((ep) =>
          ep && ep.id != null && names[String(ep.id)] ? { ...ep, name: names[String(ep.id)] } : ep
        )
      : season?.episodes;
    out[key] = { ...season, episodes };
  }
  return out;
}

async function withEnEpisodeSeasons(
  id: string,
  seasons: Record<string, CatalogSeason> | null
): Promise<Record<string, CatalogSeason> | null> {
  if (!seasons || !isEnglish()) return seasons;
  const overlay = await getEnEpisodeNames();
  return applyEnEpisodeNames(seasons, overlay?.series?.[id]);
}

async function withEnEpisodeBulk(
  bulk: Record<string, Record<string, CatalogSeason>> | null
): Promise<Record<string, Record<string, CatalogSeason>> | null> {
  if (!bulk || !isEnglish()) return bulk;
  const overlay = await getEnEpisodeNames();
  if (!overlay?.series) return bulk;
  const out: Record<string, Record<string, CatalogSeason>> = {};
  for (const sid in bulk) {
    const names = overlay.series[sid];
    out[sid] = names ? applyEnEpisodeNames(bulk[sid], names) : bulk[sid];
  }
  return out;
}

// Provider-Dedup-Expansion

interface ProviderEntry {
  logo?: string;
  name?: string;
}

interface DedupedMetaPayload {
  _meta?: { providers?: Record<string, ProviderEntry> };
  [tmdbId: string]: unknown;
}

/**
 * Bei Provider-Dedup im Server steht oben im JSON ein `_meta.providers`-Mapping
 * von ID -> {logo, name}, und in jedem Series/Movie-Eintrag sind die Provider
 * nur noch als `[id, id, id]` gespeichert. Wir expandieren das nach dem Fetch
 * zurueck zur alten Full-Object-Struktur, sodass das uebrige Frontend
 * unveraendert bleibt.
 *
 * Bei alten Payloads (ohne _meta) ist das ein No-Op.
 */
function expandProviders<T extends { providers?: unknown }>(raw: unknown): Record<string, T> {
  if (!raw || typeof raw !== 'object') return {};
  const payload = raw as DedupedMetaPayload;
  const providerMap = payload._meta?.providers;
  const out: Record<string, T> = {};
  for (const key in payload) {
    if (key === '_meta') continue;
    const entry = payload[key] as T & { providers?: unknown };
    if (entry && providerMap && Array.isArray(entry.providers)) {
      const expanded = (entry.providers as unknown[]).map((p) => {
        if (typeof p === 'number') {
          const info = providerMap[String(p)] || {};
          return { id: p, logo: info.logo || '', name: info.name || '' };
        }
        return p;
      });
      out[key] = { ...entry, providers: expanded } as T;
    } else {
      out[key] = entry as T;
    }
  }
  return out;
}

// RTDB-Ausfall-Spiegel: Der Backend-Cron spiegelt den Katalog nach
// catalogMirror/* (Delta-Sync). Wird NUR gelesen, wenn der statische Origin
// nicht erreichbar ist UND kein lokaler Cache existiert — Firebase-Egress
// fällt also nur während eines echten Ausfalls an. Memory-only (kein IDB),
// damit nach Origin-Rückkehr wieder der normale Pfad greift.
async function readCatalogMirror<T>(path: string): Promise<T | null> {
  try {
    const { dbGet } = await import('./db/ref');
    return await dbGet<T>(path);
  } catch {
    return null;
  }
}

// Public API

/**
 * Laedt catalog/seriesMeta (alle Serien, ohne Seasons, ~400 KB gzipped ~80 KB).
 *
 * Stale-While-Revalidate: bei vorhandenem Cache wird sofort zurueckgegeben,
 * der Versions-Check laeuft im Hintergrund.
 */
export async function fetchStaticCatalogSeries(): Promise<Record<string, CatalogSeries> | null> {
  if (memoryMeta) return memoryMeta;

  // Stale-While-Revalidate: IDB sofort lesen, ohne Versions-Roundtrip abzuwarten
  const cached = await idbGetAny<Record<string, CatalogSeries>>(LS_META_KEY);
  if (cached) {
    memoryMeta = await withOverlays(cached.data, 'series');
    void revalidateInBackground(cached.v);
    return memoryMeta;
  }

  // Cold path: Version + Daten holen
  const version = await ensureVersionFresh();
  try {
    const raw = await fetchJson<unknown>('seriesMeta.json', { version });
    const data = expandProviders<CatalogSeries>(raw);
    void idbSetVersioned(LS_META_KEY, version, data);
    memoryMeta = await withOverlays(data, 'series');
    return memoryMeta;
  } catch (e) {
    console.warn('[staticCatalog] seriesMeta fetch failed, trying RTDB mirror', e);
    const mirror = await readCatalogMirror<unknown>('catalogMirror/seriesMeta');
    if (mirror) {
      const data = expandProviders<CatalogSeries>(mirror);
      memoryMeta = await withOverlays(data, 'series');
      return memoryMeta;
    }
    return null;
  }
}

/**
 * Laedt catalog/moviesMeta (alle Filme, ~300 KB gzipped ~60 KB).
 */
export async function fetchStaticCatalogMovies(): Promise<Record<string, CatalogMovie> | null> {
  if (memoryMovies) return memoryMovies;

  const cached = await idbGetAny<Record<string, CatalogMovie>>(LS_MOVIES_KEY);
  if (cached) {
    memoryMovies = await withOverlays(cached.data, 'movies');
    void revalidateInBackground(cached.v);
    return memoryMovies;
  }

  const version = await ensureVersionFresh();
  try {
    const raw = await fetchJson<unknown>('moviesMeta.json', { version });
    const data = expandProviders<CatalogMovie>(raw);
    void idbSetVersioned(LS_MOVIES_KEY, version, data);
    memoryMovies = await withOverlays(data, 'movies');
    return memoryMovies;
  } catch (e) {
    console.warn('[staticCatalog] moviesMeta fetch failed, trying RTDB mirror', e);
    const mirror = await readCatalogMirror<unknown>('catalogMirror/moviesMeta');
    if (mirror) {
      const data = expandProviders<CatalogMovie>(mirror);
      memoryMovies = await withOverlays(data, 'movies');
      return memoryMovies;
    }
    return null;
  }
}

/**
 * Laedt catalog/seasons/{tmdbId} (Seasons einer einzelnen Serie, ~10 KB).
 * Wird heute nur noch fuer Edge-Cases verwendet — der Provider lädt normalerweise
 * den Bulk via fetchStaticCatalogSeasonsBulk().
 */
export async function fetchStaticCatalogSeasons(
  tmdbId: string | number
): Promise<Record<string, CatalogSeason> | null> {
  const id = String(tmdbId);
  const mem = memorySeasons.get(id);
  if (mem) return mem;

  // Falls bulk-Daten geladen sind, daraus bedienen (Bulk ist bereits overlayt)
  if (memorySeasonsBulk && memorySeasonsBulk[id]) {
    memorySeasons.set(id, memorySeasonsBulk[id]);
    return memorySeasonsBulk[id];
  }

  const cacheKey = LS_SEASONS_PREFIX + id;
  const cached = await idbGetAny<Record<string, CatalogSeason>>(cacheKey);
  if (cached) {
    const applied = await withEnEpisodeSeasons(id, cached.data);
    memorySeasons.set(id, applied ?? cached.data);
    void revalidateInBackground(cached.v);
    return applied ?? cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<Record<string, CatalogSeason>>(`seasons/${id}.json`, {
      version,
    });
    void idbSetVersioned(cacheKey, version, data);
    const applied = (await withEnEpisodeSeasons(id, data)) ?? data;
    memorySeasons.set(id, applied);
    return applied;
  } catch (e) {
    // 404 = Serie existiert nicht im Katalog — dafür hilft auch der Mirror nicht.
    if (!String(e).includes('404')) {
      console.warn(`[staticCatalog] seasons/${id} fetch failed, trying RTDB mirror`, e);
      const mirror = await readCatalogMirror<Record<string, CatalogSeason>>(
        `catalogMirror/seasons/${id}`
      );
      if (mirror) {
        const applied = (await withEnEpisodeSeasons(id, mirror)) ?? mirror;
        memorySeasons.set(id, applied);
        return applied;
      }
    }
    return null;
  }
}

/**
 * Laedt catalog/seasonsAll.json (alle Seasons aller Serien in einem Request).
 * Ersetzt die frueheren N parallelen Requests pro User-Serie und reduziert
 * die Initialladezeit dramatisch bei vielen Serien (Browser-Limit von 6
 * parallelen Connections pro Origin).
 *
 * Returnt null wenn das Bulk-File noch nicht existiert (Server-Cron nicht
 * gelaufen oder alte Server-Version) — Provider faellt dann auf einzelne
 * fetchStaticCatalogSeasons-Calls zurueck.
 */
export async function fetchStaticCatalogSeasonsBulk(): Promise<Record<
  string,
  Record<string, CatalogSeason>
> | null> {
  if (memorySeasonsBulk) return memorySeasonsBulk;

  const cached =
    await idbGetAny<Record<string, Record<string, CatalogSeason>>>(LS_SEASONS_BULK_KEY);
  if (cached) {
    memorySeasonsBulk = (await withEnEpisodeBulk(cached.data)) ?? cached.data;
    void revalidateInBackground(cached.v);
    return memorySeasonsBulk;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<Record<string, Record<string, CatalogSeason>>>('seasonsAll.json', {
      version,
    });
    void idbSetVersioned(LS_SEASONS_BULK_KEY, version, data);
    memorySeasonsBulk = (await withEnEpisodeBulk(data)) ?? data;
    return memorySeasonsBulk;
  } catch (e) {
    // 404 = Bulk-File existiert noch nicht (Backend nicht aktuell). Kein Fehler-Log,
    // der Provider faellt auf einzelne Season-Fetches zurueck.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] seasonsAll fetch failed', e);
    }
    return null;
  }
}

/** Eintrag aus catalog/seasonal-anime.json — vom Backend-Cron täglich für
 *  die aktuelle + nächste AniList-Season vorgerechnet (anilistId-Key). */
export interface SeasonalAnimeStaticEntry {
  tmdbId: number;
  overviewDe: string | null;
  rating: number | null;
  /** Bereits aufs App-Genre-Vokabular gemappt (ohne Animation). */
  genres: string[];
  /** DE-Flatrate (TMDB) bzw. AniList-Link-Fallback — Namen unnormalisiert. */
  providers: { name: string; logo: string | null }[];
}

/**
 * Laedt catalog/seasonal-anime.json (anilistId -> vorgerechnete TMDB-Daten).
 * Erspart der Anime-Season-Seite die komplette Client-Hydration (~500
 * TMDB/TVMaze-Requests) fuer alle abgedeckten Eintraege. Gleiche Cache-
 * Strategie wie die uebrigen Catalog-Files (IDB + Versions-Cache-Busting).
 */
export async function fetchStaticSeasonalAnime(): Promise<Record<
  string,
  SeasonalAnimeStaticEntry
> | null> {
  if (memorySeasonalAnime) return memorySeasonalAnime;

  const cached = await idbGetAny<Record<string, SeasonalAnimeStaticEntry>>(LS_SEASONAL_ANIME_KEY);
  if (cached) {
    memorySeasonalAnime = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<{ entries?: Record<string, SeasonalAnimeStaticEntry> }>(
      'seasonal-anime.json',
      { version }
    );
    const entries = data.entries ?? {};
    memorySeasonalAnime = entries;
    void idbSetVersioned(LS_SEASONAL_ANIME_KEY, version, entries);
    return entries;
  } catch (e) {
    // 404 = Backend noch nicht aktuell — die Page faellt auf Client-Hydration zurueck.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] seasonal-anime fetch failed', e);
    }
    return null;
  }
}

/** Eintrag aus catalog/anime-filler.json — vom Backend-Cron (update_anime_filler)
 *  taeglich vorgerechnet. `f`/`r` sind ABSOLUTE MAL-Episodennummern (1..N ueber
 *  die gesamte Sequel-Chain), passend zur TMDB-Episodenreihenfolge, die
 *  `buildFillerLookup` im Frontend flach durchzaehlt. tmdbId ist der Key. */
export interface AnimeFillerStaticEntry {
  /** Absolute Episodennummern, die Filler sind. */
  f: number[];
  /** Absolute Episodennummern, die Recap sind. */
  r: number[];
}

/**
 * Laedt catalog/anime-filler.json (tmdbId -> {f, r}). Ersetzt die frueheren
 * per-Serie Firebase-Reads (admin/animeFiller) auf allen Listen-Oberflaechen
 * (Home-Sektionen, WatchNext): die Filler-Info ist geteilte Katalog-Daten und
 * reist jetzt mit dem statischen Katalog mit — 0 Firebase-Reads, kein
 * localStorage-Warming noetig. Gleiche Cache-Strategie wie die uebrigen
 * Catalog-Files (IDB + Versions-Cache-Busting).
 *
 * Returnt null, solange das Backend die Datei noch nicht erzeugt hat (404) —
 * die Chips bleiben dann still, genau wie vor diesem Feature.
 */
export async function fetchStaticAnimeFiller(): Promise<Record<
  string,
  AnimeFillerStaticEntry
> | null> {
  if (memoryAnimeFiller) return memoryAnimeFiller;

  const cached = await idbGetAny<Record<string, AnimeFillerStaticEntry>>(LS_ANIME_FILLER_KEY);
  if (cached) {
    memoryAnimeFiller = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<{ entries?: Record<string, AnimeFillerStaticEntry> }>(
      'anime-filler.json',
      { version }
    );
    const entries = data.entries ?? {};
    memoryAnimeFiller = entries;
    void idbSetVersioned(LS_ANIME_FILLER_KEY, version, entries);
    return entries;
  } catch (e) {
    // 404 = Backend noch nicht aktuell — Chips bleiben still.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] anime-filler fetch failed', e);
    }
    return null;
  }
}

/**
 * Eintrag aus catalog/anime-manga.json — vom Backend-Cron (update_anime_manga)
 * vorgerechnet: der Quell-Manga eines Anime + eine (KI-geschätzte) Kapitelmarke
 * je Staffel, an der die Staffel im Manga endet. tmdbId ist der Key.
 *
 * `s` bildet die (1-basierte) Staffelnummer auf das geschätzte End-Kapitel ab.
 * `cf` ist eine grobe Konfidenz der KI-Schätzung ('high' | 'med' | 'low').
 * Kapitelzahlen sind bewusst **approximativ** — im UI immer als „~ca." labeln.
 */
export interface AnimeMangaStaticEntry {
  /** AniList-id des Quell-Mangas. */
  m: number;
  /** Titel des Quell-Mangas (Anzeigename). */
  t: string;
  /** Gesamt-Kapitelzahl des Mangas (falls bekannt), sonst null. */
  c: number | null;
  /** Staffelnummer (1-basiert, als String-Key) → geschätztes End-Kapitel. */
  s: Record<string, number>;
  /** Grobe Konfidenz der KI-Schätzung. */
  cf?: 'high' | 'med' | 'low';
}

/**
 * Lädt catalog/anime-manga.json (tmdbId -> Anime→Manga-Anschluss). Gleiche
 * Cache-Strategie wie anime-filler (IDB + Versions-Cache-Busting), 0 Firebase.
 * Returnt null, solange das Backend die Datei noch nicht erzeugt hat (404).
 */
export async function fetchStaticAnimeManga(): Promise<Record<
  string,
  AnimeMangaStaticEntry
> | null> {
  if (memoryAnimeManga) return memoryAnimeManga;

  const cached = await idbGetAny<Record<string, AnimeMangaStaticEntry>>(LS_ANIME_MANGA_KEY);
  if (cached) {
    memoryAnimeManga = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<{ entries?: Record<string, AnimeMangaStaticEntry> }>(
      'anime-manga.json',
      { version }
    );
    const entries = data.entries ?? {};
    memoryAnimeManga = entries;
    void idbSetVersioned(LS_ANIME_MANGA_KEY, version, entries);
    return entries;
  } catch (e) {
    // 404 = Backend noch nicht aktuell — der Anschluss bleibt still.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] anime-manga fetch failed', e);
    }
    return null;
  }
}

/**
 * Ein Premieren-Eintrag aus catalog/tv-premieres.json — vom Backend-Cron
 * täglich vorgerechnet für ein rollierendes 3-Monats-Fenster (Vormonat ·
 * aktueller Monat · nächster Monat). Ganz neue Serie ODER Staffel-Premiere
 * eines Rückkehrers; alle Felder bereits deutsch + auf App-Vokabular gemappt.
 */
export interface TvPremiereStaticEntry {
  tmdbId: number;
  /** 'new' = ganz neue Serie · 'season' = Staffel-Premiere eines Rückkehrers. */
  type: 'new' | 'season';
  /** Staffelnummer (nur bei type === 'season'). */
  seasonNumber?: number;
  /** Premierentag „YYYY-MM-DD" (Erstausstrahlung bzw. Staffel-Start). */
  premiereDate: string;
  title: string;
  originalTitle: string | null;
  overviewDe: string | null;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  genres: string[];
  networks: string[];
  providers: { name: string; logo: string | null }[];
}

/**
 * Laedt catalog/tv-premieres.json (Array vorgerechneter Premieren fuer die
 * Serien-Kalender-Seite). Gleiche Cache-Strategie wie die uebrigen
 * Catalog-Files (IDB + Versions-Cache-Busting). null bei 404 = Backend-Export
 * noch nicht vorhanden → die Page zeigt einen Leer-Zustand.
 */
export async function fetchStaticTvPremieres(): Promise<TvPremiereStaticEntry[] | null> {
  if (memoryTvPremieres) return memoryTvPremieres;

  const cached = await idbGetAny<TvPremiereStaticEntry[]>(LS_TV_PREMIERES_KEY);
  if (cached) {
    memoryTvPremieres = cached.data;
    void revalidateInBackground(cached.v);
    return cached.data;
  }

  const version = await ensureVersionFresh();
  try {
    const data = await fetchJson<{ entries?: TvPremiereStaticEntry[] }>('tv-premieres.json', {
      version,
    });
    const entries = Array.isArray(data.entries) ? data.entries : [];
    memoryTvPremieres = entries;
    void idbSetVersioned(LS_TV_PREMIERES_KEY, version, entries);
    return entries;
  } catch (e) {
    // 404 = Backend-Export noch nicht da — die Page zeigt einen Leer-Zustand.
    if (!String(e).includes('404')) {
      console.warn('[staticCatalog] tv-premieres fetch failed', e);
    }
    return null;
  }
}

/**
 * Prueft ob serverseitig eine neue Catalog-Version vorliegt und invalidiert
 * in diesem Fall Memory + IDB (aber ohne direkt neu zu fetchen).
 * Wird beim Tab-visibilitychange aufgerufen, damit der Client neue Cron-
 * Daten nach laengerer Inaktivitaet automatisch zieht — ohne App-Reload.
 *
 * Returns true wenn eine neue Version gefunden wurde (und Caches invalidiert
 * wurden), false sonst.
 */
export async function checkForCatalogVersionBump(): Promise<boolean> {
  // Cached Version zuruecksetzen damit getRemoteVersion den Server neu abfragt
  cachedVersion = null;
  let remote: number | null;
  try {
    const v = await fetchJson<VersionResponse>('version.json', {
      noStore: true,
      timeoutMs: 5_000,
    });
    remote = typeof v?.version === 'number' ? v.version : null;
  } catch {
    return false;
  }
  if (remote === null) return false;
  cachedVersion = remote;
  const local = await getLocalVersion();
  if (local !== null && local === remote) {
    return false;
  }
  // Bump detected: Seasons wenn moeglich per Delta nachziehen, den Rest
  // invalidieren (inkl. seasonalAnime + tvPremieres — die beiden haben keinen
  // eigenen Versions-Check).
  await handleVersionBump(local, remote);
  return true;
}

// Zentraler Versions-Watcher (Silent-Refresh ueberall)
//
// Ein EINZIGER Watcher pro Tab pollt version.json (5-min-Intervall +
// visibilitychange, 30s-Debounce, nur wenn der Tab sichtbar ist). Erkennt er
// einen Bump, invalidiert checkForCatalogVersionBump() ALLE Caches (Memory +
// IDB, inkl. seasonalAnime + tvPremieres) und der Watcher benachrichtigt
// anschliessend alle Abonnenten. Jeder Abonnent holt seine Catalog-Daten dann
// frisch (die fetchStatic*-Funktionen cold-pathen automatisch) und setzt
// seinen React-State neu → Silent-Refresh ohne Reload, auf JEDER Seite.
//
// Vorteil ggue. den frueheren Provider-lokalen Intervallen:
//   - EIN version.json-Request pro Tick statt einer pro Provider
//   - haengt NICHT an userRefs — ein RTDB-Delta resettet den Timer nicht mehr
//     (die Provider-Effekte feuerten ihren 5-min-Tick bei aktiven Usern quasi
//      nie, weil jedes Firebase-Update den Effect neu aufsetzte)
//   - deckt auch Seiten OHNE List-Provider ab (Serien-Kalender, Anime-Season)

type CatalogChangeListener = () => void;
const catalogChangeListeners = new Set<CatalogChangeListener>();
let watcherStarted = false;
let watcherLastCheck = 0;
let watcherInFlight = false;
const WATCHER_POLL_MS = 5 * 60 * 1000;
const WATCHER_DEBOUNCE_MS = 30 * 1000;

async function runCatalogVersionCheck(): Promise<void> {
  if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
  const now = Date.now();
  if (now - watcherLastCheck < WATCHER_DEBOUNCE_MS) return;
  watcherLastCheck = now;
  if (watcherInFlight) return;
  watcherInFlight = true;
  try {
    const bumped = await checkForCatalogVersionBump();
    if (!bumped) return;
    // Caches sind jetzt invalidiert — alle Abonnenten silent refetchen lassen.
    for (const cb of Array.from(catalogChangeListeners)) {
      try {
        cb();
      } catch {
        // ein kaputter Listener darf die anderen nicht blockieren
      }
    }
  } catch {
    // best-effort — den Haupt-Flow nie stoeren
  } finally {
    watcherInFlight = false;
  }
}

function startCatalogVersionWatcher(): void {
  if (watcherStarted) return;
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  watcherStarted = true;
  // Tab-Sichtbarkeit: feuert bei Tab-Wechsel / Minimieren / Occlusion.
  document.addEventListener('visibilitychange', () => {
    void runCatalogVersionCheck();
  });
  // Fenster-Fokus: feuert wenn das Browserfenster den OS-Fokus (zurueck)bekommt
  // — deckt den Fall ab, dass das Tab die ganze Zeit sichtbar BLEIBT (z.B.
  // Zwei-Monitor-Setup: Klick auf anderen Monitor/andere App und zurueck).
  // visibilitychange feuert dort NICHT, focus schon. Der 30s-Debounce in
  // runCatalogVersionCheck verhindert doppelte Checks mit visibilitychange.
  window.addEventListener('focus', () => {
    void runCatalogVersionCheck();
  });
  // Fallback-Poll, solange der Tab sichtbar ist (Desktop-Tab, der offen bleibt).
  window.setInterval(() => {
    void runCatalogVersionCheck();
  }, WATCHER_POLL_MS);
}

/**
 * Abonniert Catalog-Versions-Bumps. `listener` feuert (silent, ohne Reload),
 * sobald der zentrale Watcher serverseitig eine neue Version erkannt und alle
 * Caches invalidiert hat. Im Callback holt der Consumer seine Catalog-Daten
 * frisch (fetchStatic*-Funktionen cold-pathen dann automatisch) und ruft seine
 * State-Setter. Rueckgabe: Unsubscribe-Funktion. Der Watcher startet lazy beim
 * ersten Abo und laeuft dann tab-global weiter.
 */
export function subscribeCatalogChange(listener: CatalogChangeListener): () => void {
  catalogChangeListeners.add(listener);
  startCatalogVersionWatcher();
  return () => {
    catalogChangeListeners.delete(listener);
  };
}

/**
 * Erzwingt einen frischen Fetch vom Server, ohne Memory-, IDB-
 * oder Browser-HTTP-Cache. Nuetzlich wenn bekannt ist, dass Daten fehlen
 * (z.B. nach /add oder bei stale Cache).
 */
export async function fetchStaticCatalogSeriesFresh(): Promise<Record<
  string,
  CatalogSeries
> | null> {
  try {
    const url = `${CATALOG_BASE_URL}/seriesMeta.json?_=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const raw = await res.json();
      const data = expandProviders<CatalogSeries>(raw);
      const version = await getRemoteVersion();
      if (version != null) void idbSetVersioned(LS_META_KEY, version, data);
      memoryMeta = await withOverlays(data, 'series');
      return memoryMeta;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

export async function fetchStaticCatalogMoviesFresh(): Promise<Record<
  string,
  CatalogMovie
> | null> {
  try {
    const url = `${CATALOG_BASE_URL}/moviesMeta.json?_=${Date.now()}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'omit',
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!res.ok) return null;
      const raw = await res.json();
      const data = expandProviders<CatalogMovie>(raw);
      const version = await getRemoteVersion();
      if (version != null) void idbSetVersioned(LS_MOVIES_KEY, version, data);
      memoryMovies = await withOverlays(data, 'movies');
      return memoryMovies;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch {
    return null;
  }
}

export function clearStaticCatalogCache(): void {
  memoryMeta = null;
  memoryMovies = null;
  memorySeasons.clear();
  memorySeasonsBulk = null;
  memorySeasonalAnime = null;
  memoryAnimeFiller = null;
  memoryAnimeManga = null;
  memoryTvPremieres = null;
  memoryEnOverlay = undefined;
  memoryEnEpisodes = undefined;
  memoryRegionProviders = undefined;
  cachedVersion = null;
  localVersionCache = undefined;
  void idbRemove(LS_EN_OVERLAY_KEY);
  void idbRemove(LS_EN_EPISODES_KEY);
  void idbRemovePrefix(LS_REGION_PROVIDERS_PREFIX);
  void idbRemove(LS_META_KEY);
  void idbRemove(LS_MOVIES_KEY);
  void idbRemove(LS_VERSION_KEY);
  void idbRemove(LS_SEASONS_BULK_KEY);
  void idbRemove(LS_SEASONAL_ANIME_KEY);
  void idbRemove(LS_ANIME_FILLER_KEY);
  void idbRemove(LS_ANIME_MANGA_KEY);
  void idbRemove(LS_TV_PREMIERES_KEY);
  void idbRemovePrefix(LS_SEASONS_PREFIX);
}
