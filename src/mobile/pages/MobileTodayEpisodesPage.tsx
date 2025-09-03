import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayCircle, CalendarToday, CheckCircle,
  ArrowBack, BarChart
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import { Series } from '../../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface TodayEpisode {
  id: string;
  seriesId: number;
  seriesTitle: string;
  poster: string;
  seasonIndex: number;
  episodeIndex: number;
  seasonNumber: number;
  episodeNumber: number;
  episodeTitle: string;
  airDate: string;
  releaseTime: string;
  watched: boolean;
  watchCount?: number;
}

export const MobileTodayEpisodesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const { getMobilePageStyle, getMobileHeaderStyle } = useTheme();
  const [updatingEpisodes, setUpdatingEpisodes] = useState<Set<string>>(new Set());
  
  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };
  
  // Get next unwatched episodes that have already aired
  const todayEpisodes = useMemo(() => {
    const episodes: TodayEpisode[] = [];
    // const today = new Date();
    // const todayDateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Check ALL series with progress (not just watchlist)
    const seriesWithProgress = seriesList.filter(series => {
      if (!series.seasons?.length) return false;
      
      // Check if series has any watched episodes
      let hasWatched = false;
      series.seasons.forEach(season => {
        if (season.episodes?.some(ep => ep.watched)) {
          hasWatched = true;
        }
      });
      return hasWatched;
    });
    
    seriesWithProgress.forEach((series: Series) => {
      if (!series.seasons?.length) return;
      
      // Find first unwatched episode that has already aired
      for (const [seasonIndex, season] of series.seasons.entries()) {
        if (!season.episodes?.length) continue;
        
        for (const [episodeIndex, episode] of season.episodes.entries()) {
          // Skip if already watched
          if (episode.watched) continue;
          
          // Check if episode has aired (only if air_date exists)
          if (episode.air_date) {
            const airDate = new Date(episode.air_date);
            const now = new Date();
            
            // Only show episodes that have already aired
            if (airDate > now) continue;
          }
          
          // This is the next unwatched episode
          episodes.push({
            id: `${series.id}-${seasonIndex}-${episodeIndex}`,
            seriesId: series.id,
            seriesTitle: series.title,
            poster: getImageUrl(series.poster),
            seasonIndex,
            episodeIndex,
            seasonNumber: season.seasonNumber,
            episodeNumber: episodeIndex + 1,
            episodeTitle: episode.name,
            airDate: episode.air_date || 'Unknown',
            releaseTime: '20:00', // Default time
            watched: episode.watched || false,
            watchCount: episode.watchCount || 0
          });
          break; // Only get the first unwatched episode per series
        }
        
        // If we found an episode in this season, don't check other seasons
        if (episodes.find(ep => ep.seriesId === series.id)) break;
      }
    });
    
    // Sort by series title
    return episodes.sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));
  }, [seriesList]);
  
  // Mark episode as watched/unwatched
  const handleEpisodeToggle = async (episodeData: TodayEpisode) => {
    if (!user) return;
    
    if (updatingEpisodes.has(episodeData.id)) return;
    
    setUpdatingEpisodes(prev => new Set([...prev, episodeData.id]));
    
    try {
      // Use the correct Firebase path
      const episodeRef = firebase
        .database()
        .ref(`${user.uid}/serien/${episodeData.seriesId}/seasons/${episodeData.seasonIndex}/episodes/${episodeData.episodeIndex}/watched`);
      
      await episodeRef.set(!episodeData.watched);
      
      // If marking as watched for first time, also set firstWatchedAt
      if (!episodeData.watched) {
        const firstWatchedRef = firebase
          .database()
          .ref(`${user.uid}/serien/${episodeData.seriesId}/seasons/${episodeData.seasonIndex}/episodes/${episodeData.episodeIndex}/firstWatchedAt`);
        
        await firstWatchedRef.set(new Date().toISOString());
      }
    } catch (error) {
      console.error('Error updating episode:', error);
    } finally {
      setUpdatingEpisodes(prev => {
        const newSet = new Set(prev);
        newSet.delete(episodeData.id);
        return newSet;
      });
    }
  };

  return (
    <div style={{ 
      ...getMobilePageStyle(),
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <header style={{
        ...getMobileHeaderStyle('transparent'), // Remove the black gradient entirely
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
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
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Als Nächstes schauen
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '14px',
              margin: '4px 0 0 0'
            }}>
              Nächste Episoden zum Schauen
            </p>
          </div>
        </div>
      </header>
      
      {/* Today's Episodes */}
      <div style={{ padding: '0 20px' }}>
        {todayEpisodes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <CalendarToday style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }} />
            <h3 style={{ fontSize: '18px', margin: '0 0 8px 0' }}>Keine neuen Episoden heute</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Heute wurden keine neuen Episoden aus deiner Watchlist ausgestrahlt.
            </p>
          </div>
        ) : (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '20px',
              fontSize: '16px',
              color: 'rgba(255, 255, 255, 0.8)'
            }}>
              <BarChart style={{ fontSize: '20px' }} />
              <span>{todayEpisodes.length} neue Episode{todayEpisodes.length !== 1 ? 'n' : ''}</span>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayEpisodes.map((episode) => (
                <motion.div
                  key={episode.id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleEpisodeToggle(episode)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    background: episode.watched 
                      ? 'rgba(0, 212, 170, 0.1)' 
                      : 'rgba(255, 255, 255, 0.03)',
                    border: `1px solid ${episode.watched 
                      ? 'rgba(0, 212, 170, 0.3)' 
                      : 'rgba(255, 255, 255, 0.08)'}`,
                    borderRadius: '16px',
                    padding: '16px',
                    cursor: updatingEpisodes.has(episode.id) ? 'not-allowed' : 'pointer',
                    opacity: updatingEpisodes.has(episode.id) ? 0.6 : 1
                  }}
                >
                  {/* Series Poster */}
                  <img 
                    src={episode.poster}
                    alt={episode.seriesTitle}
                    style={{
                      width: '50px',
                      height: '75px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      flexShrink: 0
                    }}
                  />
                  
                  {/* Episode Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600',
                      margin: '0 0 4px 0',
                      color: 'white'
                    }}>
                      {episode.seriesTitle}
                    </h4>
                    <p style={{ 
                      fontSize: '14px', 
                      color: 'rgba(255, 255, 255, 0.7)',
                      margin: '0 0 4px 0'
                    }}>
                      S{episode.seasonNumber + 1} E{episode.episodeNumber}: {episode.episodeTitle}
                    </p>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '12px',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}>
                      <CalendarToday style={{ fontSize: '12px' }} />
                      <span>Heute • {episode.releaseTime}</span>
                    </div>
                  </div>
                  
                  {/* Watch Status */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: episode.watched 
                      ? 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: episode.watched 
                      ? 'none'
                      : '2px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {episode.watched ? (
                      <CheckCircle style={{ fontSize: '20px', color: 'white' }} />
                    ) : (
                      <PlayCircle style={{ fontSize: '20px', color: 'rgba(255, 255, 255, 0.7)' }} />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
      
      {/* Fun Fact Section */}
      {todayEpisodes.length > 0 && (
        <div style={{
          margin: '40px 20px 0',
          padding: '20px',
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.2)',
          borderRadius: '16px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            color: '#667eea'
          }}>
            <BarChart style={{ fontSize: '20px' }} />
            <span style={{ fontSize: '16px', fontWeight: '600' }}>Fun Fact</span>
          </div>
          <p style={{
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.8)',
            margin: 0,
            fontStyle: 'italic'
          }}>
            Du hast heute {todayEpisodes.filter(ep => ep.watched).length} von {todayEpisodes.length} neuen Episoden geschaut! 
            {todayEpisodes.filter(ep => ep.watched).length === todayEpisodes.length 
              ? ' 🎉 Perfekt! Du bist auf dem neuesten Stand!'
              : ` Noch ${todayEpisodes.length - todayEpisodes.filter(ep => ep.watched).length} Episode${todayEpisodes.length - todayEpisodes.filter(ep => ep.watched).length !== 1 ? 'n' : ''} zu schauen!`
            }
          </p>
        </div>
      )}
    </div>
  );
};