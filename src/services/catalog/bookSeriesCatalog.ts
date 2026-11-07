import { isDnbSeriesKey, parseDnbSeriesKey } from '../../lib/books/bookSearchMapping';
import {
  mapCatalogSeries,
  seriesFileName,
  type CatalogSeriesFile,
} from '../../lib/books/catalogSeries';
import type { BookSeriesInfo, BookSeriesPart } from '../../types/Book';
import { appLocale } from '../i18n';
import { bookCatalogVersion, loadBookCatalogIndex } from './bookCatalog';
import { CATALOG_BACKEND } from './catalogClient';

/**
 * Reihen aus dem statischen Bücher-Katalog: Der Nachtlauf bestimmt die Reihe jedes Katalog-Buchs (`s`/`sp` in
 * index.json) und legt die Bandliste je Sprache ab. Andere App-Sprachen fragen Hardcover weiter live,
 * weil die Bandtitel übersetzt sind.
 */
const SERIES_LANGS = new Set(['de', 'en']);

const files = new Map<string, Promise<BookSeriesPart[]>>();

/** Bandliste aus dem Katalog; leer, wenn es (noch) keine gibt — dann fragt die App die Quelle live. */
export function loadCatalogSeries(
  key: string,
  lang: string = appLocale
): Promise<BookSeriesPart[]> {
  if (!SERIES_LANGS.has(lang)) return Promise.resolve([]);
  let pending = files.get(`${lang}:${key}`);
  if (!pending) {
    pending = (async () => {
      const v = await bookCatalogVersion();
      const url = `${CATALOG_BACKEND}/catalog/books/series/${lang}/${seriesFileName(key)}?v=${v}`;
      const res = await fetch(url);
      if (!res.ok) return [];
      const file = (await res.json()) as CatalogSeriesFile;
      return file.key === key ? mapCatalogSeries(file) : [];
    })().catch(() => []);
    files.set(`${lang}:${key}`, pending);
  }
  return pending;
}

/** Reihe eines Buchs laut Katalog-Index; `null` = Katalog kennt das Buch, aber keine Reihe; `undefined` = unbekannt. */
export async function catalogSeriesOf(bookId: string): Promise<BookSeriesInfo | null | undefined> {
  const index = await loadBookCatalogIndex().catch(() => null);
  const entry = index?.items.find((item) => item.id === bookId);
  if (!entry) return undefined;
  if (!entry.s) return null;
  const name = isDnbSeriesKey(entry.s)
    ? parseDnbSeriesKey(entry.s).name
    : entry.s.replace(/^hc:/, '');
  return {
    name,
    wikidataId: entry.s,
    ...(entry.sp !== undefined ? { position: entry.sp } : {}),
  };
}
