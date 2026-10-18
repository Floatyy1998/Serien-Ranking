/** Charts im Lese-Entdecken: Bücher und Manga in einem Raster (ohne I/O). */

/** Mehrere Ranglisten reihum, Platz 1 aller Listen zuerst. */
export function roundRobin<T>(lists: T[][]): T[] {
  const out: T[] = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < longest; i++)
    for (const list of lists) if (i < list.length) out.push(list[i]);
  return out;
}

/** Abwechselnd a und b; Reste erst, wenn die andere Liste fertig ist — beim Nachladen rutscht nichts. */
export function interleaveStable<A, B>(a: A[], b: B[], aDone: boolean, bDone: boolean): (A | B)[] {
  const out: (A | B)[] = [];
  const pairs = Math.min(a.length, b.length);
  for (let i = 0; i < pairs; i++) out.push(a[i], b[i]);
  if (bDone) out.push(...a.slice(pairs));
  if (aDone) out.push(...b.slice(pairs));
  return out;
}

export type ChartFilter = 'all' | 'books' | 'JP' | 'KR' | 'CN';

/** Welche Medien ein Chart mit diesem Filter zeigt. */
export function chartMedia(
  filter: ChartFilter,
  suggest: { books: boolean; manga: boolean },
  upcoming: boolean
): { books: boolean; manga: boolean } {
  const books = suggest.books && !upcoming && (filter === 'all' || filter === 'books');
  const manga = suggest.manga && filter !== 'books';
  return { books, manga };
}

/** Filter-Chips: Bücher nur neben Manga, Länder nur mit Manga, „Bald" kennt keine Bücher. */
export function chartFilters(
  suggest: { books: boolean; manga: boolean },
  upcoming: boolean
): ChartFilter[] {
  const out: ChartFilter[] = ['all'];
  if (suggest.books && suggest.manga && !upcoming) out.push('books');
  if (suggest.manga) out.push('JP', 'KR', 'CN');
  return out.length > 1 ? out : [];
}
