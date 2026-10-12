export type BookStatus = 'reading' | 'planned' | 'completed' | 'paused' | 'dropped';

export type BookFormat = 'print' | 'ebook' | 'audio';

export type BookSource = 'google' | 'openlibrary' | 'goodreads';

export interface BookSeriesInfo {
  name: string;
  position?: number;
  wikidataId?: string;
}

/** Ein Buch in `users/$uid/books/{id}` — vollständig gespeichert wie Manga, es gibt keinen Katalog. */
export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  cover?: string;
  pageCount?: number;
  publishedYear?: number;
  publisher?: string;
  language?: string;
  categories?: string[];
  isbn13?: string;
  googleId?: string;
  olWorkId?: string;
  series?: BookSeriesInfo;
  source?: BookSource;
  status: BookStatus;
  currentPage: number;
  format?: BookFormat;
  /** 0–10 in halben Schritten, 0 = unbewertet. */
  rating?: number;
  addedAt: string;
  startedAt?: string;
  completedAt?: string;
  lastReadAt?: string;
  rereadCount?: number;
  notes?: string;
  hidden?: boolean;
  /** Zeitpunkt der letzten Wikidata-Suche nach Reihe/Verfilmung (verhindert Dauer-Abfragen). */
  wdChecked?: string;
}

/** Suchtreffer aus Google Books oder Open Library, noch nicht in der Sammlung. */
export interface BookSearchResult {
  id: string;
  title: string;
  subtitle?: string;
  authors: string[];
  cover?: string;
  coverFallback?: string;
  pageCount?: number;
  publishedYear?: number;
  publisher?: string;
  language?: string;
  categories?: string[];
  isbn13?: string;
  googleId?: string;
  olWorkId?: string;
  description?: string;
  source: BookSource;
  /** Open Library: Leseliste + Ausgaben — trennt echte Bücher von Dubletten-Einträgen. */
  popularity?: number;
}

/** Live nachgeladene Details für die Detailseite — wird nicht gespeichert. */
export interface BookDetails {
  description?: string;
  categories?: string[];
  pageCount?: number;
  publisher?: string;
  publishedDate?: string;
  previewLink?: string;
  infoLink?: string;
}

export interface BookSeriesPart {
  wikidataId: string;
  title: string;
  position: number;
  publishedDate?: string;
  olWorkId?: string;
}

export interface BookAdaptation {
  wikidataId: string;
  title: string;
  tmdbId: number;
  kind: 'series' | 'movie';
}

export interface BookLinks {
  wikidataId?: string;
  wikipedia?: { lang: string; title: string };
  series?: { wikidataId: string; name: string; position?: number };
  adaptations: BookAdaptation[];
}

/** Ein Buch, auf dem eine Serie oder ein Film basiert (Wikidata P144). */
export interface BasedOnBook {
  wikidataId: string;
  title: string;
  author?: string;
  isSeries: boolean;
  tmdbId: number;
  kind: 'series' | 'movie';
}
