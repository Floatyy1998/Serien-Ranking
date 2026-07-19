import Info from '@mui/icons-material/Info';
import People from '@mui/icons-material/People';
import Star from '@mui/icons-material/Star';
import { memo } from 'react';
import { Dialog } from '../../components/ui';
import { DiscussionThread } from '../../components/Discussion';
import { CastCrew, RecommendationsSection } from '../../components/detail';
import { Deferred } from '../../components/ui/Deferred';
import { useTheme } from '../../contexts/ThemeContext';
import { MovieHeroSection } from './MovieHeroSection';
import { MovieActionButtons } from './MovieActionButtons';
import { MovieInfoTab } from './MovieInfoTab';
import { useMovieData } from './useMovieData';
import { t } from '../../services/i18n';
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

  return (
    <div>
      {/* Hero Section with Backdrop */}
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

      {/* Action Buttons (nur "Film hinzufügen" für Nur-Lese-TMDB-Filme) */}
      <MovieActionButtons
        isMobile={isMobile}
        isReadOnlyTmdbMovie={isReadOnlyTmdbMovie}
        isAdding={isAdding}
        onAddMovie={handleAddMovie}
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
        <div role="tabpanel" id="md-tabpanel-cast" aria-labelledby="md-tab-cast">
          <CastCrew tmdbId={movie.id} mediaType="movie" seriesData={movie} />
        </div>
      ) : (
        <div role="tabpanel" id="md-tabpanel-info" aria-labelledby="md-tab-info">
          <MovieInfoTab movie={movie} isMobile={isMobile} tmdbOverview={tmdbOverview} />
          <Deferred>
            <RecommendationsSection id={movie.id} mediaType="movie" />
          </Deferred>
        </div>
      )}

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
  <div
    role="tablist"
    aria-label={t('Film-Bereiche')}
    className={`md-tabs ${isMobile ? 'md-tabs--mobile' : ''}`}
  >
    <button
      type="button"
      role="tab"
      id="md-tab-info"
      aria-selected={activeTab === 'info'}
      aria-controls="md-tabpanel-info"
      tabIndex={activeTab === 'info' ? 0 : -1}
      onClick={() => onTabChange('info')}
      className={`md-tab-btn ${isMobile ? 'md-tab-btn--mobile' : ''} ${activeTab === 'info' ? 'md-tab-btn--active' : ''}`}
      style={{
        // Getöntes Glas statt Neon-Vollfüllung (Serien-Muster).
        background:
          activeTab === 'info'
            ? `linear-gradient(135deg, ${currentTheme.primary}2e, ${currentTheme.accent}24), var(--glass-light)`
            : 'rgba(255, 255, 255, 0.05)',
        color: activeTab === 'info' ? currentTheme.primary : currentTheme.text.muted,
        boxShadow: activeTab === 'info' ? 'var(--glass-specular)' : undefined,
        outline: activeTab === 'info' ? `1px solid ${currentTheme.primary}40` : undefined,
        outlineOffset: -1,
      }}
    >
      <Info aria-hidden style={{ fontSize: isMobile ? '16px' : '18px' }} />
      {t('Info')}
    </button>

    <button
      type="button"
      role="tab"
      id="md-tab-cast"
      aria-selected={activeTab === 'cast'}
      aria-controls="md-tabpanel-cast"
      tabIndex={activeTab === 'cast' ? 0 : -1}
      onClick={() => onTabChange('cast')}
      className={`md-tab-btn ${isMobile ? 'md-tab-btn--mobile' : ''} ${activeTab === 'cast' ? 'md-tab-btn--active' : ''}`}
      style={{
        background:
          activeTab === 'cast'
            ? `linear-gradient(135deg, ${currentTheme.primary}2e, ${currentTheme.accent}24), var(--glass-light)`
            : 'rgba(255, 255, 255, 0.05)',
        color: activeTab === 'cast' ? currentTheme.primary : currentTheme.text.muted,
        boxShadow: activeTab === 'cast' ? 'var(--glass-specular)' : undefined,
        outline: activeTab === 'cast' ? `1px solid ${currentTheme.primary}40` : undefined,
        outlineOffset: -1,
      }}
    >
      <People aria-hidden style={{ fontSize: isMobile ? '16px' : '18px' }} />
      {t('Besetzung')}
    </button>
  </div>
));

MovieTabBar.displayName = 'MovieTabBar';
