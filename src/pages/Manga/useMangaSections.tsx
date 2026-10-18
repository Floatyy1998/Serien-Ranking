import React from 'react';
import { useMangaList } from '../../contexts/MangaListContext';
import type { ReadingLayout } from '../../lib/layout/readingLayout';
import './MangaPage.css';
import './components/MangaCards.css';
import { HiddenMangaCard } from './sections/HiddenMangaCard';
import { MangaCatchUpCard } from './sections/MangaCatchUpCard';
import { MangaQuickActions } from './sections/MangaQuickActions';
import { MangaRatingQueueCard } from './sections/MangaRatingQueueCard';
import { MangaRereadCard } from './sections/MangaRereadCard';
import { MangaStatsSection } from './sections/MangaStatsSection';
import { RecentlyAddedMangaSection } from './sections/RecentlyAddedMangaSection';

const FOR_YOU_CARDS: Record<string, React.ReactNode> = {
  'catch-up': <MangaCatchUpCard key="catch-up" />,
  'rating-queue': <MangaRatingQueueCard key="rating-queue" />,
  reread: <MangaRereadCard key="reread" />,
  hidden: <HiddenMangaCard key="hidden" />,
};

interface MangaSectionsOptions {
  /** Schnellzugriffe aus dem Lesen-Layout. */
  layout: ReadingLayout;
}

/**
 * Manga-Bausteine der Lesen-Seite, die es nur für Manga gibt. Weiterlesen, Neues,
 * Als Nächstes und Entdecken mischt die Seite selbst mit den Büchern.
 */
export function useMangaSections({ layout }: MangaSectionsOptions) {
  const { mangaList, hiddenMangaList } = useMangaList();
  const hasManga = mangaList.length > 0;

  return {
    hasManga,
    quickActions: hasManga ? (
      <MangaQuickActions variant="chips" order={layout.quick.order} hidden={layout.quick.hidden} />
    ) : null,
    /** Einzelne Für-dich-Karten; die Lesen-Seite mischt sie mit dem Leseziel. */
    forYouCards: hasManga || hiddenMangaList.length > 0 ? FOR_YOU_CARDS : {},
    recentlyAdded: <RecentlyAddedMangaSection />,
    stats: <MangaStatsSection />,
  };
}
