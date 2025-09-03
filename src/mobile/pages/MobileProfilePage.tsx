import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import { 
  Person, Settings, Logout, Star, PlayCircle, 
  CalendarToday, Movie, TrendingUp, EmojiEvents,
  ChevronRight, Palette, Search, Group
} from '@mui/icons-material';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { useTheme } from '../../contexts/ThemeContext';

export const MobileProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme, getMobilePageStyle } = useTheme();
  
  // Load user data from Firebase Database
  const { data: userData } = useEnhancedFirebaseCache<any>(
    user ? `users/${user.uid}` : '',
    {
      ttl: 5 * 60 * 1000,
      useRealtimeListener: true,
      enableOfflineSupport: true,
    }
  );
  
  
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  
  // const getUserRating = (rating: any): number => {
  //   if (!rating || !user?.uid) return 0;
  //   return rating[user.uid] || 0;
  // };
  
  const stats = useMemo(() => {
    const totalSeries = seriesList.length;
    const totalMovies = movieList.length;
    
    let watchedEpisodes = 0;
    let totalHours = 0;
    
    seriesList.forEach(series => {
      if (series.seasons) {
        series.seasons.forEach(season => {
          if (season.episodes) {
            season.episodes.forEach(episode => {
              if (episode.watched) {
                const watchCount = episode.watchCount || 1;
                watchedEpisodes += watchCount;
                totalHours += (series.episodeRuntime || 45) * watchCount;
              }
            });
          }
        });
      }
    });
    
    movieList.forEach(movie => {
      if (movie.watched) {
        totalHours += movie.runtime || 120;
      }
    });
    
    return {
      totalSeries,
      totalMovies,
      watchedEpisodes,
      totalHours: Math.round(totalHours / 60)
    };
  }, [seriesList, movieList]);
  
  const handleLogout = async () => {
    try {
      await firebase.auth().signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };
  
  return (
    <div style={getMobilePageStyle()}>
      {/* Profile Header */}
      <div style={{
        background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
        padding: '20px',
        paddingTop: 'calc(40px + env(safe-area-inset-top))',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          ...((userData?.photoURL || user?.photoURL) ? {
            backgroundImage: `url("${userData?.photoURL || user?.photoURL}")`,
            backgroundPosition: 'center',
            backgroundSize: 'cover'
          } : {
            background: currentTheme.primary
          }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: `0 4px 12px ${currentTheme.primary}4D`
        }}>
          {!(userData?.photoURL || user?.photoURL) && <Person style={{ fontSize: '40px' }} />}
        </div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 700,
          margin: '0 0 4px 0'
        }}>
          {userData?.displayName || user?.displayName || 'User'}
        </h2>
        <p style={{ 
          fontSize: '14px',
          color: currentTheme.text.muted,
          margin: 0
        }}>
          {user?.email}
        </p>
      </div>
      
      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <CalendarToday style={{ fontSize: '24px', color: currentTheme.primary, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalSeries}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Serien</div>
        </div>
        
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Movie style={{ fontSize: '24px', color: currentTheme.status.error, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalMovies}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Filme</div>
        </div>
        
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <PlayCircle style={{ fontSize: '24px', color: currentTheme.status.success, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.watchedEpisodes}</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Episoden</div>
        </div>
        
        <div style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <TrendingUp style={{ fontSize: '24px', color: currentTheme.status.warning, marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalHours}h</div>
          <div style={{ fontSize: '12px', color: currentTheme.text.muted }}>Watchzeit</div>
        </div>
      </div>
      
      {/* Feature Navigation */}
      <div style={{ padding: '0 20px', marginBottom: '20px' }}>
        <button 
          onClick={() => navigate('/ratings')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.status.warning}1A`,
            border: `1px solid ${currentTheme.status.warning}33`,
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Star style={{ fontSize: '20px', color: currentTheme.status.warning }} />
            <span style={{ fontSize: '16px' }}>Meine Bewertungen</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/activity')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.primary}1A`,
            border: `1px solid ${currentTheme.primary}33`,
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Group style={{ fontSize: '20px', color: currentTheme.primary }} />
            <span style={{ fontSize: '16px' }}>Aktivität & Freunde</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/discover')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}33`,
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search style={{ fontSize: '20px', color: currentTheme.status.error }} />
            <span style={{ fontSize: '16px' }}>Hinzufügen & Suchen</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
      </div>
      
      {/* Settings & Profile Items */}
      <div style={{ padding: '0 20px' }}>
        <button 
          onClick={() => navigate('/stats')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <TrendingUp style={{ fontSize: '20px', color: currentTheme.primary }} />
            <span style={{ fontSize: '16px' }}>Statistiken</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/badges')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <EmojiEvents style={{ fontSize: '20px', color: currentTheme.status.warning }} />
            <span style={{ fontSize: '16px' }}>Erfolge</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/theme')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Palette style={{ fontSize: '20px', color: currentTheme.primary }} />
            <span style={{ fontSize: '16px' }}>Design</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={() => navigate('/settings')}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Settings style={{ fontSize: '20px', color: currentTheme.text.secondary }} />
            <span style={{ fontSize: '16px' }}>Einstellungen</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
        
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            background: `${currentTheme.status.error}1A`,
            border: `1px solid ${currentTheme.status.error}33`,
            borderRadius: '12px',
            color: currentTheme.status.error,
            marginTop: '20px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Logout style={{ fontSize: '20px' }} />
            <span style={{ fontSize: '16px' }}>Abmelden</span>
          </div>
          <ChevronRight style={{ fontSize: '20px', opacity: 0.5 }} />
        </button>
      </div>
    </div>
  );
};