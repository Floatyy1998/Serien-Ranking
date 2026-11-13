import { isLocale, type Locale } from '../../i18n/locales';
import type { Book, BookSeriesInfo, BookSeriesPart } from '../../types/Book';
import { isDnbSeriesKey, parseDnbSeriesKey } from './bookSearchMapping';
import { splitVolume } from './mangaVolume';

export interface RawSeriesPart {
  wikidataId: string;
  title?: string;
  position?: string;
  date?: string;
  olWorkId?: string;
}

const validDate = (value: string | undefined): string | undefined =>
  value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : undefined;

const looksLikeQid = (title: string | undefined) => !title || /^Q\d+$/.test(title);

/** Wikidata liefert Teile doppelt (Ausgaben, Übersetzungen); pro Bandnummer bleibt der älteste Eintrag. */
export function normalizeSeriesParts(raw: RawSeriesPart[]): BookSeriesPart[] {
  const byPosition = new Map<number, BookSeriesPart>();
  for (const part of raw) {
    const position = Number(part.position);
    if (!Number.isInteger(position) || position <= 0 || looksLikeQid(part.title)) continue;
    const candidate: BookSeriesPart = {
      wikidataId: part.wikidataId,
      title: part.title as string,
      position,
      publishedDate: validDate(part.date),
      olWorkId: part.olWorkId,
    };
    const existing = byPosition.get(position);
    if (!existing) {
      byPosition.set(position, candidate);
      continue;
    }
    const older =
      candidate.publishedDate &&
      (!existing.publishedDate || candidate.publishedDate < existing.publishedDate);
    if (older)
      byPosition.set(position, { ...candidate, olWorkId: candidate.olWorkId ?? existing.olWorkId });
    else if (!existing.olWorkId && candidate.olWorkId) existing.olWorkId = candidate.olWorkId;
  }
  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}

const fold = (title: string) => title.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** „Bis(s)" soll „Biss" wie „Bis" treffen — deshalb beide Lesarten der Klammer. „06" ist derselbe Band wie „6". */
function titleKeys(title: string, mainOnly: boolean): Set<string> {
  let text = fold(title).replace(/(^|\D)0+(?=\d)/g, '$1');
  if (mainOnly) text = text.split(/[:–—]| - /)[0];
  const squash = (s: string) => s.replace(/[^a-z0-9ß]+/g, '');
  return new Set(
    [squash(text), squash(text.replace(/\(.*?\)|\[.*?\]/g, ''))].filter((k) => k.length >= 3)
  );
}

const sharesKey = (a: Set<string>, b: Set<string>) => [...a].some((key) => b.has(key));

interface SeriesBookRef {
  title: string;
  wikidataId?: string;
  olWorkId?: string;
  isbn13?: string;
  series?: { wikidataId?: string; position?: number };
}

/**
 * Derselbe Reihen-Schlüssel? DNB-Reihen gab es kurz ohne Gesamttitel (`dnb:<Name>`) — sie gelten als dieselbe
 * Reihe wie `dnb:<IDN>:<Name>`, sonst zählte ein Band unter dem neuen Schlüssel in der alten Reihe als fehlend.
 */
export function sameSeriesKey(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  if (!isDnbSeriesKey(a) || !isDnbSeriesKey(b)) return false;
  const x = parseDnbSeriesKey(a);
  const y = parseDnbSeriesKey(b);
  return (
    (!x.parentId || !y.parentId || x.parentId === y.parentId) &&
    seriesNameKey(x.name) === seriesNameKey(y.name)
  );
}

/**
 * Bandnummer eines eigenen Buchs: gespeichert, über Wikidata-/Open-Library-ID oder eindeutig über den Titel.
 * Band 0 ist eine Vorgeschichte (Hardcover führt z. B. Dicks Roman als Band 0 der Blade-Runner-Reihe).
 */
export function partPositionOf(
  book: SeriesBookRef,
  parts: BookSeriesPart[],
  seriesId?: string
): number | undefined {
  const own = book.series?.position;
  if (
    typeof own === 'number' &&
    own >= 0 &&
    (!seriesId || sameSeriesKey(book.series?.wikidataId, seriesId))
  ) {
    return own;
  }
  const byId = parts.find(
    (p) =>
      (!!book.wikidataId && p.wikidataId === book.wikidataId) ||
      (!!book.olWorkId && p.olWorkId === book.olWorkId) ||
      (!!book.isbn13 && p.result?.isbn13 === book.isbn13)
  );
  if (byId) return byId.position;
  for (const mainOnly of [false, true]) {
    const keys = titleKeys(book.title, mainOnly);
    const hits = parts.filter((p) => sharesKey(keys, titleKeys(p.title, mainOnly)));
    if (hits.length === 1) return hits[0].position;
  }
  return undefined;
}

const authorKeys = (authors: string[] | undefined) =>
  new Set(
    (authors ?? []).flatMap((a) =>
      fold(a)
        .split(/[^a-z0-9ß]+/)
        .filter((w) => w.length >= 3)
    )
  );

/** Gleicher Autor, soweit beide Seiten einen kennen — „Maas, Sarah J." trifft „Sarah J. Maas". */
export function sameAuthor(a: string[] | undefined, b: string[] | undefined): boolean {
  const keysA = authorKeys(a);
  const keysB = authorKeys(b);
  return !keysA.size || !keysB.size || sharesKey(keysA, keysB);
}

// Gleiche ISBN schlägt den Autorvergleich: Die DNB nennt bei Manhwa oft nur den Zeichner.
function isPartOf(book: Book, part: BookSeriesPart | undefined): boolean {
  if (!part) return true;
  if (book.isbn13 && part.result?.isbn13 === book.isbn13) return true;
  return sameAuthor(book.authors, part.result?.authors);
}

/**
 * Bandnummer für die Reihenfolge: Steht auf dem Platz des Buchs ein Band eines anderen Autors
 * (Romanvorlage, Sammelband), liegt das Buch vor diesem Band — sonst würde der Band übersprungen.
 */
function orderPositionOf(
  book: Book,
  parts: BookSeriesPart[],
  seriesId: string
): number | undefined {
  const position = partPositionOf(book, parts, seriesId);
  if (position === undefined) return undefined;
  const part = parts.find((p) => p.position === position);
  return isPartOf(book, part) ? position : position - 0.5;
}

function certainPositionOf(
  book: Book,
  parts: BookSeriesPart[],
  seriesId: string
): number | undefined {
  const own = book.series?.position;
  if (typeof own === 'number' && sameSeriesKey(book.series?.wikidataId, seriesId)) return own;
  if (!book.isbn13) return undefined;
  return parts.find((p) => p.result?.isbn13 === book.isbn13)?.position;
}

/**
 * Passt das Buch in die Reihe? Es braucht einen Platz darin, und liegt dort ein Band, muss der Autor stimmen —
 * sonst ist die Reihe falsch zugeordnet (Verlobt mit Atsumori-kun als Band 1 von Omniscient Reader's Viewpoint).
 */
export function fitsSeries(book: Book, parts: BookSeriesPart[], seriesId: string): boolean {
  const position = partPositionOf(book, parts, seriesId);
  if (position === undefined) return false;
  return isPartOf(
    book,
    parts.find((p) => p.position === position)
  );
}

/**
 * Bandnummer zur Anzeige: Nennt der Titel selbst eine Nummer der Reihe („Blade Runner 3: Replicant Night"),
 * gilt diese — Hardcover zählt hier ab der Romanvorlage als Band 0.
 */
export function displayVolume(part: BookSeriesPart, seriesName?: string): number {
  const { series, volume } = splitVolume(part.title);
  if (volume === undefined) return part.position;
  const names = [part.result?.series?.name, seriesName].filter((n): n is string => !!n);
  return names.some((name) => seriesNameKey(name) === seriesNameKey(series))
    ? volume
    : part.position;
}

export interface NextVolume {
  part: BookSeriesPart;
  state: 'available' | 'upcoming' | 'unknown';
  daysUntil: number | null;
}

const daysFromNow = (date: string, now: number) =>
  Math.ceil((new Date(`${date}T00:00:00`).getTime() - now) / 86_400_000);

/** Der nächste Band nach der höchsten gelesenen Position; ohne Datum gilt er als erschienen, wenn ein späterer Band es ist. */
export function findNextVolume(
  parts: BookSeriesPart[],
  readPositions: number[],
  now: number
): NextVolume | null {
  const highest = readPositions.length ? Math.max(...readPositions) : 0;
  const index = parts.findIndex((p) => p.position > highest);
  if (index < 0) return null;
  const next = parts[index];
  if (next.publishedDate) {
    const days = daysFromNow(next.publishedDate, now);
    return days > 0
      ? { part: next, state: 'upcoming', daysUntil: days }
      : { part: next, state: 'available', daysUntil: null };
  }
  const laterReleased = parts
    .slice(index + 1)
    .some((p) => p.publishedDate && daysFromNow(p.publishedDate, now) <= 0);
  return { part: next, state: laterReleased ? 'available' : 'unknown', daysUntil: null };
}

export interface SeriesProgress {
  seriesId: string;
  seriesName: string;
  author?: string;
  next: NextVolume;
  /** Bandnummer des nächsten Bands zur Anzeige (siehe `displayVolume`). */
  volume: number;
  ownedCount: number;
  total: number;
  books: Book[];
}

/** Reihen, in denen jemand liest oder gelesen hat und deren nächster Band noch fehlt (geplant zählt als fehlend). */
export function seriesProgress(
  books: Book[],
  partsBySeries: Record<string, BookSeriesPart[]>,
  seriesNames: Record<string, string>,
  now: number
): SeriesProgress[] {
  const out: SeriesProgress[] = [];
  const seen: string[] = [];
  // Gleiches Buch auf gleichem Platz = dasselbe Werk unter zweitem Schlüssel; Unterreihen haben andere Plätze.
  const claimed = new Set<string>();
  // Schlüssel mit Gesamttitel zuerst — ein älterer gleichwertiger Schlüssel ergäbe dieselbe Reihe ein zweites Mal.
  const entries = Object.entries(partsBySeries).sort(
    ([a], [b]) =>
      Number(!isDnbSeriesKey(a) || !parseDnbSeriesKey(a).parentId) -
      Number(!isDnbSeriesKey(b) || !parseDnbSeriesKey(b).parentId)
  );
  for (const [seriesId, parts] of entries) {
    if (parts.length < 2) continue;
    if (seen.some((key) => sameSeriesKey(key, seriesId))) continue;
    seen.push(seriesId);
    const inSeries = books.filter(
      (b) =>
        sameSeriesKey(b.series?.wikidataId, seriesId) ||
        partPositionOf(b, parts, seriesId) !== undefined
    );
    const certain = inSeries.flatMap((b) => {
      const position = certainPositionOf(b, parts, seriesId);
      return position === undefined ? [] : [`${b.id}@${position}`];
    });
    if (certain.some((claim) => claimed.has(claim))) continue;
    certain.forEach((claim) => claimed.add(claim));
    const positionsOf = (statuses: Book['status'][]) =>
      inSeries
        .filter((b) => statuses.includes(b.status))
        .map((b) => orderPositionOf(b, parts, seriesId))
        .filter((p): p is number => p !== undefined);
    // Wer eine Reihe gerade anfängt, sieht den nächsten Band schon beim Lesen, nicht erst nach dem Beenden.
    const startedPositions = positionsOf(['completed', 'reading']);
    if (!startedPositions.length) continue;
    const readPositions = positionsOf(['completed']);
    const next = findNextVolume(parts, startedPositions, now);
    if (!next) continue;
    const owned = inSeries.some(
      (b) => orderPositionOf(b, parts, seriesId) === next.part.position && b.status !== 'planned'
    );
    if (owned) continue;
    const sample = inSeries[0];
    const seriesName = seriesNames[seriesId] || sample?.series?.name || '';
    out.push({
      seriesId,
      seriesName,
      // Der nächste Band kann von jemand anderem sein (Jeter nach Dick) — sein Autor findet ihn.
      author: next.part.result?.authors?.[0] ?? sample?.authors?.[0],
      next,
      volume: displayVolume(next.part, seriesName),
      ownedCount: readPositions.length,
      total: parts.length,
      books: inSeries,
    });
  }
  return out.sort((a, b) => (a.next.daysUntil ?? -1) - (b.next.daysUntil ?? -1));
}

const SERIES_RECHECK_MS = 30 * 86_400_000;
/**
 * Stand der Reihensuche (`seriesCheckedV`): eine neue Quelle erhöht ihn, dann prüft die App jedes Buch einmal neu.
 * 3 = Katalog, Hardcover, DNB per ISBN mit Gesamttitel, DNB über den Titel.
 * 4 = die Bandliste folgt der Sprache des Buchs (Hardcover in dieser Sprache, für Deutsch notfalls die DNB).
 * 5 = das Buch selbst zählt dabei nicht mit (Lady Eris: nur Band 1 deutsch, Band 6 und 7 koreanisch).
 */
export const SERIES_LOOKUP_VERSION = 5;

/** ISBN-Gruppen der App-Sprachen (Sprachräume bzw. Länder) — verlässlicher als das Sprachfeld der Quellen. */
const ISBN_LANGUAGE: [prefix: string, language: Locale][] = [
  ['9780', 'en'],
  ['9781', 'en'],
  ['9798', 'en'],
  ['9782', 'fr'],
  ['97910', 'fr'],
  ['9783', 'de'],
  ['97884', 'es'],
  ['978607', 'es'],
  ['978612', 'es'],
  ['978950', 'es'],
  ['978956', 'es'],
  ['978958', 'es'],
  ['978968', 'es'],
  ['978970', 'es'],
  ['978980', 'es'],
  ['978987', 'es'],
  ['97885', 'pt'],
  ['97865', 'pt'],
  ['978972', 'pt'],
  ['978989', 'pt'],
];

interface Edition {
  isbn13?: string;
  language?: string;
  source?: string;
}

/**
 * Sprache einer Ausgabe, soweit sie eine App-Sprache ist: zuerst die ISBN-Gruppe, sonst das Sprachfeld.
 * Hardcover markiert unübersetzte Ausgaben pauschal als „en" (die koreanischen Bände von Her Tale of Shim Chong).
 */
export function editionLanguage(edition: Edition | undefined): Locale | undefined {
  if (!edition) return undefined;
  const isbn = edition.isbn13 ?? '';
  const byIsbn = ISBN_LANGUAGE.find(([prefix]) => isbn.startsWith(prefix))?.[1];
  if (byIsbn) return byIsbn;
  if (edition.source === 'hardcover' && edition.language === 'en') return undefined;
  const code = edition.language?.slice(0, 2).toLowerCase();
  return isLocale(code) ? code : undefined;
}

/**
 * Passt die Bandliste zur Sprache des Buchs? Wer auf Deutsch (Spanisch, …) liest, soll als nächsten Band nicht
 * die Originalausgabe sehen — Hardcover kennt bei „Her Tale of Shim Chong" nur die koreanischen Bände, die DNB die deutschen.
 */
export function partsFitLanguage(
  book: Edition & { series?: { position?: number } },
  parts: BookSeriesPart[]
): boolean {
  const language = editionLanguage(book);
  if (!language || !parts.length) return true;
  // Das Buch selbst zählt nicht: Hardcover hängt die eigene Ausgabe in eine Liste aus Originalen.
  const own = book.series?.position;
  return parts.some(
    (p) =>
      editionLanguage(p.result) === language &&
      !(book.isbn13 && p.result?.isbn13 === book.isbn13) &&
      p.position !== own
  );
}

/** Felder, die eine abgeschlossene Reihensuche am Buch hinterlässt. */
export const seriesCheckedFields = () => ({
  seriesChecked: new Date().toISOString(),
  seriesCheckedV: SERIES_LOOKUP_VERSION,
});

/**
 * Braucht das Buch eine Reihen-Suche (Katalog, Hardcover, DNB)? Nur wenn sein Schlüssel keine Bände liefert
 * (z. B. deutscher DNB-Reihenname) oder sein Band darin nicht zu finden ist, es eine Hardcover-ID oder
 * ISBN hat und die letzte Suche alt ist oder älter als die heutigen Quellen.
 */
export function needsSeriesLookup(
  book: Book,
  knownParts: number,
  placed: boolean,
  now: number
): boolean {
  if ((knownParts >= 2 && placed) || (!book.hardcoverId && !book.isbn13)) return false;
  if (book.seriesCheckedV !== SERIES_LOOKUP_VERSION) return true;
  const checkedAt = book.seriesChecked ? new Date(book.seriesChecked).getTime() : 0;
  return now - checkedAt >= SERIES_RECHECK_MS;
}

/** Hardcover-Reihe übernehmen: Name zur Anzeige bleibt, Schlüssel und Bandnummer kommen aus derselben Quelle wie die Bände. */
export function adoptSeries(
  own: BookSeriesInfo | undefined,
  found: BookSeriesInfo
): BookSeriesInfo {
  const position = found.position ?? own?.position;
  return {
    name: own?.name || found.name,
    wikidataId: found.wikidataId,
    ...(position !== undefined ? { position } : {}),
    ...(found.hardcoverId ? { hardcoverId: found.hardcoverId } : {}),
  };
}

export const seriesNameKey = (name: string) => fold(name).replace(/[^a-z0-9ß]+/g, '');

/**
 * Hat jemand die Reihe schon über einen anderen Schlüssel (z. B. Wikidata) in der Sammlung, übernimmt ein neu
 * hinzugefügtes Buch diesen Schlüssel — sonst erschiene dieselbe Reihe zweimal unter „nächster Band".
 */
export function alignSeriesKey<T extends { series?: BookSeriesInfo }>(item: T, library: Book[]): T {
  const series = item.series;
  if (!series?.name) return item;
  const wanted = seriesNameKey(series.name);
  const known = library.find(
    (b) => b.series?.wikidataId && b.series.name && seriesNameKey(b.series.name) === wanted
  )?.series?.wikidataId;
  return known && known !== series.wikidataId
    ? { ...item, series: { ...series, wikidataId: known } }
    : item;
}

const EXPLICIT_VOLUME = /\b(?:band|bd|vol|volume|tome|tomo|teil|nr|book|buch)\.?\s*\d{1,4}\s*$/i;

export interface SeriesPlacement {
  name?: string;
  position?: number;
}

/**
 * Reihe und Band für die Anzeige: eigene Angabe vor Wikidata vor Manga-Abgleich.
 * Eine Zahl am Titelende zählt nur bei Manga-Bänden oder mit „Band/Vol./Teil" („1984" ist kein Band).
 */
export function seriesPlacement(input: {
  title: string;
  own?: BookSeriesInfo;
  linked?: SeriesPlacement;
  manga?: { name: string; volume?: number };
}): SeriesPlacement {
  const titled = splitVolume(input.title);
  const trusted =
    titled.volume !== undefined && (!!input.manga || EXPLICIT_VOLUME.test(input.title))
      ? titled
      : undefined;
  return {
    name:
      input.own?.name || input.linked?.name || trusted?.series || input.manga?.name || undefined,
    position:
      input.own?.position ?? input.linked?.position ?? input.manga?.volume ?? trusted?.volume,
  };
}
