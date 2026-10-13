import { bookMatchKey } from '../../lib/books/bookIdentity';
import type { TasteGenre } from '../../lib/books/readingTaste';
import { openLibraryCoverById } from '../../lib/books/bookSearchMapping';
import type { BasedOnBook, BookSearchResult } from '../../types/Book';
import { appLocale } from '../i18n';

const BACKEND = import.meta.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de';

/** Tagesstempel als Cache-Bust — /catalog/ ist immutable, die Datei wird täglich neu gebaut. */
const day = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

interface StaticShelfItem {
  w: string;
  t: string;
  a?: string;
  c: number;
  y?: number;
  p?: number;
  i?: string;
  l?: string;
  r?: number;
}

interface StaticSource {
  q: string;
  t: Record<string, string>;
  a?: string;
  s?: 1;
}

type SourcesFile = { tv: Record<string, StaticSource[]>; movie: Record<string, StaticSource[]> };

const memory = new Map<string, Promise<unknown>>();

function load<T>(file: string): Promise<T> {
  const url = `${BACKEND}/catalog/books/${file}?d=${day()}`;
  let pending = memory.get(url) as Promise<T> | undefined;
  if (!pending) {
    pending = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`static ${file} ${res.status}`);
      return res.json() as Promise<T>;
    });
    pending.catch(() => memory.delete(url));
    memory.set(url, pending);
  }
  return pending;
}

const toResult = (item: StaticShelfItem): BookSearchResult => ({
  id: `ol-${item.w}`,
  title: item.t,
  authors: item.a ? [item.a] : [],
  cover: openLibraryCoverById(item.c),
  pageCount: item.p,
  publishedYear: item.y,
  isbn13: item.i,
  olWorkId: item.w,
  language: item.l,
  source: 'openlibrary',
  popularity: item.r,
});

/** Vorberechnetes Regal (Backend-Cron) — null, wenn die Datei fehlt oder das Regal leer ist. */
export async function loadStaticShelf(id: string): Promise<BookSearchResult[] | null> {
  const data = await load<{ shelves?: Record<string, StaticShelfItem[]> }>(
    `discover.${appLocale}.json`
  );
  const list = data.shelves?.[id];
  return list?.length ? list.map(toResult) : null;
}

const GENRE_SHELVES: TasteGenre[] = [
  'fantasy',
  'thriller',
  'romance',
  'scifi',
  'ya',
  'classics',
  'horror',
  'nonfiction',
];

/** Genre je Buch aus den Genre-Regalen (über Werk-ID und Titel + Autor) — ergänzt fehlende Kategorien. */
export async function loadShelfGenreIndex(): Promise<Map<string, TasteGenre[]>> {
  const index = new Map<string, TasteGenre[]>();
  const data = await load<{ shelves?: Record<string, StaticShelfItem[]> }>(
    `discover.${appLocale}.json`
  ).catch(() => null);
  for (const genre of GENRE_SHELVES) {
    for (const item of data?.shelves?.[genre] ?? []) {
      for (const key of [`ol-${item.w}`, bookMatchKey(item.t, item.a ? [item.a] : [])]) {
        index.set(key, [...(index.get(key) ?? []), genre]);
      }
    }
  }
  return index;
}

/** Buchvorlagen aus dem Tagesexport; null heißt: Datei nicht erreichbar, live nachfragen. */
export async function loadStaticBasedOn(
  ids: number[],
  kind: 'series' | 'movie'
): Promise<BasedOnBook[] | null> {
  let data: SourcesFile;
  try {
    data = await load<SourcesFile>('sources.json');
  } catch {
    return null;
  }
  const table = kind === 'series' ? data.tv : data.movie;
  const out: BasedOnBook[] = [];
  for (const id of ids) {
    for (const source of table?.[String(id)] ?? []) {
      const title = source.t[appLocale] ?? source.t.en ?? source.t.de ?? Object.values(source.t)[0];
      if (!title) continue;
      out.push({
        wikidataId: source.q,
        title,
        author: source.a,
        isSeries: !!source.s,
        tmdbId: id,
        kind,
      });
    }
  }
  return out;
}
