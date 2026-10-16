import type { BasedOnBook, BookAdaptation, BookLinks, BookSeriesPart } from '../../types/Book';
import { normalizeSeriesParts } from '../../lib/books/bookSeries';
import { appLocale } from '../i18n';
import { loadStaticBasedOn } from './bookStatic';
import { hardcoverSeriesParts, isHardcoverSeriesKey } from './hardcoverApi';

const ENDPOINT = 'https://query.wikidata.org/sparql';
const CACHE_PREFIX = 'wdBooks:';
const DAY = 86_400_000;

/** Manga, Comics, Webtoons und Spiele sind keine Bücher für diese Ansicht. */
const NON_BOOK_TYPES = new Set([
  'Q21198342',
  'Q8274',
  'Q1004',
  'Q14406742',
  'Q1760610',
  'Q838795',
  'Q7889',
  'Q74262765',
]);
const SERIES_TYPES = new Set(['Q277759', 'Q1667921', 'Q614101', 'Q53815']);

type Binding = Record<string, { value: string } | undefined>;

const qid = (uri: string | undefined) => uri?.replace('http://www.wikidata.org/entity/', '') ?? '';
const val = (b: Binding, key: string) => b[key]?.value;
const labelLangs = () => (appLocale === 'en' ? 'en' : `${appLocale},en`);
const sparqlString = (text: string) => `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function readCache<T>(key: string, maxAge: number): T | undefined {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return undefined;
    const entry = JSON.parse(raw) as { at: number; data: T };
    return Date.now() - entry.at < maxAge ? entry.data : undefined;
  } catch {
    return undefined;
  }
}

function writeCache(key: string, data: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* Cache ist optional */
  }
}

async function runQuery(query: string, timeoutMs = 15000): Promise<Binding[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/sparql-results+json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ query }).toString(),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
    const json = (await res.json()) as { results?: { bindings?: Binding[] } };
    return json.results?.bindings ?? [];
  } finally {
    clearTimeout(timer);
  }
}

const inflight = new Map<string, Promise<unknown>>();

function cached<T>(key: string, maxAge: number, load: () => Promise<T>): Promise<T> {
  const hit = readCache<T>(key, maxAge);
  if (hit !== undefined) return Promise.resolve(hit);
  let pending = inflight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = load()
      .then((data) => {
        writeCache(key, data);
        return data;
      })
      .finally(() => inflight.delete(key));
    inflight.set(key, pending);
  }
  return pending;
}

async function findWork(title: string, author: string | undefined, lang: string) {
  const query = `SELECT ?work ?authorName ?series ?seriesLabel ?ord ?pos ?wpTitle ?wpTitleEn WHERE {
  SERVICE wikibase:mwapi {
    bd:serviceParam wikibase:endpoint "www.wikidata.org"; wikibase:api "EntitySearch";
      mwapi:search ${sparqlString(title)}; mwapi:language "${lang}"; mwapi:limit "10".
    ?work wikibase:apiOutputItem mwapi:item .
    ?pos wikibase:apiOrdinal true .
  }
  ?work wdt:P50 ?author .
  OPTIONAL { ?author rdfs:label ?authorName . FILTER(LANG(?authorName) = "en") }
  OPTIONAL { ?work p:P179 ?st . ?st ps:P179 ?series . OPTIONAL { ?st pq:P1545 ?ord . } }
  OPTIONAL { ?wp schema:about ?work ; schema:isPartOf <https://${appLocale}.wikipedia.org/> ; schema:name ?wpTitle . }
  OPTIONAL { ?wpEn schema:about ?work ; schema:isPartOf <https://en.wikipedia.org/> ; schema:name ?wpTitleEn . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${labelLangs()}". ?series rdfs:label ?seriesLabel . }
} ORDER BY ?pos LIMIT 30`;
  const rows = await runQuery(query);
  const lastName = author?.toLowerCase().split(/\s+/).pop();
  const match =
    (lastName && rows.find((r) => val(r, 'authorName')?.toLowerCase().includes(lastName))) ||
    (!lastName ? rows[0] : undefined);
  return match ?? null;
}

async function loadAdaptations(sources: string[]): Promise<BookAdaptation[]> {
  if (!sources.length) return [];
  const values = sources.map((s) => `wd:${s}`).join(' ');
  const rows = await runQuery(`SELECT DISTINCT ?adapt ?adaptLabel ?tv ?movie WHERE {
  VALUES ?src { ${values} }
  ?adapt wdt:P144 ?src .
  { ?adapt wdt:P4983 ?tv } UNION { ?adapt wdt:P4947 ?movie }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${labelLangs()}". }
}`);
  const seen = new Set<string>();
  const out: BookAdaptation[] = [];
  for (const r of rows) {
    const tv = Number(val(r, 'tv'));
    const movie = Number(val(r, 'movie'));
    const kind = tv ? 'series' : 'movie';
    const tmdbId = tv || movie;
    if (!tmdbId || seen.has(`${kind}-${tmdbId}`)) continue;
    seen.add(`${kind}-${tmdbId}`);
    out.push({
      wikidataId: qid(val(r, 'adapt')),
      title: val(r, 'adaptLabel') ?? '',
      tmdbId,
      kind,
    });
  }
  return out;
}

/** Reihe + Verfilmungen zu einem Buch, gefunden über Titel und Autor. */
export function fetchBookLinks(title: string, author?: string): Promise<BookLinks> {
  const key = `links2:${appLocale}:${title}|${author ?? ''}`.toLowerCase();
  return cached(key, 14 * DAY, async () => {
    let row = await findWork(title, author, appLocale);
    if (!row && appLocale !== 'en') row = await findWork(title, author, 'en');
    if (!row) return { adaptations: [] };
    const workId = qid(val(row, 'work'));
    const seriesId = qid(val(row, 'series'));
    const adaptations = await loadAdaptations([workId, seriesId].filter(Boolean));
    const wpTitle = val(row, 'wpTitle');
    const wpTitleEn = val(row, 'wpTitleEn');
    return {
      wikidataId: workId,
      wikipedia: wpTitle
        ? { lang: appLocale, title: wpTitle }
        : wpTitleEn
          ? { lang: 'en', title: wpTitleEn }
          : undefined,
      series: seriesId
        ? {
            wikidataId: seriesId,
            name: val(row, 'seriesLabel') ?? '',
            position: Number(val(row, 'ord')) || undefined,
          }
        : undefined,
      adaptations,
    };
  });
}

export function fetchSeriesParts(seriesId: string): Promise<BookSeriesPart[]> {
  if (isHardcoverSeriesKey(seriesId)) return hardcoverSeriesParts(seriesId.slice(3));
  return cached(`parts:${appLocale}:${seriesId}`, 3 * DAY, async () => {
    const rows = await runQuery(`SELECT ?part ?partLabel ?ord ?date ?olid WHERE {
  ?part p:P179 ?st . ?st ps:P179 wd:${seriesId} .
  OPTIONAL { ?st pq:P1545 ?ord . }
  OPTIONAL { ?part wdt:P577 ?date . }
  OPTIONAL { ?part wdt:P648 ?olid . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${labelLangs()}". }
} LIMIT 300`);
    return normalizeSeriesParts(
      rows.map((r) => ({
        wikidataId: qid(val(r, 'part')),
        title: val(r, 'partLabel'),
        position: val(r, 'ord'),
        date: val(r, 'date'),
        olWorkId: val(r, 'olid'),
      }))
    );
  });
}

async function loadBasedOn(ids: number[], kind: 'series' | 'movie'): Promise<BasedOnBook[]> {
  if (!ids.length) return [];
  const prop = kind === 'series' ? 'P4983' : 'P4947';
  const values = ids.map((id) => `"${id}"`).join(' ');
  const rows =
    await runQuery(`SELECT ?tmdb ?src ?srcLabel ?authorLabel (GROUP_CONCAT(DISTINCT STRAFTER(STR(?type), "entity/")) AS ?types) WHERE {
  VALUES ?tmdb { ${values} }
  ?item wdt:${prop} ?tmdb ; wdt:P144 ?src .
  ?src wdt:P50 ?author .
  OPTIONAL { ?src wdt:P31 ?type . }
  SERVICE wikibase:label { bd:serviceParam wikibase:language "${labelLangs()}". ?src rdfs:label ?srcLabel . ?author rdfs:label ?authorLabel . }
} GROUP BY ?tmdb ?src ?srcLabel ?authorLabel`);
  const out: BasedOnBook[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const types = (val(r, 'types') ?? '').split(/\s+/).filter(Boolean);
    if (types.some((t) => NON_BOOK_TYPES.has(t))) continue;
    const id = qid(val(r, 'src'));
    const title = val(r, 'srcLabel');
    if (!title || /^Q\d+$/.test(title)) continue;
    const dedupe = `${val(r, 'tmdb')}-${id}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    out.push({
      wikidataId: id,
      title,
      author: val(r, 'authorLabel'),
      isSeries: types.some((t) => SERIES_TYPES.has(t)),
      tmdbId: Number(val(r, 'tmdb')),
      kind,
    });
  }
  return out;
}

/** Bücher hinter einer Serie bzw. einem Film. */
export function fetchBasedOnBooks(
  tmdbId: number,
  kind: 'series' | 'movie'
): Promise<BasedOnBook[]> {
  return loadStaticBasedOn([tmdbId], kind).then(
    (prebuilt) =>
      prebuilt ??
      cached(`basedOn:${appLocale}:${kind}:${tmdbId}`, 7 * DAY, () => loadBasedOn([tmdbId], kind))
  );
}

const chunk = <T>(list: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(list.length / size) }, (_, i) =>
    list.slice(i * size, i * size + size)
  );

/** Für „Bücher zu deinen Serien": alle Titel der Sammlung in wenigen Abfragen. */
export function fetchBasedOnBooksBulk(
  seriesIds: number[],
  movieIds: number[]
): Promise<BasedOnBook[]> {
  return Promise.all([
    loadStaticBasedOn(seriesIds, 'series'),
    loadStaticBasedOn(movieIds, 'movie'),
  ]).then(([series, movies]) =>
    series && movies ? [...series, ...movies] : liveBasedOnBulk(seriesIds, movieIds)
  );
}

function liveBasedOnBulk(seriesIds: number[], movieIds: number[]): Promise<BasedOnBook[]> {
  const fingerprint = `${seriesIds.length}:${movieIds.length}:${[...seriesIds, ...movieIds]
    .reduce((h, id) => (h * 31 + id) % 1_000_000_007, 7)
    .toString(36)}`;
  return cached(`bulk:${appLocale}:${fingerprint}`, 3 * DAY, async () => {
    const jobs: [number[], 'series' | 'movie'][] = [
      ...chunk(seriesIds, 150).map((ids) => [ids, 'series'] as [number[], 'series']),
      ...chunk(movieIds, 150).map((ids) => [ids, 'movie'] as [number[], 'movie']),
    ];
    const out: BasedOnBook[] = [];
    for (const [ids, kind] of jobs) {
      try {
        out.push(...(await loadBasedOn(ids, kind)));
      } catch {
        /* einzelne Teilabfrage darf scheitern */
      }
    }
    return out;
  });
}
