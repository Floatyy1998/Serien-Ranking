export type BookStatus = 'reading' | 'planned' | 'completed' | 'paused' | 'dropped';

export type BookFormat = 'print' | 'ebook' | 'audio';

export type BookSource = 'hardcover' | 'google' | 'openlibrary' | 'goodreads' | 'dnb';

export interface BookSeriesInfo {
  name: string;
  position?: number;
  /** Reihen-Schlüssel: Wikidata-QID oder `hc:<Reihenname>` für Reihen aus Hardcover. */
  wikidataId?: string;
  hardcoverId?: number;
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
  /** Auflage/Ausgabe, z. B. „3. Auflage 2021" — aus der DNB oder selbst eingetragen. */
  edition?: string;
  language?: string;
  categories?: string[];
  isbn13?: string;
  googleId?: string;
  olWorkId?: string;
  hardcoverId?: number;
  /** Wikidata-Werk, mit dem die Bände einer Reihe abgeglichen werden. */
  wikidataId?: string;
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
  /** Auf der Wunschliste seit — Freunde sehen das Buch als Geschenkidee. */
  wishedAt?: string;
  /** Zeitpunkt der letzten Wikidata-Suche nach Reihe/Verfilmung (verhindert Dauer-Abfragen). */
  wdChecked?: string;
}

/** Suchtreffer aus Hardcover, Google Books oder Open Library, noch nicht in der Sammlung. */
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
  edition?: string;
  language?: string;
  categories?: string[];
  isbn13?: string;
  googleId?: string;
  olWorkId?: string;
  hardcoverId?: number;
  description?: string;
  series?: BookSeriesInfo;
  source: BookSource;
  /** Open Library: Leseliste + Ausgaben — trennt echte Bücher von Dubletten-Einträgen. */
  popularity?: number;
  /** Open Library: Ø Sterne (1–5) und Anzahl der Bewertungen. */
  avgRating?: number;
  ratingCount?: number;
}

/** Live nachgeladene Details für die Detailseite — wird nicht gespeichert. */
export interface BookDetails {
  description?: string;
  categories?: string[];
  /** Stimmungen, Tempo und Inhaltshinweise der Hardcover-Community (englisch, klein geschrieben). */
  moods?: string[];
  pace?: string[];
  warnings?: string[];
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
  /** Fertiger Treffer, wenn die Reihe aus Hardcover kommt — spart die Suche je Band. */
  result?: BookSearchResult;
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
