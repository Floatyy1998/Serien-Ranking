import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PlayCircle, ArrowBack,
  CheckBoxOutlineBlank, FilterList, Repeat,
  ArrowUpward, ArrowDownward, DragHandle,
  CheckCircle
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../../App';
import { Series } from '../../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { getNextRewatchEpisode, hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { useTheme } from '../../contexts/ThemeContext';
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
  const { currentTheme } = useTheme();
  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  // Always start with rewatches hidden on /watchlist
  const [showRewatches, setShowRewatches] = useState(false);
  const [customOrderActive, setCustomOrderActive] = useState(
    localStorage.getItem('watchNextCustomOrderActive') === 'true'
  );
  const [sortOption, setSortOption] = useState(
    localStorage.getItem('watchNextSortOption') || 'name-asc'
  );
  const [watchlistOrder, setWatchlistOrder] = useState<number[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [currentTouchIndex, setCurrentTouchIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [watchedEpisodes, setWatchedEpisodes] = useState<Set<string>>(new Set());
  // Removed tabs - only show next episodes
  
  // Save preferences to localStorage and ensure rewatches start hidden
  useEffect(() => {
    // Always set to false (hide rewatches) on mount
    setShowRewatches(false);
    localStorage.setItem('watchNextHideRewatches', 'true');
  }, []); // Only run on mount
  
  // Save when showRewatches changes after initial mount
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

  // Add non-passive touch event listeners when dragging is active
  useEffect(() => {
    if (draggedIndex !== null) {
      const handleTouchMoveNonPassive = (e: TouchEvent) => {
        // Only prevent default to stop scrolling
        e.preventDefault();
      };

      // Add non-passive listener to window to prevent scrolling during drag
      window.addEventListener('touchmove', handleTouchMoveNonPassive, { passive: false });
      
      // Store current scroll position and lock body
      const scrollY = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        window.removeEventListener('touchmove', handleTouchMoveNonPassive);
        
        // Restore scroll position
        const storedScrollY = parseInt(document.body.style.top || '0') * -1;
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.top = '';
        window.scrollTo(0, storedScrollY);
      };
    }
  }, [draggedIndex]);
  
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
            
            // Check if episode has aired
            if (!episode.air_date) continue; // Skip episodes without air date
            const airDate = new Date(episode.air_date);
            if (airDate > today) continue; // Skip future episodes
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

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent | React.TouchEvent, index: number) => {
    setDraggedIndex(index);
    if ('dataTransfer' in e) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setCurrentTouchIndex(index);
    }
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
    if (!customOrderActive) return;
    setDraggedIndex(index);
    setCurrentTouchIndex(index);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!customOrderActive || draggedIndex === null) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    // Find the element under the touch point using elementFromPoint
    // We need to temporarily hide the dragged element to find what's underneath
    const draggedElement = document.querySelectorAll('.episode-card')[draggedIndex] as HTMLElement;
    if (draggedElement) {
      draggedElement.style.pointerEvents = 'none';
    }
    
    const elementAtPoint = document.elementFromPoint(touch.clientX, currentY);
    
    if (draggedElement) {
      draggedElement.style.pointerEvents = '';
    }
    
    if (elementAtPoint) {
      const episodeCard = elementAtPoint.closest('.episode-card');
      if (episodeCard) {
        const elements = document.querySelectorAll('.episode-card');
        const index = Array.from(elements).indexOf(episodeCard);
        if (index !== -1) {
          setCurrentTouchIndex(index);
        }
      }
    }
  };
  
  const handleTouchEnd = async () => {
    if (draggedIndex === null || currentTouchIndex === null || draggedIndex === currentTouchIndex) {
      setDraggedIndex(null);
      setCurrentTouchIndex(null);
      return;
    }
    
    const newEpisodes = [...nextEpisodes];
    const draggedItem = newEpisodes[draggedIndex];
    newEpisodes.splice(draggedIndex, 1);
    newEpisodes.splice(currentTouchIndex, 0, draggedItem);
    
    // Update order in Firebase
    if (user && customOrderActive) {
      const newOrder = newEpisodes.map(ep => ep.seriesId);
      const uniqueOrder = [...new Set(newOrder)];
      setWatchlistOrder(uniqueOrder);
      await firebase.database().ref(`users/${user.uid}/watchlistOrder`).set(uniqueOrder);
    }
    
    setDraggedIndex(null);
    setCurrentTouchIndex(null);
  };

  return (
    <div ref={containerRef}>
      {/* Header */}
      <header style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: currentTheme.border.default, 
              border: 'none', 
              color: currentTheme.text.primary, 
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
              background: currentTheme.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Als Nächstes
            </h1>
            <p style={{ 
              color: currentTheme.text.secondary, 
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
              background: showFilter ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
              border: `1px solid ${currentTheme.border.default}`,
              borderRadius: '12px',
              color: currentTheme.text.primary,
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
            background: `${currentTheme.text.primary}0D`,
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
                background: `${currentTheme.text.primary}0D`,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '8px',
                color: currentTheme.text.primary,
                fontSize: '14px',
                marginBottom: '12px'
              }}
            />
            
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              overflowX: 'auto',
              scrollbarWidth: 'none' as any,
              msOverflowStyle: 'none' as any
            }}>
              <button
                onClick={() => setShowRewatches(!showRewatches)}
                style={{
                  padding: '8px 12px',
                  background: showRewatches ? `${currentTheme.status.warning}33` : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${showRewatches ? `${currentTheme.status.warning}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: showRewatches ? currentTheme.status.warning : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <Repeat style={{ fontSize: '16px' }} />
                Rewatches
              </button>
              
              <button
                onClick={() => setCustomOrderActive(!customOrderActive)}
                style={{
                  padding: '8px 12px',
                  background: customOrderActive ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${customOrderActive ? `${currentTheme.primary}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: customOrderActive ? currentTheme.primary : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <DragHandle style={{ fontSize: '16px' }} />
                Benutzerdefiniert
              </button>
              
              <button
                onClick={() => toggleSort('name')}
                style={{
                  padding: '8px 12px',
                  background: !customOrderActive && sortOption.startsWith('name') ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${!customOrderActive && sortOption.startsWith('name') ? `${currentTheme.primary}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: !customOrderActive && sortOption.startsWith('name') ? currentTheme.primary : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
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
                  background: !customOrderActive && sortOption.startsWith('date') ? `${currentTheme.primary}33` : `${currentTheme.text.primary}0D`,
                  border: `1px solid ${!customOrderActive && sortOption.startsWith('date') ? `${currentTheme.primary}4D` : currentTheme.border.default}`,
                  borderRadius: '8px',
                  color: !customOrderActive && sortOption.startsWith('date') ? currentTheme.primary : currentTheme.text.primary,
                  fontSize: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
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
                color: currentTheme.text.muted
              }}>
                <PlayCircle style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                <h3>Keine neuen Episoden</h3>
                <p>Schaue eine Serie an um hier die nächsten Episoden zu sehen!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <AnimatePresence>
                {nextEpisodes.map((episode, index) => {
                  const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                  const isBeingWatched = watchedEpisodes.has(episodeKey);
                  
                  return (
                  <motion.div
                    key={episodeKey}
                    className="episode-card"
                    initial={{ opacity: 1, x: 0 }}
                    animate={{
                      opacity: isBeingWatched ? 0 : 1,
                      x: isBeingWatched ? 50 : 0
                    }}
                    exit={{
                      opacity: 0,
                      x: 50,
                      transition: { duration: 0.3 }
                    }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                    whileTap={{ scale: 0.98 }}
                    draggable={customOrderActive}
                    onDragStart={(e) => handleDragStart(e as any, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e as any, index)}
                    onTouchStart={(e) => handleTouchStart(e, index)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: episode.isRewatch ? `${currentTheme.status.warning}0D` : `${currentTheme.status.success}08`,
                      border: currentTouchIndex === index && draggedIndex !== null && draggedIndex !== index
                        ? `2px solid ${currentTheme.primary}`
                        : episode.isRewatch 
                        ? `1px solid ${currentTheme.status.warning}4D` 
                        : `1px solid ${currentTheme.status.success}26`,
                      borderRadius: '10px',
                      padding: currentTouchIndex === index && draggedIndex !== null && draggedIndex !== index ? '7px' : '8px',
                      cursor: customOrderActive ? 'move' : 'pointer',
                      opacity: draggedIndex === index ? 0.6 : 1,
                      transform: draggedIndex === index 
                        ? 'scale(1.05)' 
                        : currentTouchIndex === index && draggedIndex !== null && draggedIndex !== index
                        ? 'scale(1.02)' 
                        : 'scale(1)',
                      boxShadow: draggedIndex === index 
                        ? `0 8px 24px ${currentTheme.primary}40`
                        : currentTouchIndex === index && draggedIndex !== null && draggedIndex !== index
                        ? `0 4px 12px ${currentTheme.primary}30`
                        : 'none',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Simple checkmark indicator */}
                    {isBeingWatched && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.2, type: 'spring', stiffness: 300 }}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          zIndex: 10
                        }}
                      >
                        <CheckCircle 
                          style={{ 
                            fontSize: '28px', 
                            color: currentTheme.status.success
                          }} 
                        />
                      </motion.div>
                    )}
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
                        color: episode.isRewatch ? currentTheme.status.warning : currentTheme.status.success 
                      }}>
                        S{(episode.seasonNumber ?? 0) + 1} E{episode.episodeNumber}
                        {episode.isRewatch && ` • ${episode.currentWatchCount}x → ${episode.targetWatchCount}x`}
                      </p>
                      <p style={{ 
                        fontSize: '12px', 
                        margin: 0, 
                        color: currentTheme.text.muted 
                      }}>
                        {episode.episodeName}
                      </p>
                      {episode.airDate && (
                        <p style={{ 
                          fontSize: '11px', 
                          margin: '4px 0 0 0', 
                          color: currentTheme.text.muted 
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
                        color: currentTheme.text.muted
                      }}>
                        <DragHandle style={{ fontSize: '20px' }} />
                      </div>
                    )}
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return;
                        
                        // Add to watched set for animation
                        const episodeKey = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
                        setWatchedEpisodes(prev => new Set([...prev, episodeKey]));
                        
                        // Wait a bit for animation to start
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
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
                          
                          // Badge-System für Rewatch
                          const { updateEpisodeCounters } = await import(
                            '../../features/badges/minimalActivityLogger'
                          );
                          await updateEpisodeCounters(user.uid, true, episode.airDate);
                        } else {
                          // Update firstWatchedAt if not set
                          const firstWatchedRef = firebase
                            .database()
                            .ref(`${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`);
                          const snapshot = await firstWatchedRef.once('value');
                          if (!snapshot.val()) {
                            await firstWatchedRef.set(new Date().toISOString());
                          }
                          
                          // Badge-System für normale Episode
                          const { updateEpisodeCounters } = await import(
                            '../../features/badges/minimalActivityLogger'
                          );
                          await updateEpisodeCounters(user.uid, false, episode.airDate);
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
                        {isBeingWatched ? (
                          <CheckCircle style={{ fontSize: '24px', color: currentTheme.status.success }} />
                        ) : (
                          <CheckBoxOutlineBlank style={{ fontSize: '24px', color: currentTheme.status.success }} />
                        )}
                      </button>
                  </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            )}
      </div>
    </div>
  );
};