import { useEffect, useMemo, useState } from 'react';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { bookMatchKey } from '../../lib/books/bookIdentity';
import { fetchBasedOnBooks, fetchBasedOnBooksBulk } from '../../services/api/wikidataBooks';
import type { BasedOnBook, Book } from '../../types/Book';

/** Findet das Buch der Sammlung zu einem Wikidata-Titel (Titel + Autor-Nachname). */
export function findOwnedBook(books: Book[], title: string, author?: string): Book | undefined {
  const base = bookMatchKey(title, author ? [author] : undefined).split('|')[0];
  return books.find(
    (b) =>
      bookMatchKey(b.title, b.authors).split('|')[0] === base ||
      (!!b.series?.name && bookMatchKey(b.series.name, b.authors).split('|')[0] === base)
  );
}

export function useBasedOnBooks(tmdbId: number | undefined, kind: 'series' | 'movie') {
  const [books, setBooks] = useState<BasedOnBook[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;
    let alive = true;
    setLoading(true);
    fetchBasedOnBooks(tmdbId, kind)
      .then((list) => alive && setBooks(list))
      .catch(() => alive && setBooks([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tmdbId, kind]);

  return { books, loading };
}

export interface ShowBookSuggestion {
  book: BasedOnBook;
  shows: { tmdbId: number; kind: 'series' | 'movie'; title: string; poster?: string }[];
}

/** „Bücher zu deinen Serien": Vorlagen deiner Serien und Filme, die noch nicht in deinen Büchern stehen. */
export function useBooksForYourShows(enabled = true) {
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { allBookList } = useBooksList();
  const [raw, setRaw] = useState<BasedOnBook[]>([]);
  const [loading, setLoading] = useState(false);

  const seriesIds = useMemo(
    () =>
      seriesList
        .map((s) => Number(s.id))
        .filter(Boolean)
        .sort((a, b) => a - b),
    [seriesList]
  );
  const movieIds = useMemo(
    () =>
      movieList
        .map((m) => Number(m.id))
        .filter(Boolean)
        .sort((a, b) => a - b),
    [movieList]
  );
  const idsKey = `${seriesIds.join(',')}|${movieIds.join(',')}`;

  useEffect(() => {
    if (!enabled || (!seriesIds.length && !movieIds.length)) return;
    let alive = true;
    setLoading(true);
    fetchBasedOnBooksBulk(seriesIds, movieIds)
      .then((list) => alive && setRaw(list))
      .catch(() => alive && setRaw([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, idsKey]);

  const suggestions = useMemo(() => {
    const titles = new Map<string, { title: string; poster?: string }>();
    for (const s of seriesList) {
      titles.set(`series-${s.id}`, { title: s.title, poster: s.poster?.poster });
    }
    for (const m of movieList) {
      titles.set(`movie-${m.id}`, { title: m.title, poster: m.poster?.poster });
    }
    const byBook = new Map<string, ShowBookSuggestion>();
    for (const book of raw) {
      if (findOwnedBook(allBookList, book.title, book.author)) continue;
      const show = titles.get(`${book.kind}-${book.tmdbId}`);
      if (!show) continue;
      const entry = byBook.get(book.wikidataId) ?? { book, shows: [] };
      if (!entry.shows.some((s) => s.tmdbId === book.tmdbId && s.kind === book.kind)) {
        entry.shows.push({ tmdbId: book.tmdbId, kind: book.kind, ...show });
      }
      byBook.set(book.wikidataId, entry);
    }
    return [...byBook.values()].sort((a, b) => b.shows.length - a.shows.length);
  }, [raw, seriesList, movieList, allBookList]);

  return { suggestions, loading };
}
