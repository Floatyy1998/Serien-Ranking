import type { BookSearchResult, BookSeriesPart } from '../../types/Book';
import {
  editionLanguage,
  sameAuthor,
  sameSeriesKey,
  seriesNameKey,
  titledStems,
} from './bookSeries';
import { dnbPartDate } from './dnbSeries';
import { splitVolume } from './mangaVolume';

export interface CatalogEdition {
  id: string;
  t: string;
  a?: string[];
  i?: string;
  h?: number;
  l?: string;
  s?: string;
  sp?: number;
  v: number;
}

/** Fremdsprachige Bände der Liste samt Katalog-Ausgabe in `lang`: dasselbe Hardcover-Buch, derselbe Reihenplatz oder der Titel der Nachbarbände. */
export function localEditionGaps(
  seriesKey: string,
  parts: BookSeriesPart[],
  lang: string,
  editions: CatalogEdition[]
): { position: number; edition: CatalogEdition }[] {
  const local = parts.filter((p) => editionLanguage(p.result) === lang);
  const foreign = parts.filter((p) => p.result && editionLanguage(p.result) !== lang);
  if (!local.length || !foreign.length) return [];
  const stems = titledStems(local);
  const fitting = editions.filter((e) => editionLanguage({ isbn13: e.i, language: e.l }) === lang);
  const gaps: { position: number; edition: CatalogEdition }[] = [];
  for (const part of foreign) {
    const edition = fitting.find((e) => {
      if (e.id === part.wikidataId) return false;
      if (e.h && e.h === part.result?.hardcoverId) return true;
      if (e.sp === part.position && sameSeriesKey(e.s, seriesKey)) return true;
      if (e.s || !sameAuthor(e.a, part.result?.authors)) return false;
      const titled = splitVolume(e.t);
      return titled.volume === part.position && stems.has(seriesNameKey(titled.series));
    });
    if (edition) gaps.push({ position: part.position, edition });
  }
  return gaps;
}

/** Band in catalog/books/series/<lang>/<datei>.json (Nachtlauf bookSeriesCatalog.js im Backend). */
export interface CatalogSeriesPart {
  id: string;
  title: string;
  position: number;
  year?: number;
  /** Geplanter Erscheinungsmonat laut DNB-Feld 263 („2027-02"), solange der Verlag ihn ankündigt. */
  planned?: string;
  authors?: string[];
  cover?: string;
  coverFallback?: string;
  isbn13?: string;
  hardcoverId?: number;
  pageCount?: number;
  publisher?: string;
  language?: string;
}

export interface CatalogSeriesFile {
  key: string;
  name: string;
  v: number;
  parts: CatalogSeriesPart[];
}

/** Dateiname der Bandliste: FNV-1a des Reihen-Schlüssels — Spiegel von seriesFileName im Backend. */
export function seriesFileName(key: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${hash.toString(16).padStart(8, '0')}.json`;
}

function publishedDateOf(
  p: CatalogSeriesPart,
  year: number,
  now: Date
): { publishedDate?: string } {
  const date = p.id.startsWith('dnb-')
    ? dnbPartDate(p.year, p.planned, now)
    : p.year && p.year !== year
      ? `${p.year}-01-01`
      : undefined;
  return date ? { publishedDate: date } : {};
}

/**
 * Bände im Format der Reihenlogik. DNB-Bände datiert wie im Frontend (geplanter Monat, sonst erschienen);
 * Hardcover-Bände aus dem laufenden Jahr bleiben ohne Datum.
 */
export function mapCatalogSeries(file: CatalogSeriesFile, now = new Date()): BookSeriesPart[] {
  const year = now.getFullYear();
  return file.parts
    .filter((p) => p.id && p.title && Number.isInteger(p.position) && p.position > 0)
    .map((p) => {
      const result: BookSearchResult = {
        id: p.id,
        title: p.title,
        authors: p.authors ?? [],
        cover: p.cover,
        coverFallback: p.coverFallback,
        isbn13: p.isbn13,
        hardcoverId: p.hardcoverId,
        pageCount: p.pageCount,
        publisher: p.publisher,
        language: p.language,
        publishedYear: p.year,
        series: { name: file.name, position: p.position, wikidataId: file.key },
        source: p.id.startsWith('dnb-') ? 'dnb' : 'hardcover',
      };
      return {
        wikidataId: p.id,
        title: p.title,
        position: p.position,
        ...publishedDateOf(p, year, now),
        result: Object.fromEntries(
          Object.entries(result).filter(([, v]) => v !== undefined)
        ) as BookSearchResult,
      };
    })
    .sort((a, b) => a.position - b.position);
}
