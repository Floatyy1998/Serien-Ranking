import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Add, Movie, FilterList,
  DragHandle, ArrowUpward, ArrowDownward,
  Tv, Star, Schedule, CheckCircle, Repeat,
  ExpandMore, ExpandLess
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';
import { Series } from '../../types/Series';

export const MobileWatchlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  
  const [activeTab, setActiveTab] = useState<'series'>('series');
  const [filterInput, setFilterInput] = useState('');
  const [sortOption, setSortOption] = useState('name-asc');
  const [showFilter, setShowFilter] = useState(false);
  const [watchlistOrder, setWatchlistOrder] = useState<number[]>([]);
  const [customOrderActive, setCustomOrderActive] = useState(
    localStorage.getItem('customOrderActive') === 'true'
  );
  const [showRewatches, setShowRewatches] = useState(false);
  
  // Load watchlist order from Firebase
  useEffect(() => {
    if (!user) return;
    
    const orderRef = firebase.database().ref(`users/${user.uid}/watchlistOrder`);
    orderRef.on('value', (snapshot) => {
      const order = snapshot.val();
      if (order && Array.isArray(order)) {
        setWatchlistOrder(order);
      }
    });
    
    return () => orderRef.off();
  }, [user]);
  
  // Get next unwatched episode for a series
  const getNextUnwatchedEpisode = (series: Series) => {
    if (!series.seasons) return null;
    
    for (let seasonIndex = 0; seasonIndex < series.seasons.length; seasonIndex++) {
      const season = series.seasons[seasonIndex];
      if (!season.episodes) continue;
      
      for (let episodeIndex = 0; episodeIndex < season.episodes.length; episodeIndex++) {
        const episode = season.episodes[episodeIndex];
        if (!episode.watched) {
          return {
            seasonIndex,
            episodeIndex,
            seasonNumber: season.seasonNumber,
            episode
          };
        }
      }
    }
    return null;
  };
  
  // Filter and sort series - ONLY WATCHLIST ITEMS
  const filteredSeries = useMemo(() => {
    let filtered = seriesList.filter(series => {
      // FIRST: Only show series in watchlist
      if (!series.watchlist) return false;
      
      // THEN: Filter by search input
      if (filterInput) {
        const searchTerm = filterInput.toLowerCase();
        return series.title?.toLowerCase().includes(searchTerm) ||
               (series.original_name?.toLowerCase().includes(searchTerm) || series.title?.toLowerCase().includes(searchTerm));
      }
      return true;
    });
    
    // Apply custom order or regular sorting
    if (customOrderActive && watchlistOrder.length > 0) {
      filtered.sort((a, b) => {
        const indexA = watchlistOrder.indexOf(a.id);
        const indexB = watchlistOrder.indexOf(b.id);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    } else {
      // Regular sorting
      filtered.sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return (a.title || '').localeCompare(b.title || '');
          case 'name-desc':
            return (b.title || '').localeCompare(a.title || '');
          case 'rating-desc':
            return ((user?.uid ? (b.rating?.[user.uid] || 0) : 0) || 0) - ((user?.uid ? (a.rating?.[user.uid] || 0) : 0) || 0);
          case 'rating-asc':
            return ((user?.uid ? (a.rating?.[user.uid] || 0) : 0) || 0) - ((user?.uid ? (b.rating?.[user.uid] || 0) : 0) || 0);
          default:
            return 0;
        }
      });
    }
    
    return filtered;
  }, [seriesList, filterInput, sortOption, customOrderActive, watchlistOrder]);
  
  // Get series with next episodes
  const seriesWithNextEpisodes = useMemo(() => {
    return filteredSeries
      .map(series => ({
        series,
        nextEpisode: getNextUnwatchedEpisode(series)
      }))
      .filter(item => item.nextEpisode !== null)
      .slice(0, 5); // Show max 5 next episodes
  }, [filteredSeries]);
  
  // Filter movies - ONLY WATCHLIST MOVIES (not watched)  
  const filteredMovies = useMemo(() => {
    let filtered = movieList.filter(movie => {
      // FIRST: Only show movies in watchlist (not watched yet)
      const userRating = user?.uid && movie.rating ? (movie.rating[user.uid] || 0) : 0;
      if (userRating > 0) return false; // Don't show watched movies
      
      // Check if movie is explicitly in watchlist or just unwatched
      // For now, we consider all unwatched movies as watchlist candidates
      
      // THEN: Filter by search input
      if (filterInput) {
        const searchTerm = filterInput.toLowerCase();
        return movie.title?.toLowerCase().includes(searchTerm);
      }
      return true;
    });
    
    // Sort movies
    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return (a.title || '').localeCompare(b.title || '');
        case 'name-desc':
          return (b.title || '').localeCompare(a.title || '');
        case 'rating-desc':
          return ((user?.uid ? (b.rating?.[user.uid] || 0) : 0) || 0) - ((user?.uid ? (a.rating?.[user.uid] || 0) : 0) || 0);
        case 'rating-asc':
          return ((user?.uid ? (a.rating?.[user.uid] || 0) : 0) || 0) - ((user?.uid ? (b.rating?.[user.uid] || 0) : 0) || 0);
        case 'year-desc':
          return parseInt(b.release_date?.split('-')[0] || '0') - parseInt(a.release_date?.split('-')[0] || '0');
        case 'year-asc':
          return parseInt(a.release_date?.split('-')[0] || '0') - parseInt(b.release_date?.split('-')[0] || '0');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [movieList, filterInput, sortOption]);
  
  // Move series up/down in custom order
  const moveSeriesInOrder = async (seriesId: number, direction: 'up' | 'down') => {
    const currentIndex = watchlistOrder.indexOf(seriesId);
    if (currentIndex === -1) return;
    
    const newOrder = [...watchlistOrder];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= newOrder.length) return;
    
    // Swap positions
    [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
    
    setWatchlistOrder(newOrder);
    
    // Save to Firebase
    if (user) {
      await firebase.database().ref(`users/${user.uid}/watchlistOrder`).set(newOrder);
    }
  };
  
  // Calculate series progress
  const getSeriesProgress = (series: Series) => {
    if (!series.seasons) return 0;
    
    let totalEpisodes = 0;
    let watchedEpisodes = 0;
    
    series.seasons.forEach(season => {
      if (season.episodes) {
        totalEpisodes += season.episodes.length;
        watchedEpisodes += season.episodes.filter(ep => ep.watched).length;
      }
    });
    
    return totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
  };
  
  // Rewatches temporarily disabled - complex system needs proper implementation
  const seriesWithRewatches = useMemo(() => [], []);
  
  // Movies rewatches disabled for now - movies don't have proper rewatch tracking
  const moviesWithRewatches = useMemo(() => [], []);
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: 'white',
      paddingBottom: '80px'
    }}>
      <header style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        background: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 100%)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Watchlist
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '16px',
              margin: '4px 0 0 0'
            }}>
              {`${filteredSeries.length} Serien`}
            </p>
          </div>
          
          <button
            onClick={() => setShowFilter(!showFilter)}
            style={{
              padding: '10px',
              background: showFilter ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <FilterList />
          </button>
        </div>
      </header>
      
      {/* Filter Section */}
      {showFilter && (
        <div style={{
          padding: '16px 20px',
          background: 'rgba(255, 255, 255, 0.02)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <input
            type="text"
            placeholder="Suchen..."
            value={filterInput}
            onChange={(e) => setFilterInput(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              marginBottom: '12px'
            }}
          />
          
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {activeTab === 'series' && (
              <button
                onClick={() => setCustomOrderActive(!customOrderActive)}
                style={{
                  padding: '8px 12px',
                  background: customOrderActive ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                <DragHandle style={{ fontSize: '16px', marginRight: '4px', verticalAlign: 'middle' }} />
                Eigene Reihenfolge
              </button>
            )}
            
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              style={{
                padding: '8px 12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '12px',
                cursor: 'pointer'
              }}
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="rating-desc">Beste Bewertung</option>
              <option value="rating-asc">Schlechteste Bewertung</option>
              {activeTab === 'movies' && (
                <>
                  <option value="year-desc">Neueste zuerst</option>
                  <option value="year-asc">Älteste zuerst</option>
                </>
              )}
            </select>
          </div>
        </div>
      )}
      
      
      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        <div>
            {/* Next Episodes Section */}
            {seriesWithNextEpisodes.length > 0 && (
              <section style={{ marginBottom: '32px' }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'rgba(255, 255, 255, 0.9)'
                }}>
                  <Schedule style={{ fontSize: '18px' }} />
                  Als Nächstes schauen
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {seriesWithNextEpisodes.map(({ series, nextEpisode }) => (
                    <div 
                      key={series.id} 
                      onClick={() => navigate(`/series/${series.id}`)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      {series.poster?.poster ? (
                        <img 
                          src={`https://image.tmdb.org/t/p/w92${series.poster.poster}`}
                          alt={series.title}
                          style={{
                            width: '60px',
                            height: '90px',
                            objectFit: 'cover',
                            borderRadius: '8px'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '90px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Tv style={{ fontSize: '24px', opacity: 0.3 }} />
                        </div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>{series.title}</h4>
                        <p style={{ fontSize: '12px', margin: 0, color: 'rgba(255, 255, 255, 0.5)' }}>
                          S{nextEpisode?.seasonNumber} E{(nextEpisode?.episodeIndex || 0) + 1} • {nextEpisode?.episode.name}
                        </p>
                        <div style={{ 
                          marginTop: '4px',
                          height: '2px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          borderRadius: '2px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            height: '100%',
                            width: `${getSeriesProgress(series)}%`,
                            background: 'linear-gradient(90deg, #667eea, #764ba2)',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            
            {/* Rewatches Section */}
            {(seriesWithRewatches.length > 0) && (
              <section style={{ marginBottom: '32px' }}>
                <button 
                  onClick={() => setShowRewatches(!showRewatches)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '16px',
                    fontWeight: 600,
                    marginBottom: '12px',
                    cursor: 'pointer'
                  }}
                >
                  <Repeat style={{ fontSize: '18px' }} />
                  Rewatches ({seriesWithRewatches.length})
                  {showRewatches ? <ExpandLess /> : <ExpandMore />}
                </button>
                
                {showRewatches && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {seriesWithRewatches.map(({ series, totalRewatches }) => (
                      <div 
                        key={series.id}
                        onClick={() => navigate(`/series/${series.id}`)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: 'rgba(255, 165, 0, 0.05)',
                          border: '1px solid rgba(255, 165, 0, 0.2)',
                          borderRadius: '12px',
                          padding: '12px',
                          cursor: 'pointer'
                        }}
                      >
                        {series.poster?.poster ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w92${series.poster.poster}`}
                            alt={series.title}
                            style={{
                              width: '40px',
                              height: '60px',
                              objectFit: 'cover',
                              borderRadius: '6px'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '40px',
                            height: '60px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Tv style={{ fontSize: '20px', opacity: 0.3 }} />
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <h4 style={{ fontSize: '14px', margin: '0 0 4px 0' }}>{series.title}</h4>
                          <p style={{ fontSize: '12px', margin: 0, color: 'rgba(255, 165, 0, 0.8)' }}>
                            {totalRewatches} Rewatch{totalRewatches > 1 ? 'es' : ''}
                          </p>
                        </div>
                        <Repeat style={{ fontSize: '20px', color: '#ffa500' }} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
            
            {/* All Series Section */}
            <section>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '12px',
                color: 'rgba(255, 255, 255, 0.9)'
              }}>
                Alle Serien
              </h3>
              
              {filteredSeries.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '40px 20px',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  <Tv style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                  <p>Keine Serien in deiner Watchlist</p>
                  <button
                    onClick={() => navigate('/search')}
                    style={{
                      marginTop: '16px',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      border: 'none',
                      borderRadius: '24px',
                      color: 'white',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    Serien entdecken
                  </button>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
                  gap: '12px' 
                }}>
                  {filteredSeries.map((series, index) => (
                    <div key={series.id} style={{ position: 'relative' }}>
                      {customOrderActive && (
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          right: '-8px',
                          zIndex: 10,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px'
                        }}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSeriesInOrder(series.id, 'up');
                            }}
                            disabled={index === 0}
                            style={{
                              padding: '4px',
                              background: index === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(102, 126, 234, 0.8)',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: index === 0 ? 'not-allowed' : 'pointer',
                              opacity: index === 0 ? 0.3 : 1
                            }}
                          >
                            <ArrowUpward style={{ fontSize: '12px' }} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              moveSeriesInOrder(series.id, 'down');
                            }}
                            disabled={index === filteredSeries.length - 1}
                            style={{
                              padding: '4px',
                              background: index === filteredSeries.length - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(102, 126, 234, 0.8)',
                              border: 'none',
                              borderRadius: '4px',
                              color: 'white',
                              cursor: index === filteredSeries.length - 1 ? 'not-allowed' : 'pointer',
                              opacity: index === filteredSeries.length - 1 ? 0.3 : 1
                            }}
                          >
                            <ArrowDownward style={{ fontSize: '12px' }} />
                          </button>
                        </div>
                      )}
                      
                      <div 
                        onClick={() => navigate(`/series/${series.id}`)}
                        style={{ cursor: 'pointer' }}
                      >
                        {series.poster?.poster ? (
                          <img 
                            src={`https://image.tmdb.org/t/p/w342${series.poster.poster}`}
                            alt={series.title}
                            style={{
                              width: '100%',
                              aspectRatio: '2/3',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              marginBottom: '8px'
                            }}
                          />
                        ) : (
                          <div style={{
                            width: '100%',
                            aspectRatio: '2/3',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '8px',
                            marginBottom: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <Tv style={{ fontSize: '32px', opacity: 0.3 }} />
                          </div>
                        )}
                        <p style={{ 
                          fontSize: '12px',
                          margin: 0,
                          color: 'rgba(255, 255, 255, 0.8)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {series.title}
                        </p>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          marginTop: '4px'
                        }}>
                          {(user?.uid ? (series.rating?.[user.uid] || 0) : 0) && (
                            <>
                              <Star style={{ fontSize: '12px', color: '#ffd700' }} />
                              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                                {((user?.uid ? (series.rating?.[user.uid] || 0) : 0) || 0).toFixed(1)}
                              </span>
                            </>
                          )}
                          {getSeriesProgress(series) === 100 && (
                            <CheckCircle style={{ fontSize: '12px', color: '#4caf50', marginLeft: 'auto' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
        </div>
      </div>
      
      {/* FAB */}
      <button style={{
        position: 'fixed',
        bottom: '90px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
        cursor: 'pointer'
      }}
      onClick={() => navigate('/search')}
      >
        <Add style={{ fontSize: '28px' }} />
      </button>
    </div>
  );
};