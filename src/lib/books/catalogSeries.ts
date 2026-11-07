import type { BookSearchResult, BookSeriesPart } from '../../types/Book';

/** Band in catalog/books/series/<lang>/<datei>.json (Nachtlauf bookSeriesCatalog.js im Backend). */
export interface CatalogSeriesPart {
  id: string;
  title: string;
  position: number;
  year?: number;
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

/** Bände im Format der Reihenlogik; ein Band aus dem laufenden Jahr bleibt ohne Datum wie bei Hardcover und DNB. */
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
        ...(p.year && p.year !== year ? { publishedDate: `${p.year}-01-01` } : {}),
        result: Object.fromEntries(
          Object.entries(result).filter(([, v]) => v !== undefined)
        ) as BookSearchResult,
      };
    })
    .sort((a, b) => a.position - b.position);
}
