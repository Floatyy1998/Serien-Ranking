import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  PlayCircle, ArrowBack,
  CheckBoxOutlineBlank
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useAuth } from '../../App';
import { Series } from '../../types/Series';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';

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
}

export const MobileWatchNextPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { seriesList } = useSeriesList();
  // Removed tabs - only show next episodes
  
  // Helper functions
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Get next unwatched episodes from series with progress
  const nextEpisodes = useMemo(() => {
    const episodes: NextEpisode[] = [];
    const rewatches: NextEpisode[] = [];
    const today = new Date();
    
    // Only from series in watchlist that have been started
    const seriesWithProgress = seriesList.filter(series => {
      if (!series.seasons?.length) return false;
      if (!series.watchlist) return false; // MUST be in watchlist
      
      let hasWatched = false;
      series.seasons.forEach(season => {
        if (season.episodes?.some(ep => ep.watched)) {
          hasWatched = true;
        }
      });
      return hasWatched;
    });
    
    seriesWithProgress.forEach((series: Series) => {
      let foundUnwatched = false;
      
      // Find first unwatched episode that has already aired
      for (const [seasonIndex, season] of series.seasons.entries()) {
        if (!season.episodes?.length) continue;
        
        for (const [episodeIndex, episode] of season.episodes.entries()) {
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
      
      // If no unwatched episodes and series has rewatches, show first episode for rewatch
      if (!foundUnwatched) {
        // Check if any episode has watchCount > 1
        let hasRewatch = false;
        for (const season of series.seasons) {
          if (season.episodes?.some(ep => ep.watchCount && ep.watchCount > 1)) {
            hasRewatch = true;
            break;
          }
        }
        
        if (hasRewatch && series.seasons[0]?.episodes?.[0]) {
          const firstEpisode = series.seasons[0].episodes[0];
          rewatches.push({
            seriesId: series.id,
            seriesTitle: series.title + ' (Rewatch)',
            poster: getImageUrl(series.poster),
            seasonIndex: 0,
            episodeIndex: 0,
            seasonNumber: series.seasons[0].seasonNumber,
            episodeNumber: 1,
            episodeName: firstEpisode.name || 'Episode 1',
            airDate: firstEpisode.air_date
          });
        }
      }
    });
    
    // Combine regular episodes with rewatches
    return [...episodes, ...rewatches].sort((a, b) => a.seriesTitle.localeCompare(b.seriesTitle));
  }, [seriesList]);


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
          
          <div>
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
        </div>
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
                {nextEpisodes.map((episode) => (
                  <motion.div
                    key={`${episode.seriesId}-${episode.seasonIndex}-${episode.episodeIndex}`}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(0, 212, 170, 0.03)',
                      border: '1px solid rgba(0, 212, 170, 0.15)',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer'
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
                        color: '#00d4aa' 
                      }}>
                        S{episode.seasonNumber + 1} E{episode.episodeNumber}
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
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!user) return;
                        
                        // Mark episode as watched in Firebase
                        const series = seriesList.find(s => s.id === episode.seriesId);
                        if (!series) return;
                        
                        const ref = firebase
                          .database()
                          .ref(`${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/watched`);
                        await ref.set(true);
                        
                        // Update firstWatchedAt if not set
                        const firstWatchedRef = firebase
                          .database()
                          .ref(`${user.uid}/serien/${series.nmr}/seasons/${episode.seasonIndex}/episodes/${episode.episodeIndex}/firstWatchedAt`);
                        const snapshot = await firstWatchedRef.once('value');
                        if (!snapshot.val()) {
                          await firstWatchedRef.set(new Date().toISOString());
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