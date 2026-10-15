/**
 * Veroeffentlicht die Gesamtzahlen der eigenen Bibliothek, damit Freunde sie in
 * der Gesamt-Rangliste vergleichen koennen. Rendert nichts.
 *
 * Haengt bewusst app-weit (und nicht an der Statistik-Seite): sonst haette nur
 * einen Schnappschuss, wer die Seite auch oeffnet. Die Drosselung sitzt im
 * Service, hier steht nur der Entprell-Timer gegen Binge-Wellen.
 */

import { useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useMovieList } from '../../contexts/MovieListContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { computeLibraryTotals } from '../../lib/stats/libraryTotals';
import {
  publishLibraryTotals,
  publishReadingCounts,
} from '../../services/social/userTotalsService';

const DEBOUNCE_MS = 20_000;

export function LibraryTotalsPublisher() {
  const { user } = useAuth() || {};
  const { allSeriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const { allMangaList, loading: mangaLoading } = useMangaList();
  const { bookList, loading: booksLoading } = useBooksList();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const uid = user?.uid;

  useEffect(() => {
    if (!uid) return;
    if (allSeriesList.length === 0 && movieList.length === 0) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void publishLibraryTotals(uid, computeLibraryTotals(allSeriesList, movieList));
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [uid, allSeriesList, movieList]);

  const mangaCount = allMangaList.length;
  const bookCount = bookList.length;
  useEffect(() => {
    if (!uid || mangaLoading || booksLoading) return;
    const timer = setTimeout(
      () => void publishReadingCounts(uid, { manga: mangaCount, books: bookCount }),
      DEBOUNCE_MS
    );
    return () => clearTimeout(timer);
  }, [uid, mangaLoading, booksLoading, mangaCount, bookCount]);

  return null;
}
