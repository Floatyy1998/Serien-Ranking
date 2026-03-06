import {
  Category,
  ExpandLess,
  ExpandMore,
  Movie,
  Star,
  Stream,
  Timer,
  TrendingUp,
  Tv,
} from '@mui/icons-material';
import { Box, Collapse, IconButton, Paper, Tooltip, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { staggerContainer, staggerItem } from '../../lib/motion';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import { colors } from '../../theme';
import type { Movie as MovieType } from '../../types/Movie';
import type { Series } from '../../types/Series';
import { hasEpisodeAired } from '../../utils/episodeDate';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subValue?: string;
  onClick?: () => void;
}

const StatCard = ({ icon, label, value, color, subValue, onClick }: StatCardProps) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2,
      background:
        'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      borderRadius: 3,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      cursor: onClick ? 'pointer' : 'default',
      '&:active': {
        transform: 'scale(0.97)',
      },
      '&:hover': onClick
        ? {
            transform: 'translateY(-3px)',
            boxShadow: `0 8px 32px -8px rgba(0, 0, 0, 0.5), 0 0 20px -5px ${color}18`,
            borderColor: `${color}25`,
          }
        : {},
      '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '10%',
        right: '10%',
        height: '1px',
        background: `linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)`,
        pointerEvents: 'none',
      },
    }}
  >
    {/* Ambient color glow */}
    <Box
      sx={{
        position: 'absolute',
        top: -25,
        right: -25,
        width: 90,
        height: 90,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
        filter: 'blur(25px)',
      }}
    />

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${color}1a 0%, ${color}0a 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          border: `1px solid ${color}15`,
        }}
      >
        {icon}
      </Box>
    </Box>

    <Typography
      variant="h5"
      sx={{
        fontWeight: 700,
        fontFamily: 'var(--font-display)',
        color: colors.text.secondary,
        fontSize: '1.3rem',
        mb: 0.5,
        letterSpacing: '-0.02em',
      }}
    >
      {value}
    </Typography>

    <Typography
      variant="caption"
      sx={{
        color: colors.text.muted,
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: 0.8,
        opacity: 0.7,
      }}
    >
      {label}
    </Typography>

    {subValue && (
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          color: color,
          fontSize: '0.65rem',
          mt: 0.5,
          opacity: 0.8,
        }}
      >
        {subValue}
      </Typography>
    )}
  </Paper>
);

export const StatsGrid = () => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth()!;
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  // Calculate statistics
  const stats = useMemo(() => {
    if (!user?.uid) {
      return {
        totalSeries: 0,
        watchedEpisodes: 0,
        totalEpisodes: 0,
        totalMovies: 0,
        watchedMovies: 0,
        timeString: '0Min',
        totalHours: 0,
        seriesTimeString: '0Min',
        movieTimeString: '0Min',
        avgSeriesRating: '0.0',
        avgMovieRating: '0.0',
        topGenre: 'Keine',
        topProvider: 'Keine',
        lastWeekWatched: 0,
        completedSeries: 0,
      };
    }
    // Series stats - only count aired episodes
    // Allow nmr: 0 as valid
    const totalSeries = seriesList.filter((s) => s && s.nmr !== undefined && s.nmr !== null).length;

    // Count watched episodes (only aired ones)
    let watchedEpisodes = 0;
    let totalAiredEpisodes = 0;

    seriesList.forEach((series) => {
      // Allow nmr: 0 as valid (only skip if undefined/null)
      if (!series || series.nmr === undefined || series.nmr === null) return;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          // Episode is watched if it has firstWatchedAt OR watched: true OR watchCount > 0
          const isWatched = !!(
            ep.firstWatchedAt ||
            ep.watched === true ||
            (ep.watched as unknown) === 1 ||
            (ep.watched as unknown) === 'true' ||
            (ep.watchCount && ep.watchCount > 0)
          );

          if (hasEpisodeAired(ep) || !ep.air_date) {
            totalAiredEpisodes++;
            if (isWatched) {
              watchedEpisodes++;
            }
          }
        });
      });
    });

    const totalEpisodes = totalAiredEpisodes;

    // Movies stats - only count valid movies with ratings
    // Allow nmr: 0 as valid
    const totalMovies = movieList.filter((m) => m && m.nmr !== undefined && m.nmr !== null).length;
    const watchedMovies = movieList.filter((movie: MovieType) => {
      // Allow nmr: 0 as valid
      if (!movie || movie.nmr === undefined || movie.nmr === null) return false;
      // A movie is watched if it has a rating > 0
      const rating = parseFloat(calculateOverallRating(movie));
      return !isNaN(rating) && rating > 0;
    }).length;

    // Time stats - only count actually watched content
    let seriesMinutesWatched = 0;
    let moviesMinutesWatched = 0;

    // Series watch time
    seriesList.forEach((series) => {
      // Allow nmr: 0 as valid (only skip if undefined/null)
      if (!series || series.nmr === undefined || series.nmr === null) return;
      const seriesRuntime = series.episodeRuntime || 45;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          // Episode is watched if it has firstWatchedAt OR watched: true OR watchCount > 0
          const isWatched = !!(
            ep.firstWatchedAt ||
            ep.watched === true ||
            (ep.watched as unknown) === 1 ||
            (ep.watched as unknown) === 'true' ||
            (ep.watchCount && ep.watchCount > 0)
          );

          if (isWatched && (hasEpisodeAired(ep) || !ep.air_date)) {
            const epRuntime = ep.runtime || seriesRuntime;
            const count = ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;
            seriesMinutesWatched += epRuntime * count;
          }
        });
      });
    });

    // Movie watch time
    movieList.forEach((movie: MovieType) => {
      if (movie && movie.nmr !== undefined && movie.nmr !== null) {
        const rating = parseFloat(calculateOverallRating(movie));
        const isWatched = !isNaN(rating) && rating > 0;
        if (isWatched) {
          moviesMinutesWatched += movie.runtime || 120;
        }
      }
    });

    const totalMinutesWatched = seriesMinutesWatched + moviesMinutesWatched;

    // Calculate years, months, days, hours like desktop
    const years = Math.floor(totalMinutesWatched / (365 * 24 * 60));
    const remainingAfterYears = totalMinutesWatched % (365 * 24 * 60);
    const months = Math.floor(remainingAfterYears / (30 * 24 * 60));
    const remainingAfterMonths = remainingAfterYears % (30 * 24 * 60);
    const days = Math.floor(remainingAfterMonths / 1440);
    const hours = Math.floor((remainingAfterMonths % 1440) / 60);
    const minutes = remainingAfterMonths % 60;

    let timeString = '';
    if (years > 0) timeString += `${years}J `;
    if (months > 0) timeString += `${months}M `;
    if (days > 0) timeString += `${days}T `;
    if (hours > 0) timeString += `${hours}S `;
    if (minutes > 0) timeString += `${Math.floor(minutes)}Min`;
    if (!timeString) timeString = '0Min';

    // Format series and movie times separately
    const formatMinutesToString = (totalMinutes: number) => {
      const y = Math.floor(totalMinutes / (365 * 24 * 60));
      const remainingAfterY = totalMinutes % (365 * 24 * 60);
      const m = Math.floor(remainingAfterY / (30 * 24 * 60));
      const remainingAfterM = remainingAfterY % (30 * 24 * 60);
      const d = Math.floor(remainingAfterM / 1440);
      const h = Math.floor((remainingAfterM % 1440) / 60);
      const min = Math.floor(remainingAfterM % 60);

      let str = '';
      if (y > 0) str += `${y}J `;
      if (m > 0) str += `${m}M `;
      if (d > 0) str += `${d}T `;
      if (h > 0) str += `${h}S `;
      if (min > 0) str += `${min}Min`;
      return str.trim() || '0Min';
    };

    const seriesTimeString = formatMinutesToString(seriesMinutesWatched);
    const movieTimeString = formatMinutesToString(moviesMinutesWatched);

    // Ratings - calculate average ratings using calculateOverallRating (same as MobileRatingsPage)
    const seriesWithRating = seriesList.filter((s: Series) => {
      if (!s || s.nmr === undefined || s.nmr === null) return false;
      const rating = parseFloat(calculateOverallRating(s));
      return !isNaN(rating) && rating > 0;
    });

    const avgSeriesRating =
      seriesWithRating.length > 0
        ? seriesWithRating.reduce((acc, s) => acc + parseFloat(calculateOverallRating(s)), 0) /
          seriesWithRating.length
        : 0;

    const moviesWithRating = movieList.filter((m: MovieType) => {
      if (!m || m.nmr === undefined || m.nmr === null) return false;
      const rating = parseFloat(calculateOverallRating(m));
      return !isNaN(rating) && rating > 0;
    });

    const avgMovieRating =
      moviesWithRating.length > 0
        ? moviesWithRating.reduce((acc, m) => acc + parseFloat(calculateOverallRating(m)), 0) /
          moviesWithRating.length
        : 0;

    // Genres - fix genre detection and exclude "All"
    const genreCounts: Record<string, number> = {};
    ([...seriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item || item.nmr === undefined || item.nmr === null) return; // Only count valid items

        // Handle different genre structures
        let genres: string[] = [];

        if (item.genre?.genres && Array.isArray(item.genre.genres)) {
          genres = item.genre.genres;
        } else if (item.genres && Array.isArray(item.genres)) {
          genres = item.genres.map((g: string | { id: number; name: string }) =>
            typeof g === 'string' ? g : g.name
          );
        }

        genres.forEach((genre: string) => {
          // Exclude "All" and other invalid genres
          if (
            genre &&
            typeof genre === 'string' &&
            genre.toLowerCase() !== 'all' &&
            genre.toLowerCase() !== 'alle' &&
            genre.trim() !== ''
          ) {
            genreCounts[genre] = (genreCounts[genre] || 0) + 1;
          }
        });
      }
    );
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Providers - fix provider detection with the correct data structure
    const providerCounts: Record<string, number> = {};
    ([...seriesList, ...movieList] as (Series | MovieType)[]).forEach(
      (item: Series | MovieType) => {
        if (!item || item.nmr === undefined || item.nmr === null) return; // Only count valid items

        // Check the actual provider structure used in the app
        let providers: { id: number; logo: string; name: string }[] = [];

        // Main provider structure: item.provider.provider[]
        if (item.provider?.provider && Array.isArray(item.provider.provider)) {
          providers = item.provider.provider;
        }

        providers.forEach((provider: { id: number; logo: string; name: string }) => {
          const name = provider.name;
          if (name && typeof name === 'string') {
            providerCounts[name] = (providerCounts[name] || 0) + 1;
          }
        });
      }
    );
    const topProvider =
      Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Activity - fix date handling and add safety checks
    const lastWeekWatched = seriesList.reduce((acc, series) => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

      if (!series.seasons) return acc;

      return (
        acc +
        series.seasons.reduce((sAcc, season) => {
          if (!season.episodes) return sAcc;

          return (
            sAcc +
            season.episodes.filter((ep) => {
              if (!ep.firstWatchedAt) return false;

              try {
                // Handle different date formats
                let watchDate: Date;
                if (typeof ep.firstWatchedAt === 'string') {
                  watchDate = new Date(ep.firstWatchedAt);
                } else if (typeof ep.firstWatchedAt === 'number') {
                  watchDate = new Date(ep.firstWatchedAt);
                } else {
                  return false;
                }

                return !isNaN(watchDate.getTime()) && watchDate > oneWeekAgo;
              } catch {
                return false;
              }
            }).length
          );
        }, 0)
      );
    }, 0);

    return {
      totalSeries,
      watchedEpisodes,
      totalEpisodes,
      totalMovies,
      watchedMovies,
      timeString,
      totalHours: Math.round(totalMinutesWatched / 60),
      seriesTimeString,
      movieTimeString,
      avgSeriesRating: avgSeriesRating > 0 ? avgSeriesRating.toFixed(1) : '0.0',
      avgMovieRating: avgMovieRating > 0 ? avgMovieRating.toFixed(1) : '0.0',
      topGenre,
      topProvider,
      lastWeekWatched,
      completedSeries: seriesList.filter((s) => {
        if (!s || s.nmr === undefined || s.nmr === null || !s.seasons || s.seasons.length === 0)
          return false;

        // Only count aired episodes for completion
        let totalAired = 0;
        let watchedAired = 0;

        s.seasons.forEach((season) => {
          season.episodes?.forEach((ep) => {
            if (hasEpisodeAired(ep) || !ep.air_date) {
              totalAired++;
              if (ep.watched === true) {
                watchedAired++;
              }
            }
          });
        });

        return totalAired > 0 && totalAired === watchedAired;
      }).length,
    };
  }, [seriesList, movieList, user]);

  // Navigation handlers
  const handleSeriesClick = () => {
    navigate('/ratings'); // Default to series tab
  };

  const handleMoviesClick = () => {
    navigate('/ratings?tab=movies'); // Only this one goes to movies tab
  };

  const handleSeriesRatingClick = () => {
    navigate('/ratings'); // Default to series tab
  };

  const handleMovieRatingClick = () => {
    navigate('/ratings'); // Also default to series tab
  };

  const handleWeeklyEpisodesClick = () => {
    navigate('/watchlist');
  };

  const progressPct =
    stats.totalEpisodes > 0 ? Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100) : 0;

  // Circular ring SVG params
  const ringSize = 80;
  const ringStroke = 5;
  const ringRadius = (ringSize - ringStroke) / 2;
  const ringCircumference = ringRadius * 2 * Math.PI;
  const ringOffset = ringCircumference - (progressPct / 100) * ringCircumference;

  return (
    <Box>
      {/* Header with expand button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1.5,
        }}
      >
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: colors.text.secondary,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
          }}
        >
          Deine Statistiken
        </Typography>

        <Tooltip title={expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'} arrow>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              color: colors.text.muted,
              padding: '4px',
            }}
          >
            {expanded ? <ExpandLess sx={{ fontSize: 20 }} /> : <ExpandMore sx={{ fontSize: 20 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Bento Grid: Progress Ring (2 rows left) + Stat Tiles (right) */}
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: 'auto auto',
          gap: '12px',
          marginBottom: expanded ? '12px' : 0,
        }}
      >
        {/* Progress Ring - spans 2 rows on left */}
        <motion.div variants={staggerItem} style={{ gridRow: '1 / 3' }}>
          <Paper
            sx={{
              p: 2,
              height: '100%',
              background:
                'linear-gradient(135deg, rgba(255, 255, 255, 0.04) 0%, rgba(255, 255, 255, 0.015) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: 3,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              position: 'relative',
              overflow: 'hidden',
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: '10%',
                right: '10%',
                height: '1px',
                background:
                  'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.08), transparent)',
                pointerEvents: 'none',
              },
            }}
          >
            {/* Circular Progress Ring */}
            <Box sx={{ position: 'relative', width: ringSize, height: ringSize }}>
              <svg width={ringSize} height={ringSize}>
                <defs>
                  <linearGradient id="stats-ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={currentTheme.primary || colors.primary} />
                    <stop
                      offset="100%"
                      stopColor={currentTheme.status?.success || colors.status.success}
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.06)"
                  strokeWidth={ringStroke}
                />
                <circle
                  cx={ringSize / 2}
                  cy={ringSize / 2}
                  r={ringRadius}
                  fill="none"
                  stroke="url(#stats-ring-grad)"
                  strokeWidth={ringStroke}
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringOffset}
                  style={{
                    transform: 'rotate(-90deg)',
                    transformOrigin: 'center',
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </svg>
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    background: `linear-gradient(135deg, ${currentTheme.primary || colors.primary}, ${currentTheme.status?.success || colors.status.success})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {progressPct}%
                </Typography>
              </Box>
            </Box>

            <Typography
              sx={{
                fontSize: '0.65rem',
                color: colors.text.muted,
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {stats.watchedEpisodes.toLocaleString('de-DE')} /{' '}
              {stats.totalEpisodes.toLocaleString('de-DE')}
            </Typography>
            <Typography
              sx={{
                fontSize: '0.6rem',
                color: colors.text.muted,
                textAlign: 'center',
                opacity: 0.7,
              }}
            >
              Episoden
            </Typography>
          </Paper>
        </motion.div>

        {/* Serien tile - top right */}
        <motion.div variants={staggerItem}>
          <StatCard
            icon={<Tv sx={{ fontSize: 20 }} />}
            label="Serien"
            value={stats.totalSeries}
            color={colors.primary}
            subValue={stats.completedSeries > 0 ? `${stats.completedSeries} komplett` : undefined}
            onClick={handleSeriesClick}
          />
        </motion.div>

        {/* Filme tile - bottom right */}
        <motion.div variants={staggerItem}>
          <StatCard
            icon={<Movie sx={{ fontSize: 20 }} />}
            label="Filme"
            value={stats.totalMovies}
            color={colors.text.accent}
            subValue={`${stats.watchedMovies} geschaut`}
            onClick={handleMoviesClick}
          />
        </motion.div>
      </motion.div>

      {/* Extended Stats (Collapsible) */}
      <Collapse in={expanded}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={expanded ? 'visible' : 'hidden'}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}
        >
          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Timer sx={{ fontSize: 20 }} />}
              label="Gesamte Watchzeit"
              value={stats.timeString}
              color={colors.status.warning}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<TrendingUp sx={{ fontSize: 20 }} />}
              label="Diese Woche"
              value={`${stats.lastWeekWatched} Ep.`}
              color={colors.status.success}
              subValue="neu geschaut"
              onClick={handleWeeklyEpisodesClick}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Tv sx={{ fontSize: 20 }} />}
              label="Zeit mit Serien"
              value={stats.seriesTimeString}
              color={colors.primary}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Movie sx={{ fontSize: 20 }} />}
              label="Zeit mit Filmen"
              value={stats.movieTimeString}
              color={colors.text.accent}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Star sx={{ fontSize: 20 }} />}
              label="Ø Serien-Rating"
              value={stats.avgSeriesRating}
              color={colors.status.warning}
              onClick={handleSeriesRatingClick}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Star sx={{ fontSize: 20 }} />}
              label="Ø Film-Rating"
              value={stats.avgMovieRating}
              color={colors.status.warning}
              onClick={handleMovieRatingClick}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Category sx={{ fontSize: 20 }} />}
              label="Lieblingsgenre"
              value={stats.topGenre}
              color={colors.primary}
            />
          </motion.div>

          <motion.div variants={staggerItem}>
            <StatCard
              icon={<Stream sx={{ fontSize: 20 }} />}
              label="Hauptprovider"
              value={stats.topProvider}
              color={colors.text.accent}
            />
          </motion.div>
        </motion.div>
      </Collapse>
    </Box>
  );
};
