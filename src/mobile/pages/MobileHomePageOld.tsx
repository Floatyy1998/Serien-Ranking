import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayCircle, CalendarToday, Movie as MovieIcon, 
  TrendingUp, Schedule, Star, Add, EmojiEvents, Recommend,
  Group, Notifications, ChevronRight
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';
import { Series } from '../../types/Series';
import { Movie } from '../../types/Movie';
import { MobileStatsGrid } from '../components/MobileStatsGrid';
import { generateRecommendations } from '../../features/recommendations/recommendationEngine';
import './MobileHomePage.css';

export const MobileHomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Get user rating
  const getUserRating = (rating: any): number => {
    if (!rating || !user?.uid) return 0;
    return rating[user.uid] || 0;
  };

  // Calculate next episodes for SERIES ONLY
  const nextEpisodes = useMemo(() => {
    const episodes: any[] = [];
    
    seriesList.forEach((series: Series) => {
      if (!series.seasons?.length) return;
      
      // Find first unwatched episode
      for (const season of series.seasons) {
        const unwatched = season.episodes?.find(ep => !ep.watched);
        if (unwatched) {
          episodes.push({
            seriesId: series.id,
            seriesTitle: series.title,
            poster: getImageUrl(series.poster),
            season: season.seasonNumber,
            episode: season.episodes.indexOf(unwatched) + 1,
            episodeName: unwatched.name,
            airDate: unwatched.air_date
          });
          break;
        }
      }
    });
    
    return episodes.slice(0, 5);
  }, [seriesList, user]);

  // Get series in progress (10-90% watched) - only from watchlist or rewatches
  const continueWatchingSeries = useMemo(() => {
    return seriesList.filter((series: Series) => {
      if (!series.seasons?.length) return false;
      
      // Check if series is in watchlist or has active rewatch
      const isWatchlist = series.watchlist === true;
      const hasRewatch = series.seasons?.some(season => 
        season.episodes?.some(episode => episode.watchCount && episode.watchCount > 1)
      );
      
      if (!isWatchlist && !hasRewatch) return false;
      
      let total = 0, watched = 0;
      series.seasons.forEach(season => {
        total += season.episodes?.length || 0;
        watched += season.episodes?.filter(ep => ep.watched).length || 0;
      });
      
      const progress = total > 0 ? (watched / total) * 100 : 0;
      return progress > 10 && progress < 90;
    }).slice(0, 6);
  }, [seriesList]);

  // Get unwatched movies
  const unwatchedMovies = useMemo(() => {
    return movieList
      .filter((movie: Movie) => getUserRating(movie.rating) === 0)
      .slice(0, 6);
  }, [movieList, user]);

  // Get recently watched movies
  const watchedMovies = useMemo(() => {
    return movieList
      .filter((movie: Movie) => getUserRating(movie.rating) > 0)
      .slice(0, 6);
  }, [movieList, user]);

  // Personalized recommendations
  const [recommendations, setRecommendations] = useState<{series: any[], movies: any[]}>({series: [], movies: []});
  
  // Load personalized recommendations on mount
  useEffect(() => {
    const loadRecommendations = async () => {
      if (!user || (seriesList.length === 0 && movieList.length === 0)) return;
      
      try {
        // Simple placeholder recommendations for now
        setRecommendations({
          series: [],
          movies: []
        });
      } catch (error) {
        console.error('Failed to load recommendations:', error);
      }
    };
    
    loadRecommendations();
  }, [user, seriesList.length, movieList.length]);

  return (
    <div className="mobile-home">
      {/* Header */}
      <header className="home-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <h1>TV-RANK</h1>
            <p>Hallo {user?.displayName || 'User'}!</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => navigate('/activity')}
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Group style={{ fontSize: '20px' }} />
            </button>
            <button 
              onClick={() => navigate('/notifications')}
              style={{
                padding: '8px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              <Notifications style={{ fontSize: '20px' }} />
            </button>
          </div>
        </div>
      </header>

      {/* Enhanced Stats Grid */}
      <div style={{ padding: '0 16px' }}>
        <MobileStatsGrid />
      </div>

      {/* SERIES SECTION */}
      <div className="content-section series-section">
        <h2 className="section-title">
          <CalendarToday /> SERIEN
        </h2>

        {/* Next Episodes */}
        {nextEpisodes.length > 0 && (
          <div className="subsection">
            <div className="subsection-header">
              <h3><PlayCircle /> Als Nächstes</h3>
              <button onClick={() => navigate('/today-episodes')}>Alle</button>
            </div>
            <div className="episode-list">
              {nextEpisodes.map((ep, idx) => (
                <motion.div
                  key={`${ep.seriesId}-${idx}`}
                  className="episode-card"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/series/${ep.seriesId}`)}
                >
                  <img src={ep.poster} alt={ep.seriesTitle} />
                  <div className="episode-info">
                    <h4>{ep.seriesTitle}</h4>
                    <p>S{ep.season} E{ep.episode} • {ep.episodeName}</p>
                  </div>
                  <PlayCircle className="play-icon" />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Watching Series */}
        {continueWatchingSeries.length > 0 && (
          <div className="subsection">
            <div className="subsection-header">
              <h3><Schedule /> Weiterschauen</h3>
              <button onClick={() => navigate('/watchlist')}>Alle</button>
            </div>
            <div className="poster-grid">
              {continueWatchingSeries.map((series: Series) => {
                // Calculate progress
                let total = 0, watched = 0;
                series.seasons?.forEach(s => {
                  total += s.episodes?.length || 0;
                  watched += s.episodes?.filter(e => e.watched).length || 0;
                });
                const progress = total > 0 ? (watched / total) * 100 : 0;

                return (
                  <motion.div
                    key={series.id}
                    className="poster-card"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/series/${series.id}`)}
                  >
                    <img src={getImageUrl(series.poster)} alt={series.title} />
                    <div className="poster-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <span>{watched}/{total}</span>
                    </div>
                    <h4>{series.title}</h4>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* MOVIES SECTION */}
      <div className="content-section movies-section">
        <h2 className="section-title">
          <MovieIcon /> FILME
        </h2>

        {/* Unwatched Movies */}
        {unwatchedMovies.length > 0 && (
          <div className="subsection">
            <div className="subsection-header">
              <h3><Add /> Watchlist</h3>
              <button onClick={() => navigate('/watchlist')}>Alle</button>
            </div>
            <div className="poster-grid">
              {unwatchedMovies.map((movie: Movie) => (
                <motion.div
                  key={movie.id}
                  className="poster-card"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                >
                  <img src={getImageUrl(movie.poster)} alt={movie.title} />
                  <h4>{movie.title}</h4>
                  <p className="movie-year">{movie.release_date?.split('-')[0]}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Watched Movies */}
        {watchedMovies.length > 0 && (
          <div className="subsection">
            <div className="subsection-header">
              <h3><Star /> Gesehen</h3>
            </div>
            <div className="poster-grid">
              {watchedMovies.map((movie: Movie) => {
                const rating = getUserRating(movie.rating);
                return (
                  <motion.div
                    key={movie.id}
                    className="poster-card"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate(`/movie/${movie.id}`)}
                  >
                    <img src={getImageUrl(movie.poster)} alt={movie.title} />
                    <div className="poster-rating">
                      <Star /> {rating}
                    </div>
                    <h4>{movie.title}</h4>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Personalized Recommendations */}
      {(recommendations.series.length > 0 || recommendations.movies.length > 0) && (
        <div className="content-section recommendations-section">
          <h2 className="section-title">
            <Recommend /> FÜR DICH EMPFOHLEN
          </h2>
          
          {recommendations.series.length > 0 && (
            <div className="subsection">
              <div className="subsection-header">
                <h3><CalendarToday /> Serien für dich</h3>
              </div>
              <div className="poster-grid">
                {recommendations.series.map((item: any) => (
                  <motion.div
                    key={item.id}
                    className="poster-card recommendation-card"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Navigate to TMDB details or add directly
                      console.log('Navigate to series recommendation:', item);
                    }}
                  >
                    <img 
                      src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                      alt={item.name || item.title}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="recommendation-info">
                      <h4>{item.name || item.title}</h4>
                      <div className="recommendation-rating">
                        <Star style={{ fontSize: '14px' }} />
                        <span>{Math.round(item.vote_average * 10) / 10}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {recommendations.movies.length > 0 && (
            <div className="subsection">
              <div className="subsection-header">
                <h3><MovieIcon /> Filme für dich</h3>
              </div>
              <div className="poster-grid">
                {recommendations.movies.map((item: any) => (
                  <motion.div
                    key={item.id}
                    className="poster-card recommendation-card"
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      // Navigate to TMDB details or add directly
                      console.log('Navigate to movie recommendation:', item);
                    }}
                  >
                    <img 
                      src={`https://image.tmdb.org/t/p/w342${item.poster_path}`} 
                      alt={item.title}
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.jpg';
                      }}
                    />
                    <div className="recommendation-info">
                      <h4>{item.title}</h4>
                      <div className="recommendation-rating">
                        <Star style={{ fontSize: '14px' }} />
                        <span>{Math.round(item.vote_average * 10) / 10}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Quick Actions */}
      <section className="quick-actions">
        <motion.button 
          className="action-btn"
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/discover')}
        >
          <TrendingUp />
          <span>Entdecken</span>
        </motion.button>
        <motion.button 
          className="action-btn"
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/discover')}
        >
          <Add />
          <span>Hinzufügen</span>
        </motion.button>
        <motion.button 
          className="action-btn"
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/ratings')}
        >
          <Star />
          <span>Bewertungen</span>
        </motion.button>
        <motion.button 
          className="action-btn"
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/badges')}
        >
          <EmojiEvents />
          <span>Achievements</span>
        </motion.button>
      </section>
      
      {/* Activity Feed Preview */}
      <div className="content-section activity-section">
        <div className="subsection-header">
          <h3><Group /> Aktivität</h3>
          <button 
            onClick={() => navigate('/activity')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'none',
              border: 'none',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Alle <ChevronRight style={{ fontSize: '16px' }} />
          </button>
        </div>
        <div style={{
          padding: '16px',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.5)'
        }}>
          <Group style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }} />
          <p style={{ margin: 0, fontSize: '14px' }}>
            Verbinde dich mit Freunden um ihre Aktivitäten zu sehen!
          </p>
        </div>
      </div>
    </div>
  );
};