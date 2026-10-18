import { useRef } from 'react';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import type { BookYear } from '../../Books/hooks/useBookYear';
import { ReadingBody } from '../../Reading/ReadingBody';
import { ActivityMarquee } from '../cards/ActivityMarquee';

interface ReadingHomeSectionsProps {
  areas: ReadingAreas;
  bookYear: BookYear;
  onSearch: (filter: 'all' | 'books' | 'manga') => void;
}

/** Startseite beim Schwerpunkt „Manga & Bücher": die Lesen-Seite mit dem Aktivitäts-Ticker der Freunde. */
export const ReadingHomeSections = ({ areas, bookYear, onSearch }: ReadingHomeSectionsProps) => {
  const readingRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ActivityMarquee scope="read" />
      <ReadingBody areas={areas} bookYear={bookYear} readingRef={readingRef} onSearch={onSearch} />
    </>
  );
};
