import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowBack, PlayCircle, CheckCircle, 
  CalendarToday, NewReleases, Timer
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../../App';
// import { getUnifiedEpisodeDate } from '../../lib/date/episodeDate.utils';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

interface UpcomingEpisode {
  seriesId: number;
  seriesName: string;
  seriesPoster: string;
  seriesNmr: number;
  seasonIndex: number;
  episodeIndex: number;
  episodeName: string;
  episodeNumber: number;
  seasonNumber: number;
  airDate: Date;
  daysUntil: number;
  watched: boolean;
}

export const MobileNewEpisodesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  const [markedWatched, setMarkedWatched] = useState<Set<string>>(new Set());
  
  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };
  
  // Get all upcoming episodes - check ALL series, not just watchlist
  const upcomingEpisodes = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const episodes: UpcomingEpisode[] = [];
    
    console.log('Checking', seriesList.length, 'series for new episodes');
    console.log('Today:', today);
    
    seriesList.forEach(series => {
      // First check if series has nextEpisode info from API
      if (series.nextEpisode?.nextEpisode) {
        console.log('Series', series.title, 'has nextEpisode:', series.nextEpisode.nextEpisode);
        const nextDate = new Date(series.nextEpisode.nextEpisode);
        if (!isNaN(nextDate.getTime()) && nextDate >= today) {
          const daysUntil = Math.floor((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          console.log('Next episode in', daysUntil, 'days');
          
          // Show ALL future episodes, no limit
          // Find the episode number from nextEpisode info
          const epNumber = series.nextEpisode.episode || 1;
          const seasonNumber = parseInt(series.nextEpisode.nextEpisode.split('x')[0]) || 1;
          
          episodes.push({
            seriesId: series.id,
            seriesName: series.title || '',
            seriesPoster: typeof series.poster === 'string' ? series.poster : (series.poster as any)?.poster || '',
            seriesNmr: series.nmr,
            seasonIndex: seasonNumber - 1,
            episodeIndex: epNumber - 1,
            episodeName: `Episode ${epNumber}`,
            episodeNumber: epNumber,
            seasonNumber: seasonNumber,
            airDate: nextDate,
            daysUntil,
            watched: false
          });
        }
      }
      
      // Also check all episodes as fallback
      if (!series.seasons) return;
      
      // Check all episodes for upcoming dates
      series.seasons.forEach((season, seasonIndex) => {
        if (!season.episodes) return;
        
        season.episodes.forEach((episode, episodeIndex) => {
          // Try multiple date fields
          const airDate = episode.air_date;
          if (!airDate) {
            // Debug: Log episodes without air dates
            if (episodeIndex === 0 && seasonIndex === 0) {
              console.log('Episode without airDate in', series.title, episode);
            }
            return;
          }
          
          const episodeDate = new Date(airDate);
          if (isNaN(episodeDate.getTime())) return; // Invalid date
          
          episodeDate.setHours(0, 0, 0, 0);
          
          // Show all upcoming episodes (not just unwatched)
          if (episodeDate >= today) {
            const daysUntil = Math.floor((episodeDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            
            // Show ALL future episodes, no time limit
            episodes.push({
              seriesId: series.id,
              seriesName: series.title || '',
              seriesPoster: typeof series.poster === 'string' ? series.poster : (series.poster as any)?.poster || '',
              seriesNmr: series.nmr,
              seasonIndex,
              episodeIndex,
              episodeName: episode.name || `Episode ${episodeIndex + 1}`,
              episodeNumber: episodeIndex + 1,
              seasonNumber: season.seasonNumber || seasonIndex + 1,
              airDate: episodeDate,
              daysUntil,
              watched: episode.watched || false
            });
          }
        });
      });
    });
    
    // Sort by air date
    episodes.sort((a, b) => a.airDate.getTime() - b.airDate.getTime());
    
    return episodes;
  }, [seriesList]);
  
  // Group episodes by date
  const groupedEpisodes = useMemo(() => {
    const groups: { [key: string]: UpcomingEpisode[] } = {};
    
    upcomingEpisodes.forEach(episode => {
      const dateKey = episode.airDate.toLocaleDateString('de-DE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(episode);
    });
    
    return groups;
  }, [upcomingEpisodes]);
  
  // Mark episode as watched
  const handleMarkWatched = async (episode: UpcomingEpisode) => {
    if (!user) return;
    
    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
    
    try {
      const ref = firebase.database()
        .ref(`${user.uid}/serien/${episode.seriesNmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`);
      await ref.set(true);
      
      setMarkedWatched(prev => new Set([...prev, key]));
    } catch (error) {
      console.error('Error marking episode as watched:', error);
    }
  };
  
  const isEpisodeWatched = (episode: UpcomingEpisode) => {
    const key = `${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`;
    return episode.watched || markedWatched.has(key);
  };
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--color-background-default, #000)', 
      color: 'white',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(180deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 0, 0, 0) 100%)',
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
              background: 'linear-gradient(135deg, #00d4aa 0%, #00b4d8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Kommende Episoden
            </h1>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.6)', 
              fontSize: '14px',
              margin: '4px 0 0 0'
            }}>
              {upcomingEpisodes.length} neue Episoden
            </p>
          </div>
        </div>
        
        {/* Stats */}
        <div style={{
          display: 'flex',
          gap: '12px',
          overflowX: 'auto',
          paddingBottom: '8px'
        }}>
          <div style={{
            background: 'rgba(0, 212, 170, 0.1)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            <CalendarToday style={{ fontSize: '16px' }} />
            Heute: {groupedEpisodes[Object.keys(groupedEpisodes)[0]]?.length || 0}
          </div>
          
          <div style={{
            background: 'rgba(255, 193, 7, 0.1)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            borderRadius: '12px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            whiteSpace: 'nowrap'
          }}>
            <Timer style={{ fontSize: '16px' }} />
            Nächste 7 Tage: {upcomingEpisodes.filter(e => e.daysUntil <= 7).length}
          </div>
        </div>
      </header>
      
      {/* Episodes List */}
      <div style={{ padding: '20px' }}>
        {Object.keys(groupedEpisodes).length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: 'rgba(255, 255, 255, 0.5)'
          }}>
            <NewReleases style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
            <h3>Keine kommenden Episoden</h3>
            <p>Es gibt aktuell keine neuen Episoden in deiner Watchlist</p>
          </div>
        ) : (
          Object.entries(groupedEpisodes).map(([date, episodes]) => (
            <div key={date} style={{ marginBottom: '32px' }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: 600,
                marginBottom: '16px',
                color: 'rgba(255, 255, 255, 0.7)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                paddingBottom: '8px'
              }}>
                {date}
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {episodes.map((episode, index) => {
                  const watched = isEpisodeWatched(episode);
                  
                  return (
                    <motion.div
                      key={`${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      style={{
                        display: 'flex',
                        gap: '12px',
                        padding: '12px',
                        background: watched 
                          ? 'rgba(0, 212, 170, 0.05)'
                          : 'rgba(255, 255, 255, 0.02)',
                        borderRadius: '12px',
                        border: watched
                          ? '1px solid rgba(0, 212, 170, 0.2)'
                          : '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      {/* Poster */}
                      <img
                        src={getImageUrl(episode.seriesPoster)}
                        alt={episode.seriesName}
                        onClick={() => navigate(`/series/${episode.seriesId}`)}
                        style={{
                          width: '60px',
                          height: '90px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'pointer'
                        }}
                      />
                      
                      {/* Info */}
                      <div style={{ flex: 1 }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          margin: '0 0 4px 0',
                          color: watched ? 'rgba(0, 212, 170, 0.9)' : 'white'
                        }}>
                          {episode.seriesName}
                        </h4>
                        
                        <p style={{
                          fontSize: '13px',
                          margin: '0 0 4px 0',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          S{String(episode.seasonNumber).padStart(2, '0')}E{String(episode.episodeNumber).padStart(2, '0')} • {episode.episodeName}
                        </p>
                        
                        <p style={{
                          fontSize: '12px',
                          margin: 0,
                          color: 'rgba(255, 255, 255, 0.4)'
                        }}>
                          {episode.daysUntil === 0 ? 'Heute' : 
                           episode.daysUntil === 1 ? 'Morgen' : 
                           `In ${episode.daysUntil} Tagen`}
                        </p>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={() => handleMarkWatched(episode)}
                        disabled={watched}
                        style={{
                          background: watched 
                            ? 'transparent'
                            : 'rgba(0, 212, 170, 0.1)',
                          border: watched
                            ? 'none'
                            : '1px solid rgba(0, 212, 170, 0.3)',
                          borderRadius: '8px',
                          padding: '8px',
                          color: watched 
                            ? 'rgba(0, 212, 170, 0.9)'
                            : 'rgba(0, 212, 170, 0.7)',
                          cursor: watched ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {watched ? (
                          <CheckCircle style={{ fontSize: '20px' }} />
                        ) : (
                          <PlayCircle style={{ fontSize: '20px' }} />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};