import Info from '@mui/icons-material/Info';
import People from '@mui/icons-material/People';
import { memo } from 'react';
import { DetailTabs, FactList, RailSection } from '../../components/detail/kit/DetailKit';
import { Dialog, Snackbar } from '../../components/ui';
import { DiscussionThread } from '../../components/Discussion';
import { CastCrew, RecommendationsSection } from '../../components/detail';
import { BasedOnBookSection } from '../Books/components/BasedOnBookSection';
import { Deferred } from '../../components/ui/feedback/Deferred';
import { useTheme } from '../../contexts/ThemeContext';
import { MovieHeroSection } from './MovieHeroSection';
import { MovieActionButtons } from './MovieActionButtons';
import { MovieInfoTab } from './MovieInfoTab';
import { CollectionSection } from './CollectionSection';
import { useMovieData } from './useMovieData';
import { FriendsMovieStrip } from './FriendsMovieStrip';
import { useFriendsMovieStatus } from './useFriendsMovieStatus';
import { dateLocale, t } from '../../services/i18n';
import './MovieDetailPage.css';

export const MovieDetailPage = memo(() => {
  const { currentTheme } = useTheme();

  const {
    id,
    navigate,
    movie,
    isReadOnlyTmdbMovie,
    loading,
    tmdbBackdrop,
    tmdbRating,
    imdbRating,
    tmdbOverview,
    providers,
    isWatched,
    averageRating,
    activeTab,
    setActiveTab,
    isMobile,
    showDeleteConfirm,
    setShowDeleteConfirm,
    isAdding,
    dialog,
    setDialog,
    snackbar,
    handleAddMovie,
    handleDeleteMovie,
    handleToggleWatched,
    getBackdropUrl,
    formatRuntime,
  } = useMovieData();
  const friendsStatus = useFriendsMovieStatus(movie?.id);

  // --- Not found state ---
  if (!movie && !loading) {
    const apiKey = import.meta.env.VITE_API_TMDB;
    return (
      <div className="md-not-found">
        <h2 className="md-not-found__title">{t('Film nicht gefunden')}</h2>
        {!apiKey && (
          <p className="md-not-found__text" style={{ color: currentTheme.text.secondary }}>
            {t(
              'Dieser Film ist nicht in deiner Liste. Um Filme von Freunden anzuzeigen, wird ein TMDB API-Schlüssel benötigt.'
            )}
          </p>
        )}
        <button
          onClick={() => navigate('/')}
          className="md-not-found__btn"
          style={{
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            color: currentTheme.text.primary,
          }}
        >
          {t('Zurück')}
        </button>
      </div>
    );
  }

  // --- Loading state ---
  if (loading || !movie) {
    return (
      <div className="md-loading">
        <p>{t('Lade...')}</p>
      </div>
    );
  }

  const releaseDate = movie.release_date
    ? new Date(movie.release_date).toLocaleDateString(dateLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;
  const shortDate = (value: string | number | undefined) =>
    value ? new Date(value).toLocaleDateString(dateLocale()) : null;
  const genreNames = (
    movie.genre?.genres?.length ? movie.genre.genres : (movie.genres?.map((g) => g.name) ?? [])
  ).filter((g) => g && g !== 'All');
  const friendsStrip = <FriendsMovieStrip entries={friendsStatus.entries} isMobile={isMobile} />;
  // Buchvorlage aus Wikidata — rendert nur, wenn es eine gibt
  const basedOnBook = (
    <Deferred>
      <BasedOnBookSection tmdbId={Number(movie.id)} kind="movie" isMobile />
    </Deferred>
  );
  const facts = (
    <div className={isMobile ? 'dk-slot' : undefined}>
      <RailSection title={t('Auf einen Blick')}>
        <FactList
          facts={[
            {
              label: t('Status'),
              value: isReadOnlyTmdbMovie
                ? null
                : isWatched
                  ? t('Gesehen')
                  : t('Noch nicht gesehen'),
            },
            { label: t('Kinostart'), value: releaseDate },
            { label: t('Laufzeit'), value: movie.runtime ? formatRuntime(movie.runtime) : null },
            { label: t('Genres'), value: genreNames.join(', ') },
            { label: t('Gesehen am'), value: shortDate(movie.watchedAt) },
            { label: t('Hinzugefügt'), value: shortDate(movie.addedAt) },
          ]}
        />
      </RailSection>
    </div>
  );

  return (
    <div className="dk">
      {/* Bühne */}
      <MovieHeroSection
        movie={movie}
        id={id}
        isMobile={isMobile}
        tmdbBackdrop={tmdbBackdrop}
        overview={movie.beschreibung || movie.overview || tmdbOverview || undefined}
        tmdbRating={tmdbRating}
        imdbRating={imdbRating}
        providers={providers}
        averageRating={averageRating}
        isWatched={isWatched}
        isReadOnlyTmdbMovie={isReadOnlyTmdbMovie}
        isAdding={isAdding}
        getBackdropUrl={getBackdropUrl}
        formatRuntime={formatRuntime}
        onAddMovie={handleAddMovie}
        onNavigateRate={() => navigate(`/rating/movie/${movie.id}`)}
        onToggleWatched={handleToggleWatched}
        onDeleteClick={() => setShowDeleteConfirm(true)}
      />

      {/* „Film hinzufügen" für Filme, die noch nicht in der Sammlung sind */}
      <MovieActionButtons
        isMobile={isMobile}
        isReadOnlyTmdbMovie={isReadOnlyTmdbMovie}
        isAdding={isAdding}
        onAddMovie={handleAddMovie}
      />

      <div className="dk-layout">
        <div className="dk-main">
          {isMobile && friendsStrip}

          <DetailTabs
            ariaLabel={t('Film-Bereiche')}
            idPrefix="md"
            active={activeTab}
            onChange={setActiveTab}
            tabs={[
              {
                key: 'info',
                icon: <Info aria-hidden style={{ fontSize: 18 }} />,
                label: t('Info'),
              },
              {
                key: 'cast',
                icon: <People aria-hidden style={{ fontSize: 18 }} />,
                label: t('Besetzung'),
              },
            ]}
          />

          {activeTab === 'cast' ? (
            <div role="tabpanel" id="md-tabpanel-cast" aria-labelledby="md-tab-cast">
              <CastCrew tmdbId={movie.id} mediaType="movie" seriesData={movie} />
            </div>
          ) : (
            <div role="tabpanel" id="md-tabpanel-info" aria-labelledby="md-tab-info">
              <MovieInfoTab movie={movie} isMobile={isMobile} tmdbOverview={tmdbOverview} />
              <Deferred>
                <CollectionSection movieId={Number(movie.id)} isMobile={isMobile} />
              </Deferred>
              {isMobile && (
                <>
                  {facts}
                  {basedOnBook}
                </>
              )}
              <Deferred>
                <RecommendationsSection id={movie.id} mediaType="movie" />
              </Deferred>
            </div>
          )}
        </div>

        {!isMobile && (
          <aside className="dk-rail">
            {friendsStrip}
            {facts}
            <div className="dk-rail__bleed">{basedOnBook}</div>
          </aside>
        )}
      </div>

      {/* Discussions Section */}
      <div className="md-discussion">
        <Deferred>
          <DiscussionThread
            itemId={movie.id}
            itemType="movie"
            isWatched={isWatched}
            feedMetadata={{
              itemTitle: movie.title || 'Unbekannter Film',
              posterPath:
                movie.poster && typeof movie.poster === 'object' ? movie.poster.poster : undefined,
            }}
          />
        </Deferred>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm && !isReadOnlyTmdbMovie}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('Film löschen?')}
        message={t(
          'Möchtest du "{title}" wirklich aus deiner Sammlung entfernen? Diese Aktion kann nicht rückgängig gemacht werden.',
          { title: movie?.title ?? '' }
        )}
        type="warning"
        actions={[
          {
            label: t('Abbrechen'),
            onClick: () => setShowDeleteConfirm(false),
            variant: 'secondary',
          },
          {
            label: t('Löschen'),
            onClick: handleDeleteMovie,
            variant: 'danger',
          },
        ]}
      />

      {/* Success Snackbar (zentrales Toast-System) */}
      <Snackbar open={snackbar.open} message={snackbar.message} />

      {/* Dialog for other alerts */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </div>
  );
});

MovieDetailPage.displayName = 'MovieDetailPage';
