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
  ratings_average?: number;
  ratings_count?: number;
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
    avgRating: doc.ratings_average ? Math.round(doc.ratings_average * 10) / 10 : undefined,
    ratingCount: doc.ratings_count || undefined,
  };
}

export const dnbCoverUrl = (isbn13: string) =>
  `https://portal.dnb.de/opac/mvb/cover?isbn=${isbn13}`;

const trimMarc = (value: string | undefined) =>
  value
    ?.split(' / ')[0]
    .replace(/\s*[/:;,.=]\s*$/, '')
    .trim() || undefined;

/** „1. Aufl." verliert durch trimMarc den Punkt der Abkürzung — bei bekannten Kürzeln kommt er zurück. */
const fixAbbreviation = (value: string | undefined) =>
  value && /(?:^|\s)(?:Aufl|Ausg|Nachdr|erw|überarb|aktual|Jh)$/i.test(value) ? `${value}.` : value;

const normalizeName = (value: string | undefined) =>
  (value ?? '')
    .toLowerCase()
    .replace(/(?:verlag|gmbh|kg|ag|taschenbuch)/g, '')
    .replace(/[^a-z0-9]+/g, '');

/** Verlagsnummern („Carlsen ; 815", „Heyne ; 12345") stehen auch in Feld 490 — das ist keine Buchreihe. */
const samePublisher = (series: string, publisher: string | undefined) => {
  const a = normalizeName(series);
  const b = normalizeName(publisher);
  return !!a && !!b && (a === b || a.startsWith(b) || b.startsWith(a));
};

/**
 * Verantwortlichkeitsangabe (245$c) als Ersatz, wenn die DNB keine Personen-Felder (100/700) anlegt — bei Comics
 * die Regel: „Artwork: Studio LICO ; Original: Sung Sojak ; aus dem Koreanischen von Jessica Walther" → Studio LICO, Sung Sojak.
 */
function namesFromStatement(statement: string | undefined): string[] {
  if (!statement) return [];
  return statement
    .split(/\s*;\s*/)
    .map((part) =>
      part
        .replace(
          /[.,]?\s*(?:aus dem|übersetz|übertragen|ins Deutsche|translated|traduit|traducción|tradução).*$/i,
          ''
        )
        .replace(/^[^:]{1,30}:\s*/, '')
        .replace(/^(?:hrsg\.?|herausgegeben|edited|ed\.)\s+(?:von|by)\s+/i, '')
        .replace(/^(?:von|by|par)\s+/i, '')
        .replace(/\s*[([].*$/, '')
        .replace(/[\s.,;:]+$/, '')
        .trim()
    )
    .filter((name) => name.length >= 2 && name.length <= 60 && !/\d{4}/.test(name))
    .slice(0, 3);
}

/** MARC21-Datensatz der Deutschen Nationalbibliothek (SRU) — kennt fast jede deutsche ISBN. */
export function mapDnbRecord(xml: string, isbn13: string): BookSearchResult | null {
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const fields = [...doc.getElementsByTagNameNS('*', 'datafield')];
  const subfields = (field: Element, code: string) =>
    [...field.getElementsByTagNameNS('*', 'subfield')]
      .filter((s) => s.getAttribute('code') === code)
      .map((s) => s.textContent?.replace(/[\u0098\u009c]/g, '').trim() ?? '')
      .filter(Boolean);
  const first = (tags: string[], code: string) => {
    for (const field of fields) {
      if (tags.includes(field.getAttribute('tag') ?? '')) {
        const value = subfields(field, code)[0];
        if (value) return value;
      }
    }
    return undefined;
  };

  const mainTitle = trimMarc(first(['245'], 'a'));
  if (!mainTitle) return null;
  const partNumber = trimMarc(first(['245'], 'n'));
  const names = (pick: (tag: string | null, roles: string[]) => boolean) =>
    fields
      .filter((f) => pick(f.getAttribute('tag'), subfields(f, '4')))
      .map((f) => subfields(f, 'a')[0])
      .filter((name): name is string => !!name)
      .map((name) => name.split(/,\s*/).reverse().join(' ').trim());
  const writers = names((tag, roles) =>
    tag === '100' ? !roles.length || roles.includes('aut') : tag === '700' && roles.includes('aut')
  );
  const persons = writers.length ? writers : names((tag) => tag === '100');
  const authors = persons.length ? persons : namesFromStatement(first(['245'], 'c'));
  const pages = first(['300'], 'a')?.match(/(\d+)\s*(?:S\.|Seiten)/)?.[1];
  const lang = first(['041'], 'a');
  const publisher = trimMarc(first(['264', '260'], 'b'));
  const seriesField = fields.find((f) => f.getAttribute('tag') === '490');
  const seriesRaw = seriesField ? trimMarc(subfields(seriesField, 'a')[0]) : undefined;
  const seriesName = seriesRaw && !samePublisher(seriesRaw, publisher) ? seriesRaw : undefined;
  const seriesVolume = seriesField
    ? Number(subfields(seriesField, 'v')[0]?.match(/\d+/)?.[0])
    : undefined;
  const comic = fields.some(
    (f) =>
      ['082', '083'].includes(f.getAttribute('tag') ?? '') &&
      subfields(f, 'a').some((ddc) => ddc.startsWith('741.5'))
  );
  // Formschlagwörter (655, GND): „Comic", „Fantasy", „Jugendbuch" — zusammen mit der Sachgruppe 741.5 das Genre.
  const genreTerms = fields
    .filter((f) => f.getAttribute('tag') === '655')
    .flatMap((f) => subfields(f, 'a'))
    .map((term) => (/^comics?$/i.test(term) ? 'Comics' : term));
  const categories = [...new Set([...(comic ? ['Comics'] : []), ...genreTerms])].slice(0, 6);

  return stripResult({
    id: sanitizeBookKey(`dnb-${isbn13}`),
    title: partNumber ? `${mainTitle} ${partNumber}` : mainTitle,
    subtitle: trimMarc(first(['245'], 'b')) ?? trimMarc(first(['245'], 'p')),
    edition: fixAbbreviation(trimMarc(first(['250'], 'a'))),
    authors,
    cover: dnbCoverUrl(isbn13),
    coverFallback: openLibraryCoverByIsbn(isbn13),
    pageCount: pages ? Number(pages) : undefined,
    publishedYear: parseYear(first(['264', '260'], 'c')),
    publisher,
    language: lang ? (LANG_3_TO_2[lang] ?? lang) : undefined,
    categories: categories.length ? categories : undefined,
    isbn13,
    series: seriesName
      ? stripUndefined({
          name: seriesName,
          position: seriesVolume && Number.isFinite(seriesVolume) ? seriesVolume : undefined,
          wikidataId: `hc:${seriesName}`,
        })
      : undefined,
    source: 'dnb' as const,
  });
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
    edition: result.edition,
    language: result.language,
    categories: result.categories,
    isbn13: result.isbn13,
    googleId: result.googleId,
    olWorkId: result.olWorkId,
    hardcoverId: result.hardcoverId,
    series: result.series,
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

/** Fremdes Buch (Freundesprofil) als Vorschau-Treffer — ohne Stand, Bewertung und Notizen. */
export function bookAsResult(book: Book): BookSearchResult {
  return stripResult({
    id: book.id,
    title: book.title,
    subtitle: book.subtitle,
    authors: book.authors ?? [],
    cover: book.cover,
    pageCount: book.pageCount,
    publishedYear: book.publishedYear,
    publisher: book.publisher,
    edition: book.edition,
    language: book.language,
    categories: book.categories,
    isbn13: book.isbn13,
    googleId: book.googleId,
    olWorkId: book.olWorkId,
    hardcoverId: book.hardcoverId,
    series: book.series,
    source:
      book.source ?? (book.hardcoverId ? 'hardcover' : book.googleId ? 'google' : 'openlibrary'),
  });
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

/** stripUndefined für Treffer: authors bleibt auch leer ein Array, die Karten lesen authors[0]. */
export function stripResult(result: BookSearchResult): BookSearchResult {
  return { ...stripUndefined(result), authors: result.authors ?? [] };
}

/**
 * Lücken (fehlend oder leer) aus einer zweiten Quelle füllen — der erste Datensatz behält Vorrang, nichts wird
 * überschrieben. Für Feed-Vorschauen und dünne Katalog-Einträge, die nur Titel und Cover kennen.
 */
export function fillBookGaps<T extends object>(
  base: T,
  extra: Partial<BookSearchResult> | null | undefined
): T {
  if (!extra) return base;
  const out = { ...base } as Record<string, unknown>;
  for (const [key, value] of Object.entries(extra)) {
    if (value === undefined || value === null) continue;
    const current = out[key];
    const empty =
      current === undefined ||
      current === null ||
      current === '' ||
      (Array.isArray(current) && current.length === 0);
    if (empty) out[key] = value;
  }
  return out as T;
}

const BOOKCOVER_BASE = `${import.meta.env.VITE_BACKEND_API_URL || 'https://serienapi.konrad-dinges.de'}/bookcover`;
const COVER_MIRROR = `${BOOKCOVER_BASE}/id`;

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

const HARDCOVER_MIRROR = /(\/bookcover\/hc\/[A-Za-z0-9_-]+)(?:\.[ML])?\.jpg/;
const LIBRARY_COVER = /(\/bookcover\/book\/[A-Za-z0-9_-]+)-[ML](\.jpg(?:\?v=\d+)?)/;

/**
 * Open-Library-Cover kommen über den Backend-Spiegel — direkt leitet jedes Bild ~2 s über archive.org um.
 * Hardcover-Cover liegen ebenfalls dort und werden serverseitig auf M (360 px) bzw. L (720 px) verkleinert.
 * DNB-Cover nur über den Spiegel: das Portal stellt Browsern eine Bot-Prüfseite statt des Bildes zu.
 * Katalog-Cover (/bookcover/book/) liegen dauerhaft in M und L bei uns.
 */
export function coverAtSize(url: string | undefined, size: 'M' | 'L'): string | undefined {
  if (url && LIBRARY_COVER.test(url)) return url.replace(LIBRARY_COVER, `$1-${size}$2`);
  if (url && HARDCOVER_MIRROR.test(url)) return url.replace(HARDCOVER_MIRROR, `$1.${size}.jpg`);
  const dnb = url?.match(/portal\.dnb\.de\/opac\/mvb\/cover\?isbn=(97[89]\d{10})/)?.[1];
  if (dnb) return `${BOOKCOVER_BASE}/dnb/${dnb}-${size}.jpg`;
  const id = url?.match(/covers\.openlibrary\.org\/b\/id\/(\d+)-[SML]\.jpg/)?.[1];
  return id ? `${COVER_MIRROR}/${id}-${size}.jpg` : directCoverAtSize(url, size);
}
