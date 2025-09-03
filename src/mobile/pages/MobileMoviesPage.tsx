import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Movie, ArrowBack, Star, FilterList, 
  Search, Sort, CalendarToday, TrendingUp
} from '@mui/icons-material';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';
import { Movie as MovieType } from '../../types/Movie';
import { calculateOverallRating } from '../../lib/rating/rating';
import { MobileQuickFilter } from '../components/MobileQuickFilter';

export const MobileMoviesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { movieList } = useMovieList();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'rating'>('name');
  const [filterGenre, setFilterGenre] = useState<string>('all');
  
  // Get image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };
  
  // Get all unique genres
  const allGenres = useMemo(() => {
    const genres = new Set<string>();
    movieList.forEach(movie => {
      if (movie.genres && Array.isArray(movie.genres)) {
        movie.genres.forEach((g: any) => {
          const genre = typeof g === 'string' ? g : g.name;
          if (genre) genres.add(genre);
        });
      }
    });
    return Array.from(genres).sort();
  }, [movieList]);
  
  // Filter and sort movies
  const filteredMovies = useMemo(() => {
    let filtered = movieList.filter(movie => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!movie.title?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Genre filter
      if (filterGenre !== 'all') {
        const movieGenres = movie.genres?.map((g: any) => 
          typeof g === 'string' ? g : g.name
        ) || [];
        if (!movieGenres.includes(filterGenre)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'year':
          const yearA = parseInt(a.release_date?.split('-')[0] || '0');
          const yearB = parseInt(b.release_date?.split('-')[0] || '0');
          return yearB - yearA;
        case 'rating':
          const ratingA = parseFloat(calculateOverallRating(a));
          const ratingB = parseFloat(calculateOverallRating(b));
          return ratingB - ratingA;
        default:
          return (a.title || '').localeCompare(b.title || '');
      }
    });
    
    return filtered;
  }, [movieList, searchQuery, filterGenre, sortBy]);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-background-default, #000)', 
      color: 'white',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(255, 107, 107, 0.2) 0%, rgba(0, 0, 0, 0) 100%)',
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'rgba(255, 255, 255, 0.1)', 
              border: 'none', 
              color: 'white', 
              fontSize: '20px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
          >
            <ArrowBack />
          </button>
          
          <div>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #ff6b6b 0%, #ff4757 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Filme
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '14px',
              margin: '4px 0 0 0'
            }}>
              {filteredMovies.length} Filme
            </p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div style={{ marginBottom: '12px' }}>
          <input
            type="text"
            placeholder="Film suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
          <select
            value={filterGenre}
            onChange={(e) => setFilterGenre(e.target.value)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px'
            }}
          >
            <option value="all">Alle Genres</option>
            {allGenres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px'
            }}
          >
            <option value="name">Name</option>
            <option value="year">Jahr</option>
            <option value="rating">Bewertung</option>
          </select>
        </div>
      </header>
      
      {/* Movies Grid */}
      <div style={{ padding: '20px' }}>
        {filteredMovies.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <Movie style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
            <h3>Keine Filme gefunden</h3>
            <p>Versuche andere Suchkriterien</p>
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px' 
          }}>
            {filteredMovies.map((movie) => {
              const rating = parseFloat(calculateOverallRating(movie));
              
              return (
                <motion.div
                  key={movie.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(`/movie/${movie.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ position: 'relative' }}>
                    <img 
                      src={getImageUrl(movie.poster)} 
                      alt={movie.title}
                      style={{
                        width: '100%',
                        aspectRatio: '2/3',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        background: 'rgba(255, 255, 255, 0.05)'
                      }}
                    />
                    
                    {/* Rating Badge */}
                    {rating > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.8)',
                        borderRadius: '16px',
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        fontWeight: 600
                      }}>
                        <Star style={{ fontSize: '12px', color: '#ffd700' }} />
                        {rating.toFixed(1)}
                      </div>
                    )}
                  </div>
                  
                  <p style={{ 
                    fontSize: '12px',
                    fontWeight: 500,
                    margin: '8px 0 2px 0',
                    color: 'rgba(255, 255, 255, 0.9)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {movie.title}
                  </p>
                  
                  {movie.release_date && (
                    <p style={{ 
                      fontSize: '11px',
                      margin: 0,
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      {movie.release_date.split('-')[0]}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
        
        {/* QuickFilter FAB */}
        <MobileQuickFilter 
          onFilterChange={(filters) => {
            if (filters.search) setSearchQuery(filters.search);
            if (filters.genre) setFilterGenre(filters.genre);
            // Provider filter would need to be added to the filtering logic
          }}
          isMovieMode={true}
        />
      </div>
    </div>
  );
};