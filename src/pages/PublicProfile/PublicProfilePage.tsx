import {
  ArrowBack,
  AutoStories,
  GridView,
  ListAlt,
  LocalLibrary,
  Movie as MovieIcon,
  Public,
  Star,
  Tv as TvIcon,
  ViewList,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import {
  EmptyState,
  PageLayout,
  QuickFilter,
  ScrollToTopButton,
  SearchInput,
  Skeleton,
  SkeletonPosterRow,
  TabSwitcher,
} from '../../components/ui';
import type { useTheme } from '../../contexts/ThemeContext';
import { usePersistedState } from '../../hooks/data/usePersistedState';
import { getImageUrl } from '../../utils/imageUrl';
import { t } from '../../services/i18n';
import { RatingCompactRow } from '../Ratings/RatingCompactRow';
import { RatingItemCard } from '../Ratings/RatingItemCard';
import type { PreparedItem } from '../Ratings/ratingsHelpers';
import { RatingFolderGrid } from '../Ratings/RatingFolderGrid';
import type { FolderPreview } from '../Ratings/ratingsHelpers';
import { folderItemKey } from '../../lib/rating/ratingFolders';
import { rankBooksByRating } from '../../lib/books/bookRanking';
import { useFriendBooks } from '../FriendProfile/useFriendBooks';
import { useFriendFolders } from '../FriendProfile/useFriendFolders';
import { useFriendManga } from '../FriendProfile/useFriendManga';
import { useAuth } from '../../contexts/AuthContext';
import { PublicBooksGrid, PublicMangaGrid } from './PublicReadingGrids';
import { PublicProfileHeader } from './PublicProfileHeader';
import type { PublicItem } from './publicProfileHelpers';
import { userMangaRating } from '../../lib/manga/overview';
import { calculatePublicRating, usePublicProfileData } from './usePublicProfileData';
import '../Ratings/RatingsPage.css';
import '../FriendProfile/FriendProfilePage.css';
import './PublicProfilePage.css';
import { tapScale } from '../../lib/motion';

function toPreparedItem(item: PublicItem): PreparedItem {
  const isMovie = 'release_date' in item && !item.seasons?.length;
  const rating = parseFloat(calculatePublicRating(item));
  const genreList = (item.genres || item.genre?.genres || []).filter(
    (g) => g.toLowerCase() !== 'all'
  );
  const providers = Array.from(new Set((item.provider?.provider ?? []).map((p) => p.name))).flatMap(
    (name) => {
      const p = item.provider?.provider.find((x) => x.name === name);
      return p ? [{ name: p.name, logo: p.logo }] : [];
    }
  );
  const rated = !isNaN(rating) && rating > 0;
  return {
    id: item.id,
    title: item.title || '',
    posterUrl: getImageUrl(item.poster),
    rating: isNaN(rating) ? 0 : rating,
    progress: 0,
    watched: isMovie && rated,
    isMovie,
    watchlist: false,
    releaseDate: item.release_date,
    year: isMovie && item.release_date ? item.release_date.slice(0, 4) : undefined,
    genres: genreList.length > 0 ? genreList.slice(0, 2).join(', ') : undefined,
    providers,
  };
}

const LoadingState = memo<{ theme: ReturnType<typeof usePublicProfileData>['currentTheme'] }>(
  ({ theme }) => (
    <div className="pp-loading" style={{ background: theme.background.default }}>
      <div
        className="pp-loading__glow"
        style={{
          background: `radial-gradient(circle, ${theme.primary}20, transparent 70%)`,
        }}
      />
      <div className="pp-loading__content">
        <div
          role="status"
          aria-label={t('Lade Profil')}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            width: '100%',
          }}
        >
          <Skeleton width={96} height={96} shape="circle" />
          <Skeleton width={160} height={20} shape="text" />
          <Skeleton width={220} height={14} shape="text" />
          <div style={{ height: 12 }} />
          <SkeletonPosterRow count={4} posterWidth={110} />
        </div>
      </div>
    </div>
  )
);
LoadingState.displayName = 'LoadingState';

const NotFoundState = memo<{
  theme: ReturnType<typeof usePublicProfileData>['currentTheme'];
  onNavigateHome: () => void;
}>(({ theme, onNavigateHome }) => (
  <div
    className="pp-not-found"
    style={{
      background: theme.background.default,
      color: theme.text.primary,
    }}
  >
    <div
      className="pp-not-found__glow"
      style={{
        background: `radial-gradient(circle, ${theme.primary}15, transparent 70%)`,
      }}
    />
    <motion.div
      className="pp-not-found__icon"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
    >
      <Public
        style={{
          fontSize: '48px',
          color: (theme.text as { muted?: string }).muted ?? theme.text.secondary,
        }}
      />
    </motion.div>
    <h2 className="pp-not-found__title">{t('Profil nicht gefunden')}</h2>
    <p className="pp-not-found__text" style={{ color: theme.text.secondary }}>
      {t('Dieses öffentliche Profil existiert nicht')}
      <br />
      {t('oder ist nicht mehr öffentlich zugänglich.')}
    </p>
    <motion.button
      className="pp-not-found__btn"
      whileTap={tapScale}
      onClick={onNavigateHome}
      style={{
        background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`,
      }}
    >
      {t('Zur Startseite')}
    </motion.button>
  </div>
));
NotFoundState.displayName = 'NotFoundState';

export const PublicProfilePage: React.FC = () => {
  const {
    currentTheme,
    navigate,
    scrollRef,
    loading,
    profileExists,
    profileName,
    profileUserId,
    profilePhotoURL,
    averageRating,
    itemsWithRatingCount,
    activeTab,
    setActiveTab,
    filters,
    setFilters,
    ratedSeries,
    ratedMovies,
    currentItems,
    handleItemClick,
  } = usePublicProfileData();

  const [density, setDensity] = usePersistedState<'cinematic' | 'compact'>(
    'ratingsDensity',
    'cinematic'
  );

  const ratingsTheme = currentTheme as ReturnType<typeof useTheme>['currentTheme'];
  const { user } = useAuth() || {};

  type Extra = 'manga' | 'books' | 'lists';
  const [extra, setExtra] = useState<Extra | null>(null);
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  const ownerId = profileUserId ?? undefined;
  const manga = useFriendManga(ownerId);
  const books = useFriendBooks(ownerId);
  const { folders } = useFriendFolders(ownerId);
  const openFolder = folders.find((f) => f.id === openFolderId) ?? null;
  const search = (filters.search || '').trim().toLowerCase();
  const mangaItems = useMemo(
    () =>
      manga.list
        .filter(
          (m) =>
            !search ||
            [m.title, m.titleEnglish, m.titleRomaji].some((v) => v?.toLowerCase().includes(search))
        )
        .sort(
          (a, b) =>
            userMangaRating(b, ownerId) - userMangaRating(a, ownerId) ||
            new Date(b.lastReadAt || b.addedAt || 0).getTime() -
              new Date(a.lastReadAt || a.addedAt || 0).getTime()
        ),
    [manga.list, search, ownerId]
  );
  const bookItems = useMemo(
    () => rankBooksByRating(books.list, filters.search),
    [books.list, filters.search]
  );

  useEffect(() => {
    if (extra === 'manga' && !manga.loading && manga.list.length === 0) setExtra(null);
    if (extra === 'books' && !books.loading && books.list.length === 0) setExtra(null);
    if (extra === 'lists' && folders.length === 0) setExtra(null);
  }, [extra, manga.loading, manga.list.length, books.loading, books.list.length, folders.length]);

  const folderPreviews = useMemo(() => {
    const byKey = new Map<string, { rating: number; poster: string }>();
    const collect = (items: typeof ratedSeries, kind: 'series' | 'movie') => {
      for (const item of items) {
        const r = parseFloat(calculatePublicRating(item));
        byKey.set(folderItemKey(kind, item.id), {
          rating: isNaN(r) ? 0 : r,
          poster: getImageUrl(item.poster),
        });
      }
    };
    collect(ratedSeries, 'series');
    collect(ratedMovies, 'movie');
    const previews: Record<string, FolderPreview> = {};
    for (const f of folders) {
      const entries = [...f.items]
        .map((key) => byKey.get(key))
        .filter((e): e is { rating: number; poster: string } => !!e)
        .sort((a, b) => b.rating - a.rating);
      previews[f.id] = { count: entries.length, posters: entries.slice(0, 4).map((e) => e.poster) };
    }
    return previews;
  }, [folders, ratedSeries, ratedMovies]);

  const shownItems = useMemo(() => {
    if (extra !== 'lists' || !openFolder) return currentItems;
    const inFolder = (item: { id: number }, kind: 'series' | 'movie') =>
      openFolder.items.has(folderItemKey(kind, item.id));
    return [
      ...ratedSeries.filter((i) => inFolder(i, 'series')),
      ...ratedMovies.filter((i) => inFolder(i, 'movie')),
    ].sort(
      (a, b) =>
        (parseFloat(calculatePublicRating(b)) || 0) - (parseFloat(calculatePublicRating(a)) || 0)
    );
  }, [extra, openFolder, currentItems, ratedSeries, ratedMovies]);

  const preparedItems = useMemo(() => shownItems.map(toPreparedItem), [shownItems]);

  const handleGridClick = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('.ratings-provider-badges')) return;
      const el = (e.target as HTMLElement).closest('.ratings-grid-item') as HTMLElement | null;
      const id = Number(el?.dataset.id);
      if (!el || !id) return;
      const isMovie = el.dataset.movie !== undefined;
      const item = shownItems.find((i) => i.id === id);
      if (item) handleItemClick(item, isMovie ? 'movie' : 'series');
    },
    [shownItems, handleItemClick]
  );

  if (loading) {
    return <LoadingState theme={currentTheme} />;
  }

  if (!profileExists) {
    return <NotFoundState theme={currentTheme} onNavigateHome={() => navigate('/')} />;
  }

  const rankedByRating =
    filters.quickFilter !== 'recently-added' &&
    (filters.quickFilter === 'ongoing' || (filters.sortBy || 'rating-desc') === 'rating-desc');

  return (
    <PageLayout>
      <div ref={scrollRef} className="fp-page">
        <PublicProfileHeader
          profileName={profileName}
          profileUid={profileUserId}
          photoURL={profilePhotoURL}
          itemsWithRatingCount={itemsWithRatingCount}
          averageRating={averageRating}
          currentTheme={currentTheme}
        />

        <div className="fp-search-wrap">
          <SearchInput
            value={filters.search || ''}
            onChange={(v) => setFilters((prev) => ({ ...prev, search: v }))}
            placeholder={
              extra === 'manga'
                ? t('Manga durchsuchen...')
                : extra === 'books'
                  ? t('Bücher durchsuchen...')
                  : t('Serien & Filme durchsuchen...')
            }
          />
        </div>

        {(extra === null || (extra === 'lists' && openFolder)) && (
          <QuickFilter
            onFilterChange={setFilters}
            isMovieMode={activeTab === 'movies'}
            isRatingsMode={true}
            hasBottomNav={false}
            initialFilters={filters}
          />
        )}

        <TabSwitcher
          className="fp-tabs"
          tabs={[
            { id: 'series', label: t('Serien'), icon: TvIcon, count: ratedSeries.length },
            { id: 'movies', label: t('Filme'), icon: MovieIcon, count: ratedMovies.length },
            ...(manga.list.length > 0
              ? [{ id: 'manga', label: 'Manga', icon: AutoStories, count: manga.list.length }]
              : []),
            ...(books.list.length > 0
              ? [{ id: 'books', label: t('Bücher'), icon: LocalLibrary, count: books.list.length }]
              : []),
            ...(folders.length > 0
              ? [{ id: 'lists', label: t('Listen'), icon: ListAlt, count: folders.length }]
              : []),
          ]}
          activeTab={extra ?? activeTab}
          onTabChange={(id) => {
            setOpenFolderId(null);
            if (id === 'series' || id === 'movies') {
              setExtra(null);
              setActiveTab(id);
            } else {
              setExtra(id as Extra);
            }
          }}
        />

        <div className="fp-grid-wrapper">
          {extra === 'manga' ? (
            <PublicMangaGrid
              items={mangaItems}
              ownerUid={profileUserId}
              theme={ratingsTheme}
              onOpen={user ? (id) => navigate(`/manga/${id}`) : undefined}
            />
          ) : extra === 'books' ? (
            <PublicBooksGrid items={bookItems} theme={ratingsTheme} />
          ) : extra === 'lists' && !openFolder ? (
            <RatingFolderGrid
              theme={ratingsTheme}
              folders={folders}
              previews={folderPreviews}
              onOpen={setOpenFolderId}
            />
          ) : (
            <>
              {openFolder && (
                <div className="rf-bar">
                  <button
                    type="button"
                    className="rf-icon-btn"
                    onClick={() => setOpenFolderId(null)}
                    aria-label={t('Alle Listen')}
                    style={{
                      borderColor: currentTheme.border.default,
                      color: currentTheme.text.secondary,
                    }}
                  >
                    <ArrowBack style={{ fontSize: 20 }} />
                  </button>
                  <div className="rf-bar__text">
                    <span className="rf-bar__name" style={{ color: currentTheme.text.primary }}>
                      {openFolder.name}
                    </span>
                  </div>
                </div>
              )}
              {preparedItems.length > 0 && (
                <div className="ratings-density-toggle" role="group" aria-label={t('Ansicht')}>
                  {(
                    [
                      ['cinematic', GridView, t('Cinematic-Ansicht')],
                      ['compact', ViewList, t('Kompakte Listen-Ansicht')],
                    ] as const
                  ).map(([mode, Icon, title]) => (
                    <button
                      key={mode}
                      type="button"
                      className={`ratings-density-btn${density === mode ? ' active' : ''}`}
                      onClick={() => setDensity(mode)}
                      aria-pressed={density === mode}
                      title={title}
                      style={
                        density === mode
                          ? {
                              background: currentTheme.primary,
                              color: currentTheme.background.default,
                            }
                          : { color: ratingsTheme.text.muted }
                      }
                    >
                      <Icon fontSize="small" />
                    </button>
                  ))}
                </div>
              )}

              <AnimatePresence mode="wait">
                {shownItems.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                  >
                    <EmptyState
                      icon={<Star style={{ fontSize: '56px' }} />}
                      title={
                        activeTab === 'series'
                          ? t('Keine Serien gefunden')
                          : t('Keine Filme gefunden')
                      }
                      description={t('Versuche andere Filter oder entferne sie.')}
                      iconColor={currentTheme.primary}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="grid"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {density === 'compact' ? (
                      <div className="ratings-list" onClick={handleGridClick}>
                        {preparedItems.map((item, idx) => (
                          <RatingCompactRow
                            key={`${item.isMovie ? 'm' : 's'}-${item.id}`}
                            item={item}
                            theme={ratingsTheme}
                            rank={rankedByRating ? idx + 1 : undefined}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="ratings-grid" onClick={handleGridClick}>
                        {preparedItems.map((item) => (
                          <RatingItemCard
                            key={`${item.isMovie ? 'm' : 's'}-${item.id}`}
                            item={item}
                            theme={ratingsTheme}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </PageLayout>
  );
};
