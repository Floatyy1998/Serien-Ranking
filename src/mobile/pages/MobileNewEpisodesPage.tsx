import {
  CalendarToday,
  Check,
  CheckCircle,
  ExpandLess,
  ExpandMore,
  NewReleases,
  PlayCircle,
  Search,
  Timer,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { MobileBackButton } from '../components/MobileBackButton';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../components/auth/AuthProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';
import apiService from '../../services/api.service';

interface UpcomingEpisode {
  seriesId: number;
  seriesName: string;
  seriesPoster: string;
  seriesNmr: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeName: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate: Date;
  daysUntil: number;
  watched: boolean;
  watchCount?: number;
}

export const MobileNewEpisodesPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList, updateEpisode } = useSeriesList();
  const { currentTheme } = useTheme();
  const [showAllSeries, setShowAllSeries] = useState<boolean>(true);
  const [markedWatched, setMarkedWatched] = useState<Set<string>>(new Set());
  const [expandedSeries, setExpandedSeries] = useState<Set<string>>(new Set());
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(
    new Set()
  );
  const [dragOffsets, setDragOffsets] = useState<{ [key: string]: number }>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(
    new Set()
  );
  const [hiddenEpisodes, setHiddenEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<
    Record<string, 'left' | 'right'>
  >({});
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Get all upcoming episodes - check ALL series, not just watchlist
  const upcomingEpisodes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const episodes: UpcomingEpisode[] = [];


    seriesList.forEach((series) => {
      // Filter by watchlist unless showAllSeries is true
      if (!showAllSeries && !series.watchlist) return;
      
      // Filter by search query
      if (searchQuery && !series.title?.toLowerCase().includes(searchQuery.toLowerCase())) return;
      
      // Only check episodes in seasons, not API data (to avoid duplicates)
      if (!series.seasons) return;

      // Check all episodes for upcoming dates
      series.seasons.forEach((season, seasonIndex) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode, episodeIndex) => {
          // Try multiple date fields
          const airDate = episode.air_date;
          if (!airDate) {
            // Debug: Log episodes without air dates
            if (episodeIndex === 0 && seasonIndex === 0) {
            }
            return;
          }

          const episodeDate = new Date(airDate);
          if (isNaN(episodeDate.getTime())) return; // Invalid date

          episodeDate.setHours(0, 0, 0, 0);

          // Show all upcoming episodes (not just unwatched)
          if (episodeDate >= today) {
            const daysUntil = Math.floor(
              (episodeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Show ALL future episodes, no time limit
            episodes.push({
              seriesId: series.id,
              seriesName: series.title || '',
              seriesPoster:
                typeof series.poster === 'string'
                  ? series.poster
                  : (series.poster as any)?.poster || '',
              seriesNmr: series.nmr,
              seasonIndex,
              episodeIndex,
              episodeName: episode.name || `Episode ${episode.episode_number || episodeIndex + 1}`,
              episodeNumber: episode.episode_number || episodeIndex + 1,
              seasonNumber: season.seasonNumber ?? seasonIndex + 1,
              airDate: episodeDate,
              daysUntil,
              watched: !!episode.watched,
            });
          }
        });
      });
    });

    // Sort by air date
    episodes.sort((a, b) => a.airDate.getTime() - b.airDate.getTime());

    return episodes;
  }, [seriesList, searchQuery, showAllSeries]);

  // Group episodes by date and then by series
  const groupedEpisodes = useMemo(() => {
    const groups: { [key: string]: { [seriesId: number]: UpcomingEpisode[] } } =
      {};

    upcomingEpisodes.forEach((episode) => {
      const dateKey = episode.airDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      if (!groups[dateKey]) {
        groups[dateKey] = {};
      }

      if (!groups[dateKey][episode.seriesId]) {
        groups[dateKey][episode.seriesId] = [];
      }

      groups[dateKey][episode.seriesId].push(episode);
    });

    return groups;
  }, [upcomingEpisodes]);

  // Mark episode as watched
  const handleMarkWatched = async (episode: UpcomingEpisode) => {
    if (!user) return;

    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    try {
      const series = seriesList.find(s => s.nmr === episode.seriesNmr);
      if (series) {
        await updateEpisode(series.id.toString(), {
          seasonNumber: episode.seasonNumber,
          episodeNumber: episode.episodeNumber,
          watched: true
        });
      }

      setMarkedWatched((prev) => new Set([...prev, key]));
    } catch (error) {
    }
  };

  // Check if episode has aired
  const hasEpisodeAired = (episode: UpcomingEpisode) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return episode.airDate <= today;
  };

  // Handle episode swipe to complete
  const handleEpisodeComplete = async (
    episode: UpcomingEpisode,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    // Don't allow marking future episodes as watched
    if (!hasEpisodeAired(episode)) return;
    
    const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched via API
    if (user) {
      try {
        const series = seriesList.find(s => s.nmr === episode.seriesNmr);
        if (series) {
          const currentCount = episode.watchCount || 0;
          await updateEpisode(series.id.toString(), {
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episodeNumber,
            watched: true,
            watchCount: currentCount + 1,
            firstWatchedAt: currentCount === 0 ? new Date().toISOString() : undefined
          });
        }
      } catch (error) {
        console.error('Failed to mark episode as watched:', error);
        }
    }

    // After animation, hide the episode
    setTimeout(() => {
      setHiddenEpisodes((prev) => new Set(prev).add(episodeKey));
      setCompletingEpisodes((prev) => {
        const newSet = new Set(prev);
        newSet.delete(episodeKey);
        return newSet;
      });
    }, 300);
  };

  const isEpisodeWatched = (episode: UpcomingEpisode) => {
    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
    return episode.watched || markedWatched.has(key);
  };

  const toggleSeriesExpanded = (date: string, seriesId: number) => {
    const key = `${date}-${seriesId}`;
    setExpandedSeries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isSeriesExpanded = (date: string, seriesId: number) => {
    return expandedSeries.has(`${date}-${seriesId}`);
  };

  return (
    <div>
      {/* Header */}
      <header
        style={{
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          padding: '20px',
          paddingTop: 'calc(30px + env(safe-area-inset-top))',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '16px',
          }}
        >
          <MobileBackButton />

          <div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 800,
                margin: 0,
                background: currentTheme.primary,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Episoden Kalender
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              {upcomingEpisodes.length} kommende Episoden
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div
          style={{
            marginBottom: '16px',
            position: 'relative',
          }}
        >
          <Search
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '20px',
              color: currentTheme.text.secondary,
            }}
          />
          <input
            type="text"
            placeholder="Nach Serie suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px 10px 40px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: `1px solid ${currentTheme.primary}33`,
              borderRadius: '12px',
              color: currentTheme.text.primary,
              fontSize: '14px',
              outline: 'none',
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: currentTheme.text.secondary,
                cursor: 'pointer',
                padding: '4px',
                fontSize: '14px',
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* Stats */}
        <HorizontalScrollContainer
          gap={12}
          style={{
            paddingBottom: '8px',
          }}
        >
          <div
            onClick={() => setShowAllSeries(!showAllSeries)}
            style={{
              background: showAllSeries 
                ? `${currentTheme.primary}1A`
                : `${currentTheme.status.success}1A`,
              border: showAllSeries
                ? `1px solid ${currentTheme.primary}4D`
                : `1px solid ${currentTheme.status.success}4D`,
              borderRadius: '12px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {showAllSeries ? (
              <><Visibility style={{ fontSize: '16px' }} /> Alle Serien</>
            ) : (
              <><VisibilityOff style={{ fontSize: '16px' }} /> Nur Watchlist</>
            )}
          </div>
          <div
            style={{
              background: `${currentTheme.primary}1A`,
              border: `1px solid ${currentTheme.primary}4D`,
              borderRadius: '12px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            <CalendarToday style={{ fontSize: '16px' }} />
            Heute:{' '}
            {Object.values(
              groupedEpisodes[Object.keys(groupedEpisodes)[0]] || {}
            ).flat().length || 0}
          </div>

          <div
            style={{
              background: `${currentTheme.status.warning}1A`,
              border: `1px solid ${currentTheme.status.warning}4D`,
              borderRadius: '12px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              whiteSpace: 'nowrap',
            }}
          >
            <Timer style={{ fontSize: '16px' }} />
            Nächste 7 Tage:{' '}
            {upcomingEpisodes.filter((e) => e.daysUntil <= 7).length}
          </div>
        </HorizontalScrollContainer>
      </header>

      {/* Episodes List */}
      <div style={{ padding: '20px' }}>
        {Object.keys(groupedEpisodes).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <NewReleases
              style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}
            />
            <h3>Keine kommenden Episoden</h3>
            <p>Es gibt aktuell keine neuen Episoden {showAllSeries ? '' : 'in deiner Watchlist'}</p>
          </div>
        ) : (
          Object.entries(groupedEpisodes).map(([date, seriesGroups]) => (
            <div key={date} style={{ marginBottom: '28px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '12px',
                  padding: '8px 12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <CalendarToday style={{ fontSize: '18px', color: currentTheme.primary }} />
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    margin: 0,
                    color: 'rgba(255, 255, 255, 0.9)',
                  }}
                >
                  {date}
                </h3>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontSize: '13px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                  }}
                >
                  {Object.values(seriesGroups).flat().length} Episode{Object.values(seriesGroups).flat().length !== 1 ? 'n' : ''}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <AnimatePresence mode='popLayout'>
                  {Object.entries(seriesGroups).map(([seriesId, episodes]) => {
                    const firstEpisode = episodes[0];
                    const isExpanded = isSeriesExpanded(date, Number(seriesId));
                    const allWatched = episodes.every((ep) =>
                      isEpisodeWatched(ep)
                    );

                    // If only one episode, show it directly without accordion
                    if (episodes.length === 1) {
                      const episode = episodes[0];
                      const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                      const watched = isEpisodeWatched(episode);
                      const isCompleting = completingEpisodes.has(episodeKey);
                      const isSwiping = swipingEpisodes.has(episodeKey);
                      const isHidden = hiddenEpisodes.has(episodeKey);
                      const hasAired = hasEpisodeAired(episode);

                      if (isHidden) return null;

                      return (
                        <motion.div
                          key={episodeKey}
                          data-block-swipe
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{
                            opacity: isCompleting ? 0.5 : 1,
                            y: 0,
                            scale: isCompleting ? 0.95 : 1,
                          }}
                          exit={{
                            opacity: 0,
                            x:
                              swipeDirections[episodeKey] === 'left'
                                ? -300
                                : 300,
                            transition: { duration: 0.3 },
                          }}
                          style={{
                            position: 'relative',
                          }}
                        >
                          {/* Swipe overlay for episode - only enabled for aired episodes */}
                          <motion.div
                            drag={hasAired && !watched ? 'x' : false}
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            dragSnapToOrigin={true}
                            onDragStart={() => {
                              if (hasAired && !watched) {
                                setSwipingEpisodes((prev) =>
                                  new Set(prev).add(episodeKey)
                                );
                              }
                            }}
                            onDrag={(_event, info: PanInfo) => {
                              if (hasAired && !watched) {
                                setDragOffsets((prev) => ({
                                  ...prev,
                                  [episodeKey]: info.offset.x,
                                }));
                              }
                            }}
                            onDragEnd={(event, info: PanInfo) => {
                              event.stopPropagation();
                              setSwipingEpisodes((prev) => {
                                const newSet = new Set(prev);
                                newSet.delete(episodeKey);
                                return newSet;
                              });
                              setDragOffsets((prev) => {
                                const newOffsets = { ...prev };
                                delete newOffsets[episodeKey];
                                return newOffsets;
                              });

                              if (
                                hasAired &&
                                Math.abs(info.offset.x) > 100 &&
                                Math.abs(info.velocity.x) > 50 &&
                                !watched
                              ) {
                                const direction =
                                  info.offset.x > 0 ? 'right' : 'left';
                                handleEpisodeComplete(episode, direction);
                              }
                            }}
                            whileDrag={{ scale: 1.02 }}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: '72px', // Start after the poster
                              right: 0,
                              bottom: 0,
                              zIndex: 1,
                            }}
                          />

                          <div
                            style={{
                              display: 'flex',
                              gap: '10px',
                              padding: '10px',
                              background: !hasAired
                                ? 'rgba(255, 255, 255, 0.02)'
                                : isCompleting
                                ? 'linear-gradient(90deg, rgba(76, 209, 55, 0.2), rgba(255, 215, 0, 0.05))'
                                : watched
                                ? 'rgba(76, 209, 55, 0.1)'
                                : `rgba(76, 209, 55, ${Math.min(
                                    (Math.abs(dragOffsets[episodeKey] || 0) /
                                      100) *
                                      0.15,
                                    0.15
                                  )})`,
                              borderRadius: '12px',
                              border: `1px solid ${
                                !hasAired
                                  ? 'rgba(255, 255, 255, 0.1)'
                                  : isCompleting
                                  ? 'rgba(76, 209, 55, 0.5)'
                                  : watched
                                  ? 'rgba(76, 209, 55, 0.3)'
                                  : `rgba(76, 209, 55, ${
                                      0.05 +
                                      Math.min(
                                        (Math.abs(
                                          dragOffsets[episodeKey] || 0
                                        ) /
                                          100) *
                                          0.25,
                                        0.25
                                      )
                                    })`
                              }`,
                              transition: 'all 0.3s ease',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Swipe Indicator Background */}
                            <motion.div
                              style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background:
                                  'linear-gradient(90deg, transparent, rgba(76, 209, 55, 0.3))',
                                opacity: 0,
                              }}
                              animate={{
                                opacity: isSwiping ? 1 : 0,
                              }}
                            />
                            <img
                              src={getImageUrl(episode.seriesPoster)}
                              alt={episode.seriesName}
                              onClick={() =>
                                navigate(`/series/${episode.seriesId}`)
                              }
                              style={{
                                width: '48px',
                                height: '72px',
                                objectFit: 'cover',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                position: 'relative',
                                zIndex: 2,
                              }}
                            />

                            <div
                              style={{
                                flex: 1,
                                pointerEvents: 'none',
                                position: 'relative',
                                zIndex: 2,
                              }}
                            >
                              <h4
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 600,
                                  margin: '0 0 4px 0',
                                  color: !hasAired
                                    ? 'rgba(255, 255, 255, 0.5)'
                                    : watched
                                    ? 'rgba(0, 212, 170, 0.9)'
                                    : 'white',
                                }}
                              >
                                {episode.seriesName}
                              </h4>

                              <p
                                style={{
                                  fontSize: '13px',
                                  margin: '0 0 4px 0',
                                  color: !hasAired
                                    ? 'rgba(255, 255, 255, 0.4)'
                                    : 'rgba(255, 255, 255, 0.6)',
                                }}
                              >
                                S{String(episode.seasonNumber + 1).padStart(2, '0')}
                                E
                                {String(episode.episodeNumber).padStart(2, '0')}{' '}
                                • {episode.episodeName}
                              </p>

                              <p
                                style={{
                                  fontSize: '12px',
                                  margin: 0,
                                  color: 'rgba(255, 255, 255, 0.4)',
                                }}
                              >
                                {episode.daysUntil === 0
                                  ? 'Heute'
                                  : episode.daysUntil === 1
                                  ? 'Morgen'
                                  : `In ${episode.daysUntil} Tagen`}
                              </p>
                            </div>

                            <AnimatePresence mode='wait'>
                              {!hasAired ? (
                                <Timer
                                  style={{
                                    fontSize: '20px',
                                    color: 'rgba(255, 255, 255, 0.3)',
                                  }}
                                />
                              ) : isCompleting ? (
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  exit={{ scale: 0, rotate: 180 }}
                                  style={{
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <Check
                                    style={{
                                      fontSize: '24px',
                                      color: currentTheme.status.success,
                                    }}
                                  />
                                </motion.div>
                              ) : watched ? (
                                <CheckCircle
                                  style={{
                                    fontSize: '20px',
                                    color: currentTheme.status.success,
                                  }}
                                />
                              ) : (
                                <motion.div
                                  animate={{ x: isSwiping ? 10 : 0 }}
                                  style={{
                                    padding: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <PlayCircle
                                    style={{
                                      fontSize: '20px',
                                      color: currentTheme.status.success,
                                    }}
                                  />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    }

                    // Multiple episodes - show accordion
                    return (
                      <motion.div
                        key={seriesId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                          background: allWatched
                            ? 'rgba(0, 212, 170, 0.05)'
                            : 'rgba(255, 255, 255, 0.02)',
                          borderRadius: '12px',
                          border: allWatched
                            ? '1px solid rgba(0, 212, 170, 0.2)'
                            : '1px solid rgba(255, 255, 255, 0.05)',
                          overflow: 'hidden',
                          transition: 'all 0.3s ease',
                        }}
                      >
                        {/* Accordion Header */}
                        <div
                          onClick={() =>
                            toggleSeriesExpanded(date, Number(seriesId))
                          }
                          style={{
                            display: 'flex',
                            gap: '12px',
                            padding: '12px',
                            cursor: 'pointer',
                            background: 'rgba(255, 255, 255, 0.02)',
                          }}
                        >
                          <img
                            src={getImageUrl(firstEpisode.seriesPoster)}
                            alt={firstEpisode.seriesName}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/series/${firstEpisode.seriesId}`);
                            }}
                            style={{
                              width: '60px',
                              height: '90px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              cursor: 'pointer',
                            }}
                          />

                          <div style={{ flex: 1 }}>
                            <h4
                              style={{
                                fontSize: '14px',
                                fontWeight: 600,
                                margin: '0 0 4px 0',
                                color: allWatched
                                  ? 'rgba(0, 212, 170, 0.9)'
                                  : 'white',
                              }}
                            >
                              {firstEpisode.seriesName}
                            </h4>

                            <p
                              style={{
                                fontSize: '13px',
                                margin: '0 0 4px 0',
                                color: 'rgba(255, 255, 255, 0.6)',
                              }}
                            >
                              {episodes.length} Episoden
                            </p>

                            <p
                              style={{
                                fontSize: '12px',
                                margin: 0,
                                color: 'rgba(255, 255, 255, 0.4)',
                              }}
                            >
                              {
                                episodes.filter((ep) => isEpisodeWatched(ep))
                                  .length
                              }{' '}
                              von {episodes.length} gesehen
                            </p>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              color: 'rgba(255, 255, 255, 0.6)',
                            }}
                          >
                            {isExpanded ? <ExpandLess /> : <ExpandMore />}
                          </div>
                        </div>

                        {/* Expanded Episodes */}
                        {isExpanded && (
                          <div
                            style={{
                              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                              padding: '8px',
                            }}
                          >
                            {episodes.map((episode, idx) => {
                              const watched = isEpisodeWatched(episode);
                              const hasAired = hasEpisodeAired(episode);

                              return (
                                <div
                                  key={`${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    background:
                                      idx % 2 === 0
                                        ? 'transparent'
                                        : 'rgba(255, 255, 255, 0.01)',
                                  }}
                                >
                                  <div style={{ flex: 1 }}>
                                    <p
                                      style={{
                                        fontSize: '13px',
                                        margin: 0,
                                        color: !hasAired
                                          ? 'rgba(255, 255, 255, 0.5)'
                                          : watched
                                          ? 'rgba(0, 212, 170, 0.9)'
                                          : 'rgba(255, 255, 255, 0.8)',
                                      }}
                                    >
                                      S
                                      {String(episode.seasonNumber + 1).padStart(
                                        2,
                                        '0'
                                      )}
                                      E
                                      {String(episode.episodeNumber).padStart(
                                        2,
                                        '0'
                                      )}{' '}
                                      • {episode.episodeName}
                                    </p>
                                  </div>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (hasAired) {
                                        handleMarkWatched(episode);
                                      }
                                    }}
                                    disabled={watched || !hasAired}
                                    style={{
                                      background: !hasAired
                                        ? 'transparent'
                                        : watched
                                        ? 'transparent'
                                        : 'rgba(0, 212, 170, 0.1)',
                                      border: !hasAired
                                        ? '1px solid rgba(255, 255, 255, 0.1)'
                                        : watched
                                        ? 'none'
                                        : '1px solid rgba(0, 212, 170, 0.3)',
                                      borderRadius: '8px',
                                      padding: '6px',
                                      color: !hasAired
                                        ? 'rgba(255, 255, 255, 0.3)'
                                        : watched
                                        ? 'rgba(0, 212, 170, 0.9)'
                                        : 'rgba(0, 212, 170, 0.7)',
                                      cursor: !hasAired || watched ? 'default' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {!hasAired ? (
                                      <Timer
                                        style={{ fontSize: '18px' }}
                                      />
                                    ) : watched ? (
                                      <CheckCircle
                                        style={{ fontSize: '18px' }}
                                      />
                                    ) : (
                                      <PlayCircle
                                        style={{ fontSize: '18px' }}
                                      />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
