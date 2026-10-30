import type { Manga } from '../../types/Manga';

/** ISBN-10/13 → ISBN-13 ohne Bindestriche, sonst undefined. */
export function toIsbn13(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined;
  const clean = raw.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (clean.length === 13 && /^\d{13}$/.test(clean)) return clean;
  if (clean.length !== 10 || !/^\d{9}[\dX]$/.test(clean)) return undefined;
  const core = `978${clean.slice(0, 9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(core[i]) * (i % 2 === 0 ? 1 : 3);
  return `${core}${(10 - (sum % 10)) % 10}`;
}

export function pickIsbn13(
  candidates: (string | undefined | null)[] | undefined
): string | undefined {
  if (!candidates) return undefined;
  const all = candidates.map(toIsbn13).filter((v): v is string => !!v);
  return all.find((v) => v.startsWith('9783')) ?? all[0];
}

export function looksLikeIsbn(query: string): boolean {
  const clean = query.replace(/[\s-]/g, '');
  return /^(\d{9}[\dXx]|\d{13})$/.test(clean);
}

const VOLUME_MARKER = /\b(?:band|bd|vol|volume|tome|tomo|teil|nr)\b\.?\s*(?=\d)/g;

export const normalizeBookText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/×/g, ' x ')
    .replace(/\(.*?\)|\[.*?\]/g, '');

const compactWords = (value: string): string =>
  value
    .replace(VOLUME_MARKER, '')
    .replace(/[^a-z0-9ß]+/g, ' ')
    .trim();

const SUBTITLE_SPLIT = /[:–—]| - /;

/**
 * Haupttitel und Bandnummer aus dem Untertitel: „X: Bd. 5" und „X: Untertitel 5" tragen Band 5
 * (eine Zahl am Ende des Untertitels ist der Band — bis drei Stellen, damit Jahre nicht zählen).
 */
function titleParts(title: string): { head: string; volume?: string } {
  const [head, ...rest] = normalizeBookText(title).split(SUBTITLE_SPLIT);
  const subtitle = compactWords(rest.join(' '));
  const volume = subtitle.match(/^(\d{1,4})$/)?.[1] ?? subtitle.match(/\s(\d{1,3})$/)?.[1];
  return { head: compactWords(head), volume };
}

/** Titel ohne Untertitel, aber mit Bandnummer („X, Band 5", „X: Bd. 5", „X 5", „X: Untertitel 5" sind gleich). */
export function bookTitleKey(title: string): string {
  const { head, volume } = titleParts(title);
  return volume ? `${head} ${volume}` : head;
}

/** Nachname des Erstautors als Vergleichsschlüssel, leer ohne Autor. */
export function bookAuthorKey(authors: string[] | undefined): string {
  return (
    normalizeBookText(authors?.[0] ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .pop() ?? ''
  );
}

/** Vergleichsschlüssel für „dieses Buch hast du schon" über Quellen und Ausgaben hinweg. */
export function bookMatchKey(title: string, authors: string[] | undefined): string {
  return `${bookTitleKey(title)}|${bookAuthorKey(authors)}`;
}

/** Bandnummer am Ende des Titelschlüssels: „marry my husband 7" → Reihe + Band, sonst null. */
export function splitVolumeKey(titleKey: string): { series: string; number: number } | null {
  const match = /^(.+) (\d{1,4})$/.exec(titleKey);
  return match ? { series: match[1], number: Number(match[2]) } : null;
}

// Wörter, die keine Person bezeichnen — „Studio LICO" und „Studio Pierrot" treffen sich nicht über „studio".
const GENERIC_AUTHOR_WORDS = new Set([
  'studio',
  'team',
  'comics',
  'verlag',
  'various',
  'diverse',
  'anonym',
  'anonymous',
  'unknown',
  'unbekannt',
]);

/** Alle Namensteile aller Beteiligten — Reihenfolge („Sung Sojak"/„Sojak Sung") und Mitwirkende sind egal. */
export function bookAuthorTokens(authors: string[] | undefined): Set<string> {
  const tokens = new Set<string>();
  for (const author of authors ?? []) {
    for (const token of compactWords(normalizeBookText(author)).split(' ')) {
      if (token.length >= 2 && !GENERIC_AUTHOR_WORDS.has(token)) tokens.add(token);
    }
  }
  return tokens;
}

/** Beteiligte verträglich: eine Seite nennt niemanden, oder beide teilen einen Namensteil. */
export function sameBookAuthors(a: string[] | undefined, b: string[] | undefined): boolean {
  const left = bookAuthorTokens(a);
  const right = bookAuthorTokens(b);
  if (left.size === 0 || right.size === 0) return true;
  for (const token of left) if (right.has(token)) return true;
  return false;
}

export interface BookIdentityLike {
  id?: string;
  title: string;
  authors?: string[];
  isbn13?: string;
  hardcoverId?: number;
}

/**
 * Dasselbe Buch über Quellen und Ausgaben hinweg: gleiche ID, Hardcover-ID oder ISBN, sonst gleicher Titel.
 * Bei Reihenbänden („Marry my husband 7") entscheidet der Titel samt Band allein — die Quellen nennen mal
 * die Autorin, mal das Zeichenstudio; ohne Band müssen sich die Beteiligten in einem Namensteil treffen.
 */
export function isSameBookIdentity(a: BookIdentityLike, b: BookIdentityLike): boolean {
  if (a.id && a.id === b.id) return true;
  if (a.hardcoverId && a.hardcoverId === b.hardcoverId) return true;
  if (a.isbn13 && a.isbn13 === b.isbn13) return true;
  const key = bookTitleKey(a.title);
  if (key !== bookTitleKey(b.title)) return false;
  return !!splitVolumeKey(key) || sameBookAuthors(a.authors, b.authors);
}

/** Nachschlagewerk über eine Buchliste: findet zu einem Treffer das passende eigene Buch. */
export function createBookIndex<T extends BookIdentityLike>(books: T[]) {
  const byId = new Map<string, T>();
  const byIsbn = new Map<string, T>();
  const byHardcover = new Map<number, T>();
  const byTitle = new Map<string, T[]>();
  for (const book of books) {
    if (book.id) byId.set(book.id, book);
    if (book.isbn13 && !byIsbn.has(book.isbn13)) byIsbn.set(book.isbn13, book);
    if (book.hardcoverId && !byHardcover.has(book.hardcoverId)) {
      byHardcover.set(book.hardcoverId, book);
    }
    const key = bookTitleKey(book.title);
    const list = byTitle.get(key);
    if (list) list.push(book);
    else byTitle.set(key, [book]);
  }
  const find = (item: BookIdentityLike): T | undefined =>
    (item.id ? byId.get(item.id) : undefined) ??
    (item.hardcoverId ? byHardcover.get(item.hardcoverId) : undefined) ??
    (item.isbn13 ? byIsbn.get(item.isbn13) : undefined) ??
    byTitle.get(bookTitleKey(item.title))?.find((book) => isSameBookIdentity(book, item));
  return { find, has: (item: BookIdentityLike): boolean => !!find(item) };
}

type MangaTitles = Pick<Manga, 'title' | 'titleEnglish' | 'titleRomaji'>;

/** Ein Manga-Band als Buchtreffer: Reihentitel plus höchstens eine Bandnummer, kein Roman. */
export function findMangaForBook<T extends MangaTitles>(
  item: { title: string; subtitle?: string },
  mangas: T[]
): T | undefined {
  const full = compactWords(normalizeBookText(`${item.title} ${item.subtitle ?? ''}`));
  if (!full || /\b(?:light ?novel|roman)\b/.test(full)) return undefined;
  const title = compactWords(normalizeBookText(item.title));
  // Deutsche Ausgaben hängen den Band an den Untertitel („X: Untertitel 2") — zählt wie „X 2".
  const { head, volume } = titleParts(
    item.subtitle ? `${item.title}: ${item.subtitle}` : item.title
  );
  const candidates = volume ? [title, full, `${head} ${volume}`] : [title, full];
  return mangas.find((manga) =>
    [manga.title, manga.titleEnglish, manga.titleRomaji].some((name) => {
      const series = name ? compactWords(normalizeBookText(name)) : '';
      if (!series) return false;
      return candidates.some(
        (candidate) =>
          candidate === series ||
          (candidate.startsWith(`${series} `) &&
            /^\d{1,4}$/.test(candidate.slice(series.length + 1)))
      );
    })
  );
}

/** RTDB-tauglicher Schlüssel (keine . # $ [ ] /). */
export function sanitizeBookKey(raw: string): string {
  return raw.replace(/[.#$[\]/]/g, '_').slice(0, 120);
}
