import Info from '@mui/icons-material/Info';
import People from '@mui/icons-material/People';
import Star from '@mui/icons-material/Star';
import { memo } from 'react';
import { Dialog } from '../../components/ui';
import { DiscussionThread } from '../../components/Discussion';
import { CastCrew } from '../../components/detail';
import { useTheme } from '../../contexts/ThemeContextDef';
import { MovieHeroSection } from './MovieHeroSection';
import { MovieActionButtons } from './MovieActionButtons';
import { MovieInfoTab } from './MovieInfoTab';
import { useMovieData } from './useMovieData';
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
    getBackdropUrl,
    formatRuntime,
  } = useMovieData();

  // --- Not found state ---
  if (!movie && !loading) {
    const apiKey = import.meta.env.VITE_API_TMDB;
    return (
      <div className="md-not-found">
        <h2 className="md-not-found__title">Film nicht gefunden</h2>
        {!apiKey && (
          <p className="md-not-found__text" style={{ color: currentTheme.text.secondary }}>
            Dieser Film ist nicht in deiner Liste. Um Filme von Freunden anzuzeigen, wird ein TMDB
            API-Schlüssel benötigt.
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
          Zurück
        </button>
      </div>
    );
  }

  // --- Loading state ---
  if (loading || !movie) {
    return (
      <div className="md-loading">
        <p>Lade...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section with Backdrop */}
      <MovieHeroSection
        movie={movie}
        id={id}
        isMobile={isMobile}
        tmdbBackdrop={tmdbBackdrop}
        tmdbRating={tmdbRating}
        imdbRating={imdbRating}
        providers={providers}
        averageRating={averageRating}
        isReadOnlyTmdbMovie={isReadOnlyTmdbMovie}
        isAdding={isAdding}
        getBackdropUrl={getBackdropUrl}
        formatRuntime={formatRuntime}
        onAddMovie={handleAddMovie}
      />

      {/* Action Buttons */}
      <MovieActionButtons
        isMobile={isMobile}
        isWatched={isWatched}
        isReadOnlyTmdbMovie={isReadOnlyTmdbMovie}
        isAdding={isAdding}
        loading={loading}
        movieId={movie.id}
        onNavigateRate={() => navigate(`/rating/movie/${movie.id}`)}
        onAddMovie={handleAddMovie}
        onDeleteClick={() => setShowDeleteConfirm(true)}
      />

      {/* Tab Navigation */}
      <MovieTabBar
        activeTab={activeTab}
        isMobile={isMobile}
        currentTheme={currentTheme}
        onTabChange={setActiveTab}
      />

      {/* Content based on active tab */}
      {activeTab === 'cast' ? (
        <CastCrew tmdbId={movie.id} mediaType="movie" seriesData={movie} />
      ) : (
        <MovieInfoTab movie={movie} isMobile={isMobile} tmdbOverview={tmdbOverview} />
      )}

      {/* Discussions Section */}
      <div className="md-discussion">
        <DiscussionThread
          itemId={movie.id}
          itemType="movie"
          feedMetadata={{
            itemTitle: movie.title || 'Unbekannter Film',
            posterPath:
              movie.poster && typeof movie.poster === 'object' ? movie.poster.poster : undefined,
          }}
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirm && !isReadOnlyTmdbMovie}
        onClose={() => setShowDeleteConfirm(false)}
        title="Film löschen?"
        message={`Möchtest du "${movie?.title}" wirklich aus deiner Sammlung entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`}
        type="warning"
        actions={[
          {
            label: 'Abbrechen',
            onClick: () => setShowDeleteConfirm(false),
            variant: 'secondary',
          },
          {
            label: 'Löschen',
            onClick: handleDeleteMovie,
            variant: 'primary',
          },
        ]}
      />

      {/* Success Snackbar */}
      {snackbar.open && (
        <div className="md-snackbar" style={{ background: currentTheme.status.success }}>
          <Star style={{ fontSize: '20px' }} />
          <span style={{ fontSize: '15px', fontWeight: 500 }}>{snackbar.message}</span>
        </div>
      )}

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

/* ─── Inline sub-component: Tab bar ─── */

interface MovieTabBarProps {
  activeTab: 'info' | 'cast';
  isMobile: boolean;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  onTabChange: (tab: 'info' | 'cast') => void;
}

const MovieTabBar = memo(({ activeTab, isMobile, currentTheme, onTabChange }: MovieTabBarProps) => (
  <div className={`md-tabs ${isMobile ? 'md-tabs--mobile' : ''}`}>
    <button
      onClick={() => onTabChange('info')}
      className={`md-tab-btn ${isMobile ? 'md-tab-btn--mobile' : ''} ${activeTab === 'info' ? 'md-tab-btn--active' : ''}`}
      style={{
        background:
          activeTab === 'info'
            ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
            : 'rgba(255, 255, 255, 0.05)',
        color: activeTab === 'info' ? currentTheme.text.secondary : currentTheme.text.muted,
      }}
    >
      <Info style={{ fontSize: isMobile ? '16px' : '18px' }} />
      Info
    </button>

    <button
      onClick={() => onTabChange('cast')}
      className={`md-tab-btn ${isMobile ? 'md-tab-btn--mobile' : ''} ${activeTab === 'cast' ? 'md-tab-btn--active' : ''}`}
      style={{
        background:
          activeTab === 'cast'
            ? `linear-gradient(135deg, ${currentTheme.primary} 0%, ${currentTheme.accent} 100%)`
            : 'rgba(255, 255, 255, 0.05)',
        color: activeTab === 'cast' ? currentTheme.text.secondary : currentTheme.text.muted,
      }}
    >
      <People style={{ fontSize: isMobile ? '16px' : '18px' }} />
      Besetzung
    </button>
  </div>
));

MovieTabBar.displayName = 'MovieTabBar';
