/**
 * StatsPage - Premium Statistics Dashboard
 * Comprehensive view of user's watching statistics
 */

import {
  AutoAwesome,
  Category,
  EmojiEvents,
  LocalFireDepartment,
  Movie,
  Star,
  Stream,
  Timer,
  Tv,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { GradientText, PageHeader, PageLayout } from '../../components/ui';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Movie as MovieType } from '../../types/Movie';
import type { Series } from '../../types/Series';

export const StatsPage = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  // Calculate all statistics
  const stats = useMemo(() => {
    if (!user?.uid) {
      return {
        totalSeries: 0,
        watchedEpisodes: 0,
        totalEpisodes: 0,
        totalMovies: 0,
        watchedMovies: 0,
        totalMinutes: 0,
        seriesMinutes: 0,
        movieMinutes: 0,
        avgSeriesRating: 0,
        avgMovieRating: 0,
        topGenres: [] as { name: string; count: number }[],
        topProviders: [] as { name: string; count: number }[],
        lastWeekWatched: 0,
        completedSeries: 0,
        progress: 0,
      };
    }

    const today = new Date();
    const totalSeries = seriesList.filter((s) => s && s.nmr !== undefined && s.nmr !== null).length;

    let watchedEpisodes = 0;
    let totalAiredEpisodes = 0;
    let seriesMinutes = 0;
    let completedSeries = 0;

    seriesList.forEach((series) => {
      if (!series || series.nmr === undefined || series.nmr === null) return;
      const runtime = series.episodeRuntime || 45;

      let seriesTotal = 0;
      let seriesWatched = 0;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          const isWatched = !!(
            ep.firstWatchedAt ||
            ep.watched === true ||
            (ep.watched as unknown) === 1 ||
            (ep.watchCount && ep.watchCount > 0)
          );

          const airDate = ep.air_date ? new Date(ep.air_date) : null;
          const hasAired = !airDate || airDate <= today;

          if (hasAired) {
            totalAiredEpisodes++;
            seriesTotal++;
            if (isWatched) {
              watchedEpisodes++;
              seriesWatched++;
              const count = ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;
              seriesMinutes += runtime * count;
            }
          }
        });
      });

      if (seriesTotal > 0 && seriesTotal === seriesWatched) {
        completedSeries++;
      }
    });

    // Movies
    const totalMovies = movieList.filter((m) => m && m.nmr !== undefined && m.nmr !== null).length;
    let watchedMovies = 0;
    let movieMinutes = 0;

    movieList.forEach((movie: MovieType) => {
      if (!movie || movie.nmr === undefined || movie.nmr === null) return;
      const rating = parseFloat(calculateOverallRating(movie));
      if (!isNaN(rating) && rating > 0) {
        watchedMovies++;
        movieMinutes += movie.runtime || 120;
      }
    });

    // Ratings
    const seriesWithRating = seriesList.filter((s: Series) => {
      if (!s || s.nmr === undefined) return false;
      const rating = parseFloat(calculateOverallRating(s));
      return !isNaN(rating) && rating > 0;
    });

    const avgSeriesRating =
      seriesWithRating.length > 0
        ? seriesWithRating.reduce((acc, s) => acc + parseFloat(calculateOverallRating(s)), 0) /
          seriesWithRating.length
        : 0;

    const moviesWithRating = movieList.filter((m: MovieType) => {
      if (!m || m.nmr === undefined) return false;
      const rating = parseFloat(calculateOverallRating(m));
      return !isNaN(rating) && rating > 0;
    });

    const avgMovieRating =
      moviesWithRating.length > 0
        ? moviesWithRating.reduce((acc, m) => acc + parseFloat(calculateOverallRating(m)), 0) /
          moviesWithRating.length
        : 0;

    // Genres
    const genreCounts: Record<string, number> = {};
    ([...seriesList, ...movieList] as (Series | MovieType)[]).forEach((item: Series | MovieType) => {
      if (!item || item.nmr === undefined) return;
      let genres: string[] = [];
      if (item.genre?.genres && Array.isArray(item.genre.genres)) {
        genres = item.genre.genres;
      } else if (item.genres && Array.isArray(item.genres)) {
        genres = item.genres.map((g: string | { id: number; name: string }) => (typeof g === 'string' ? g : g.name));
      }
      genres.forEach((genre: string) => {
        if (genre && genre.toLowerCase() !== 'all' && genre.toLowerCase() !== 'alle') {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Providers
    const providerCounts: Record<string, number> = {};
    ([...seriesList, ...movieList] as (Series | MovieType)[]).forEach((item: Series | MovieType) => {
      if (!item || item.nmr === undefined) return;
      if (item.provider?.provider && Array.isArray(item.provider.provider)) {
        item.provider.provider.forEach((p: { id: number; logo: string; name: string }) => {
          const name = p.name;
          if (name) providerCounts[name] = (providerCounts[name] || 0) + 1;
        });
      }
    });

    const topProviders = Object.entries(providerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Last week
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let lastWeekWatched = 0;
    seriesList.forEach((series) => {
      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          if (ep.firstWatchedAt) {
            const watchDate = new Date(ep.firstWatchedAt);
            if (!isNaN(watchDate.getTime()) && watchDate > oneWeekAgo) {
              lastWeekWatched++;
            }
          }
        });
      });
    });

    const progress = totalAiredEpisodes > 0 ? (watchedEpisodes / totalAiredEpisodes) * 100 : 0;

    return {
      totalSeries,
      watchedEpisodes,
      totalEpisodes: totalAiredEpisodes,
      totalMovies,
      watchedMovies,
      totalMinutes: seriesMinutes + movieMinutes,
      seriesMinutes,
      movieMinutes,
      avgSeriesRating,
      avgMovieRating,
      topGenres,
      topProviders,
      lastWeekWatched,
      completedSeries,
      progress,
    };
  }, [seriesList, movieList, user]);

  // Format time - returns primary value and detailed breakdown
  const formatTime = (
    minutes: number
  ): { value: string; unit: string; details: string; breakdown: { value: number; unit: string }[] } => {
    const totalHours = Math.floor(minutes / 60);
    const totalDays = Math.floor(totalHours / 24);
    const totalMonths = Math.floor(totalDays / 30);
    const totalYears = Math.floor(totalMonths / 12);

    const breakdown: { value: number; unit: string }[] = [];
    let remaining = minutes;

    // Years
    if (totalYears > 0) {
      breakdown.push({ value: totalYears, unit: totalYears === 1 ? 'Jahr' : 'Jahre' });
      remaining -= totalYears * 12 * 30 * 24 * 60;
    }

    // Months (remaining after years)
    const remainingMonths = Math.floor(remaining / (30 * 24 * 60));
    if (remainingMonths > 0) {
      breakdown.push({ value: remainingMonths, unit: remainingMonths === 1 ? 'Monat' : 'Monate' });
      remaining -= remainingMonths * 30 * 24 * 60;
    }

    // Days (remaining after months)
    const remainingDays = Math.floor(remaining / (24 * 60));
    if (remainingDays > 0) {
      breakdown.push({ value: remainingDays, unit: remainingDays === 1 ? 'Tag' : 'Tage' });
      remaining -= remainingDays * 24 * 60;
    }

    // Hours (remaining after days)
    const remainingHours = Math.floor(remaining / 60);
    if (remainingHours > 0 && totalDays < 30) {
      // Only show hours if less than a month total
      breakdown.push({ value: remainingHours, unit: remainingHours === 1 ? 'Stunde' : 'Stunden' });
    }

    // Determine primary display
    if (minutes < 60) {
      return { value: String(minutes), unit: 'Min', details: '', breakdown };
    }
    if (totalHours < 24) {
      return { value: String(totalHours), unit: 'Stunden', details: '', breakdown };
    }
    if (totalDays < 30) {
      const details = remainingHours > 0 ? `${remainingHours} Stunden` : '';
      return { value: String(totalDays), unit: 'Tage', details, breakdown };
    }
    if (totalMonths < 12) {
      const daysLeft = Math.floor((remaining + remainingMonths * 30 * 24 * 60) / (24 * 60)) % 30;
      const details = daysLeft > 0 ? `${daysLeft} Tage` : '';
      return { value: String(totalMonths), unit: 'Monate', details, breakdown };
    }

    // Years - show detailed breakdown
    const detailParts: string[] = [];
    if (remainingMonths > 0) detailParts.push(`${remainingMonths} ${remainingMonths === 1 ? 'Monat' : 'Monate'}`);
    if (remainingDays > 0) detailParts.push(`${remainingDays} ${remainingDays === 1 ? 'Tag' : 'Tage'}`);
    const details = detailParts.join(', ');

    return { value: String(totalYears), unit: totalYears === 1 ? 'Jahr' : 'Jahre', details, breakdown };
  };

  const formatTimeDetailed = (minutes: number): string => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    if (days < 30) return `${days}d ${remainingHours}h`;
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    return `${months}M ${remainingDays}d`;
  };

  const timeData = formatTime(stats.totalMinutes);
  const maxGenreCount = stats.topGenres[0]?.count || 1;

  // Animated ring component
  const AnimatedRing: React.FC<{
    progress: number;
    size: number;
    strokeWidth: number;
    color: string;
    bgColor?: string;
  }> = ({ progress, size, strokeWidth, color, bgColor }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(progress, 100) / 100) * circumference;

    return (
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor || `${currentTheme.text.muted}20`}
          strokeWidth={strokeWidth}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
          style={{ strokeDasharray: circumference }}
        />
      </svg>
    );
  };

  return (
    <PageLayout>
        {/* Header */}
        <PageHeader
          title="Statistiken"
          gradientFrom={currentTheme.text.primary}
          subtitle="Dein Viewing-Universum in Zahlen"
          sticky={false}
        />

        {/* Hero Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            margin: '0 20px 24px',
            padding: '28px',
            borderRadius: '28px',
            background: `linear-gradient(135deg, ${currentTheme.background.surface}ee, ${currentTheme.background.surface}cc)`,
            backdropFilter: 'blur(20px)',
            border: `1px solid ${currentTheme.border.default}`,
            boxShadow: `0 8px 32px ${currentTheme.primary}15`,
          }}
        >
          {/* Main Time Stat */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              style={{
                width: '100px',
                height: '100px',
                margin: '0 auto 16px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentTheme.primary}20, #8b5cf620)`,
                border: `3px solid ${currentTheme.primary}40`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Timer style={{ fontSize: 48, color: currentTheme.primary }} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <GradientText as="span" to="#8b5cf6" style={{
                  fontSize: '52px',
                  fontWeight: 800,
                  letterSpacing: '-2px',
                }}
              >
                {timeData.value}
              </GradientText>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  color: currentTheme.text.secondary,
                  marginLeft: '8px',
                }}
              >
                {timeData.unit}
              </span>
              {timeData.details && (
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: currentTheme.text.muted,
                    marginLeft: '4px',
                  }}
                >
                  , {timeData.details}
                </span>
              )}
            </motion.div>
            <p style={{ color: currentTheme.text.muted, fontSize: '14px', margin: '4px 0 0' }}>
              Gesamte Watchtime
            </p>
          </div>

          {/* Progress Ring */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              marginBottom: '24px',
            }}
          >
            <div style={{ position: 'relative' }}>
              <AnimatedRing
                progress={stats.progress}
                size={90}
                strokeWidth={8}
                color={currentTheme.primary}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '22px', fontWeight: 800 }}>
                  {Math.min(99, Math.round(stats.progress))}%
                </span>
                <span style={{ fontSize: '10px', color: currentTheme.text.muted }}>Fortschritt</span>
              </div>
            </div>

            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '24px', fontWeight: 700 }}>
                  {stats.watchedEpisodes.toLocaleString('de-DE')}
                </span>
                <span style={{ color: currentTheme.text.muted, fontSize: '14px' }}>
                  {' '}
                  / {stats.totalEpisodes.toLocaleString('de-DE')}
                </span>
              </div>
              <p style={{ color: currentTheme.text.muted, fontSize: '13px', margin: 0 }}>
                Episoden geschaut
              </p>
            </div>
          </div>

          {/* Quick Stats Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
            }}
          >
            {[
              {
                icon: <Tv style={{ fontSize: 20 }} />,
                value: stats.totalSeries,
                label: 'Serien',
                color: currentTheme.primary,
              },
              {
                icon: <Movie style={{ fontSize: 20 }} />,
                value: stats.totalMovies,
                label: 'Filme',
                color: '#f59e0b',
              },
              {
                icon: <EmojiEvents style={{ fontSize: 20 }} />,
                value: stats.completedSeries,
                label: 'Fertig',
                color: currentTheme.status.success,
              },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                style={{
                  textAlign: 'center',
                  padding: '12px 8px',
                  borderRadius: '14px',
                  background: `${stat.color}10`,
                  border: `1px solid ${stat.color}25`,
                }}
              >
                <div style={{ color: stat.color, marginBottom: '6px' }}>{stat.icon}</div>
                <div style={{ fontSize: '20px', fontWeight: 700 }}>{stat.value}</div>
                <div style={{ fontSize: '11px', color: currentTheme.text.muted }}>{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Actor Universe Banner */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/actor-universe')}
          style={{
            margin: '0 20px 24px',
            padding: '20px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            cursor: 'pointer',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Animated stars */}
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
              style={{
                position: 'absolute',
                width: 2 + Math.random() * 3,
                height: 2 + Math.random() * 3,
                borderRadius: '50%',
                background: 'white',
                top: `${5 + Math.random() * 90}%`,
                left: `${5 + Math.random() * 90}%`,
                boxShadow: '0 0 6px rgba(255, 255, 255, 0.6)',
              }}
            />
          ))}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 30px rgba(102, 126, 234, 0.6)',
              }}
            >
              <AutoAwesome style={{ color: 'white', fontSize: '28px' }} />
            </motion.div>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'white' }}>
                Actor Universe
              </h3>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                Entdecke Verbindungen zwischen Schauspielern
              </p>
            </div>
            <div
              style={{
                padding: '8px 14px',
                borderRadius: '20px',
                background: 'rgba(102, 126, 234, 0.3)',
                color: '#a5b4fc',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              Erkunden
            </div>
          </div>
        </motion.div>

        {/* Time Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            margin: '0 20px 24px',
            padding: '20px',
            borderRadius: '20px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Timer style={{ fontSize: 20, color: currentTheme.primary }} />
            Zeit-Aufteilung
          </h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                background: `${currentTheme.primary}10`,
                border: `1px solid ${currentTheme.primary}25`,
              }}
            >
              <Tv style={{ fontSize: 24, color: currentTheme.primary, marginBottom: '8px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                {formatTimeDetailed(stats.seriesMinutes)}
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Serien</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                background: '#f59e0b10',
                border: '1px solid #f59e0b25',
              }}
            >
              <Movie style={{ fontSize: 24, color: '#f59e0b', marginBottom: '8px' }} />
              <div style={{ fontSize: '18px', fontWeight: 700 }}>
                {formatTimeDetailed(stats.movieMinutes)}
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Filme</div>
            </div>
          </div>
        </motion.div>

        {/* Ratings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          style={{
            margin: '0 20px 24px',
            padding: '20px',
            borderRadius: '20px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <h3
            style={{
              margin: '0 0 16px',
              fontSize: '16px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Star style={{ fontSize: 20, color: '#fbbf24' }} />
            Deine Bewertungen
          </h3>

          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                background: '#fbbf2410',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>
                {stats.avgSeriesRating.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Ø Serien</div>
            </div>
            <div
              style={{
                flex: 1,
                padding: '16px',
                borderRadius: '14px',
                background: '#fbbf2410',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#fbbf24' }}>
                {stats.avgMovieRating.toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Ø Filme</div>
            </div>
          </div>
        </motion.div>

        {/* Top Genres */}
        {stats.topGenres.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            style={{
              margin: '0 20px 24px',
              padding: '20px',
              borderRadius: '20px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Category style={{ fontSize: 20, color: '#8b5cf6' }} />
              Top Genres
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.topGenres.map((genre, i) => (
                <motion.div
                  key={genre.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px' }}
                >
                  <span
                    style={{
                      width: '24px',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: i === 0 ? '#fbbf24' : currentTheme.text.muted,
                    }}
                  >
                    #{i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '4px',
                      }}
                    >
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{genre.name}</span>
                      <span style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                        {genre.count}
                      </span>
                    </div>
                    <div
                      style={{
                        height: '6px',
                        background: `${currentTheme.text.muted}20`,
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(genre.count / maxGenreCount) * 100}%` }}
                        transition={{ duration: 0.8, delay: 1 + i * 0.1 }}
                        style={{
                          height: '100%',
                          background: `linear-gradient(90deg, #8b5cf6, ${currentTheme.primary})`,
                          borderRadius: '3px',
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Top Providers */}
        {stats.topProviders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            style={{
              margin: '0 20px 24px',
              padding: '20px',
              borderRadius: '20px',
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <h3
              style={{
                margin: '0 0 16px',
                fontSize: '16px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Stream style={{ fontSize: 20, color: '#06b6d4' }} />
              Streaming-Dienste
            </h3>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.topProviders.map((provider, i) => (
                <motion.div
                  key={provider.name}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.1 + i * 0.1 }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '12px',
                    background: i === 0 ? `${currentTheme.primary}20` : `${currentTheme.text.muted}10`,
                    border: `1px solid ${i === 0 ? currentTheme.primary : currentTheme.text.muted}25`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '13px', fontWeight: 600 }}>{provider.name}</span>
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      background: `${currentTheme.text.muted}20`,
                      color: currentTheme.text.muted,
                    }}
                  >
                    {provider.count}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* This Week Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          style={{
            margin: '0 20px 120px',
            padding: '20px',
            borderRadius: '20px',
            background: `linear-gradient(135deg, ${currentTheme.status.success}15, ${currentTheme.primary}15)`,
            border: `1px solid ${currentTheme.status.success}30`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.primary})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LocalFireDepartment style={{ fontSize: 28, color: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800 }}>{stats.lastWeekWatched}</div>
              <div style={{ fontSize: '13px', color: currentTheme.text.muted }}>
                Episoden diese Woche
              </div>
            </div>
          </div>
        </motion.div>
    </PageLayout>
  );
};
