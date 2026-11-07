import type { Book, BookSeriesInfo, BookSeriesPart } from '../../types/Book';
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

/** „Bis(s)" soll „Biss" wie „Bis" treffen — deshalb beide Lesarten der Klammer. */
function titleKeys(title: string, mainOnly: boolean): Set<string> {
  let text = fold(title);
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
  series?: { wikidataId?: string; position?: number };
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
  if (typeof own === 'number' && own >= 0 && (!seriesId || book.series?.wikidataId === seriesId)) {
    return own;
  }
  const byId = parts.find(
    (p) =>
      (!!book.wikidataId && p.wikidataId === book.wikidataId) ||
      (!!book.olWorkId && p.olWorkId === book.olWorkId)
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
function sameAuthor(a: string[] | undefined, b: string[] | undefined): boolean {
  const keysA = authorKeys(a);
  const keysB = authorKeys(b);
  return !keysA.size || !keysB.size || sharesKey(keysA, keysB);
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
  return part && !sameAuthor(book.authors, part.result?.authors) ? position - 0.5 : position;
}

/**
 * Passt das Buch in die Reihe? Es braucht einen Platz darin, und liegt dort ein Band, muss der Autor stimmen —
 * sonst ist die Reihe falsch zugeordnet (Verlobt mit Atsumori-kun als Band 1 von Omniscient Reader's Viewpoint).
 */
export function fitsSeries(book: Book, parts: BookSeriesPart[], seriesId: string): boolean {
  const position = partPositionOf(book, parts, seriesId);
  if (position === undefined) return false;
  const part = parts.find((p) => p.position === position);
  return !part || sameAuthor(book.authors, part.result?.authors);
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
  for (const [seriesId, parts] of Object.entries(partsBySeries)) {
    if (parts.length < 2) continue;
    const inSeries = books.filter(
      (b) => b.series?.wikidataId === seriesId || partPositionOf(b, parts, seriesId) !== undefined
    );
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
/** Prüfungen davor kannten die DNB-Gesamttitel (`partof`) als Reihenquelle noch nicht. */
const SERIES_LOOKUP_SINCE = Date.parse('2026-11-07T15:00:00+01:00');

/**
 * Braucht das Buch eine Reihen-Suche (Hardcover, dann DNB)? Nur wenn sein Schlüssel keine Bände liefert
 * (z. B. deutscher DNB-Reihenname) oder sein Band darin nicht zu finden ist, es eine Hardcover-ID oder
 * ISBN hat und die letzte Suche alt ist.
 */
export function needsSeriesLookup(
  book: Book,
  knownParts: number,
  placed: boolean,
  now: number
): boolean {
  if ((knownParts >= 2 && placed) || (!book.hardcoverId && !book.isbn13)) return false;
  const checkedAt = book.seriesChecked ? new Date(book.seriesChecked).getTime() : 0;
  return checkedAt < SERIES_LOOKUP_SINCE || now - checkedAt >= SERIES_RECHECK_MS;
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
