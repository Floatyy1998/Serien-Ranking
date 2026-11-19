import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooksList } from '../../../contexts/BooksListContext';
import { useMangaForBook, useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { sanitizeBookKey } from '../../../lib/books/bookIdentity';
import { volumeBookState } from '../../../lib/books/mangaBooks';
import { splitVolume } from '../../../lib/books/mangaVolume';
import { mangaPath } from '../../../lib/manga/mangaSource';
import { findBook } from '../../../services/api/booksApi';
import type { BookSearchResult } from '../../../types/Book';
import { bookPath } from '../helpers';

/** Öffnet eigene Bücher direkt, fremde als Vorschau mit den Treffer-Daten; Bände eigener Manga die Reihe samt Band. */
export function useOpenResult() {
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  const mangaFor = useMangaForBook();
  const { seriesAsBooks } = useBooksList();
  return (result: BookSearchResult) => {
    const owned = ownedFor(result);
    const manga = owned ? undefined : mangaFor(result);
    // „Als Buch führen": Bände der Reihe öffnen als Buch, nicht auf der Manga-Seite.
    if (manga && !seriesAsBooks.has(manga.anilistId)) {
      navigate(
        mangaPath(manga.anilistId, splitVolume(result.title).volume),
        volumeBookState(result)
      );
      return;
    }
    navigate(bookPath(owned?.id ?? result.id), { state: { result } });
  };
}

/** Öffnet ein Buch, von dem nur Titel und Autor bekannt sind (Wikidata): erst suchen, ohne Treffer Detail aus Titel + Autor. */
export function useOpenByTitle() {
  const navigate = useNavigate();
  const ownedFor = useOwnedBooks();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const open = async (title: string, author?: string) => {
    const key = `${title}|${author ?? ''}`;
    if (busyKey) return;
    setBusyKey(key);
    try {
      const result = (await findBook(title, author)) ?? {
        id: sanitizeBookKey(`wd-${title}-${author ?? ''}`),
        title,
        authors: author ? [author] : [],
        source: 'openlibrary' as const,
      };
      const owned = ownedFor(result);
      navigate(bookPath(owned?.id ?? result.id), { state: { result } });
    } finally {
      setBusyKey(null);
    }
  };
  return { open, busyKey };
}
