import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageHeader, PageLayout } from '../../components/ui';
import { useBooksList } from '../../contexts/BooksListContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useMangaGenrePicks } from '../../hooks/manga/useMangaGenrePicks';
import { useReadingAreas } from '../../hooks/ui/useReadingAreas';
import { ANILIST_GENRE_FOR } from '../../lib/reading/genreMap';
import { suggestionAreas } from '../../lib/reading/readingMedium';
import type { ShelfId } from '../../services/api/bookDiscovery';
import { t } from '../../services/i18n';
import '../Books/components/books.css';
import { GENRES } from '../Books/data/genres';
import { MixedShelf } from '../Books/discover/DiscoverParts';
import '../Books/discover/discover.css';
import { useAddFlow } from '../Books/discover/useAddFlow';
import { MangaPosterCard } from '../Manga/components/MangaPosterCard';
import { MangaPosterRow } from '../Manga/components/MangaPosterRow';
import '../Manga/MangaPage.css';
import { mangaFromAniList } from './discover/MixedDiscover';

/** Ein Genre für Bücher und Manga zusammen — Ziel der Genre-Kacheln auf der Lesen-Seite. */
export const ReadingGenrePage = () => {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const areas = useReadingAreas();
  const { bookList } = useBooksList();
  const { mangaList, hiddenMangaList } = useMangaList();
  const { openAdd, sheet } = useAddFlow();
  const genre = GENRES.find((g) => g.id === id);
  const anilistGenre = ANILIST_GENRE_FOR[id];
  const suggest = suggestionAreas(areas, bookList.length > 0, mangaList.length > 0);
  const showBooks = suggest.books;
  const showManga = suggest.manga && !!anilistGenre;
  const ownedIds = useMemo(
    () => new Set([...mangaList, ...hiddenMangaList].map((m) => m.anilistId)),
    [mangaList, hiddenMangaList]
  );
  const picks = useMangaGenrePicks(showManga ? anilistGenre : undefined, ownedIds, 30);
  const manga = useMemo(() => picks.map(mangaFromAniList), [picks]);

  return (
    <PageLayout>
      <PageHeader
        title={genre?.label() ?? t('Genre')}
        subtitle={showManga && showBooks ? t('Bücher und Manga') : undefined}
      />
      <div style={{ paddingTop: 8 }}>
        {showBooks && genre && (
          <MixedShelf ids={[genre.id as ShelfId]} onAdd={openAdd} title={t('Bücher')} />
        )}
        {showManga && manga.length > 0 && (
          <MangaPosterRow
            icon={genre ? <genre.icon /> : null}
            iconColor={genre?.colors[1]}
            title="Manga"
            onSeeAll={() => navigate('/reading/discover')}
          >
            {manga.map((item) => (
              <MangaPosterCard
                key={item.id}
                title={item.title}
                poster={item.poster}
                format={item.format}
                countryOfOrigin={item.countryOfOrigin}
                score={item.score}
                owned={ownedIds.has(item.id)}
                onClick={() => navigate(`/manga/${item.id}`)}
              />
            ))}
          </MangaPosterRow>
        )}
      </div>
      {sheet}
    </PageLayout>
  );
};
