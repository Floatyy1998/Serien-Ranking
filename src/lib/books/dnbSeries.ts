import type { BookSearchResult, BookSeriesInfo, BookSeriesPart } from '../../types/Book';
import { pickIsbn13 } from './bookIdentity';
import { dnbSeriesKey, isDnbSeriesKey, mapDnbRecord, parseDnbSeriesKey } from './bookSearchMapping';
import { sameAuthor, seriesNameKey } from './bookSeries';
import { seriesHead, splitVolume } from './mangaVolume';

const MARC_NS = 'http://www.loc.gov/MARC21/slim';

/** Geplanter Erscheinungsmonat aus Feld 263 („202702") als „2027-02". */
export function plannedMonthOf(raw: string | undefined | null): string | undefined {
  const match = raw?.match(/^(\d{4})(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : undefined;
}

/**
 * Erscheinungsdatum eines DNB-Bands: Feld 263 trägt den geplanten Monat, solange der Verlag ihn ankündigt
 * (im laufenden Monat bleibt der Termin offen). Ohne 263 ist der Band erschienen, das Jahr genügt —
 * „Why Claris was Married to Jean 03" (2026, erschienen im September) steht sonst als „Termin offen" da.
 */
export function dnbPartDate(
  year: number | undefined,
  planned: string | undefined,
  now = new Date()
): string | undefined {
  if (planned) {
    const current = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    return planned === current ? undefined : `${planned}-01`;
  }
  return year ? `${year}-01-01` : undefined;
}

/** Bandnummer eines Treffers, wenn er zur gesuchten Reihe gehört — aus Feld 490/245 $n oder der Zahl am Titelende. */
function volumeIn(result: BookSearchResult, wanted: string): number | undefined {
  const { series } = result;
  if (series?.position && seriesNameKey(series.name) === wanted) return series.position;
  const titled = splitVolume(result.title);
  if (!titled.volume) return undefined;
  // „Lady Eris - Nur der Tod kann mich erlösen 05" gehört zu „Lady Eris" (Bände 1–4 ohne Untertitel).
  return seriesNameKey(titled.series) === wanted ||
    seriesNameKey(seriesHead(titled.series)) === wanted
    ? titled.volume
    : undefined;
}

/**
 * Bände einer Reihe aus einer DNB-Titelsuche (SRU, MARC21). Pro Band bleibt die Druckausgabe (mit Seitenzahl)
 * vor dem E-Book; Bände aus dem laufenden Jahr bleiben ohne Datum — die DNB nennt oft nur das Jahr.
 */
export function mapDnbSeriesParts(xml: string, name: string, now = new Date()): BookSeriesPart[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const serializer = new XMLSerializer();
  const wanted = seriesNameKey(name);
  const byPosition = new Map<number, BookSeriesPart>();
  for (const record of [...doc.getElementsByTagNameNS(MARC_NS, 'record')]) {
    const fields = [...record.getElementsByTagNameNS(MARC_NS, 'datafield')];
    const values = (tag: string, codes: string[]) =>
      fields
        .filter((f) => f.getAttribute('tag') === tag)
        .flatMap((f) => [...f.getElementsByTagNameNS(MARC_NS, 'subfield')])
        .filter((s) => codes.includes(s.getAttribute('code') ?? ''))
        .map((s) => s.textContent ?? '');
    const isbn13 = pickIsbn13(values('020', ['9', 'a']));
    if (!isbn13) continue;
    const result = mapDnbRecord(serializer.serializeToString(record), isbn13);
    const position = result && volumeIn(result, wanted);
    if (!result || !position) continue;
    const publishedDate = dnbPartDate(
      result.publishedYear,
      plannedMonthOf(values('263', ['a'])[0]),
      now
    );
    keepPrint(byPosition, {
      wikidataId: result.id,
      title: result.title,
      position,
      ...(publishedDate ? { publishedDate } : {}),
      result,
    });
  }
  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}

/** Leader/06 „a"/„t" = Textausgabe; Hörbücher, Filme und Fanartikel (Plüsch, Tassen) fallen weg. */
const isTextRecord = (record: Element) => {
  const leader = record.getElementsByTagNameNS(MARC_NS, 'leader')[0]?.textContent ?? '';
  return leader.length < 7 || leader[6] === 'a' || leader[6] === 't';
};

/** Alle Bücher einer DNB-Suche (SRU, MARC21) mit ISBN als Treffer — für die Freitextsuche. */
export function mapDnbRecords(xml: string): BookSearchResult[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const serializer = new XMLSerializer();
  const out: BookSearchResult[] = [];
  const seen = new Set<string>();
  for (const record of [...doc.getElementsByTagNameNS(MARC_NS, 'record')]) {
    if (!isTextRecord(record)) continue;
    const isbns = [...record.getElementsByTagNameNS(MARC_NS, 'datafield')]
      .filter((f) => f.getAttribute('tag') === '020')
      .flatMap((f) => [...f.getElementsByTagNameNS(MARC_NS, 'subfield')])
      .filter((s) => ['9', 'a'].includes(s.getAttribute('code') ?? ''))
      .map((s) => s.textContent ?? '');
    const isbn13 = pickIsbn13(isbns);
    if (!isbn13 || seen.has(isbn13)) continue;
    const result = mapDnbRecord(serializer.serializeToString(record), isbn13);
    if (!result) continue;
    seen.add(isbn13);
    out.push(result);
  }
  return out;
}

/** Pro Band die Druckausgabe (mit Seitenzahl) vor dem E-Book; bei Gleichstand bleibt der erste Treffer. */
function keepPrint(byPosition: Map<number, BookSeriesPart>, part: BookSeriesPart) {
  const existing = byPosition.get(part.position);
  if (existing && (existing.result?.pageCount || !part.result?.pageCount)) return;
  byPosition.set(part.position, part);
}

/**
 * Reihe aus dem Titel („Bungo Stray Dogs 01"), wenn keine Quelle die ISBN kennt: Die DNB-Bände der Reihe müssen
 * vom selben Autor sein, sonst ist es keine („Fahrenheit 451"). Schlüssel mit dem häufigsten Gesamttitel der Bände.
 */
export function seriesFromTitle(
  book: { title: string; authors?: string[] },
  parts: BookSeriesPart[]
): BookSeriesInfo | null {
  const { series, volume } = splitVolume(book.title);
  if (volume === undefined || parts.length < 2 || !book.authors?.length) return null;
  const known = parts.filter((p) => p.result?.authors?.length);
  const matching = known.filter((p) => sameAuthor(book.authors, p.result?.authors)).length;
  if (!known.length || matching * 2 < known.length) return null;
  const parents = new Map<string, number>();
  for (const part of parts) {
    const key = part.result?.series?.wikidataId;
    const parentId = key && isDnbSeriesKey(key) ? parseDnbSeriesKey(key).parentId : undefined;
    if (parentId) parents.set(parentId, (parents.get(parentId) ?? 0) + 1);
  }
  const parentId = [...parents.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { name: series, position: volume, wikidataId: dnbSeriesKey(series, parentId) };
}

const parentOf = (part: BookSeriesPart): string | undefined => {
  const key = part.result?.series?.wikidataId;
  return key && isDnbSeriesKey(key) ? parseDnbSeriesKey(key).parentId : undefined;
};

/**
 * Bandliste mit bekanntem Gesamttitel: Die Titelsuche findet auch gleichnamige andere Reihen (Manga und Light Novel
 * von „Meine Wiedergeburt als Schleim in einer anderen Welt" heißen Band für Band gleich). Bände eines anderen
 * Gesamttitels fallen weg, Bände ohne Gesamttitel (nur Feld 490) verlängern die Liste nur lückenlos.
 */
export function mergeParentSeriesParts(
  byParent: BookSeriesPart[],
  byTitle: BookSeriesPart[],
  parentId: string
): BookSeriesPart[] {
  const own = mergeSeriesParts([byParent, byTitle.filter((p) => parentOf(p) === parentId)]);
  const loose = mergeSeriesParts([byTitle.filter((p) => !parentOf(p))]);
  if (!own.length) return loose;
  let last = own[own.length - 1].position;
  for (const part of loose) {
    if (part.position <= last) continue;
    if (part.position !== last + 1) break;
    own.push(part);
    last = part.position;
  }
  return own;
}

/** Bandlisten mehrerer DNB-Abfragen (`partof`, Titelsuche) zu einer zusammenführen. */
export function mergeSeriesParts(lists: BookSeriesPart[][]): BookSeriesPart[] {
  const byPosition = new Map<number, BookSeriesPart>();
  for (const part of lists.flat()) keepPrint(byPosition, part);
  return [...byPosition.values()].sort((a, b) => a.position - b.position);
}
