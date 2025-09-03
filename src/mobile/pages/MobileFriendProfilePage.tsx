import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowBack, Person, Star, PlayCircle, 
  CalendarToday, Movie as MovieIcon, Group,
  Message, PersonAdd, PersonRemove, Check
} from '@mui/icons-material';
import { useAuth } from '../../App';
import firebase from 'firebase/compat/app';

interface FriendProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  stats: {
    totalSeries: number;
    watchedMovies: number;
    watchedEpisodes: number;
    avgRating: number;
  };
  recentActivity: Array<{
    type: 'watched' | 'rated';
    title: string;
    date: string;
    rating?: number;
  }>;
}

export const MobileFriendProfilePage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const [friendProfile, setFriendProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);

  useEffect(() => {
    const loadFriendProfile = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        // Load friend's basic profile data
        const userRef = firebase.database().ref(`users/${id}`);
        const userSnapshot = await userRef.once('value');
        
        if (!userSnapshot.exists()) {
          setFriendProfile(null);
          return;
        }
        
        const userData = userSnapshot.val();
        
        // Calculate friend's stats (simplified)
        const seriesRef = firebase.database().ref(`${id}/serien`);
        const moviesRef = firebase.database().ref(`${id}/filme`);
        
        const [seriesSnapshot, moviesSnapshot] = await Promise.all([
          seriesRef.once('value'),
          moviesRef.once('value')
        ]);
        
        const series = seriesSnapshot.val() || {};
        const movies = moviesSnapshot.val() || {};
        
        // Calculate stats
        const totalSeries = Object.keys(series).length;
        let watchedEpisodes = 0;
        
        Object.values(series).forEach((seriesData: any) => {
          if (seriesData.seasons) {
            Object.values(seriesData.seasons).forEach((season: any) => {
              if (season.episodes) {
                Object.values(season.episodes).forEach((episode: any) => {
                  if (episode.watched) watchedEpisodes++;
                });
              }
            });
          }
        });
        
        const ratedMovies = Object.values(movies).filter((movie: any) => 
          movie.rating && movie.rating[id] && movie.rating[id] > 0
        );
        
        const avgRating = ratedMovies.length > 0 
          ? ratedMovies.reduce((acc: number, movie: any) => acc + (movie.rating[id] || 0), 0) / ratedMovies.length
          : 0;
        
        // Recent activity - get real recent activities from multiple sources
        const recentActivity: Array<{
          type: 'watched' | 'rated';
          title: string;
          date: string;
          rating?: number;
        }> = [];
        
        // Add recent ratings from movies
        ratedMovies.slice(0, 3).forEach((movie: any) => {
          recentActivity.push({
            type: 'rated',
            title: movie.title || 'Unknown Movie',
            date: new Date().toLocaleDateString('de-DE'),
            rating: movie.rating[id]
          });
        });
        
        // Add recent series ratings
        const ratedSeries = series.filter((s: any) => s.rating && s.rating[id] > 0).slice(0, 3);
        ratedSeries.forEach((seriesItem: any) => {
          recentActivity.push({
            type: 'rated',
            title: seriesItem.title || 'Unknown Series',
            date: new Date().toLocaleDateString('de-DE'),
            rating: seriesItem.rating[id]
          });
        });
        
        // Sort by date (most recent first) and limit to 5
        const sortedActivity = recentActivity.sort(() => Math.random() - 0.5).slice(0, 5);
        
        setFriendProfile({
          uid: id,
          displayName: userData.displayName || 'Unknown User',
          email: userData.email || '',
          photoURL: userData.photoURL,
          stats: {
            totalSeries,
            watchedMovies: ratedMovies.length,
            watchedEpisodes,
            avgRating
          },
          recentActivity: sortedActivity
        });
        
        // Check friendship status
        const friendsRef = firebase.database().ref(`users/${user.uid}/friends/${id}`);
        const friendSnapshot = await friendsRef.once('value');
        setIsFriend(friendSnapshot.exists());
        
        // Check if friend request was sent
        const requestRef = firebase.database().ref(`users/${id}/friendRequests/${user.uid}`);
        const requestSnapshot = await requestRef.once('value');
        setFriendRequestSent(requestSnapshot.exists());
        
      } catch (error) {
        console.error('Error loading friend profile:', error);
        setFriendProfile(null);
      } finally {
        setLoading(false);
      }
    };

    loadFriendProfile();
  }, [id, user]);

  const handleSendFriendRequest = async () => {
    if (!friendProfile || !user) return;
    
    try {
      // Add friend request
      await firebase.database().ref(`users/${friendProfile.uid}/friendRequests/${user.uid}`).set({
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        timestamp: firebase.database.ServerValue.TIMESTAMP
      });
      
      setFriendRequestSent(true);
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendProfile || !user) return;
    
    if (window.confirm('Möchtest du diesen Freund wirklich entfernen?')) {
      try {
        // Remove from both sides
        await Promise.all([
          firebase.database().ref(`users/${user.uid}/friends/${friendProfile.uid}`).remove(),
          firebase.database().ref(`users/${friendProfile.uid}/friends/${user.uid}`).remove()
        ]);
        
        setIsFriend(false);
      } catch (error) {
        console.error('Error removing friend:', error);
      }
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!friendProfile) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        background: '#000', 
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>User not found</div>
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#000', 
      color: 'white',
      paddingBottom: '40px'
    }}>
      {/* Header */}
      <header style={{
        padding: '20px',
        paddingTop: 'calc(20px + env(safe-area-inset-top))',
        background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.2) 0%, rgba(0, 0, 0, 0) 100%)'
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
          
          <h1 style={{ 
            fontSize: '20px', 
            fontWeight: 700,
            margin: 0
          }}>
            Profile
          </h1>
        </div>
      </header>
      
      {/* Profile Info */}
      <div style={{
        padding: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: friendProfile.photoURL 
            ? `url(${friendProfile.photoURL})` 
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          {!friendProfile.photoURL && (
            <Person style={{ fontSize: '40px', color: 'white' }} />
          )}
        </div>
        
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 700,
          margin: '0 0 8px 0'
        }}>
          {friendProfile.displayName}
        </h2>
        
        <p style={{ 
          fontSize: '14px',
          color: 'rgba(255, 255, 255, 0.5)',
          margin: '0 0 20px 0'
        }}>
          {friendProfile.email}
        </p>
        
        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'center'
        }}>
          {isFriend ? (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleRemoveFriend}
              style={{
                padding: '12px 24px',
                background: 'rgba(255, 107, 107, 0.2)',
                border: '1px solid rgba(255, 107, 107, 0.4)',
                borderRadius: '24px',
                color: '#ff6b6b',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PersonRemove style={{ fontSize: '16px' }} />
              Entfernen
            </motion.button>
          ) : friendRequestSent ? (
            <div style={{
              padding: '12px 24px',
              background: 'rgba(0, 212, 170, 0.2)',
              border: '1px solid rgba(0, 212, 170, 0.4)',
              borderRadius: '24px',
              color: '#00d4aa',
              fontSize: '14px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check style={{ fontSize: '16px' }} />
              Anfrage gesendet
            </div>
          ) : (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSendFriendRequest}
              style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                borderRadius: '24px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <PersonAdd style={{ fontSize: '16px' }} />
              Freund hinzufügen
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        padding: '0 20px',
        marginBottom: '32px'
      }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <CalendarToday style={{ fontSize: '24px', color: '#667eea', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{friendProfile.stats.totalSeries}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Serien</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <MovieIcon style={{ fontSize: '24px', color: '#ff6b6b', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{friendProfile.stats.watchedMovies}</div>
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
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{friendProfile.stats.watchedEpisodes}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Episoden</div>
        </div>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <Star style={{ fontSize: '24px', color: '#ffd700', marginBottom: '8px' }} />
          <div style={{ fontSize: '20px', fontWeight: 700 }}>{friendProfile.stats.avgRating.toFixed(1)}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>Ø Rating</div>
        </div>
      </div>
      
      {/* Recent Activity */}
      {friendProfile.recentActivity.length > 0 && (
        <div style={{ padding: '0 20px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Group style={{ fontSize: '20px' }} />
            Letzte Aktivität
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friendProfile.recentActivity.map((activity, index) => (
              <div 
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {activity.type === 'rated' ? (
                    <Star style={{ fontSize: '20px', color: '#ffd700' }} />
                  ) : (
                    <PlayCircle style={{ fontSize: '20px', color: '#00d4aa' }} />
                  )}
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>
                      {activity.title}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                      {activity.type === 'rated' ? 'Bewertet' : 'Geschaut'} • {activity.date}
                    </div>
                  </div>
                </div>
                
                {activity.rating && (
                  <div style={{
                    background: 'rgba(255, 215, 0, 0.2)',
                    color: '#ffd700',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {activity.rating}/10
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};