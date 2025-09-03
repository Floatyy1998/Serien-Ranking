import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowBack,
  FilterList,
  Clear,
  Check,
  Movie,
  Tv,
  Star,
  Schedule,
  NewReleases,
  Visibility,
  Category,
  Stream,
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import './MobileFilterPage.css';

interface FilterState {
  type: 'all' | 'series' | 'movies';
  genres: string[];
  providers: string[];
  rating: { min: number; max: number };
  year: { min: number; max: number };
  status: string[];
  special: string[];
}

const specialFilters = {
  series: [
    { id: 'new-episodes', label: 'Neue Episoden', icon: <NewReleases /> },
    { id: 'no-rating', label: 'Ohne Bewertung', icon: <Star /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Schedule /> },
    { id: 'completed', label: 'Abgeschlossen', icon: <Check /> },
    { id: 'continuing', label: 'Läuft noch', icon: <Schedule /> },
  ],
  movies: [
    { id: 'unreleased', label: 'Unveröffentlicht', icon: <NewReleases /> },
    { id: 'no-rating', label: 'Ohne Bewertung', icon: <Star /> },
    { id: 'watchlist', label: 'Watchlist', icon: <Schedule /> },
    { id: 'watched', label: 'Gesehen', icon: <Visibility /> },
    { id: 'unwatched', label: 'Ungesehen', icon: <Check /> },
  ],
};

export const MobileFilterPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [filters, setFilters] = useState<FilterState>({
    type: 'all',
    genres: [],
    providers: [],
    rating: { min: 0, max: 10 },
    year: { min: 1900, max: new Date().getFullYear() },
    status: [],
    special: [],
  });

  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [availableProviders, setAvailableProviders] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'type' | 'genre' | 'provider' | 'rating' | 'year' | 'special'>('type');

  // Load saved filters from location state
  useEffect(() => {
    if (location.state?.filters) {
      setFilters(location.state.filters);
    }
  }, [location]);

  // Extract unique genres and providers
  useEffect(() => {
    const genres = new Set<string>();
    const providers = new Set<string>();

    [...seriesList, ...movieList].forEach((item: any) => {
      if (item.genre?.genres) {
        item.genre.genres.forEach((g: string) => genres.add(g));
      }
      if (item.providers?.results?.DE?.flatrate) {
        item.providers.results.DE.flatrate.forEach((p: any) => {
          providers.add(p.provider_name);
        });
      }
    });

    setAvailableGenres(Array.from(genres).sort());
    setAvailableProviders(Array.from(providers).sort());
  }, [seriesList, movieList]);

  const handleTypeToggle = (type: 'all' | 'series' | 'movies') => {
    setFilters(prev => ({ ...prev, type }));
    // Clear special filters when changing type
    setFilters(prev => ({ ...prev, special: [] }));
  };

  const handleGenreToggle = (genre: string) => {
    setFilters(prev => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter(g => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleProviderToggle = (provider: string) => {
    setFilters(prev => ({
      ...prev,
      providers: prev.providers.includes(provider)
        ? prev.providers.filter(p => p !== provider)
        : [...prev.providers, provider],
    }));
  };

  const handleSpecialToggle = (special: string) => {
    setFilters(prev => ({
      ...prev,
      special: prev.special.includes(special)
        ? prev.special.filter(s => s !== special)
        : [...prev.special, special],
    }));
  };

  const handleRatingChange = (type: 'min' | 'max', value: number) => {
    setFilters(prev => ({
      ...prev,
      rating: { ...prev.rating, [type]: value },
    }));
  };

  // const handleYearChange = (type: 'min' | 'max', value: number) => {
  //   setFilters(prev => ({
  //     ...prev,
  //     year: { ...prev.year, [type]: value },
  //   }));
  // };

  const handleApplyFilters = () => {
    // Navigate back with filters in state
    navigate('/mobile/discover');
  };

  const handleResetFilters = () => {
    setFilters({
      type: 'all',
      genres: [],
      providers: [],
      rating: { min: 0, max: 10 },
      year: { min: 1900, max: new Date().getFullYear() },
      status: [],
      special: [],
    });
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.type !== 'all') count++;
    count += filters.genres.length;
    count += filters.providers.length;
    if (filters.rating.min > 0 || filters.rating.max < 10) count++;
    if (filters.year.min > 1900 || filters.year.max < new Date().getFullYear()) count++;
    count += filters.special.length;
    return count;
  };

  return (
    <div className="mobile-filter-page">
      {/* Header */}
      <div className="filter-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowBack />
        </button>
        <div className="header-content">
          <h1>Filter</h1>
          {getActiveFiltersCount() > 0 && (
            <span className="filter-count">{getActiveFiltersCount()} aktiv</span>
          )}
        </div>
        <button onClick={handleResetFilters} className="reset-button">
          <Clear />
        </button>
      </div>

      {/* Section Tabs */}
      <div className="section-tabs">
        <button
          className={`section-tab ${activeSection === 'type' ? 'active' : ''}`}
          onClick={() => setActiveSection('type')}
        >
          Typ
        </button>
        <button
          className={`section-tab ${activeSection === 'genre' ? 'active' : ''}`}
          onClick={() => setActiveSection('genre')}
        >
          Genre
        </button>
        <button
          className={`section-tab ${activeSection === 'provider' ? 'active' : ''}`}
          onClick={() => setActiveSection('provider')}
        >
          Anbieter
        </button>
        <button
          className={`section-tab ${activeSection === 'rating' ? 'active' : ''}`}
          onClick={() => setActiveSection('rating')}
        >
          Bewertung
        </button>
        <button
          className={`section-tab ${activeSection === 'special' ? 'active' : ''}`}
          onClick={() => setActiveSection('special')}
        >
          Spezial
        </button>
      </div>

      {/* Filter Content */}
      <div className="filter-content">
        <AnimatePresence mode="wait">
          {/* Type Filter */}
          {activeSection === 'type' && (
            <motion.div
              key="type"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="filter-section"
            >
              <h2>Inhaltstyp</h2>
              <div className="type-filters">
                <motion.button
                  className={`type-button ${filters.type === 'all' ? 'active' : ''}`}
                  onClick={() => handleTypeToggle('all')}
                  whileTap={{ scale: 0.95 }}
                >
                  <FilterList />
                  <span>Alles</span>
                </motion.button>
                <motion.button
                  className={`type-button ${filters.type === 'series' ? 'active' : ''}`}
                  onClick={() => handleTypeToggle('series')}
                  whileTap={{ scale: 0.95 }}
                >
                  <Tv />
                  <span>Serien</span>
                </motion.button>
                <motion.button
                  className={`type-button ${filters.type === 'movies' ? 'active' : ''}`}
                  onClick={() => handleTypeToggle('movies')}
                  whileTap={{ scale: 0.95 }}
                >
                  <Movie />
                  <span>Filme</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Genre Filter */}
          {activeSection === 'genre' && (
            <motion.div
              key="genre"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="filter-section"
            >
              <h2>Genres</h2>
              <div className="filter-grid">
                {availableGenres.map(genre => (
                  <motion.button
                    key={genre}
                    className={`filter-chip ${filters.genres.includes(genre) ? 'active' : ''}`}
                    onClick={() => handleGenreToggle(genre)}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Category fontSize="small" />
                    <span>{genre}</span>
                    {filters.genres.includes(genre) && <Check fontSize="small" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Provider Filter */}
          {activeSection === 'provider' && (
            <motion.div
              key="provider"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="filter-section"
            >
              <h2>Streaming-Anbieter</h2>
              <div className="filter-grid">
                {availableProviders.map(provider => (
                  <motion.button
                    key={provider}
                    className={`filter-chip ${filters.providers.includes(provider) ? 'active' : ''}`}
                    onClick={() => handleProviderToggle(provider)}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Stream fontSize="small" />
                    <span>{provider}</span>
                    {filters.providers.includes(provider) && <Check fontSize="small" />}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Rating Filter */}
          {activeSection === 'rating' && (
            <motion.div
              key="rating"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="filter-section"
            >
              <h2>Bewertung</h2>
              <div className="range-filter">
                <div className="range-header">
                  <span>Minimum: {filters.rating.min}</span>
                  <Star />
                  <span>Maximum: {filters.rating.max}</span>
                </div>
                <div className="range-sliders">
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.rating.min}
                    onChange={(e) => handleRatingChange('min', parseFloat(e.target.value))}
                    className="range-slider"
                  />
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.5"
                    value={filters.rating.max}
                    onChange={(e) => handleRatingChange('max', parseFloat(e.target.value))}
                    className="range-slider"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Special Filters */}
          {activeSection === 'special' && (
            <motion.div
              key="special"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="filter-section"
            >
              <h2>Spezielle Filter</h2>
              {filters.type !== 'all' && (
                <div className="special-filters">
                  {(filters.type === 'series' ? specialFilters.series : specialFilters.movies).map(filter => (
                    <motion.button
                      key={filter.id}
                      className={`special-filter ${filters.special.includes(filter.id) ? 'active' : ''}`}
                      onClick={() => handleSpecialToggle(filter.id)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {filter.icon}
                      <span>{filter.label}</span>
                      {filters.special.includes(filter.id) && <Check />}
                    </motion.button>
                  ))}
                </div>
              )}
              {filters.type === 'all' && (
                <p className="info-text">Wähle zuerst einen Typ (Serien oder Filme) aus</p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Apply Button */}
      <div className="bottom-actions">
        <motion.button
          className="apply-button"
          onClick={handleApplyFilters}
          whileTap={{ scale: 0.95 }}
        >
          <FilterList />
          <span>Filter anwenden</span>
          {getActiveFiltersCount() > 0 && (
            <span className="badge">{getActiveFiltersCount()}</span>
          )}
        </motion.button>
      </div>
    </div>
  );
};