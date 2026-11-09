import type { Book, BookSearchResult, BookSeriesPart } from '../../types/Book';
import { searchResultToBook } from './bookSearchMapping';
import { partPositionOf } from './bookSeries';

export interface BulkCandidate {
  position: number;
  result: BookSearchResult;
}

export interface SeriesBulkSelection {
  /** Fehlende, erschienene Bände mit Buchdaten — in Reihenfolge. */
  candidates: BulkCandidate[];
  /** Eigene Bände, die noch auf der Leseliste stehen (für „Gelesen bis Band N"). */
  plannedOwned: { position: number; book: Book }[];
  /** Bände ohne Buchdaten (Wikidata kennt nur den Titel) — werden übersprungen. */
  unresolved: number;
  upcoming: number;
}

/**
 * Was „Ganze Reihe hinzufügen" anlegen würde: fehlende Bände mit Buchdaten, nie angekündigte
 * (Massen-Aktionen markieren keine Zukunft). `found` = nachgeschlagene Treffer für Bände ohne eigene Daten.
 */
export function seriesBulkSelection(
  parts: BookSeriesPart[],
  seriesId: string,
  library: Book[],
  found: Record<string, BookSearchResult> = {},
  today = new Date().toISOString().slice(0, 10)
): SeriesBulkSelection {
  const ownedAt = new Map<number, Book>();
  for (const book of library) {
    const position = partPositionOf(book, parts, seriesId);
    if (position !== undefined && !ownedAt.has(position)) ownedAt.set(position, book);
  }
  const selection: SeriesBulkSelection = {
    candidates: [],
    plannedOwned: [],
    unresolved: 0,
    upcoming: 0,
  };
  const seen = new Set<number>();
  for (const part of [...parts].sort((a, b) => a.position - b.position)) {
    if (seen.has(part.position)) continue;
    seen.add(part.position);
    const owned = ownedAt.get(part.position);
    if (owned) {
      if (owned.status === 'planned')
        selection.plannedOwned.push({ position: part.position, book: owned });
      continue;
    }
    if (part.publishedDate && part.publishedDate > today) {
      selection.upcoming++;
      continue;
    }
    const result = part.result ?? found[part.wikidataId];
    if (!result) selection.unresolved++;
    else selection.candidates.push({ position: part.position, result });
  }
  return selection;
}

/**
 * Neue Sammlungseinträge: Bände bis `readUpTo` als früher gelesen (ohne Datum, zählt in keinem Jahresrückblick),
 * der Rest auf die Leseliste. Alle tragen den Reihen-Schlüssel der Leiste, damit sie dort sofort zugeordnet sind.
 */
export function seriesBulkBooks(
  candidates: BulkCandidate[],
  series: { id: string; name: string },
  readUpTo: number,
  nowIso: string
): Book[] {
  return candidates.map(({ position, result }) => {
    const read = position <= readUpTo;
    const book = searchResultToBook(
      {
        ...result,
        series: {
          ...result.series,
          name: series.name || result.series?.name || '',
          position,
          wikidataId: series.id,
        },
      },
      read ? 'completed' : 'planned',
      nowIso
    );
    if (read) {
      delete book.startedAt;
      delete book.completedAt;
    }
    return book;
  });
}
