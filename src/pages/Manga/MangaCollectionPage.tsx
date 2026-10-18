import { PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { t } from '../../services/i18n';
import './MangaPage.css';
import './components/MangaCards.css';
import { MangaCollectionSection } from './sections/MangaCollectionSection';

/** Komplette Manga-Sammlung mit Suche und Filtern — der Manga-Teil von „Deine Bibliothek". */
export const MangaCollectionPage = () => {
  const { mangaList } = useMangaList();

  return (
    <PageLayout>
      <PageHeader
        title={t('Manga-Sammlung')}
        subtitle={t('{n} Titel in deiner Sammlung', { n: mangaList.length })}
      />
      <div style={{ paddingTop: 8 }}>
        <MangaCollectionSection />
      </div>
    </PageLayout>
  );
};
