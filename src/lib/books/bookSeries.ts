import type { Book, BookSeriesPart } from '../../types/Book';

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

/** Bandnummer eines eigenen Buchs: gespeichert, über Wikidata-/Open-Library-ID oder eindeutig über den Titel. */
export function partPositionOf(
  book: SeriesBookRef,
  parts: BookSeriesPart[],
  seriesId?: string
): number | undefined {
  if (book.series?.position && (!seriesId || book.series.wikidataId === seriesId)) {
    return book.series.position;
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
  ownedCount: number;
  total: number;
  books: Book[];
}

/** Reihen, in denen jemand gelesen hat und deren nächster Band noch fehlt (geplant zählt als fehlend). */
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
    const readPositions = inSeries
      .filter((b) => b.status === 'completed')
      .map((b) => partPositionOf(b, parts, seriesId))
      .filter((p): p is number => !!p);
    if (!readPositions.length) continue;
    const next = findNextVolume(parts, readPositions, now);
    if (!next) continue;
    const owned = inSeries.some(
      (b) => partPositionOf(b, parts, seriesId) === next.part.position && b.status !== 'planned'
    );
    if (owned) continue;
    const sample = inSeries[0];
    out.push({
      seriesId,
      seriesName: seriesNames[seriesId] || sample?.series?.name || '',
      author: sample?.authors?.[0],
      next,
      ownedCount: readPositions.length,
      total: parts.length,
      books: inSeries,
    });
  }
  return out.sort((a, b) => (a.next.daysUntil ?? -1) - (b.next.daysUntil ?? -1));
}
