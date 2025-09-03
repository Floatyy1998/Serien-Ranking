import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FilterList, Close, 
  Star, NewReleases, Schedule, PlaylistAdd 
} from '@mui/icons-material';
import { genreMenuItems, providerMenuItems } from '../../config/menuItems';

interface MobileQuickFilterProps {
  onFilterChange: (filters: {
    genre?: string;
    provider?: string;
    quickFilter?: string;
    search?: string;
    sortBy?: string;
  }) => void;
  isMovieMode?: boolean;
  isRatingsMode?: boolean;
}

const seriesQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'new-episodes', label: 'Neue Episoden', icon: NewReleases },
  { value: 'started', label: 'Begonnen', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

const movieQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'unreleased', label: 'Unveröffentlicht', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

const ratingsQuickFilters = [
  { value: 'unrated', label: 'Ohne Bewertung', icon: Star },
  { value: 'started', label: 'Begonnen', icon: Schedule },
  { value: 'best-rated', label: 'Beste Bewertungen', icon: Star },
  { value: 'worst-rated', label: 'Schlechteste Bewertungen', icon: Star },
  { value: 'recently-rated', label: 'Zuletzt Bewertet', icon: Schedule },
  { value: 'recently-added', label: 'Zuletzt Hinzugefügt', icon: PlaylistAdd },
];

export const MobileQuickFilter: React.FC<MobileQuickFilterProps> = ({
  onFilterChange,
  isMovieMode = false,
  isRatingsMode = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<string>('rating-desc');
  
  const quickFilters = isRatingsMode 
    ? ratingsQuickFilters 
    : (isMovieMode ? movieQuickFilters : seriesQuickFilters);
  const activeFiltersCount = [selectedGenre, selectedProvider, selectedQuickFilter].filter(Boolean).length;

  useEffect(() => {
    onFilterChange({
      genre: selectedGenre,
      provider: selectedProvider,
      quickFilter: selectedQuickFilter,
      search: searchQuery,
      sortBy: selectedSort
    });
  }, [selectedGenre, selectedProvider, selectedQuickFilter, searchQuery, selectedSort]);

  const clearFilters = () => {
    setSelectedGenre('');
    setSelectedProvider('');
    setSelectedQuickFilter('');
    setSearchQuery('');
    setSelectedSort('rating-desc');
  };

  return (
    <>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '120px',  // Fixed height above navbar
          right: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          cursor: 'pointer',
          zIndex: 1000
        }}
      >
        <FilterList />
        {activeFiltersCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: '#ff4757',
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
            {activeFiltersCount}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                zIndex: 1100
              }}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'var(--color-background-elevated, #1a1a1a)',
                borderTopLeftRadius: '24px',
                borderTopRightRadius: '24px',
                padding: '24px',
                paddingBottom: 'calc(24px + env(safe-area-inset-bottom))',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 1200
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <h2 style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  margin: 0,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Filter & Sortierung
                </h2>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  {activeFiltersCount > 0 && (
                    <button
                      onClick={clearFilters}
                      style={{
                        background: 'rgba(255, 71, 87, 0.1)',
                        border: '1px solid rgba(255, 71, 87, 0.3)',
                        borderRadius: '20px',
                        padding: '6px 12px',
                        color: '#ff4757',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      Zurücksetzen
                    </button>
                  )}
                  
                  <button
                    onClick={() => setIsOpen(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '32px',
                      height: '32px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <Close />
                  </button>
                </div>
              </div>

              {/* Search */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '8px'
                }}>
                  Suche
                </label>
                <input
                  type="text"
                  placeholder={`${isMovieMode ? 'Film' : 'Serie'} suchen...`}
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

              {/* Quick Filters */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Schnellfilter
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '8px'
                }}>
                  {quickFilters.map((filter) => {
                    const Icon = filter.icon;
                    const isActive = selectedQuickFilter === filter.value;
                    
                    return (
                      <button
                        key={filter.value}
                        onClick={() => setSelectedQuickFilter(isActive ? '' : filter.value)}
                        style={{
                          padding: '12px',
                          background: isActive 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '12px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <Icon style={{ fontSize: '16px' }} />
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sort Options - Only for Ratings Mode */}
              {isRatingsMode && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.7)',
                    display: 'block',
                    marginBottom: '12px'
                  }}>
                    Sortierung
                  </label>
                  <select
                    value={selectedSort}
                    onChange={(e) => setSelectedSort(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  >
                    <option value="rating-desc" style={{ background: '#1a1a1a', color: 'white' }}>Beste zuerst</option>
                    <option value="rating-asc" style={{ background: '#1a1a1a', color: 'white' }}>Schlechteste zuerst</option>
                    <option value="name-asc" style={{ background: '#1a1a1a', color: 'white' }}>Name A-Z</option>
                    <option value="name-desc" style={{ background: '#1a1a1a', color: 'white' }}>Name Z-A</option>
                    <option value="date-desc" style={{ background: '#1a1a1a', color: 'white' }}>Neueste zuerst</option>
                  </select>
                </div>
              )}

              {/* Genre Filter */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Genre
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {genreMenuItems.map((genre) => {
                    const isActive = selectedGenre === genre.value;
                    
                    return (
                      <button
                        key={genre.value}
                        onClick={() => setSelectedGenre(isActive ? '' : genre.value)}
                        style={{
                          padding: '10px',
                          background: isActive 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '8px',
                          color: 'white',
                          fontSize: '12px',
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {genre.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Provider Filter */}
              <div>
                <label style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  display: 'block',
                  marginBottom: '12px'
                }}>
                  Streaming-Anbieter
                </label>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px'
                }}>
                  {providerMenuItems.map((provider) => {
                    const isActive = selectedProvider === provider.value;
                    
                    return (
                      <button
                        key={provider.value}
                        onClick={() => setSelectedProvider(isActive ? '' : provider.value)}
                        title={provider.label}
                        style={{
                          padding: '12px',
                          background: isActive 
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                          border: `1px solid ${isActive ? 'transparent' : 'rgba(255, 255, 255, 0.1)'}`,
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {(provider as any)?.icon ? (
                          <img 
                            src={(provider as any).icon} 
                            alt={provider.label}
                            style={{
                              width: '24px',
                              height: '24px',
                              objectFit: 'contain',
                              filter: isActive ? 'brightness(1.2)' : 'none'
                            }}
                          />
                        ) : (
                          <span style={{
                            fontSize: '8px',
                            fontWeight: 600,
                            color: 'white',
                            textAlign: 'center',
                            lineHeight: '1.1'
                          }}>
                            {provider.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};