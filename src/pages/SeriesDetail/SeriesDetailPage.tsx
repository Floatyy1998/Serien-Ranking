import {
  BookmarkAdd,
  BookmarkRemove,
  Check,
  Delete,
  Info,
  List,
  People,
  PlayCircle,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../App';
import { BackButton, Dialog } from '../../components/ui';
import { DiscussionThread } from '../../components/Discussion';
import { CastCrew, FriendsWhoHaveThis, ProviderBadges, VideoGallery } from '../../components/detail';
import { useTheme } from '../../contexts/ThemeContext';
import { logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { useEpisodeDiscussionCounts } from '../../hooks/useDiscussionCounts';
import { calculateOverallRating } from '../../lib/rating/rating';
import { WatchActivityService } from '../../services/watchActivityService';
import { calculateWatchingPace, formatPaceLine } from '../../lib/paceCalculation';
import { RewatchDialog } from './RewatchDialog';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useSeriesData } from './useSeriesData';
import type { SeriesEpisode, SeriesSeason } from './types';

export const SeriesDetailPage = memo(() => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState<number>(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRewatchDialog, setShowRewatchDialog] = useState<{
    show: boolean;
    type: 'episode' | 'season';
    item: SeriesEpisode | null;
  }>({ show: false, type: 'episode', item: null });
  const [activeTab, setActiveTab] = useState<'info' | 'cast'>('info');
  const [isAdding, setIsAdding] = useState(false);
  const [dialog, setDialog] = useState<{
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    onConfirm?: () => void;
  }>({ open: false, message: '', type: 'info' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  // Responsive state
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Use the extracted data hook
  const {
    series,
    localSeries,
    tmdbSeries,
    isReadOnlyTmdbSeries,
    loading,
    tmdbBackdrop,
    providers,
    tmdbRating,
    imdbRating,
    tmdbFirstAirDate,
    tmdbOverview,
  } = useSeriesData(id);

  // Episode discussion counts for the selected season
  const selectedSeasonData = series?.seasons?.[selectedSeasonIndex];
  const selectedSeasonEpisodeCount = selectedSeasonData?.episodes?.length || 0;
  const episodeDiscussionCounts = useEpisodeDiscussionCounts(
    Number(id) || 0,
    (selectedSeasonData?.seasonNumber || 0) + 1, // Season numbers are 1-based in the discussion path
    selectedSeasonEpisodeCount
  );

  const getBackdropUrl = (backdropPath: string | undefined): string => {
    if (!backdropPath) return '';
    if (backdropPath.startsWith('http')) return backdropPath;
    // Use original size for best quality on 2K/4K monitors
    return `https://image.tmdb.org/t/p/original${backdropPath}`;
  };

  // Calculate overall rating from genre ratings
  const overallRating = useMemo(() => {
    if (!series) return '0.00';
    return calculateOverallRating(series);
  }, [series]);

  // Calculate progress statistics - only count aired episodes
  const progressStats = useMemo(() => {
    if (!series?.seasons) return { watched: 0, total: 0, percentage: 0 };

    const today = new Date();
    let watchedCount = 0;
    let airedCount = 0;

    series.seasons.forEach((season) => {
      season.episodes?.forEach((episode) => {
        // Only count episodes that have aired
        if (episode.air_date) {
          const airDate = new Date(episode.air_date);
          if (airDate <= today) {
            airedCount++;
            if (episode.watched === true) {
              watchedCount++;
            }
          }
        }
      });
    });

    return {
      watched: watchedCount,
      total: airedCount, // Only show aired episodes in total
      percentage: airedCount > 0 ? Math.round((watchedCount / airedCount) * 100) : 0,
    };
  }, [series]);

  // Calculate watching pace
  const paceInfo = useMemo(() => {
    if (!series?.seasons) return null;
    const pace = calculateWatchingPace(series.seasons, series.episodeRuntime);
    if (!pace.shouldShow) return null;
    return { pace, text: formatPaceLine(pace) };
  }, [series]);

  // Handle adding series - memoized
  const handleAddSeries = useCallback(async () => {
    if (!series || !user) return;

    setIsAdding(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_API_URL}/add`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: import.meta.env.VITE_USER,
          id: series.id,
          uuid: user.uid,
        }),
      });

      if (response.ok) {
        // Activity-Logging für Friend + Badge-System (wie Desktop)
        // Bei lokalen Serien ist es series.poster.poster, bei TMDB ist es in tmdbSeries
        let posterPath: string | undefined;
        if (series.poster && typeof series.poster === 'object' && series.poster.poster) {
          posterPath = series.poster.poster;
        } else if (tmdbSeries && tmdbSeries.poster?.poster) {
          posterPath = tmdbSeries.poster.poster;
        }
        await logSeriesAdded(
          user.uid,
          series.name || series.title || 'Unbekannte Serie',
          series.id,
          posterPath
        );

        setSnackbar({ open: true, message: 'Serie erfolgreich hinzugefügt!' });
        setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);

        // Navigate to refresh the series data
        navigate(`/series/${series.id}`, { replace: true });
      } else {
        const data = await response.json();
        if (data.error === 'Serie bereits vorhanden') {
          setDialog({ open: true, message: 'Serie ist bereits in deiner Liste!', type: 'warning' });
        } else {
          throw new Error('Fehler beim Hinzufügen');
        }
      }
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Hinzufügen der Serie.', type: 'error' });
    } finally {
      setIsAdding(false);
    }
  }, [series, user]);

  // Handle series deletion - using Firebase directly - memoized
  const handleDeleteSeries = useCallback(() => {
    if (!series || !user) return;

    setDialog({
      open: true,
      message: 'Möchtest du diese Serie wirklich löschen?',
      type: 'warning',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          // Delete directly from Firebase
          await firebase.database().ref(`${user.uid}/serien/${series.nmr}`).remove();

          // Show success message
          setSnackbar({ open: true, message: 'Serie erfolgreich gelöscht!' });
          setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);

          // Series will be removed from list automatically via Firebase listener
          // No navigation needed - stay on current page
        } catch (error) {
          setDialog({ open: true, message: 'Fehler beim Löschen der Serie.', type: 'error' });
        } finally {
          setIsDeleting(false);
        }
      },
    });
  }, [series, user, navigate]);

  // Handle watchlist toggle - memoized
  const handleWatchlistToggle = useCallback(async () => {
    if (!series || !user) return;

    try {
      // Use Firebase directly like desktop
      const ref = firebase.database().ref(`${user.uid}/serien/${series.nmr}/watchlist`);

      const newWatchlistStatus = !series.watchlist;
      await ref.set(newWatchlistStatus);

      // Badge-System für Watchlist (nur wenn hinzugefügt)
      if (newWatchlistStatus) {
        const { logWatchlistAdded } = await import('../../features/badges/minimalActivityLogger');
        await logWatchlistAdded(user.uid, series.title, series.id);
      }

      // The context will update automatically through Firebase listeners
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Aktualisieren der Watchlist.', type: 'error' });
    }
  }, [series, user]);

  // Handle hide/unhide toggle ("Nicht weiterschauen")
  const { toggleHideSeries } = useSeriesList();
  const handleHideToggle = useCallback(async () => {
    if (!series || !user) return;
    const newHiddenStatus = !series.hidden;
    try {
      await toggleHideSeries(series.nmr, newHiddenStatus);
      setSnackbar({
        open: true,
        message: newHiddenStatus ? 'Nicht weiterschauen' : 'Serie wieder aktiv',
      });
      setTimeout(() => setSnackbar({ open: false, message: '' }), 3000);
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Ändern des Status.', type: 'error' });
    }
  }, [series, user, toggleHideSeries]);

  // Handle episode rewatch
  const handleEpisodeRewatch = async (episode: SeriesEpisode) => {
    if (!series || !user) return;

    try {
      // Find the season and episode indices
      const seasonIndex = series.seasons?.findIndex((s: SeriesSeason) =>
        s.episodes?.some((e: SeriesEpisode) => e.id === episode.id)
      );
      const episodeIndex = series.seasons?.[seasonIndex]?.episodes?.findIndex(
        (e: SeriesEpisode) => e.id === episode.id
      );

      if (seasonIndex === -1 || episodeIndex === -1) {
        throw new Error('Episode not found');
      }

      const episodePath = `${user.uid}/serien/${series.nmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
      const newWatchCount = (episode.watchCount || 1) + 1;

      await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
      await firebase.database().ref(`${episodePath}/lastWatchedAt`).set(new Date().toISOString());

      // Wrapped 2026: Rewatch loggen
      const seasonNumber = (series.seasons?.[seasonIndex]?.seasonNumber || 0) + 1;
      WatchActivityService.logEpisodeWatch(
        user.uid,
        series.id,
        series.title || series.name || 'Unbekannte Serie',
        seasonNumber,
        episodeIndex + 1,
        episode.runtime || series.episodeRuntime || 45,
        true, // isRewatch
        series.genre?.genres,
        series.provider?.provider?.map((p) => p.name)
      );

      setShowRewatchDialog({ show: false, type: 'episode', item: null });
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Rewatch der Episode.', type: 'error' });
    }
  };

  // Handle episode unwatch
  const handleEpisodeUnwatch = async (episode: SeriesEpisode) => {
    if (!series || !user) return;

    try {
      // Find the season and episode indices
      const seasonIndex = series.seasons?.findIndex((s: SeriesSeason) =>
        s.episodes?.some((e: SeriesEpisode) => e.id === episode.id)
      );
      const episodeIndex = series.seasons?.[seasonIndex]?.episodes?.findIndex(
        (e: SeriesEpisode) => e.id === episode.id
      );

      if (seasonIndex === -1 || episodeIndex === -1) {
        throw new Error('Episode not found');
      }

      const episodePath = `${user.uid}/serien/${series.nmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;

      if (episode.watchCount && episode.watchCount > 1) {
        // Reduce watch count
        const newWatchCount = episode.watchCount - 1;
        await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
      } else {
        // Mark as unwatched completely
        await firebase.database().ref(`${episodePath}/watched`).remove();
        await firebase.database().ref(`${episodePath}/watchCount`).remove();
        await firebase.database().ref(`${episodePath}/firstWatchedAt`).remove();
        await firebase.database().ref(`${episodePath}/lastWatchedAt`).remove();
      }

      setShowRewatchDialog({ show: false, type: 'episode', item: null });
    } catch (error) {
      setDialog({ open: true, message: 'Fehler beim Markieren als nicht gesehen.', type: 'error' });
    }
  };

  if (!series && !loading) {
    const apiKey = import.meta.env.VITE_API_TMDB;
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
          textAlign: 'center',
        }}
      >
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Serie nicht gefunden</h2>
        {!apiKey && (
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px' }}>
            Diese Serie ist nicht in deiner Liste. Um Serien von Freunden anzuzeigen, wird ein TMDB
            API-Schlüssel benötigt.
          </p>
        )}
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Zurück
        </button>
      </div>
    );
  }

  if (loading || !series) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <p>Lade...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section with Backdrop */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: isMobile ? '280px' : '420px',
          overflow: 'hidden',
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.9))',
        }}
      >
        {tmdbBackdrop && (
          <img
            src={getBackdropUrl(tmdbBackdrop)}
            alt={series.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center top',
              opacity: 0.5,
            }}
          />
        )}

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '150px',
            background: 'linear-gradient(to top, #000 0%, transparent 100%)',
          }}
        />

        {/* Back Button */}
        <div
          style={{
            position: 'absolute',
            top: isMobile
              ? 'calc(10px + env(safe-area-inset-top))'
              : 'calc(20px + env(safe-area-inset-top))',
            left: isMobile ? '10px' : '20px',
            zIndex: 10,
          }}
        >
          <BackButton style={{ backdropFilter: 'blur(10px)' }} />
        </div>

        {/* Add button for TMDB-only series */}
        {isReadOnlyTmdbSeries && (
          <Tooltip title="Zur Sammlung hinzufügen" arrow>
            <button
              onClick={handleAddSeries}
              disabled={isAdding}
              style={{
                position: 'absolute',
                top: isMobile
                  ? 'calc(10px + env(safe-area-inset-top))'
                  : 'calc(20px + env(safe-area-inset-top))',
                right: isMobile ? '10px' : '20px',
                zIndex: 10,
                background: isAdding
                  ? `${currentTheme.status.success}88`
                  : `${currentTheme.status.success}CC`,
                backdropFilter: 'blur(10px)',
                border: 'none',
                color: 'white',
                fontSize: '24px',
                cursor: isAdding ? 'not-allowed' : 'pointer',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
              }}
            >
              {isAdding ? '...' : '+'}
            </button>
          </Tooltip>
        )}

        {/* Series Info Overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: isMobile ? '16px' : '20px',
            right: isMobile ? '16px' : '20px',
            maxWidth: '100%',
          }}
        >
          <h1
            style={{
              fontSize: isMobile ? '20px' : '28px',
              fontWeight: 'bold',
              margin: '0 0 6px 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
              wordBreak: 'break-word',
              lineHeight: 1.2,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {series.title}
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '6px' : '12px',
              fontSize: isMobile ? '12px' : '14px',
              opacity: 0.9,
              marginBottom: isMobile ? '10px' : '12px',
              flexWrap: 'wrap',
            }}
          >
            {(tmdbFirstAirDate || series.first_air_date || series.release_date) && (
              <span>{new Date(tmdbFirstAirDate || series.first_air_date || series.release_date).getFullYear()}</span>
            )}
            {series.seasons && <span>• {series.seasons.length} Staffeln</span>}
            {series.status && (
              <span>
                •{' '}
                {series.status === 'Returning Series' || series.status === 'ongoing'
                  ? 'Wird fortgesetzt'
                  : series.status === 'Ended' || series.status === 'Canceled'
                    ? 'Beendet'
                    : series.status}
              </span>
            )}
            {parseFloat(overallRating) > 0 && (
              <span style={{ color: '#ffd700' }}>• ⭐ {overallRating}</span>
            )}
            {/* Friends Who Have This */}
            {series && (
              <>
                <span style={{ opacity: 0.5 }}>•</span>
                <FriendsWhoHaveThis itemId={series.id} mediaType="series" />
              </>
            )}
          </div>

          {/* Status Badge & Genres */}
          <div
            style={{
              display: 'flex',
              gap: isMobile ? '6px' : '8px',
              marginBottom: isMobile ? '8px' : '12px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {/* Status Badge */}
            {(() => {
              const isOngoing =
                series.status === 'Returning Series' ||
                series.status === 'ongoing' ||
                (!series.status && series.production?.production === true);
              const isEnded =
                series.status === 'Ended' ||
                series.status === 'Canceled' ||
                (!series.status && series.production?.production === false);

              if (isOngoing) {
                return (
                  <span
                    style={{
                      background: 'rgba(76, 175, 80, 0.2)',
                      border: '1px solid rgba(76, 175, 80, 0.4)',
                      borderRadius: isMobile ? '8px' : '12px',
                      padding: isMobile ? '3px 8px' : '4px 10px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '500',
                      color: '#4CAF50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#4CAF50',
                      }}
                    />
                    Fortlaufend
                  </span>
                );
              } else if (isEnded) {
                return (
                  <span
                    style={{
                      background: 'rgba(158, 158, 158, 0.2)',
                      border: '1px solid rgba(158, 158, 158, 0.4)',
                      borderRadius: isMobile ? '8px' : '12px',
                      padding: isMobile ? '3px 8px' : '4px 10px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '500',
                      color: '#9E9E9E',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#9E9E9E',
                      }}
                    />
                    Beendet
                  </span>
                );
              }
              return null;
            })()}

            {/* Genres */}
            {((series.genre?.genres && series.genre.genres.length > 0) ||
              (tmdbSeries?.genre?.genres && tmdbSeries.genre.genres.length > 0)) && (
              <>
                {(series.genre?.genres || tmdbSeries?.genre?.genres || [])
                  .filter((genre) => genre && genre.trim() !== '' && genre !== 'All')
                  .slice(0, isMobile ? 3 : 4)
                  .map((genre, index) => (
                    <span
                      key={index}
                      style={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: isMobile ? '8px' : '12px',
                        padding: isMobile ? '3px 8px' : '4px 10px',
                        fontSize: isMobile ? '10px' : '12px',
                        fontWeight: '500',
                        color: 'white',
                      }}
                    >
                      {genre}
                    </span>
                  ))}
                {(series.genre?.genres || tmdbSeries?.genre?.genres || []).filter(
                  (genre) => genre && genre.trim() !== '' && genre !== 'All'
                ).length > (isMobile ? 3 : 4) && (
                  <span
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      borderRadius: isMobile ? '8px' : '12px',
                      padding: isMobile ? '3px 8px' : '4px 10px',
                      fontSize: isMobile ? '10px' : '12px',
                      fontWeight: '500',
                      color: 'white',
                      opacity: 0.7,
                    }}
                  >
                    +
                    {(series.genre?.genres || tmdbSeries?.genre?.genres || []).filter(
                      (genre) => genre && genre.trim() !== '' && genre !== 'All'
                    ).length - (isMobile ? 3 : 4)}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Progress Bar */}
          {progressStats.total > 0 && (
            <div style={{ marginBottom: isMobile ? '8px' : '12px' }}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '4px',
                  height: '6px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    background: '#00d4aa',
                    height: '100%',
                    width: `${progressStats.percentage}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: isMobile ? '11px' : '12px',
                  margin: '4px 0 0 0',
                  opacity: 0.7,
                }}
              >
                {progressStats.watched} von {progressStats.total} Episoden (
                {progressStats.percentage}%)
              </p>
              {paceInfo && (
                <p
                  style={{
                    fontSize: isMobile ? '10px' : '11px',
                    margin: '2px 0 0 0',
                    opacity: 0.5,
                  }}
                >
                  {paceInfo.text}
                </p>
              )}
            </div>
          )}

          {/* Ratings from TMDB and IMDB */}
          {!isMobile && (
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '12px',
                flexWrap: 'wrap',
              }}
            >
              {/* TMDB Rating - Always show */}
              <a
                href={`https://www.themoviedb.org/tv/${id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'rgba(0, 188, 212, 0.15)',
                  border: '1px solid rgba(0, 188, 212, 0.3)',
                  borderRadius: '16px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: 'white',
                }}
              >
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: '11px',
                    background: '#01b4e4',
                    color: '#0d253f',
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                >
                  TMDB
                </span>
                <span style={{ fontWeight: 600 }}>
                  {(
                    tmdbRating?.vote_average ||
                    series?.vote_average ||
                    localSeries?.vote_average ||
                    0
                  ).toFixed(1)}
                  /10
                </span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                  (
                  {(
                    (tmdbRating?.vote_count || series?.vote_count || localSeries?.vote_count || 0) /
                    1000
                  ).toFixed(1)}
                  k)
                </span>
              </a>

              {/* IMDB Rating - Always show */}
              <a
                href={`https://www.imdb.com/title/${series?.imdb?.imdb_id || localSeries?.imdb?.imdb_id || ''}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  background: 'rgba(245, 197, 24, 0.15)',
                  border: '1px solid rgba(245, 197, 24, 0.3)',
                  borderRadius: '16px',
                  fontSize: '13px',
                  textDecoration: 'none',
                  color: 'white',
                  opacity: series?.imdb?.imdb_id || localSeries?.imdb?.imdb_id ? 1 : 0.5,
                  pointerEvents:
                    series?.imdb?.imdb_id || localSeries?.imdb?.imdb_id ? 'auto' : 'none',
                }}
              >
                <span
                  style={{
                    fontWeight: 900,
                    fontSize: '11px',
                    background: '#F5C518',
                    color: '#000',
                    padding: '2px 4px',
                    borderRadius: '4px',
                  }}
                >
                  IMDb
                </span>
                <span style={{ fontWeight: 600 }}>
                  {imdbRating?.rating?.toFixed(1) || '0.0'}/10
                </span>
                <span style={{ fontSize: '11px', opacity: 0.7 }}>
                  (
                  {imdbRating
                    ? (parseInt(imdbRating.votes.replace(/,/g, '')) / 1000).toFixed(1)
                    : '0.0'}
                  k)
                </span>
              </a>
            </div>
          )}

          {/* Provider Badges unter dem Fortschrittsbalken */}
          {((series.provider?.provider && series.provider.provider.length > 0) || providers) && (
            <div>
              <ProviderBadges
                providers={
                  series.provider?.provider && series.provider.provider.length > 0
                    ? series.provider.provider
                    : providers ?? undefined
                }
                size={isMobile ? 'medium' : 'large'}
                maxDisplay={isMobile ? 4 : 6}
                showNames={false}
                searchTitle={series.title || series.name}
                tmdbId={series.tmdb_id || series.id}
                mediaType="tv"
              />
            </div>
          )}

          {/* Video Gallery Button - Desktop */}
          {!isMobile && (
            <VideoGallery
              tmdbId={series.tmdb_id || series.id}
              mediaType="tv"
              buttonStyle="desktop"
            />
          )}
        </div>
      </div>

      {/* Mobile Video Gallery Button */}
      {isMobile && (
        <div style={{ padding: '8px 12px 0' }}>
          <VideoGallery tmdbId={series.tmdb_id || series.id} mediaType="tv" buttonStyle="mobile" />
        </div>
      )}

      {/* Action Buttons - only for user's series */}
      {!isReadOnlyTmdbSeries && (
        <div
          style={{
            display: 'flex',
            gap: isMobile ? '8px' : '12px',
            padding: isMobile ? '10px 12px' : '20px',
            justifyContent: 'center',
          }}
        >
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/episodes/${series.id}`)}
            style={{
              flex: 1,
              padding: isMobile ? '10px' : '12px',
              background:
                'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
              border: '1px solid rgba(0, 212, 170, 0.5)',
              color: 'white',
              borderRadius: isMobile ? '10px' : '12px',
              fontSize: isMobile ? '13px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '5px' : '8px',
            }}
          >
            <PlayCircle style={{ fontSize: isMobile ? '18px' : '24px' }} />
            Episoden
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(`/rating/series/${series.id}`)}
            style={{
              flex: 1,
              padding: isMobile ? '10px' : '12px',
              background:
                parseFloat(overallRating) > 0
                  ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
              border:
                parseFloat(overallRating) > 0
                  ? '1px solid rgba(255, 215, 0, 0.3)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderRadius: isMobile ? '10px' : '12px',
              fontSize: isMobile ? '13px' : '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '5px' : '8px',
              position: 'relative',
            }}
          >
            <Star
              style={{
                fontSize: isMobile ? '16px' : '18px',
                color: parseFloat(overallRating) > 0 ? '#ffd700' : 'white',
              }}
            />
            Bewerten
          </motion.button>

          <Tooltip title={series.watchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist'} arrow>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleWatchlistToggle}
              style={{
                padding: isMobile ? '10px' : '12px',
                background: series.watchlist
                  ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 180, 216, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: series.watchlist
                  ? '1px solid rgba(0, 212, 170, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: isMobile ? '10px' : '12px',
                fontSize: isMobile ? '13px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {series.watchlist ? (
                <BookmarkRemove style={{ fontSize: isMobile ? '18px' : '24px' }} />
              ) : (
                <BookmarkAdd style={{ fontSize: isMobile ? '18px' : '24px' }} />
              )}
            </motion.button>
          </Tooltip>

          <Tooltip title={series.hidden ? 'Serie einblenden' : 'Serie ausblenden'} arrow>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleHideToggle}
              style={{
                padding: isMobile ? '10px' : '12px',
                background: series.hidden
                  ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 183, 77, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: series.hidden
                  ? '1px solid rgba(255, 152, 0, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                color: 'white',
                borderRadius: isMobile ? '10px' : '12px',
                fontSize: isMobile ? '13px' : '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {series.hidden ? (
                <Visibility style={{ fontSize: isMobile ? '18px' : '24px' }} />
              ) : (
                <VisibilityOff style={{ fontSize: isMobile ? '18px' : '24px' }} />
              )}
            </motion.button>
          </Tooltip>
        </div>
      )}

      {/* Hidden series banner */}
      {series.hidden && !isReadOnlyTmdbSeries && (
        <div
          style={{
            margin: isMobile ? '0 12px 12px' : '0 20px 20px',
            padding: '10px 16px',
            background: 'rgba(255, 152, 0, 0.15)',
            border: '1px solid rgba(255, 152, 0, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: '#ffb74d',
          }}
        >
          <VisibilityOff style={{ fontSize: '16px' }} />
          Du schaust diese Serie nicht mehr
        </div>
      )}

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: isMobile ? '6px' : '8px',
          padding: isMobile ? '0 12px 12px 12px' : '0 20px 20px 20px',
        }}
      >
        <button
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: isMobile ? '8px' : '10px',
            background:
              activeTab === 'info'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: isMobile ? '10px' : '12px',
            color: 'white',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: activeTab === 'info' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '4px' : '6px',
          }}
        >
          <List style={{ fontSize: isMobile ? '16px' : '18px' }} />
          Info & Episoden
        </button>

        <button
          onClick={() => setActiveTab('cast')}
          style={{
            flex: 1,
            padding: isMobile ? '8px' : '10px',
            background:
              activeTab === 'cast'
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: isMobile ? '10px' : '12px',
            color: 'white',
            fontSize: isMobile ? '12px' : '14px',
            fontWeight: activeTab === 'cast' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: isMobile ? '4px' : '6px',
          }}
        >
          <People style={{ fontSize: isMobile ? '16px' : '18px' }} />
          Besetzung
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'cast' ? (
        <CastCrew tmdbId={series.tmdb_id || series.id} mediaType="tv" seriesData={series} />
      ) : (
        <>
          {/* Series Description */}
          {(series.beschreibung || series.overview || tmdbOverview) && (
            <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 20px' }}>
              <h3
                style={{
                  fontSize: isMobile ? '14px' : '18px',
                  fontWeight: '600',
                  margin: isMobile ? '0 0 8px 0' : '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '6px' : '8px',
                }}
              >
                <Info style={{ fontSize: isMobile ? '16px' : '20px' }} />
                Beschreibung
              </h3>
              <p
                style={{
                  fontSize: isMobile ? '12px' : '14px',
                  lineHeight: isMobile ? '1.4' : '1.5',
                  opacity: 0.8,
                  margin: 0,
                }}
              >
                {series.beschreibung || series.overview || tmdbOverview}
              </p>
            </div>
          )}

          {/* Seasons Overview - Compact Design */}
          {series.seasons &&
            series.seasons.length > 0 &&
            (() => {
              const selectedSeason = series.seasons[selectedSeasonIndex];
              const watchedEpisodes =
                selectedSeason?.episodes?.filter((ep) => ep.watched).length || 0;
              const totalEpisodes = selectedSeason?.episodes?.length || 0;
              const seasonProgress =
                totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;

              return (
                <div style={{ padding: '0 20px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '12px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <List fontSize="small" />
                      Staffeln
                    </h3>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate(`/episodes/${series.id}`)}
                      style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '8px',
                        color: 'white',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                      }}
                    >
                      Alle verwalten
                    </motion.button>
                  </div>

                  {/* Horizontal Season Tabs */}
                  <div
                    style={{
                      display: 'flex',
                      gap: '8px',
                      overflowX: 'auto',
                      paddingBottom: '8px',
                      marginBottom: '12px',
                      scrollbarWidth: 'none',
                      msOverflowStyle: 'none',
                    }}
                  >
                    {series.seasons.map((season, index) => {
                      const sWatched = season.episodes?.filter((ep) => ep.watched).length || 0;
                      const sTotal = season.episodes?.length || 0;
                      const sProgress = sTotal > 0 ? Math.round((sWatched / sTotal) * 100) : 0;
                      const isSelected = index === selectedSeasonIndex;

                      return (
                        <motion.button
                          key={index}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedSeasonIndex(index)}
                          style={{
                            flexShrink: 0,
                            padding: '8px 14px',
                            borderRadius: '10px',
                            border: isSelected
                              ? '2px solid #00d4aa'
                              : sProgress === 100
                                ? '2px solid rgba(0, 212, 170, 0.4)'
                                : '2px solid rgba(255, 255, 255, 0.15)',
                            background: isSelected
                              ? 'rgba(0, 212, 170, 0.2)'
                              : sProgress === 100
                                ? 'rgba(0, 212, 170, 0.1)'
                                : 'rgba(255, 255, 255, 0.05)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            minWidth: '52px',
                          }}
                        >
                          <span style={{ fontSize: '14px', fontWeight: '700' }}>
                            {season.seasonNumber + 1}
                          </span>
                          <span style={{ fontSize: '10px', opacity: 0.7 }}>
                            {sProgress === 100 ? (
                              <Check style={{ fontSize: '12px', color: '#00d4aa' }} />
                            ) : (
                              `${sProgress}%`
                            )}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Selected Season Content */}
                  <div
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '16px',
                    }}
                  >
                    {/* Season Info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600' }}>
                          Staffel {selectedSeason.seasonNumber + 1}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {watchedEpisodes}/{totalEpisodes} Episoden
                        </div>
                      </div>
                      <div
                        style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background:
                            seasonProgress === 100
                              ? 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)'
                              : 'rgba(255, 255, 255, 0.1)',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        {seasonProgress}%
                      </div>
                    </div>

                    {/* Episode Grid */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(32px, 1fr))',
                        gap: '6px',
                      }}
                    >
                      {selectedSeason.episodes?.map((episode, episodeIndex) => {
                        const discussionCount = episodeDiscussionCounts[episodeIndex + 1] || 0;
                        return (
                          <motion.div
                            key={episode.id}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() =>
                              navigate(
                                `/episode/${series.id}/s/${selectedSeason.seasonNumber + 1}/e/${episodeIndex + 1}`
                              )
                            }
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '6px',
                              background: episode.watched
                                ? 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)'
                                : 'rgba(255, 255, 255, 0.1)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '600',
                              color: 'white',
                              cursor: 'pointer',
                              position: 'relative',
                              border: episode.watched
                                ? 'none'
                                : '1px solid rgba(255, 255, 255, 0.2)',
                            }}
                          >
                            {episodeIndex + 1}
                            {(episode.watchCount || 0) > 1 && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '-3px',
                                  right: '-3px',
                                  background: '#ff6b6b',
                                  borderRadius: '50%',
                                  width: '14px',
                                  height: '14px',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                }}
                              >
                                {episode.watchCount}
                              </span>
                            )}
                            {discussionCount > 0 && (episode.watchCount || 0) <= 1 && (
                              <span
                                style={{
                                  position: 'absolute',
                                  top: '-3px',
                                  right: '-3px',
                                  background: currentTheme.primary,
                                  borderRadius: '50%',
                                  width: '14px',
                                  height: '14px',
                                  fontSize: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: '700',
                                }}
                              >
                                {discussionCount}
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
        </>
      )}

      {/* Delete Button - only for user's series */}
      {!isReadOnlyTmdbSeries && (
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={handleDeleteSeries}
            disabled={isDeleting}
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              color: '#ff6b6b',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            <Delete />
            {isDeleting ? 'Wird gelöscht...' : 'Serie löschen'}
          </motion.button>
        </div>
      )}

      {/* Add Button - only for TMDB series not in user's list */}
      {isReadOnlyTmdbSeries && (
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={handleAddSeries}
            disabled={isAdding}
            whileHover={{ scale: isAdding ? 1 : 1.02 }}
            whileTap={{ scale: isAdding ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '16px',
              background:
                'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
              border: '1px solid rgba(0, 212, 170, 0.5)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isAdding ? 0.6 : 1,
            }}
          >
            {isAdding ? 'Wird hinzugefügt...' : 'Serie hinzufügen'}
          </motion.button>
        </div>
      )}

      {/* Rewatch Dialog */}
      {showRewatchDialog.show && showRewatchDialog.item && (
        <RewatchDialog
          item={showRewatchDialog.item}
          onRewatch={handleEpisodeRewatch}
          onUnwatch={handleEpisodeUnwatch}
          onClose={() =>
            setShowRewatchDialog({
              show: false,
              type: 'episode',
              item: null,
            })
          }
        />
      )}

      {/* Discussions Section */}
      {series && (
        <div style={{ padding: '0 20px 20px 20px' }}>
          <DiscussionThread
            itemId={series.id}
            itemType="series"
            feedMetadata={{
              itemTitle: series.title || series.name || 'Unbekannte Serie',
              posterPath: series.poster && typeof series.poster === 'object' ? series.poster.poster : undefined,
            }}
          />
        </div>
      )}

      {/* Dialog */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        title={
          dialog.type === 'warning'
            ? 'Bestätigung'
            : dialog.type === 'error'
              ? 'Fehler'
              : 'Information'
        }
        message={dialog.message}
        type={dialog.type}
        actions={
          dialog.onConfirm
            ? [
                {
                  label: 'Abbrechen',
                  onClick: () => setDialog({ ...dialog, open: false }),
                  variant: 'secondary',
                },
                {
                  label: 'Bestätigen',
                  onClick: dialog.onConfirm,
                  variant: 'primary',
                },
              ]
            : []
        }
      />

      {/* Success Snackbar */}
      {snackbar.open && (
        <div
          style={{
            position: 'fixed',
            bottom: 'calc(20px + env(safe-area-inset-bottom))',
            left: '20px',
            right: '20px',
            background: currentTheme.status.success,
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            zIndex: 1000,
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
          }}
        >
          <Check style={{ fontSize: '20px' }} />
          <span>{snackbar.message}</span>
        </div>
      )}
    </div>
  );
});

SeriesDetailPage.displayName = 'SeriesDetailPage';
