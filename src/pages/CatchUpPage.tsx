/**
 * CatchUpPage - Premium Catch Up Experience
 * Zeigt Serien an, bei denen der User hinterherhinkt
 */

import {
  ArrowForward,
  AutoAwesome,
  Bolt,
  CheckCircleOutline,
  MovieFilter,
  PlayArrow,
  Timer,
  TrendingUp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { BackButton } from '../components/BackButton';
import { Series } from '../types/Series';

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

export const CatchUpPage: React.FC = () => {
  const navigate = useNavigate();
  const { seriesList } = useSeriesList();
  const { currentTheme } = useTheme();
  const [sortBy, setSortBy] = useState<SortOption>('episodes');

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
            } else if (!foundUnwatched) {
              currentSeason = season.seasonNumber || season.season_number || 1;
              currentEpisode = episode.episode_number || epIndex + 1;
              foundUnwatched = true;
            }
          }
        });
      });

      const remainingEpisodes = totalEpisodes - watchedEpisodes;

      if (remainingEpisodes > 0 && totalEpisodes > 0) {
        const runtime = series.episodeRuntime || 45;
        const remainingMinutes = remainingEpisodes * runtime;
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

    switch (sortBy) {
      case 'episodes':
        sorted.sort((a, b) => b.remainingEpisodes - a.remainingEpisodes);
        break;
      case 'time':
        sorted.sort((a, b) => b.remainingMinutes - a.remainingMinutes);
        break;
      case 'progress':
        sorted.sort((a, b) => b.progress - a.progress);
        break;
      case 'recent':
        sorted.sort((a, b) => {
          if (!a.lastWatchedDate && !b.lastWatchedDate) return 0;
          if (!a.lastWatchedDate) return 1;
          if (!b.lastWatchedDate) return -1;
          return new Date(b.lastWatchedDate).getTime() - new Date(a.lastWatchedDate).getTime();
        });
        break;
    }

    return sorted;
  }, [catchUpData, sortBy]);

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

  const getImageUrl = (poster: string | undefined): string => {
    if (!poster) return '';
    if (poster.startsWith('http')) return poster;
    if (poster.startsWith('/')) return `https://image.tmdb.org/t/p/w500${poster}`;
    return poster;
  };

  const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
    { value: 'episodes', label: 'Meiste Episoden', icon: <MovieFilter style={{ fontSize: 18 }} /> },
    { value: 'time', label: 'Längste Zeit', icon: <Timer style={{ fontSize: 18 }} /> },
    { value: 'progress', label: 'Fast fertig', icon: <TrendingUp style={{ fontSize: 18 }} /> },
    { value: 'recent', label: 'Zuletzt geschaut', icon: <Bolt style={{ fontSize: 18 }} /> },
  ];

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
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#ring-gradient-${progress})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
            style={{ strokeDasharray: circumference }}
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
          <span
            style={{
              fontSize: size * 0.24,
              fontWeight: 700,
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            {Math.min(99, Math.round(progress))}%
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: currentTheme.background.default,
        color: currentTheme.text.primary,
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}30, transparent),
            radial-gradient(ellipse 60% 40% at 80% 0%, #8b5cf620, transparent),
            radial-gradient(ellipse 50% 30% at 20% 10%, #06b6d420, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 20px',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                margin: 0,
                fontSize: '26px',
                fontWeight: 800,
                background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.text.secondary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Backlog
            </h1>
          </div>
          {catchUpData.length > 0 && (
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
          )}
        </div>

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
            <div
              style={{
                height: '8px',
                background: `${currentTheme.text.muted}15`,
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${totals.avgProgress}%` }}
                transition={{ duration: 1, ease: [0.4, 0, 0.2, 1] }}
                style={{
                  height: '100%',
                  background: `linear-gradient(90deg, ${currentTheme.primary}, #8b5cf6)`,
                  borderRadius: '4px',
                }}
              />
            </div>
          </motion.div>
        )}

        {/* Sort Options */}
        {catchUpData.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '10px',
              padding: '0 20px 20px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {sortOptions.map((option, i) => (
              <motion.button
                key={option.value}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSortBy(option.value)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 18px',
                  borderRadius: '14px',
                  border: 'none',
                  background:
                    sortBy === option.value
                      ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                      : `${currentTheme.background.surface}`,
                  boxShadow: sortBy === option.value
                    ? `0 4px 16px ${currentTheme.primary}40`
                    : `0 2px 8px rgba(0,0,0,0.1)`,
                  color: sortBy === option.value ? '#fff' : currentTheme.text.secondary,
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s ease',
                }}
              >
                {option.icon}
                {option.label}
              </motion.button>
            ))}
          </div>
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

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              style={{
                margin: '0 0 12px 0',
                fontSize: '28px',
                fontWeight: 800,
                background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.primary})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Alles aufgeholt!
            </motion.h2>

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
          <AnimatePresence mode="popLayout">
            {sortedData.map((item, index) => (
              <motion.div
                key={item.series.id}
                layout
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{
                  delay: index * 0.04,
                  layout: { type: 'spring', stiffness: 300, damping: 30 },
                }}
                whileTap={{ scale: 0.98 }}
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
                    src={getImageUrl(item.series.poster?.poster)}
                    alt={item.series.title}
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
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.progress}%` }}
                      transition={{ duration: 0.8, delay: index * 0.04, ease: [0.4, 0, 0.2, 1] }}
                      style={{
                        height: '100%',
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
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
