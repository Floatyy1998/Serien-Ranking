import React from 'react';
import { useMangaList } from '../../contexts/MangaListContext';
import './MangaPage.css';
import './components/MangaCards.css';
import { HiddenMangaCard } from './sections/HiddenMangaCard';
import { MangaRatingQueueCard } from './sections/MangaRatingQueueCard';
import { MangaRereadCard } from './sections/MangaRereadCard';
import { MangaStatsSection } from './sections/MangaStatsSection';
import { RecentlyAddedMangaSection } from './sections/RecentlyAddedMangaSection';

const FOR_YOU_CARDS: Record<string, React.ReactNode> = {
  'rating-queue': <MangaRatingQueueCard key="rating-queue" />,
  reread: <MangaRereadCard key="reread" />,
  hidden: <HiddenMangaCard key="hidden" />,
};

/**
 * Manga-Bausteine der Lesen-Seite, die es nur für Manga gibt. Weiterlesen, Neues,
 * Als Nächstes und Entdecken mischt die Seite selbst mit den Büchern.
 */
export function useMangaSections() {
  const { mangaList, hiddenMangaList } = useMangaList();
  const hasManga = mangaList.length > 0;

  return {
    hasManga,
    /** Einzelne Für-dich-Karten; die Lesen-Seite mischt sie mit dem Leseziel. */
    forYouCards: hasManga || hiddenMangaList.length > 0 ? FOR_YOU_CARDS : {},
    recentlyAdded: <RecentlyAddedMangaSection />,
    stats: <MangaStatsSection />,
  };
}
