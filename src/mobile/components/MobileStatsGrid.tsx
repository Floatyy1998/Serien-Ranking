import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  Tv,
  Movie,
  Timer,
  Star,
  TrendingUp,
  PlayCircle,
  Schedule,
  Category,
  Stream,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { colors } from '../../theme';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  subValue?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color, subValue }) => (
  <Paper
    sx={{
      p: 2,
      background: colors.background.card,
      border: `1px solid ${colors.border.subtle}`,
      borderRadius: 2,
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      '&:active': {
        transform: 'scale(0.98)',
      },
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

export const MobileStatsGrid: React.FC = () => {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  
  // Helper function to get user rating
  const getUserRating = (rating: any): number => {
    if (!rating || !user?.uid) return 0;
    return rating[user.uid] || 0;
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!user?.uid) {
      console.warn('MobileStatsGrid: No user found');
      return {
        totalSeries: 0, watchedEpisodes: 0, totalEpisodes: 0, totalMovies: 0,
        watchedMovies: 0, timeString: '0m', totalHours: 0, avgSeriesRating: '0.0',
        avgMovieRating: '0.0', topGenre: 'Keine', topProvider: 'Keine',
        lastWeekWatched: 0, completedSeries: 0
      };
    }
    // Series stats
    const totalSeries = seriesList.length;
    
    // Count watched episodes including rewatches (like desktop)
    const watchedEpisodes = seriesList.reduce((acc, series) => {
      return acc + (series.seasons?.reduce((sAcc, season) => {
        return sAcc + (season.episodes?.reduce((epAcc, ep) => {
          if (ep.watched) {
            // Count rewatches like desktop does
            return epAcc + (ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1);
          }
          return epAcc;
        }, 0) || 0);
      }, 0) || 0);
    }, 0);
    
    const totalEpisodes = seriesList.reduce((acc, series) => {
      return acc + (series.seasons?.reduce((sAcc, season) => {
        return sAcc + (season.episodes?.length || 0);
      }, 0) || 0);
    }, 0);

    // Movies stats - count properly watched movies
    const totalMovies = movieList.length;
    const watchedMovies = movieList.filter((movie: any) => {
      // A movie is watched if it has a rating > 0 from current user
      const rating = getUserRating(movie.rating);
      return rating > 0;
    }).length;

    // Time stats - include rewatches like desktop
    const totalMinutesWatched = seriesList.reduce((acc, series) => {
      const runtime = series.episodeRuntime || 45;
      const watched = series.seasons?.reduce((sAcc, season) => {
        return sAcc + (season.episodes?.reduce((epAcc, ep) => {
          if (ep.watched) {
            // Count rewatches for time calculation
            return epAcc + (ep.watchCount && ep.watchCount > 1 ? ep.watchCount : 1);
          }
          return epAcc;
        }, 0) || 0);
      }, 0) || 0;
      return acc + (watched * runtime);
    }, 0) + movieList.reduce((acc: number, movie: any) => {
      const isWatched = getUserRating(movie.rating) > 0;
      return acc + (isWatched ? (movie.runtime || 120) : 0);
    }, 0);

    // Calculate years, days, hours like desktop
    const years = Math.floor(totalMinutesWatched / (365 * 24 * 60));
    const remainingAfterYears = totalMinutesWatched % (365 * 24 * 60);
    const days = Math.floor(remainingAfterYears / 1440);
    const hours = Math.floor((remainingAfterYears % 1440) / 60);
    const minutes = remainingAfterYears % 60;

    let timeString = '';
    if (years > 0) timeString += `${years}y `;
    if (days > 0) timeString += `${days}d `;
    if (hours > 0) timeString += `${hours}h `;
    if (minutes > 0) timeString += `${minutes}m`;
    if (!timeString) timeString = '0m';

    // Ratings - fix for series ratings
    const ratedSeries = seriesList.filter((s: any) => {
      const rating = getUserRating(s.rating);
      return rating > 0;
    });
    const avgSeriesRating = ratedSeries.length > 0 
      ? ratedSeries.reduce((acc: number, s: any) => acc + getUserRating(s.rating), 0) / ratedSeries.length
      : 0;
      
    const ratedMovies = movieList.filter((m: any) => getUserRating(m.rating) > 0);
    const avgMovieRating = ratedMovies.length > 0
      ? ratedMovies.reduce((acc: number, m: any) => acc + getUserRating(m.rating), 0) / ratedMovies.length
      : 0;

    // Genres - fix genre detection for different data structures
    const genreCounts: Record<string, number> = {};
    [...seriesList, ...movieList].forEach((item: any) => {
      // Handle different genre structures
      let genres: string[] = [];
      
      if (item.genre?.genres && Array.isArray(item.genre.genres)) {
        genres = item.genre.genres;
      } else if (item.genres && Array.isArray(item.genres)) {
        genres = item.genres.map((g: any) => typeof g === 'string' ? g : g.name);
      } else if (item.genre_ids && Array.isArray(item.genre_ids)) {
        // TMDB genre mapping would go here, but for now skip
        genres = [];
      }
      
      genres.forEach((genre: string) => {
        if (genre && typeof genre === 'string') {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        }
      });
    });
    const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Providers - fix provider detection with fallbacks
    const providerCounts: Record<string, number> = {};
    [...seriesList, ...movieList].forEach((item: any) => {
      // Try different provider data structures
      let providers: any[] = [];
      
      if (item.providers?.results?.DE?.flatrate) {
        providers = item.providers.results.DE.flatrate;
      } else if (item.providers?.results?.US?.flatrate) {
        providers = item.providers.results.US.flatrate;
      } else if (item.watch_providers?.results?.DE?.flatrate) {
        providers = item.watch_providers.results.DE.flatrate;
      } else if (item.flatrate) {
        providers = item.flatrate;
      }
      
      providers.forEach((provider: any) => {
        const name = provider.provider_name || provider.name;
        if (name && typeof name === 'string') {
          providerCounts[name] = (providerCounts[name] || 0) + 1;
        }
      });
    });
    const topProvider = Object.entries(providerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Keine';

    // Activity - fix date handling and add safety checks
    const lastWeekWatched = seriesList.reduce((acc, series) => {
      const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      
      if (!series.seasons) return acc;
      
      return acc + series.seasons.reduce((sAcc, season) => {
        if (!season.episodes) return sAcc;
        
        return sAcc + season.episodes.filter(ep => {
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
        }).length;
      }, 0);
    }, 0);

    return {
      totalSeries,
      watchedEpisodes,
      totalEpisodes,
      totalMovies,
      watchedMovies,
      timeString,
      totalHours: Math.round(totalMinutesWatched / 60),
      avgSeriesRating: avgSeriesRating > 0 ? avgSeriesRating.toFixed(1) : '0.0',
      avgMovieRating: avgMovieRating > 0 ? avgMovieRating.toFixed(1) : '0.0',
      topGenre,
      topProvider,
      lastWeekWatched,
      completedSeries: seriesList.filter(s => {
        if (!s.seasons || s.seasons.length === 0) return false;
        
        const total = s.seasons.reduce((acc, season) => {
          return acc + (season.episodes?.length || 0);
        }, 0);
        
        const watched = s.seasons.reduce((acc, season) => {
          return acc + (season.episodes?.filter(ep => ep.watched === true).length || 0);
        }, 0);
        
        return total > 0 && total === watched;
      }).length,
    };
  }, [seriesList, movieList, user]);

  return (
    <Box sx={{ mb: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
            color: colors.text.secondary,
            fontSize: '1.1rem',
          }}
        >
          Deine Statistiken
        </Typography>
        
        <IconButton
          onClick={() => setExpanded(!expanded)}
          sx={{
            color: colors.text.muted,
            p: 0.5,
          }}
        >
          {expanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Box>

      {/* Primary Stats Grid (Always visible) */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 1.5,
          mb: expanded ? 2 : 0,
        }}
      >
        <StatCard
          icon={<Tv sx={{ fontSize: 20 }} />}
          label="Serien"
          value={stats.totalSeries}
          color={colors.primary}
          subValue={`${stats.completedSeries} abgeschlossen`}
        />
        
        <StatCard
          icon={<Movie sx={{ fontSize: 20 }} />}
          label="Filme"
          value={stats.watchedMovies}
          color={colors.text.accent}
          subValue={`von ${stats.totalMovies}`}
        />
        
        <StatCard
          icon={<PlayCircle sx={{ fontSize: 20 }} />}
          label="Episoden"
          value={stats.watchedEpisodes}
          color={colors.status.success}
          subValue={`von ${stats.totalEpisodes}`}
        />
        
        <StatCard
          icon={<Timer sx={{ fontSize: 20 }} />}
          label="Watchzeit"
          value={stats.timeString}
          color={colors.status.warning}
          subValue={`${stats.totalHours} Stunden`}
        />
      </Box>

      {/* Extended Stats (Collapsible) */}
      <Collapse in={expanded}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 1.5,
          }}
        >
          <StatCard
            icon={<Star sx={{ fontSize: 20 }} />}
            label="Ø Serien"
            value={stats.avgSeriesRating}
            color={colors.status.warning}
            subValue="Bewertung"
          />
          
          <StatCard
            icon={<Star sx={{ fontSize: 20 }} />}
            label="Ø Filme"
            value={stats.avgMovieRating}
            color={colors.status.warning}
            subValue="Bewertung"
          />
          
          <StatCard
            icon={<Category sx={{ fontSize: 20 }} />}
            label="Top Genre"
            value={stats.topGenre}
            color={colors.primary}
          />
          
          <StatCard
            icon={<Stream sx={{ fontSize: 20 }} />}
            label="Top Provider"
            value={stats.topProvider}
            color={colors.text.accent}
          />
          
          <StatCard
            icon={<TrendingUp sx={{ fontSize: 20 }} />}
            label="Diese Woche"
            value={stats.lastWeekWatched}
            color={colors.status.success}
            subValue="Episoden"
          />
          
          <StatCard
            icon={<Schedule sx={{ fontSize: 20 }} />}
            label="Fortschritt"
            value={stats.totalEpisodes > 0 ? `${Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100)}%` : '0%'}
            color={colors.primary}
            subValue="Gesamt"
          />
        </Box>
      </Collapse>
    </Box>
  );
};