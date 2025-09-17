import {
  Category,
  ExpandLess,
  ExpandMore,
  Movie,
  Schedule,
  Star,
  Stream,
  Timer,
  TrendingUp,
  Tv,
} from '@mui/icons-material';
import { Box, Collapse, IconButton, Paper, Typography } from '@mui/material';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { useMovieList } from '../contexts/MovieListProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { calculateOverallRating } from '../lib/rating/rating';
import { colors } from '../theme';

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
      background: colors.background.card,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: onClick ? 'pointer' : 'default',
      '&:active': {
        transform: 'scale(0.98)',
      },
      '&:hover': onClick ? {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      } : {},
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        top: -20,
        right: -20,
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: `${color}15`,
        filter: 'blur(20px)',
      }}
    />

    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1.5,
          background: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}
      >
        {icon}
      </Box>
    </Box>

    <Typography
      variant="h5"
      sx={{
        fontWeight: 700,
        color: colors.text.secondary,
        fontSize: '1.3rem',
        mb: 0.5,
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
        letterSpacing: 0.5,
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
  const { seriesList } = useSeriesList();
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
    const today = new Date();
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
            (ep.watched as any) === 1 ||
            (ep.watched as any) === 'true' ||
            (ep.watchCount && ep.watchCount > 0)
          );

          // Also count episodes without air_date (they should be considered aired)
          if (ep.air_date) {
            const airDate = new Date(ep.air_date);
            if (airDate <= today) {
              totalAiredEpisodes++;
              if (isWatched) {
                watchedEpisodes++;
              }
            }
          } else {
            // No air_date means it's probably an old episode that's already aired
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
    const watchedMovies = movieList.filter((movie: any) => {
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
      const runtime = series.episodeRuntime || 45;

      series.seasons?.forEach((season) => {
        season.episodes?.forEach((ep) => {
          // Episode is watched if it has firstWatchedAt OR watched: true OR watchCount > 0
          const isWatched = !!(
            ep.firstWatchedAt ||
            ep.watched === true ||
            (ep.watched as any) === 1 ||
            (ep.watched as any) === 'true' ||
            (ep.watchCount && ep.watchCount > 0)
          );

          if (isWatched) {
            if (ep.air_date) {
              const airDate = new Date(ep.air_date);
              if (airDate <= today) {
                // Count rewatches for time calculation
                const count = ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;
                seriesMinutesWatched += runtime * count;
              }
            } else {
              // No air_date means it's probably an old episode that's already aired
              const count = ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1;
              seriesMinutesWatched += runtime * count;
            }
          }
        });
      });
    });

    // Movie watch time
    movieList.forEach((movie: any) => {
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
    const seriesWithRating = seriesList.filter((s: any) => {
      if (!s || s.nmr === undefined || s.nmr === null) return false;
      const rating = parseFloat(calculateOverallRating(s));
      return !isNaN(rating) && rating > 0;
    });

    const avgSeriesRating =
      seriesWithRating.length > 0
        ? seriesWithRating.reduce((acc, s) => acc + parseFloat(calculateOverallRating(s)), 0) /
          seriesWithRating.length
        : 0;

    const moviesWithRating = movieList.filter((m: any) => {
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
    [...seriesList, ...movieList].forEach((item: any) => {
      if (!item || item.nmr === undefined || item.nmr === null) return; // Only count valid items

      // Handle different genre structures
      let genres: string[] = [];

      if (item.genre?.genres && Array.isArray(item.genre.genres)) {
        genres = item.genre.genres;
      } else if (item.genres && Array.isArray(item.genres)) {
        genres = item.genres.map((g: any) => (typeof g === 'string' ? g : g.name));
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
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Providers - fix provider detection with the correct data structure
    const providerCounts: Record<string, number> = {};
    [...seriesList, ...movieList].forEach((item: any) => {
      if (!item || item.nmr === undefined || item.nmr === null) return; // Only count valid items

      // Check the actual provider structure used in the app
      let providers: any[] = [];

      // Main provider structure: item.provider.provider[]
      if (item.provider?.provider && Array.isArray(item.provider.provider)) {
        providers = item.provider.provider;
      }

      providers.forEach((provider: any) => {
        const name = provider.name || provider.provider_name;
        if (name && typeof name === 'string') {
          providerCounts[name] = (providerCounts[name] || 0) + 1;
        }
      });
    });
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
        if (!s || s.nmr === undefined || s.nmr === null || !s.seasons || s.seasons.length === 0) return false;

        // Only count aired episodes for completion
        let totalAired = 0;
        let watchedAired = 0;

        s.seasons.forEach((season) => {
          season.episodes?.forEach((ep) => {
            if (ep.air_date) {
              const airDate = new Date(ep.air_date);
              if (airDate <= today) {
                totalAired++;
                if (ep.watched === true) {
                  watchedAired++;
                }
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
            fontWeight: 600,
          }}
        >
          Deine Statistiken
        </Typography>

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
      </Box>

      {/* Progress Bar - Full Width */}
      <Paper
        sx={{
          p: 2,
          background: colors.background.card,
          border: `1px solid ${colors.border.subtle}`,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              background: `${colors.primary}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.primary,
            }}
          >
            <Schedule sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            sx={{ fontSize: '0.7rem', textTransform: 'uppercase', color: colors.text.muted }}
          >
            Dein Episoden-Fortschritt
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {stats.watchedEpisodes.toLocaleString('de-DE')}
          </Typography>
          <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: colors.text.muted }}>
            {stats.totalEpisodes.toLocaleString('de-DE')}
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            height: 8,
            background: colors.border.subtle,
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              height: '100%',
              width: `${stats.totalEpisodes > 0 ? (stats.watchedEpisodes / stats.totalEpisodes) * 100 : 0}%`,
              background: `linear-gradient(90deg, ${currentTheme.primary || colors.primary}, ${currentTheme.status?.success || colors.status.success})`,
              transition: 'width 0.3s ease',
            }}
          />
        </Box>

        <Typography sx={{ fontSize: '0.65rem', color: colors.text.muted, mt: 1 }}>
          {stats.totalEpisodes > 0
            ? `${Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100)}% geschafft • Noch ${(stats.totalEpisodes - stats.watchedEpisodes).toLocaleString('de-DE')} Episoden vor dir`
            : 'Keine Episoden'}
        </Typography>
      </Paper>

      {/* Primary 2 Stats (Always visible) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
          mb: expanded ? 1.5 : 0,
        }}
      >
        <StatCard
          icon={<Tv sx={{ fontSize: 20 }} />}
          label="Serien"
          value={stats.totalSeries}
          color={colors.primary}
          subValue={
            stats.completedSeries > 0
              ? `${stats.completedSeries} von ${stats.totalSeries} komplett`
              : 'In deiner Sammlung'
          }
          onClick={handleSeriesClick}
        />

        <StatCard
          icon={<Movie sx={{ fontSize: 20 }} />}
          label="Filme"
          value={stats.totalMovies}
          color={colors.text.accent}
          subValue={`${stats.watchedMovies} von ${stats.totalMovies} geschaut`}
          onClick={handleMoviesClick}
        />
      </Box>

      {/* Extended Stats (Collapsible) - Better organized */}
      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1.5,
          }}
        >
          {/* Watchzeit Details */}
          <StatCard
            icon={<Timer sx={{ fontSize: 20 }} />}
            label="Gesamte Watchzeit"
            value={stats.timeString}
            color={colors.status.warning}
          />

          <StatCard
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            label="Diese Woche"
            value={`${stats.lastWeekWatched} Episoden`}
            color={colors.status.success}
            subValue="neu geschaut"
            onClick={handleWeeklyEpisodesClick}
          />

          <StatCard
            icon={<Tv sx={{ fontSize: 20 }} />}
            label="Zeit mit Serien"
            value={stats.seriesTimeString}
            color={colors.primary}
          />

          <StatCard
            icon={<Movie sx={{ fontSize: 20 }} />}
            label="Zeit mit Filmen"
            value={stats.movieTimeString}
            color={colors.text.accent}
          />

          {/* Bewertungen */}
          <StatCard
            icon={<Star sx={{ fontSize: 20 }} />}
            label="Ø Serien-Bewertung"
            value={`⭐ ${stats.avgSeriesRating}`}
            color={colors.status.warning}
            onClick={handleSeriesRatingClick}
          />

          <StatCard
            icon={<Star sx={{ fontSize: 20 }} />}
            label="Ø Film-Bewertung"
            value={`⭐ ${stats.avgMovieRating}`}
            color={colors.status.warning}
            onClick={handleMovieRatingClick}
          />

          {/* Präferenzen */}
          <StatCard
            icon={<Category sx={{ fontSize: 20 }} />}
            label="Lieblingsgenre"
            value={stats.topGenre}
            color={colors.primary}
          />

          <StatCard
            icon={<Stream sx={{ fontSize: 20 }} />}
            label="Hauptprovider"
            value={stats.topProvider}
            color={colors.text.accent}
          />
        </Box>
      </Collapse>
    </Box>
  );
};
