import { PageLayout } from '../../../components/ui';
import type { ThemeContextType } from '../../../contexts/ThemeContext';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import type { MangaHeroData } from './mangaDetailData';
import { MangaDetailHero } from './MangaDetailHero';
import { MangaInfoSections } from './MangaInfoSections';

interface MangaDetailPreviewProps {
  anilistData: AniListMangaSearchResult;
  heroData: MangaHeroData;
  currentTheme: ThemeContextType['currentTheme'];
  isMobile: boolean;
  ownedIds: Set<number>;
  adding: boolean;
  onAdd: () => void | Promise<void>;
}

/** Manga, die noch nicht in der Sammlung sind: gleicher Hero, Hinzufügen als Hauptaktion. */
export const MangaDetailPreview = ({
  anilistData,
  heroData,
  currentTheme,
  isMobile,
  ownedIds,
  adding,
  onAdd,
}: MangaDetailPreviewProps) => (
  <PageLayout>
    <MangaDetailHero
      data={heroData}
      currentTheme={currentTheme}
      isMobile={isMobile}
      adding={adding}
      onAdd={() => void onAdd()}
    />
    <div className="manga-detail-content md-layout">
      <div className="md-main">
        <MangaInfoSections
          part="main"
          data={heroData}
          anilist={anilistData}
          isMobile={isMobile}
          ownedIds={ownedIds}
        />
      </div>
      <aside className="md-side">
        <MangaInfoSections
          part="side"
          data={heroData}
          anilist={anilistData}
          isMobile={isMobile}
          ownedIds={ownedIds}
        />
      </aside>
    </div>
  </PageLayout>
);
