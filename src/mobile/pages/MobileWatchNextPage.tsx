import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayCircle, ArrowBack,
  CheckBoxOutlineBlank, FilterList, Repeat,
  ArrowUpward, ArrowDownward, DragHandle
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../../App';
import { Series } from '../../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { getNextRewatchEpisode, hasActiveRewatch } from '../../lib/validation/rewatch.utils';
// import { cleanOverlappingEpisodes } from '../../lib/episode/cleanOverlappingEpisodes';

interface NextEpisode {
  seriesId: number;
  seriesTitle: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
  airDate?: string;
  isRewatch?: boolean;
  currentWatchCount?: number;
  targetWatchCount?: number;
}

export const MobileWatchNextPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [showRewatches, setShowRewatches] = useState(
    localStorage.getItem('watchNextHideRewatches') !== 'false'
  );
  const [customOrderActive, setCustomOrderActive] = useState(
    localStorage.getItem('watchNextCustomOrderActive') === 'true'
  );
  const [sortOption, setSortOption] = useState(
    localStorage.getItem('watchNextSortOption') || 'name-asc'
  );
  const [watchlistOrder, setWatchlistOrder] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  // Removed tabs - only show next episodes
  
  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent | React.TouchEvent, index: number) => {
    setDraggedIndex(index);
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = async (e: React.DragEvent | React.TouchEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    
    const newEpisodes = [...nextEpisodes];
    const draggedItem = newEpisodes[draggedIndex];
    newEpisodes.splice(draggedIndex, 1);
    newEpisodes.splice(dropIndex, 0, draggedItem);
    
    // Update order in Firebase
    if (user && customOrderActive) {
      const newOrder = newEpisodes.map(ep => ep.seriesId);
      // Remove duplicates and keep first occurrence
      const uniqueOrder = [...new Set(newOrder)];
      setWatchlistOrder(uniqueOrder);
      await firebase.database().ref(`users/${user.uid}/watchlistOrder`).set(uniqueOrder);
    }
    
    setDraggedIndex(null);
  };
  
  const handleTouchStart = (_e: React.TouchEvent, index: number) => {
    setDraggedIndex(index);
  };
  
  const handleTouchEnd = async (e: React.TouchEvent, dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    await handleDrop(e, dropIndex);
  };
  
  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('watchNextHideRewatches', (!showRewatches).toString());
  }, [showRewatches]);
  
  useEffect(() => {
    localStorage.setItem('watchNextCustomOrderActive', customOrderActive.toString());
  }, [customOrderActive]);
  
  useEffect(() => {
    localStorage.setItem('watchNextSortOption', sortOption);
  }, [sortOption]);
  
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
  
  // Helper functions
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };
  
  // Toggle sort function
  const toggleSort = (field: string) => {
    if (customOrderActive) {
      setCustomOrderActive(false);
      setSortOption(`${field}-asc`);
    } else if (sortOption.startsWith(field)) {
      setSortOption(`${field}-${sortOption.endsWith('asc') ? 'desc' : 'asc'}`);
    } else {
      setSortOption(`${field}-asc`);
    }
  };

  // Get next unwatched episodes from series with progress
  const nextEpisodes = useMemo(() => {
    const episodes: NextEpisode[] = [];
    const rewatches: NextEpisode[] = [];
    const today = new Date();
    
    // All series in watchlist
    const seriesInWatchlist = seriesList.filter(series => {
      if (!series.watchlist) return false; // MUST be in watchlist
      // Check if seasons exists and has content
      if (!series.seasons) return false;
      // Handle both array and object formats
      const seasonsArray = Array.isArray(series.seasons) 
        ? series.seasons 
        : Object.values(series.seasons);
      if (!seasonsArray.length) return false;
      return true;
    });
    
    
    seriesInWatchlist.forEach((series: Series) => {
      // Apply filter if set
      if (filterInput) {
        const searchTerm = filterInput.toLowerCase();
        if (!series.title?.toLowerCase().includes(searchTerm)) {
          return;
        }
      }
      
      // Convert seasons to array if needed
      const seasonsArray: typeof series.seasons = Array.isArray(series.seasons) 
        ? series.seasons 
        : Object.values(series.seasons) as typeof series.seasons;
      
      // If showing rewatches, ONLY show series with active rewatches
      if (showRewatches) {
        if (hasActiveRewatch(series)) {
          const rewatchEpisode = getNextRewatchEpisode(series);
          if (rewatchEpisode) {
            // Find the correct season index based on seasonNumber
            const seasonIndex = seasonsArray.findIndex(s => s.seasonNumber === rewatchEpisode.seasonNumber);
            if (seasonIndex !== -1) {
              rewatches.push({
                seriesId: series.id,
                seriesTitle: series.title,
                poster: getImageUrl(series.poster),
                seasonIndex: seasonIndex,
                episodeIndex: rewatchEpisode.episodeIndex,
                seasonNumber: rewatchEpisode.seasonNumber,
                episodeNumber: rewatchEpisode.episodeIndex + 1,
                episodeName: rewatchEpisode.name || `Episode ${rewatchEpisode.episodeIndex + 1}`,
                airDate: rewatchEpisode.air_date,
                isRewatch: true,
                currentWatchCount: rewatchEpisode.currentWatchCount,
                targetWatchCount: rewatchEpisode.targetWatchCount
              });
            }
          }
        }
      } else {
        // Normal mode: show next unwatched episodes
        let foundUnwatched = false;
        
        // Find first unwatched episode that has already aired
        for (const [seasonIndex, season] of seasonsArray.entries()) {
          const episodesList: typeof season.episodes = Array.isArray(season.episodes) 
            ? season.episodes 
            : season.episodes ? Object.values(season.episodes) as typeof season.episodes : [];
          
          if (!episodesList.length) continue;
          
          for (const [episodeIndex, episode] of episodesList.entries()) {
            if (episode.watched) continue;
            
            // Check if episode has aired (if air_date exists)
            if (episode.air_date) {
              const airDate = new Date(episode.air_date);
              if (airDate > today) continue; // Skip future episodes
            }
            episodes.push({
              seriesId: series.id,
              seriesTitle: series.title,
              poster: getImageUrl(series.poster),
              seasonIndex,
              episodeIndex,
              seasonNumber: season.seasonNumber,
              episodeNumber: episodeIndex + 1,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              airDate: episode.air_date
            });
            foundUnwatched = true;
            break; // Only first unwatched per series
          }
          
          if (foundUnwatched) break;
        }
      }
    });
    
    // Return only the appropriate episodes based on mode
    const sortedEpisodes = showRewatches ? rewatches : episodes;
    
    if (!customOrderActive) {
      const [field, order] = sortOption.split('-');
      const orderMultiplier = order === 'asc' ? 1 : -1;
      
      sortedEpisodes.sort((a, b) => {
        if (field === 'name') {
          return a.seriesTitle.localeCompare(b.seriesTitle) * orderMultiplier;
        } else if (field === 'date') {
          if (a.airDate && b.airDate) {
            return (new Date(a.airDate).getTime() - new Date(b.airDate).getTime()) * orderMultiplier;
          }
          return 0;
        }
        return 0;
      });
    } else if (watchlistOrder.length > 0) {
      // Apply custom order
      sortedEpisodes.sort((a, b) => {
        const indexA = watchlistOrder.indexOf(a.seriesId);
        const indexB = watchlistOrder.indexOf(b.seriesId);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
    }
    
    return sortedEpisodes;
  }, [seriesList, filterInput, showRewatches, sortOption, customOrderActive, watchlistOrder]);


  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: 'white',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.2) 0%, rgba(0, 0, 0, 0) 100%)'
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
          
          <div style={{ flex: 1 }}>
            <h1 style={{ 
              fontSize: '24px', 
              fontWeight: 800,
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Als Nächstes
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '14px',
              margin: '4px 0 0 0'
            }}>
              {nextEpisodes.length} nächste Episoden
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
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <FilterList />
          </button>
        </div>
        
        {/* Filter Section */}
        {showFilter && (
          <div style={{
            marginTop: '16px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '8px'
          }}>
            <input
              type="text"
              placeholder="Serie suchen..."
              value={filterInput}
              onChange={(e) => setFilterInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowRewatches(!showRewatches)}
                style={{
                  padding: '8px 12px',
                  background: showRewatches ? 'rgba(255, 152, 0, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${showRewatches ? 'rgba(255, 152, 0, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: showRewatches ? '#ff9800' : 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Repeat style={{ fontSize: '16px' }} />
                Rewatches
              </button>
              
              <button
                onClick={() => setCustomOrderActive(!customOrderActive)}
                style={{
                  padding: '8px 12px',
                  background: customOrderActive ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${customOrderActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: customOrderActive ? '#667eea' : 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <DragHandle style={{ fontSize: '16px' }} />
                Benutzerdefiniert
              </button>
              
              <button
                onClick={() => toggleSort('name')}
                style={{
                  padding: '8px 12px',
                  background: !customOrderActive && sortOption.startsWith('name') ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${!customOrderActive && sortOption.startsWith('name') ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: !customOrderActive && sortOption.startsWith('name') ? '#667eea' : 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Name
                {!customOrderActive && sortOption.startsWith('name') && (
                  sortOption.endsWith('asc') ? 
                    <ArrowUpward style={{ fontSize: '14px' }} /> : 
                    <ArrowDownward style={{ fontSize: '14px' }} />
                )}
              </button>
              
              <button
                onClick={() => toggleSort('date')}
                style={{
                  padding: '8px 12px',
                  background: !customOrderActive && sortOption.startsWith('date') ? 'rgba(102, 126, 234, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                  border: `1px solid ${!customOrderActive && sortOption.startsWith('date') ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  borderRadius: '8px',
                  color: !customOrderActive && sortOption.startsWith('date') ? '#667eea' : 'white',
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                Datum
                {!customOrderActive && sortOption.startsWith('date') && (
                  sortOption.endsWith('asc') ? 
                    <ArrowUpward style={{ fontSize: '14px' }} /> : 
                    <ArrowDownward style={{ fontSize: '14px' }} />
                )}
              </button>
            </div>
          </div>
        )}
      </header>
      
      
      {/* Content */}
      <div style={{ padding: '0 20px' }}>
        {nextEpisodes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: 'rgba(255, 255, 255, 0.5)'
              }}>
                <PlayCircle style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                <h3>Keine neuen Episoden</h3>
                <p>Schaue eine Serie an um hier die nächsten Episoden zu sehen!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {nextEpisodes.map((episode, index) => (
                  <motion.div
                    key={`${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`}
                    whileTap={{ scale: 0.98 }}
                    draggable={customOrderActive}
                    onDragStart={(e) => handleDragStart(e as any, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e as any, index)}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchEnd={(e) => handleTouchEnd(e, index)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: episode.isRewatch ? 'rgba(255, 152, 0, 0.05)' : 'rgba(0, 212, 170, 0.03)',
                      border: episode.isRewatch ? '1px solid rgba(255, 152, 0, 0.3)' : '1px solid rgba(0, 212, 170, 0.15)',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: customOrderActive ? 'move' : 'pointer',
                      opacity: draggedIndex === index ? 0.5 : 1,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <img 
                      src={episode.poster} 
                      alt={episode.seriesTitle}
                      onClick={() => navigate(`/series/${episode.seriesId}`)}
                      style={{
                        width: '48px',
                        height: '72px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    />
                    <div style={{ flex: 1 }} onClick={() => navigate(`/series/${episode.seriesId}`)}>
                      <h4 style={{ fontSize: '14px', fontWeight: 600, margin: '0 0 2px 0' }}>
                        {episode.seriesTitle}
                      </h4>
                      <p style={{ 
                        fontSize: '13px', 
                        fontWeight: 500,
                        margin: '0 0 2px 0',
                        color: episode.isRewatch ? '#ff9800' : '#00d4aa' 
                      }}>
                        S{(episode.seasonNumber || 0) + 1} E{episode.episodeNumber}
                        {episode.isRewatch && ` • ${episode.currentWatchCount}x → ${episode.targetWatchCount}x`}
                      </p>
                      <p style={{ 
                        fontSize: '12px', 
                        margin: 0, 
                        color: 'rgba(255, 255, 255, 0.5)' 
                      }}>
                        {episode.episodeName}
                      </p>
                      {episode.airDate && (
                        <p style={{ 
                          fontSize: '11px', 
                          margin: '4px 0 0 0', 
                          color: 'rgba(255, 255, 255, 0.4)' 
                        }}>
                          {new Date(episode.airDate).toLocaleDateString('de-DE')}
                        </p>
                      )}
                    </div>
                    {customOrderActive && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '4px',
                        color: 'rgba(255, 255, 255, 0.4)'
                      }}>
                        <DragHandle style={{ fontSize: '20px' }} />
                      </div>
                    )}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return;
                        
                        // Mark episode as watched in Firebase
                        const series = seriesList.find(s => s.id === episode.seriesId);
                        if (!series) return;
                        
                        const watchedRef = firebase
                          .database()
                          .ref(`${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`);
                        await watchedRef.set(true);
                        
                        // Handle rewatch: increment watchCount
                        if (episode.isRewatch) {
                          const watchCountRef = firebase
                            .database()
                            .ref(`${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watchCount`);
                          const newCount = (episode.currentWatchCount || 0) + 1;
                          await watchCountRef.set(newCount);
                        } else {
                          // Update firstWatchedAt if not set
                          const firstWatchedRef = firebase
                            .database()
                            .ref(`${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`);
                          const snapshot = await firstWatchedRef.once('value');
                          if (!snapshot.val()) {
                            await firstWatchedRef.set(new Date().toISOString());
                          }
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      >
                        <CheckBoxOutlineBlank style={{ fontSize: '24px', color: '#00d4aa' }} />
                      </button>
                  </motion.div>
                ))}
              </div>
            )}
      </div>
    </div>
  );
};