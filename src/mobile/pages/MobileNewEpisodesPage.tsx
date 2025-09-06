import {
  ArrowBack,
  CalendarToday,
  Check,
  CheckCircle,
  ExpandLess,
  ExpandMore,
  NewReleases,
  PlayCircle,
  Timer,
} from '@mui/icons-material';
import { AnimatePresence, motion, PanInfo } from 'framer-motion';
import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { HorizontalScrollContainer } from '../components/HorizontalScrollContainer';
// import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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
}

export const MobileNewEpisodesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { currentTheme, getMobileHeaderStyle } = useTheme();
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

    console.log('Checking', seriesList.length, 'series for new episodes');
    console.log('Today:', today);

    seriesList.forEach((series) => {
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
              console.log('Episode without airDate in', series.title, episode);
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
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              episodeNumber: episodeIndex + 1,
              seasonNumber: (season.seasonNumber ?? seasonIndex) + 1,
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
  }, [seriesList]);

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
      const ref = firebase
        .database()
        .ref(
          `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
        );
      await ref.set(true);

      setMarkedWatched((prev) => new Set([...prev, key]));
    } catch (error) {
      console.error('Error marking episode as watched:', error);
    }
  };

  // Handle episode swipe to complete
  const handleEpisodeComplete = async (
    episode: UpcomingEpisode,
    swipeDirection: 'left' | 'right' = 'right'
  ) => {
    const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;

    // Store swipe direction for exit animation
    setSwipeDirections((prev) => ({ ...prev, [episodeKey]: swipeDirection }));

    // Add to completing set for animation
    setCompletingEpisodes((prev) => new Set(prev).add(episodeKey));

    // Mark episode as watched in Firebase
    if (user) {
      try {
        const ref = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`
          );
        await ref.set(true);

        // Also update watchCount if needed
        const watchCountRef = firebase
          .database()
          .ref(
            `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`
          );
        const snapshot = await watchCountRef.once('value');
        const currentCount = snapshot.val() || 0;
        await watchCountRef.set(currentCount + 1);

        // Update firstWatchedAt if this is the first time
        if (currentCount === 0) {
          const firstWatchedRef = firebase
            .database()
            .ref(
              `${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`
            );
          await firstWatchedRef.set(new Date().toISOString());
        }
      } catch (error) {
        console.error('Error marking episode as watched:', error);
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
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
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
          <button
            onClick={() => navigate(-1)}
            style={{
              background: currentTheme.background.surface,
              border: 'none',
              color: currentTheme.text.primary,
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
            }}
          >
            <ArrowBack />
          </button>

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
              Kommende Episoden
            </h1>
            <p
              style={{
                color: currentTheme.text.secondary,
                fontSize: '14px',
                margin: '4px 0 0 0',
              }}
            >
              {upcomingEpisodes.length} neue Episoden
            </p>
          </div>
        </div>

        {/* Stats */}
        <HorizontalScrollContainer
          gap={12}
          style={{
            paddingBottom: '8px',
          }}
        >
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
            <p>Es gibt aktuell keine neuen Episoden in deiner Watchlist</p>
          </div>
        ) : (
          Object.entries(groupedEpisodes).map(([date, seriesGroups]) => (
            <div key={date} style={{ marginBottom: '32px' }}>
              <h3
                style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '16px',
                  color: 'rgba(255, 255, 255, 0.7)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                  paddingBottom: '8px',
                }}
              >
                {date}
              </h3>

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
                          {/* Swipe overlay for episode */}
                          <motion.div
                            drag='x'
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={1}
                            dragSnapToOrigin={true}
                            onDragStart={() => {
                              setSwipingEpisodes((prev) =>
                                new Set(prev).add(episodeKey)
                              );
                            }}
                            onDrag={(_event, info: PanInfo) => {
                              setDragOffsets((prev) => ({
                                ...prev,
                                [episodeKey]: info.offset.x,
                              }));
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
                              gap: '12px',
                              padding: '12px',
                              background: isCompleting
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
                                isCompleting
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
                                width: '60px',
                                height: '90px',
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
                                  color: watched
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
                                  color: 'rgba(255, 255, 255, 0.6)',
                                }}
                              >
                                S{String(episode.seasonNumber).padStart(2, '0')}
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
                              {isCompleting ? (
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
                                        color: watched
                                          ? 'rgba(0, 212, 170, 0.9)'
                                          : 'rgba(255, 255, 255, 0.8)',
                                      }}
                                    >
                                      S
                                      {String(episode.seasonNumber).padStart(
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
                                      handleMarkWatched(episode);
                                    }}
                                    disabled={watched}
                                    style={{
                                      background: watched
                                        ? 'transparent'
                                        : 'rgba(0, 212, 170, 0.1)',
                                      border: watched
                                        ? 'none'
                                        : '1px solid rgba(0, 212, 170, 0.3)',
                                      borderRadius: '8px',
                                      padding: '6px',
                                      color: watched
                                        ? 'rgba(0, 212, 170, 0.9)'
                                        : 'rgba(0, 212, 170, 0.7)',
                                      cursor: watched ? 'default' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    {watched ? (
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
