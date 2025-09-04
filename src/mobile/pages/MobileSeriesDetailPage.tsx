import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowBack, PlayCircle, Star, Check, 
  Info, Delete, List, People,
  ExpandMore, ExpandLess, Visibility,
  DateRange, Repeat, BookmarkAdd, BookmarkRemove
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../../App';
import { logSeriesAdded } from '../../features/badges/minimalActivityLogger';
import { Series } from '../../types/Series';
import { MobileProviderBadges } from '../components/MobileProviderBadges';
import { MobileCastCrew } from '../components/MobileCastCrew';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import { useTheme } from '../../contexts/ThemeContext';

export const MobileSeriesDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const {} = useTheme();
  const [expandedSeasons, setExpandedSeasons] = useState<Set<number>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showRewatchDialog, setShowRewatchDialog] = useState<{show: boolean, type: 'episode' | 'season', item: any}>({show: false, type: 'episode', item: null});
  const [activeTab, setActiveTab] = useState<'info' | 'cast'>('info');
  const [tmdbSeries, setTmdbSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Firebase batch updates ready if needed
  // Using API instead of direct Firebase updates
  // const { flushBatch } = useFirebaseBatch({
  //   batchSize: 3,
  //   delayMs: 500,
  //   maxDelayMs: 1500
  // });
  
  // Find the series locally first
  const localSeries = useMemo(() => {
    return seriesList.find((s: Series) => s.id.toString() === id);
  }, [seriesList, id]);

  // Fetch from TMDB if not found locally
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!localSeries && id && apiKey && !tmdbSeries) {
      setLoading(true);
      fetch(`https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}&language=de-DE&append_to_response=credits`)
        .then(res => res.json())
        .then(data => {
          if (data.id) {
            // Transform TMDB data to match our Series type
            const series: Series = {
              id: data.id,
              nmr: 0, // No nmr for non-user series
              title: data.name,
              name: data.name,
              poster: { poster: data.poster_path },
              genre: { genres: data.genres?.map((g: any) => g.name) || [] },
              provider: { provider: [] },
              seasons: data.seasons || [],
              first_air_date: data.first_air_date,
              status: data.status,
              rating: {},
              watchlist: false,
              overview: data.overview,
              backdrop: data.backdrop_path,
              // Required fields with defaults
              begründung: '',
              beschreibung: data.overview || '',
              episodeCount: 0,
              episodeRuntime: 0,
              imdb: { imdb_id: '' },
              nextEpisode: { episode: 0, nextEpisode: '', nextEpisodes: [], season: 0 },
              origin_country: data.origin_country || [],
              original_language: data.original_language || '',
              original_name: data.original_name || data.name || '',
              popularity: data.popularity || 0,
              vote_average: data.vote_average || 0,
              vote_count: data.vote_count || 0,
              seasonCount: data.seasons?.length || 0,
              tvMaze: { tvMazeID: 0 },
              watchtime: 0,
              wo: { wo: '' },
              release_date: data.first_air_date || ''
            };
            setTmdbSeries(series);
          }
        })
        .catch(err => console.error('Error fetching series from TMDB:', err))
        .finally(() => setLoading(false));
    }
  }, [localSeries, id, tmdbSeries]); // Remove loading dependency, add tmdbSeries to prevent re-fetching

  // Use local series if available, otherwise use TMDB series
  const series = localSeries || tmdbSeries;
  
  // Check if this is a TMDB-only series (not in user's list)
  const isReadOnlyTmdbSeries = !localSeries && !!tmdbSeries;
  const [isAdding, setIsAdding] = useState(false);

  // Get TMDB image URL - following TmdbDialog pattern
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  // Calculate user rating - using real Firebase structure
  const userRating = useMemo(() => {
    if (!user?.uid || !series?.rating) return 0;
    return series.rating[user.uid] || 0;
  }, [series, user]);

  // Calculate progress statistics - only count aired episodes
  const progressStats = useMemo(() => {
    if (!series?.seasons) return { watched: 0, total: 0, percentage: 0 };
    
    const today = new Date();
    let watchedCount = 0;
    let airedCount = 0;
    
    series.seasons.forEach(season => {
      season.episodes?.forEach(episode => {
        // Only count episodes that have aired
        if (episode.air_date) {
          const airDate = new Date(episode.air_date);
          if (airDate <= today) {
            airedCount++;
            if (episode.watched === true) {
              watchedCount++;
            }
          }
        }
      });
    });
    
    return {
      watched: watchedCount,
      total: airedCount, // Only show aired episodes in total
      percentage: airedCount > 0 ? Math.round((watchedCount / airedCount) * 100) : 0
    };
  }, [series]);

  // Handle season expand/collapse
  const toggleSeasonExpand = (seasonIndex: number) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonIndex)) {
      newExpanded.delete(seasonIndex);
    } else {
      newExpanded.add(seasonIndex);
    }
    setExpandedSeasons(newExpanded);
  };


  // Handle adding series
  const handleAddSeries = async () => {
    if (!series || !user) return;
    
    setIsAdding(true);
    try {
      const response = await fetch('https://serienapi.konrad-dinges.de/add', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: import.meta.env.VITE_USER,
          id: series.id,
          uuid: user.uid,
        }),
      });
      
      if (response.ok) {
        // Activity-Logging für Friend + Badge-System (wie Desktop)
        await logSeriesAdded(
          user.uid,
          series.name || series.title || 'Unbekannte Serie',
          series.id
        );
        
        alert('Serie erfolgreich hinzugefügt!');
        // Reload page to show the series from user's list
        window.location.reload();
      } else {
        const data = await response.json();
        if (data.error === 'Serie bereits vorhanden') {
          alert('Serie ist bereits in deiner Liste!');
        } else {
          throw new Error('Fehler beim Hinzufügen');
        }
      }
    } catch (error) {
      console.error('Error adding series:', error);
      alert('Fehler beim Hinzufügen der Serie.');
    } finally {
      setIsAdding(false);
    }
  };
  
  // Handle series deletion - using Firebase directly
  const handleDeleteSeries = async () => {
    if (!series || !user || !window.confirm('Möchtest du diese Serie wirklich löschen?')) return;
    
    setIsDeleting(true);
    try {
      // Delete directly from Firebase
      await firebase
        .database()
        .ref(`${user.uid}/serien/${series.nmr}`)
        .remove();

      navigate('/');
    } catch (error) {
      console.error('Error deleting series:', error);
      alert('Fehler beim Löschen der Serie.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Handle watchlist toggle
  const handleWatchlistToggle = async () => {
    if (!series || !user) return;
    
    try {
      // Use Firebase directly like desktop
      const ref = firebase
        .database()
        .ref(`${user.uid}/serien/${series.nmr}/watchlist`);
      
      const newWatchlistStatus = !series.watchlist;
      await ref.set(newWatchlistStatus);
      
      // Badge-System für Watchlist (nur wenn hinzugefügt)
      if (newWatchlistStatus) {
        const { logWatchlistAdded } = await import(
          '../../features/badges/minimalActivityLogger'
        );
        await logWatchlistAdded(user.uid, series.title, series.id);
      }
      
      // The context will update automatically through Firebase listeners
    } catch (error) {
      console.error('Error updating watchlist:', error);
      alert('Fehler beim Aktualisieren der Watchlist.');
    }
  };
  
  // Handle episode rewatch
  const handleEpisodeRewatch = async (episode: any) => {
    if (!series || !user) return;
    
    try {
      // Find the season and episode indices
      const seasonIndex = series.seasons?.findIndex((s: any) => 
        s.episodes?.some((e: any) => e.id === episode.id)
      );
      const episodeIndex = series.seasons?.[seasonIndex]?.episodes?.findIndex(
        (e: any) => e.id === episode.id
      );
      
      if (seasonIndex === -1 || episodeIndex === -1) {
        throw new Error('Episode not found');
      }
      
      const episodePath = `${user.uid}/serien/${series.nmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
      const newWatchCount = (episode.watchCount || 1) + 1;
      
      await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
      
      setShowRewatchDialog({show: false, type: 'episode', item: null});
    } catch (error) {
      console.error('Error rewatching episode:', error);
      alert('Fehler beim Rewatch der Episode.');
    }
  };
  
  // Handle episode unwatch
  const handleEpisodeUnwatch = async (episode: any) => {
    if (!series || !user) return;
    
    try {
      // Find the season and episode indices
      const seasonIndex = series.seasons?.findIndex((s: any) => 
        s.episodes?.some((e: any) => e.id === episode.id)
      );
      const episodeIndex = series.seasons?.[seasonIndex]?.episodes?.findIndex(
        (e: any) => e.id === episode.id
      );
      
      if (seasonIndex === -1 || episodeIndex === -1) {
        throw new Error('Episode not found');
      }
      
      const episodePath = `${user.uid}/serien/${series.nmr}/seasons/${seasonIndex}/episodes/${episodeIndex}`;
      
      if (episode.watchCount && episode.watchCount > 1) {
        // Reduce watch count
        const newWatchCount = episode.watchCount - 1;
        await firebase.database().ref(`${episodePath}/watchCount`).set(newWatchCount);
      } else {
        // Mark as unwatched completely
        await firebase.database().ref(`${episodePath}/watched`).remove();
        await firebase.database().ref(`${episodePath}/watchCount`).remove();
        await firebase.database().ref(`${episodePath}/firstWatchedAt`).remove();
      }
      
      setShowRewatchDialog({show: false, type: 'episode', item: null});
    } catch (error) {
      console.error('Error unwatching episode:', error);
      alert('Fehler beim Markieren als nicht gesehen.');
    }
  };

  if (!series && !loading) {
    const apiKey = import.meta.env.VITE_API_TMDB;
    return (
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>Serie nicht gefunden</h2>
        {!apiKey && (
          <p style={{ color: 'rgba(255,255,255,0.6)', maxWidth: '400px' }}>
            Diese Serie ist nicht in deiner Liste. 
            Um Serien von Freunden anzuzeigen, wird ein TMDB API-Schlüssel benötigt.
          </p>
        )}
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Zurück
        </button>
      </div>
    );
  }
  
  if (loading || !series) {
    return (
      <div style={{ 
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <p>Lade...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section with Poster */}
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '300px',
        overflow: 'hidden'
      }}>
        {series.poster?.poster && (
          <img 
            src={getImageUrl(series.poster.poster)}
            alt={series.title}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.4
            }}
          />
        )}
        
        {/* Gradient Overlay */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '150px',
          background: 'linear-gradient(to top, #000 0%, transparent 100%)'
        }} />
        
        {/* Back Button */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ 
            position: 'absolute',
            top: 'calc(20px + env(safe-area-inset-top))',
            left: '20px',
            background: 'rgba(0, 0, 0, 0.5)', 
            backdropFilter: 'blur(10px)',
            border: 'none', 
            color: 'white', 
            fontSize: '24px',
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

        {/* Add button for TMDB-only series */}
        {isReadOnlyTmdbSeries && (
          <button
            onClick={handleAddSeries}
            disabled={isAdding}
            style={{
              position: 'absolute',
              top: 'calc(20px + env(safe-area-inset-top))',
              right: '20px',
              background: isAdding ? 'rgba(0, 212, 170, 0.5)' : 'rgba(0, 212, 170, 0.8)',
              backdropFilter: 'blur(10px)',
              border: 'none',
              color: 'white',
              fontSize: '24px',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              padding: '8px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px'
            }}
          >
            {isAdding ? '...' : '+'}
          </button>
        )}

        {/* Series Info Overlay */}
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '20px',
          right: '20px'
        }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: 'bold', 
            margin: '0 0 8px 0' 
          }}>
            {series.title}
          </h1>
          
          {/* Provider Badges */}
          {series.watch_providers && (
            <div style={{ marginBottom: '8px' }}>
              <MobileProviderBadges 
                providers={series.watch_providers}
                size="medium"
                maxDisplay={4}
              />
            </div>
          )}
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            opacity: 0.8,
            marginBottom: '12px'
          }}>
            {series.release_date && (
              <span>{new Date(series.release_date).getFullYear()}</span>
            )}
            {series.seasons && (
              <span>• {series.seasons.length} Staffeln</span>
            )}
            {userRating > 0 && (
              <span style={{ color: '#ffd700' }}>• ⭐ {userRating}/10</span>
            )}
          </div>

          {/* Progress Bar */}
          {progressStats.total > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '4px',
                height: '6px',
                overflow: 'hidden'
              }}>
                <div style={{
                  background: '#00d4aa',
                  height: '100%',
                  width: `${progressStats.percentage}%`,
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <p style={{ 
                fontSize: '12px', 
                margin: '4px 0 0 0',
                opacity: 0.7
              }}>
                {progressStats.watched} von {progressStats.total} Episoden ({progressStats.percentage}%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - only for user's series */}
      {!isReadOnlyTmdbSeries && (
        <div style={{
          display: 'flex',
          gap: '12px',
          padding: '20px',
          justifyContent: 'center'
        }}>
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/episodes/${series.id}`)}
          style={{
            flex: 1,
            padding: '12px',
            background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
            border: '1px solid rgba(0, 212, 170, 0.5)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <PlayCircle />
          Episoden
        </motion.button>

        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(`/rating/series/${series.id}`)}
          style={{
            flex: 1,
            padding: '12px',
            background: userRating
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: userRating
              ? '1px solid rgba(255, 215, 0, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Star style={{ fontSize: '18px', color: userRating ? '#ffd700' : 'white' }} />
          {userRating ? `${userRating}/10` : 'Bewerten'}
        </motion.button>
        
        <motion.button 
          whileTap={{ scale: 0.95 }}
          onClick={handleWatchlistToggle}
          style={{
            padding: '12px',
            background: series.watchlist
              ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 180, 216, 0.2) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: series.watchlist
              ? '1px solid rgba(0, 212, 170, 0.4)'
              : '1px solid rgba(255, 255, 255, 0.1)',
            color: 'white',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {series.watchlist ? <BookmarkRemove /> : <BookmarkAdd />}
        </motion.button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '0 20px 20px 20px'
      }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'info' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: activeTab === 'info' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <List style={{ fontSize: '18px' }} />
          Info & Episoden
        </button>
        
        <button
          onClick={() => setActiveTab('cast')}
          style={{
            flex: 1,
            padding: '10px',
            background: activeTab === 'cast' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: 'none',
            borderRadius: '12px',
            color: 'white',
            fontSize: '14px',
            fontWeight: activeTab === 'cast' ? 600 : 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <People style={{ fontSize: '18px' }} />
          Besetzung
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'cast' ? (
        <MobileCastCrew 
          tmdbId={series.tmdb_id || series.id}
          mediaType="tv"
          seriesData={series}
        />
      ) : (
        <>
          {/* Series Description */}
          {(series.beschreibung || series.overview) && (
        <div style={{ padding: '0 20px 20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: '0 0 12px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Info fontSize="small" />
            Beschreibung
          </h3>
          <p style={{ 
            fontSize: '14px', 
            lineHeight: '1.5', 
            opacity: 0.8, 
            margin: 0 
          }}>
            {series.beschreibung || series.overview}
          </p>
        </div>
      )}

      {/* Seasons Overview - only for user's series */}
      {!isReadOnlyTmdbSeries && series.seasons && series.seasons.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <List fontSize="small" />
            Staffeln ({series.seasons.length})
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {series.seasons.map((season, seasonIndex) => {
              const watchedEpisodes = season.episodes?.filter(ep => ep.watched).length || 0;
              const totalEpisodes = season.episodes?.length || 0;
              const seasonProgress = totalEpisodes > 0 ? Math.round((watchedEpisodes / totalEpisodes) * 100) : 0;
              const isExpanded = expandedSeasons.has(seasonIndex);

              return (
                <motion.div 
                  key={seasonIndex}
                  initial={false}
                  animate={{ 
                    backgroundColor: seasonProgress === 100 ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 255, 255, 0.05)'
                  }}
                  style={{
                    border: `1px solid ${seasonProgress === 100 ? 'rgba(0, 212, 170, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                    borderRadius: '12px',
                    overflow: 'hidden'
                  }}
                >
                  <button
                    onClick={() => toggleSeasonExpand(seasonIndex)}
                    style={{
                      width: '100%',
                      padding: '16px',
                      background: 'transparent',
                      border: 'none',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '8px',
                        background: seasonProgress === 100 
                          ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.3) 0%, rgba(0, 180, 216, 0.3) 100%)'
                          : 'rgba(255, 255, 255, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}>
                        {season.seasonNumber + 1}
                      </div>
                      
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600' }}>
                          Staffel {season.seasonNumber + 1}
                        </div>
                        <div style={{ fontSize: '12px', opacity: 0.7 }}>
                          {watchedEpisodes} von {totalEpisodes} Episoden ({seasonProgress}%)
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {seasonProgress === 100 && (
                        <Check style={{ color: '#00d4aa', fontSize: '18px' }} />
                      )}
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                          maxHeight: '200px',
                          overflowY: 'auto',
                          overflowX: 'hidden'
                        }}
                      >
                        {season.episodes?.map((episode, episodeIndex) => (
                          <div
                            key={episode.id}
                            style={{
                              padding: '12px 16px',
                              borderBottom: episodeIndex < season.episodes!.length - 1
                                ? '1px solid rgba(255, 255, 255, 0.05)' 
                                : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                              <div
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '50%',
                                  background: episode.watched === true
                                    ? '#00d4aa' 
                                    : 'rgba(255, 255, 255, 0.1)',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: '600',
                                  color: 'white',
                                  cursor: 'default',
                                  position: 'relative'
                                }}
                              >
                                {episodeIndex + 1}
                                {(episode.watchCount || 0) > 1 && (
                                  <span style={{
                                    position: 'absolute',
                                    top: '-4px',
                                    right: '-4px',
                                    background: '#ff6b6b',
                                    borderRadius: '50%',
                                    width: '14px',
                                    height: '14px',
                                    fontSize: '9px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: '700'
                                  }}>
                                    {episode.watchCount}
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ 
                                  fontSize: '14px', 
                                  fontWeight: '500',
                                  opacity: episode.watched === true ? 0.7 : 1,
                                  textDecoration: episode.watched === true ? 'line-through' : 'none',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis'
                                }}>
                                  {episode.name}
                                </div>
                                {episode.air_date && (
                                  <div style={{ 
                                    fontSize: '11px', 
                                    opacity: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginTop: '2px'
                                  }}>
                                    <DateRange style={{ fontSize: '10px' }} />
                                    {getUnifiedEpisodeDate(episode.air_date)}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {!!episode.watched && episode.firstWatchedAt && Number(episode.firstWatchedAt) > 0 && (
                                <div style={{
                                  fontSize: '10px',
                                  opacity: 0.5,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px'
                                }}>
                                  <Visibility style={{ fontSize: '10px' }} />
                                  {getUnifiedEpisodeDate(episode.firstWatchedAt)}
                                </div>
                              )}
                              
                              {!!episode.watched && (episode.watchCount || 0) > 1 && (
                                <div
                                  style={{
                                    background: 'rgba(255, 165, 0, 0.2)',
                                    border: '1px solid rgba(255, 165, 0, 0.4)',
                                    color: '#ffa500',
                                    borderRadius: '12px',
                                    padding: '2px 6px',
                                    fontSize: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '2px'
                                  }}
                                >
                                  <Repeat style={{ fontSize: '10px' }} />
                                  {episode.watchCount}x
                                </div>
                              )}
                              
                              {!!episode.watched && (
                                <div style={{
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '50%',
                                  background: '#00d4aa',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  <Check style={{ fontSize: '12px', color: 'white' }} />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

        </>
      )}

      {/* Delete Button - only for user's series */}
      {!isReadOnlyTmdbSeries && (
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={handleDeleteSeries}
            disabled={isDeleting}
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: '12px',
              color: '#ff6b6b',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isDeleting ? 0.6 : 1
            }}
          >
            <Delete />
            {isDeleting ? 'Wird gelöscht...' : 'Serie löschen'}
          </motion.button>
        </div>
      )}

      {/* Add Button - only for TMDB series not in user's list */}
      {isReadOnlyTmdbSeries && (
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={handleAddSeries}
            disabled={isAdding}
            whileHover={{ scale: isAdding ? 1 : 1.02 }}
            whileTap={{ scale: isAdding ? 1 : 0.98 }}
            style={{
              width: '100%',
              padding: '16px',
              background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
              border: '1px solid rgba(0, 212, 170, 0.5)',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: isAdding ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isAdding ? 0.6 : 1
            }}
          >
            {isAdding ? 'Wird hinzugefügt...' : 'Serie hinzufügen'}
          </motion.button>
        </div>
      )}
      
      {/* Rewatch Dialog */}
      {showRewatchDialog.show && showRewatchDialog.item && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '400px',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <h3 style={{
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
              textAlign: 'center'
            }}>
              Episode bearbeiten
            </h3>
            
            <p style={{
              margin: '0 0 24px 0',
              fontSize: '14px',
              opacity: 0.8,
              textAlign: 'center'
            }}>
              "{showRewatchDialog.item.name}" wurde {showRewatchDialog.item.watchCount}x gesehen.
              <br /><br />
              Was möchtest du tun?
            </p>
            
            <div style={{
              display: 'flex',
              gap: '12px',
              flexDirection: 'column'
            }}>
              <button
                onClick={() => handleEpisodeRewatch(showRewatchDialog.item)}
                style={{
                  padding: '12px',
                  background: 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Nochmal gesehen ({(showRewatchDialog.item.watchCount || 1) + 1}x)
              </button>
              
              <button
                onClick={() => handleEpisodeUnwatch(showRewatchDialog.item)}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 107, 107, 0.2)',
                  border: '1px solid rgba(255, 107, 107, 0.4)',
                  borderRadius: '8px',
                  color: '#ff6b6b',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                {showRewatchDialog.item.watchCount > 2
                  ? `Auf ${showRewatchDialog.item.watchCount - 1}x reduzieren`
                  : showRewatchDialog.item.watchCount === 2
                  ? 'Auf 1x reduzieren'
                  : 'Als nicht gesehen markieren'}
              </button>
              
              <button
                onClick={() => setShowRewatchDialog({show: false, type: 'episode', item: null})}
                style={{
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};