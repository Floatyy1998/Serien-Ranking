import type { Book, BookDetails, BookSearchResult } from '../../types/Book';
import { pickIsbn13, sanitizeBookKey } from './bookIdentity';

export interface GoogleVolume {
  id: string;
  volumeInfo?: {
    title?: string;
    subtitle?: string;
    authors?: string[];
    publisher?: string;
    publishedDate?: string;
    description?: string;
    pageCount?: number;
    categories?: string[];
    language?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: Record<string, string>;
    previewLink?: string;
    infoLink?: string;
    canonicalVolumeLink?: string;
  };
}

interface OpenLibraryEdition {
  key?: string;
  title?: string;
  subtitle?: string;
  cover_i?: number;
  language?: string[];
  isbn?: string[];
  number_of_pages?: number;
  publisher?: string[];
  publish_date?: string[];
}

export interface OpenLibraryDoc {
  key: string;
  title?: string;
  subtitle?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
  number_of_pages_median?: number;
  isbn?: string[];
  language?: string[];
  subject?: string[];
  publisher?: string[];
  readinglog_count?: number;
  edition_count?: number;
  editions?: { docs?: OpenLibraryEdition[] };
}

const LANG_3_TO_2: Record<string, string> = {
  ger: 'de',
  deu: 'de',
  eng: 'en',
  spa: 'es',
  fre: 'fr',
  fra: 'fr',
  por: 'pt',
  ita: 'it',
  pol: 'pl',
  jpn: 'ja',
};

export const openLibraryCoverById = (coverId: number, size: 'M' | 'L' = 'L') =>
  `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;

export const openLibraryCoverByIsbn = (isbn13: string) =>
  `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false`;

/** Google-Thumbnails kommen als http und mit Eselsohr-Effekt. */
export function googleCoverUrl(imageLinks: Record<string, string> | undefined): string | undefined {
  if (!imageLinks) return undefined;
  const raw =
    imageLinks.extraLarge ||
    imageLinks.large ||
    imageLinks.medium ||
    imageLinks.thumbnail ||
    imageLinks.smallThumbnail;
  if (!raw) return undefined;
  return raw.replace(/^http:/, 'https:').replace(/&edge=curl/g, '');
}

export function parseYear(date: string | undefined): number | undefined {
  const match = date?.match(/\d{4}/);
  return match ? Number(match[0]) : undefined;
}

const cleanCategories = (raw: string[] | undefined): string[] | undefined => {
  if (!raw?.length) return undefined;
  const out = new Set<string>();
  for (const entry of raw) {
    for (const part of entry.split(/\s*\/\s*/)) {
      const name = part.trim();
      if (name && name.length < 40 && !/^general$/i.test(name)) out.add(name);
      if (out.size >= 4) break;
    }
  }
  return out.size ? [...out] : undefined;
};

export function mapGoogleVolume(volume: GoogleVolume): BookSearchResult | null {
  const info = volume.volumeInfo;
  if (!info?.title) return null;
  const isbn13 = pickIsbn13(info.industryIdentifiers?.map((i) => i.identifier));
  const google = googleCoverUrl(info.imageLinks);
  return {
    id: sanitizeBookKey(`gb-${volume.id}`),
    title: info.title,
    subtitle: info.subtitle,
    authors: info.authors ?? [],
    cover: google ?? (isbn13 ? openLibraryCoverByIsbn(isbn13) : undefined),
    coverFallback: google && isbn13 ? openLibraryCoverByIsbn(isbn13) : undefined,
    pageCount: info.pageCount || undefined,
    publishedYear: parseYear(info.publishedDate),
    publisher: info.publisher,
    language: info.language,
    categories: cleanCategories(info.categories),
    isbn13,
    googleId: volume.id,
    description: info.description,
    source: 'google',
  };
}

export function mapGoogleDetails(volume: GoogleVolume): BookDetails {
  const info = volume.volumeInfo ?? {};
  return {
    description: info.description,
    categories: cleanCategories(info.categories),
    pageCount: info.pageCount || undefined,
    publisher: info.publisher,
    publishedDate: info.publishedDate,
    previewLink: info.previewLink?.replace(/^http:/, 'https:'),
    infoLink: (info.canonicalVolumeLink || info.infoLink)?.replace(/^http:/, 'https:'),
  };
}

/** Nimmt die passende Ausgabe (z. B. die deutsche) statt des Originalwerks, wenn Open Library sie mitliefert. */
export function mapOpenLibraryDoc(doc: OpenLibraryDoc): BookSearchResult | null {
  const edition = doc.editions?.docs?.[0];
  const title = (edition?.title || doc.title || '').replace(/\s+/g, ' ').trim();
  if (!title) return null;
  const workId = doc.key.replace('/works/', '');
  const coverId = edition?.cover_i ?? doc.cover_i;
  const isbn13 = pickIsbn13(edition?.isbn ?? doc.isbn);
  const lang = edition?.language?.[0] ?? doc.language?.[0];
  return {
    id: sanitizeBookKey(`ol-${workId}`),
    title,
    subtitle: edition?.subtitle ?? doc.subtitle,
    authors: doc.author_name ?? [],
    cover: coverId ? openLibraryCoverById(coverId) : undefined,
    coverFallback: coverId && isbn13 ? openLibraryCoverByIsbn(isbn13) : undefined,
    pageCount: edition?.number_of_pages || doc.number_of_pages_median || undefined,
    publishedYear: doc.first_publish_year,
    publisher: edition?.publisher?.[0] ?? doc.publisher?.[0],
    language: lang ? (LANG_3_TO_2[lang] ?? lang) : undefined,
    categories: doc.subject?.slice(0, 4),
    isbn13,
    olWorkId: workId,
    source: 'openlibrary',
    popularity: (doc.readinglog_count ?? 0) + (doc.edition_count ?? 0) * 5,
  };
}

/** Treffer → neuer Sammlungseintrag; undefined-Felder fliegen raus, RTDB lehnt sie ab. */
export function searchResultToBook(
  result: BookSearchResult,
  status: Book['status'],
  nowIso: string,
  cover?: string
): Book {
  const book: Book = {
    id: result.id,
    title: result.title,
    subtitle: result.subtitle,
    authors: result.authors,
    cover: cover ?? result.cover,
    pageCount: result.pageCount,
    publishedYear: result.publishedYear,
    publisher: result.publisher,
    language: result.language,
    categories: result.categories,
    isbn13: result.isbn13,
    googleId: result.googleId,
    olWorkId: result.olWorkId,
    source: result.source,
    status,
    currentPage: status === 'completed' ? (result.pageCount ?? 0) : 0,
    addedAt: nowIso,
    startedAt: status === 'reading' || status === 'completed' ? nowIso : undefined,
    completedAt: status === 'completed' ? nowIso : undefined,
    lastReadAt: status === 'reading' ? nowIso : undefined,
  };
  return stripUndefined(book);
}

export function stripUndefined<T extends object>(obj: T): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out as T;
}

const COVER_MIRROR = `${import.meta.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de'}/bookcover/id`;

/** Original-URL in passender Größe: M (~180 px) für Karten, L nur für große Darstellungen. */
export function directCoverAtSize(url: string | undefined, size: 'M' | 'L'): string | undefined {
  if (!url) return url;
  if (/books\.google\./.test(url)) {
    return `${url.replace(/&fife=[^&]*/g, '')}&fife=${size === 'L' ? 'w480-h720' : 'w240-h360'}`;
  }
  return url.replace(
    /(covers\.openlibrary\.org\/b\/(?:id|isbn|olid)\/[^/?]+)-[SML]\.jpg/,
    `$1-${size}.jpg`
  );
}

/** Open-Library-Cover kommen über den Backend-Spiegel — direkt leitet jedes Bild ~2 s über archive.org um. */
export function coverAtSize(url: string | undefined, size: 'M' | 'L'): string | undefined {
  const id = url?.match(/covers\.openlibrary\.org\/b\/id\/(\d+)-[SML]\.jpg/)?.[1];
  return id ? `${COVER_MIRROR}/${id}-${size}.jpg` : directCoverAtSize(url, size);
}
