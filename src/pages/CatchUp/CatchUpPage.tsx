/**
 * CatchUpPage - Premium Catch Up Experience
 * Zeigt Serien an, bei denen der User hinterherhinkt
 */

import {
  ArrowDownward,
  ArrowForward,
  ArrowUpward,
  AutoAwesome,
  Bolt,
  CheckCircleOutline,
  MovieFilter,
  PlayArrow,
  Timer,
  TrendingUp,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { GradientText, PageHeader, PageLayout, ProgressBar, ScrollToTopButton } from '../../components/ui';
import { Series } from '../../types/Series';
import { getImageUrl } from '../../utils/imageUrl';
import './CatchUpPage.css';

interface CatchUpSeries {
  series: Series;
  totalEpisodes: number;
  watchedEpisodes: number;
  remainingEpisodes: number;
  remainingMinutes: number;
  progress: number;
  currentSeason: number;
  currentEpisode: number;
  lastWatchedDate?: string;
}

type SortOption = 'episodes' | 'time' | 'progress' | 'recent';
type SortDirection = 'asc' | 'desc';

const SCROLL_STORAGE_KEY = 'catchup-scroll-position';

export const CatchUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollRestoredRef = useRef(false);

  // Initialize sortBy and direction from URL params
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const sortParam = searchParams.get('sort') as SortOption;
    return sortParam && ['episodes', 'time', 'progress', 'recent'].includes(sortParam)
      ? sortParam
      : 'episodes';
  });

  const [sortDirection, setSortDirection] = useState<SortDirection>(() => {
    const dirParam = searchParams.get('dir') as SortDirection;
    return dirParam && ['asc', 'desc'].includes(dirParam) ? dirParam : 'desc';
  });

  // Handle tab click - toggle direction if same tab, otherwise switch tab
  const handleSortClick = useCallback((value: SortOption) => {
    if (sortBy === value) {
      setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortBy(value);
      setSortDirection('desc');
    }
    // Scroll to top when sort changes
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    sessionStorage.removeItem(SCROLL_STORAGE_KEY);
  }, [sortBy]);

  // Update URL params when sort changes
  useEffect(() => {
    setSearchParams({ sort: sortBy, dir: sortDirection }, { replace: true });
  }, [sortBy, sortDirection, setSearchParams]);

  // Save scroll position on scroll (debounced)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(SCROLL_STORAGE_KEY, String(container.scrollTop));
      }, 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, []);

  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRestoredRef.current) return;
    scrollRestoredRef.current = true;

    const savedPosition = sessionStorage.getItem(SCROLL_STORAGE_KEY);
    if (savedPosition) {
      const pos = parseInt(savedPosition, 10);
      // Delay to ensure content is rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollContainerRef.current?.scrollTo({ top: pos });
        });
      });
    }
  }, []);

  // Calculate catch-up data for each series
  const catchUpData = useMemo(() => {
    const data: CatchUpSeries[] = [];

    seriesList.forEach((series) => {
      if (!series.seasons || series.seasons.length === 0) return;

      let totalEpisodes = 0;
      let watchedEpisodes = 0;
      let currentSeason = 1;
      let currentEpisode = 1;
      let lastWatchedDate: string | undefined;
      let foundUnwatched = false;
      let remainingMinutes = 0;
      const seriesRuntime = series.episodeRuntime || 45;

      series.seasons.forEach((season) => {
        if (!season.episodes) return;

        season.episodes.forEach((episode, epIndex) => {
          const airDate = episode.air_date || episode.airDate || episode.firstAired;
          if (!airDate) return;
          const hasAired = new Date(airDate) <= new Date();

          if (hasAired) {
            totalEpisodes++;
            if (episode.watched) {
              watchedEpisodes++;
              if (episode.lastWatchedAt || episode.firstWatchedAt) {
                const watchDate = episode.lastWatchedAt || episode.firstWatchedAt;
                if (!lastWatchedDate || watchDate! > lastWatchedDate) {
                  lastWatchedDate = watchDate;
                }
              }
            } else {
              remainingMinutes += episode.runtime || seriesRuntime;
              if (!foundUnwatched) {
                currentSeason = season.seasonNumber || season.season_number || 1;
                currentEpisode = episode.episode_number || epIndex + 1;
                foundUnwatched = true;
              }
            }
          }
        });
      });

      const remainingEpisodes = totalEpisodes - watchedEpisodes;

      if (remainingEpisodes > 0 && totalEpisodes > 0) {
        const progress = (watchedEpisodes / totalEpisodes) * 100;

        data.push({
          series,
          totalEpisodes,
          watchedEpisodes,
          remainingEpisodes,
          remainingMinutes,
          progress,
          currentSeason,
          currentEpisode,
          lastWatchedDate,
        });
      }
    });

    return data;
  }, [seriesList]);

  // Sort the data
  const sortedData = useMemo(() => {
    const sorted = [...catchUpData];
    const dir = sortDirection === 'desc' ? 1 : -1;

    switch (sortBy) {
      case 'episodes':
        sorted.sort((a, b) => dir * (b.remainingEpisodes - a.remainingEpisodes));
        break;
      case 'time':
        sorted.sort((a, b) => dir * (b.remainingMinutes - a.remainingMinutes));
        break;
      case 'progress':
        sorted.sort((a, b) => dir * (b.progress - a.progress));
        break;
      case 'recent':
        sorted.sort((a, b) => {
          if (!a.lastWatchedDate && !b.lastWatchedDate) return 0;
          if (!a.lastWatchedDate) return 1;
          if (!b.lastWatchedDate) return -1;
          return dir * (new Date(b.lastWatchedDate).getTime() - new Date(a.lastWatchedDate).getTime());
        });
        break;
    }

    return sorted;
  }, [catchUpData, sortBy, sortDirection]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalEpisodes = catchUpData.reduce((sum, item) => sum + item.remainingEpisodes, 0);
    const totalMinutes = catchUpData.reduce((sum, item) => sum + item.remainingMinutes, 0);
    const avgProgress = catchUpData.length > 0
      ? catchUpData.reduce((sum, item) => sum + item.progress, 0) / catchUpData.length
      : 0;
    return { totalEpisodes, totalMinutes, avgProgress };
  }, [catchUpData]);

  const formatTime = (minutes: number): { value: number; unit: string } => {
    if (minutes < 60) return { value: minutes, unit: 'Min' };
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return { value: hours, unit: 'Std' };
    const days = Math.floor(hours / 24);
    return { value: days, unit: 'Tage' };
  };

  const formatTimeString = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
  };


  const sortOptions: { value: SortOption; labelDesc: string; labelAsc: string; icon: React.ReactNode }[] = [
    { value: 'episodes', labelDesc: 'Meiste Episoden', labelAsc: 'Wenigste Episoden', icon: <MovieFilter style={{ fontSize: 18 }} /> },
    { value: 'time', labelDesc: 'Längste Zeit', labelAsc: 'Kürzeste Zeit', icon: <Timer style={{ fontSize: 18 }} /> },
    { value: 'progress', labelDesc: 'Fast fertig', labelAsc: 'Am Anfang', icon: <TrendingUp style={{ fontSize: 18 }} /> },
    { value: 'recent', labelDesc: 'Zuletzt geschaut', labelAsc: 'Am längsten her', icon: <Bolt style={{ fontSize: 18 }} /> },
  ];

  const activeLabel = sortOptions.find((o) => o.value === sortBy);
  const currentLabel = sortDirection === 'desc' ? activeLabel?.labelDesc : activeLabel?.labelAsc;

  const timeData = formatTime(totals.totalMinutes);

  // Gradient ring progress component
  const GradientRing: React.FC<{ progress: number; size?: number; strokeWidth?: number }> = ({
    progress,
    size = 56,
    strokeWidth = 4,
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    return (
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <defs>
            <linearGradient id={`ring-gradient-${progress}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={currentTheme.primary} />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`${currentTheme.text.muted}20`}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#ring-gradient-${progress})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GradientText as="span" to="#8b5cf6" style={{
              fontSize: size * 0.24,
              fontWeight: 700,
            }}
          >
            {Math.min(99, Math.round(progress))}%
          </GradientText>
        </div>
      </div>
    );
  };

  return (
    <PageLayout ref={scrollContainerRef} style={{ height: '100vh', overflowY: 'auto', overflowX: 'hidden', color: currentTheme.text.primary }}>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <PageHeader
          title="Backlog"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.text.secondary}
          sticky={false}
          actions={
            catchUpData.length > 0 ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                  border: `1px solid ${currentTheme.primary}40`,
                  fontSize: '13px',
                  fontWeight: 600,
                  color: currentTheme.primary,
                }}
              >
                {catchUpData.length} Serien
              </motion.div>
            ) : undefined
          }
        />

        {/* Hero Stats */}
        {catchUpData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              margin: '8px 20px 24px',
              padding: '24px',
              borderRadius: '24px',
              background: `linear-gradient(135deg,
                ${currentTheme.background.surface}ee,
                ${currentTheme.background.surface}cc
              )`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${currentTheme.border.default}`,
              boxShadow: `
                0 4px 24px ${currentTheme.primary}10,
                0 1px 2px rgba(0,0,0,0.1)
              `,
            }}
          >
            {/* Main Stats Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}
            >
              {/* Episodes */}
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  style={{
                    width: '52px',
                    height: '52px',
                    margin: '0 auto 10px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, #f59e0b20, #f59e0b10)`,
                    border: '1px solid #f59e0b40',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <PlayArrow style={{ fontSize: 26, color: '#f59e0b' }} />
                </motion.div>
                <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>
                  {totals.totalEpisodes}
                </div>
                <div style={{ fontSize: '12px', color: currentTheme.text.muted, marginTop: '2px' }}>
                  Episoden
                </div>
              </div>

              {/* Time */}
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  style={{
                    width: '52px',
                    height: '52px',
                    margin: '0 auto 10px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, #8b5cf620, #8b5cf610)`,
                    border: '1px solid #8b5cf640',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Timer style={{ fontSize: 26, color: '#8b5cf6' }} />
                </motion.div>
                <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>
                  {timeData.value}
                </div>
                <div style={{ fontSize: '12px', color: currentTheme.text.muted, marginTop: '2px' }}>
                  {timeData.unit}
                </div>
              </div>

              {/* Progress */}
              <div style={{ textAlign: 'center' }}>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                  style={{
                    width: '52px',
                    height: '52px',
                    margin: '0 auto 10px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.primary}10)`,
                    border: `1px solid ${currentTheme.primary}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <TrendingUp style={{ fontSize: 26, color: currentTheme.primary }} />
                </motion.div>
                <div style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-1px' }}>
                  {Math.min(99, Math.round(totals.avgProgress))}%
                </div>
                <div style={{ fontSize: '12px', color: currentTheme.text.muted, marginTop: '2px' }}>
                  Fortschritt
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <ProgressBar value={totals.avgProgress} />
          </motion.div>
        )}

        {/* Sort Options - Icon Only Tabs */}
        {catchUpData.length > 0 && (
          <>
            <div
              style={{
                padding: '0 16px 12px',
                position: 'sticky',
                top: 0,
                background: currentTheme.background.default,
                zIndex: 10,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: 0,
                  background: currentTheme.background.surface,
                  borderRadius: '16px',
                  padding: '6px',
                  width: '100%',
                  overflow: 'hidden',
                }}
              >
                {sortOptions.map((option) => {
                  const isActive = sortBy === option.value;
                  return (
                    <button
                      key={option.value}
                      className="catchup-sort-btn"
                      onClick={() => handleSortClick(option.value)}
                      style={{
                        flex: '1 1 0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '3px',
                        padding: '12px 8px',
                        borderRadius: '12px',
                        border: 'none',
                        background: isActive
                          ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                          : 'transparent',
                        color: isActive ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        boxShadow: isActive ? `0 2px 8px ${currentTheme.primary}40` : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {option.icon}
                      {isActive && (
                        sortDirection === 'desc'
                          ? <ArrowDownward style={{ fontSize: 14 }} />
                          : <ArrowUpward style={{ fontSize: 14 }} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Sort Title */}
            <div style={{ padding: '0 16px 16px' }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                }}
              >
                {currentLabel}
              </h2>
            </div>
          </>
        )}

        {/* Empty State */}
        {catchUpData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  `0 0 0 0 ${currentTheme.status.success}40`,
                  `0 0 0 20px ${currentTheme.status.success}00`,
                ],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeOut',
              }}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '60px',
                background: `linear-gradient(135deg, ${currentTheme.status.success}20, ${currentTheme.primary}20)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '28px',
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              >
                <CheckCircleOutline
                  style={{ fontSize: '60px', color: currentTheme.status.success }}
                />
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GradientText as="h2" from={currentTheme.text.primary} to={currentTheme.primary} style={{
                margin: '0 0 12px 0',
                fontSize: '28px',
                fontWeight: 800,
              }}>
                Alles aufgeholt!
              </GradientText>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              style={{
                margin: 0,
                color: currentTheme.text.muted,
                fontSize: '16px',
                maxWidth: '300px',
                lineHeight: 1.6,
              }}
            >
              Du bist bei allen Serien up-to-date. Zeit für etwas Neues!
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/discover')}
              style={{
                marginTop: '32px',
                padding: '16px 32px',
                borderRadius: '16px',
                border: 'none',
                background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                boxShadow: `0 8px 24px ${currentTheme.primary}40`,
                color: '#fff',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <AutoAwesome style={{ fontSize: 20 }} />
              Neue Serie entdecken
              <ArrowForward style={{ fontSize: 20 }} />
            </motion.button>
          </motion.div>
        )}

        {/* Series List */}
        <div style={{ padding: '0 20px 120px' }}>
            {sortedData.map((item) => (
              <div
                key={item.series.id}
                className="catchup-list-item"
                onClick={() => navigate(`/series/${item.series.id}`)}
                style={{
                  display: 'flex',
                  gap: '16px',
                  padding: '16px',
                  background: currentTheme.background.surface,
                  borderRadius: '20px',
                  marginBottom: '14px',
                  cursor: 'pointer',
                  border: `1px solid ${currentTheme.border.default}`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle gradient accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: `linear-gradient(90deg,
                      ${currentTheme.primary}${Math.round(item.progress * 2.55).toString(16).padStart(2, '0')},
                      #8b5cf6${Math.round(item.progress * 2.55).toString(16).padStart(2, '0')}
                    )`,
                    opacity: 0.6,
                  }}
                />

                {/* Poster */}
                <div
                  style={{
                    width: '72px',
                    minWidth: '72px',
                    aspectRatio: '2/3',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  }}
                >
                  <img
                    src={getImageUrl(item.series.poster?.poster, 'w500', '')}
                    alt={item.series.title}
                    loading="lazy"
                    decoding="async"
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.opacity = '0';
                    }}
                  />
                  {/* Episode badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-1px',
                      left: '-1px',
                      right: '-1px',
                      padding: '6px 0 5px',
                      background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.9))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 800,
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      {item.remainingEpisodes}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.8)',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                      }}
                    >
                      EP
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    flex: 1,
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 6px 0',
                      fontSize: '16px',
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: currentTheme.text.primary,
                    }}
                  >
                    {item.series.title}
                  </h3>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '10px',
                    }}
                  >
                    <span
                      style={{
                        fontSize: '13px',
                        color: currentTheme.text.secondary,
                        fontWeight: 500,
                      }}
                    >
                      S{item.currentSeason} E{item.currentEpisode}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        background: `${currentTheme.primary}15`,
                        color: currentTheme.primary,
                        fontWeight: 600,
                      }}
                    >
                      {formatTimeString(item.remainingMinutes)}
                    </span>
                  </div>

                  {/* Inline progress */}
                  <div
                    style={{
                      height: '6px',
                      background: `${currentTheme.text.muted}15`,
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      className="catchup-progress-bar"
                      style={{
                        height: '100%',
                        width: `${item.progress}%`,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, #8b5cf6)`,
                        borderRadius: '3px',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginTop: '6px',
                      fontSize: '11px',
                      color: currentTheme.text.muted,
                    }}
                  >
                    <span>
                      {item.watchedEpisodes} von {item.totalEpisodes}
                    </span>
                  </div>
                </div>

                {/* Progress Ring */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: '4px',
                  }}
                >
                  <GradientRing progress={item.progress} size={52} strokeWidth={4} />
                </div>
              </div>
            ))}
        </div>
      </div>

      <ScrollToTopButton scrollContainerRef={scrollContainerRef} />
    </PageLayout>
  );
};
