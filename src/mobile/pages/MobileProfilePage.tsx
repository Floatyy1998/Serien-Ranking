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

export const MobileProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  
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
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: 'white',
      paddingBottom: '80px'
    }}>
      {/* Profile Header */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.2) 0%, rgba(0, 0, 0, 0) 100%)',
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
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
          color: 'rgba(255, 255, 255, 0.5)',
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
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <CalendarToday style={{ fontSize: '24px', color: '#667eea', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalSeries}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Serien</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Movie style={{ fontSize: '24px', color: '#ff6b6b', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalMovies}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Filme</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <PlayCircle style={{ fontSize: '24px', color: '#4cd137', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.watchedEpisodes}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Episoden</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <TrendingUp style={{ fontSize: '24px', color: '#ffd700', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalHours}h</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Watchzeit</div>
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
            background: 'rgba(255, 215, 0, 0.1)',
            border: '1px solid rgba(255, 215, 0, 0.2)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Star style={{ fontSize: '20px', color: '#ffd700' }} />
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
            background: 'rgba(102, 126, 234, 0.1)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Group style={{ fontSize: '20px', color: '#667eea' }} />
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
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            borderRadius: '12px',
            color: 'white',
            marginBottom: '8px',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Search style={{ fontSize: '20px', color: '#ff6b6b' }} />
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
            <TrendingUp style={{ fontSize: '20px', color: '#667eea' }} />
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
            <EmojiEvents style={{ fontSize: '20px', color: '#ffd700' }} />
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
            <Palette style={{ fontSize: '20px', color: '#667eea' }} />
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
            <Settings style={{ fontSize: '20px', opacity: 0.7 }} />
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
            background: 'rgba(255, 107, 107, 0.1)',
            border: '1px solid rgba(255, 107, 107, 0.2)',
            borderRadius: '12px',
            color: '#ff6b6b',
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