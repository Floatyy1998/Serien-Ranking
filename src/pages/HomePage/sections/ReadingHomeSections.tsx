import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ReadingAreas } from '../../../lib/reading/readingMedium';
import type { BookYear } from '../../Books/hooks/useBookYear';
import { ReadingBody } from '../../Reading/ReadingBody';
import { ActivityMarquee } from '../cards/ActivityMarquee';
import type { HomeConfig } from '../hooks/useHomeConfig';
import { QuickActionsSection, SecondaryActionsSection } from './HomeActionSections';

/** Entdecken und Verlauf zeigen nur Serien und Filme — hier stattdessen Freunde und Aktivität. */
const READER_QUICK_ACTIONS = {
  quickActionsOrder: ['friends', 'activity', 'ratings'],
  hiddenQuickActions: [],
};

interface ReadingHomeSectionsProps {
  config: HomeConfig;
  areas: ReadingAreas;
  bookYear: BookYear;
  onSearch: (filter: 'all' | 'books' | 'manga') => void;
}

/** Startseite beim Schwerpunkt „Manga & Bücher": die Lesen-Seite plus Freunde, Bestenliste, Badges, Pet. */
export const ReadingHomeSections = ({
  config,
  areas,
  bookYear,
  onSearch,
}: ReadingHomeSectionsProps) => {
  const navigate = useNavigate();
  const readingRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <ActivityMarquee />
      <QuickActionsSection config={READER_QUICK_ACTIONS} navigate={navigate} />
      <ReadingBody areas={areas} bookYear={bookYear} readingRef={readingRef} onSearch={onSearch} />
      <SecondaryActionsSection config={config} navigate={navigate} />
    </>
  );
};
