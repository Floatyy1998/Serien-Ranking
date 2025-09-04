import {
  ArrowBack,
  Cancel,
  CheckCircle,
  Close,
  Groups,
  Person,
  PersonAdd,
} from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { FriendActivity } from '../../types/Friend';

interface UserSearchResult {
  uid: string;
  username: string;
  displayName: string;
  photoURL?: string;
  isAlreadyFriend: boolean;
  hasPendingRequest: boolean;
}

export const MobileActivityPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth()!;
  const { currentTheme, getMobilePageStyle, getMobileHeaderStyle } = useTheme();
  const {
    friends,
    friendRequests,
    sentRequests,
    friendActivities,
    unreadActivitiesCount,
    unreadRequestsCount,
    markActivitiesAsRead,
    markRequestsAsRead,
    acceptFriendRequest,
    declineFriendRequest,
    sendFriendRequest,
  } = useOptimizedFriends();

  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [activeTab, setActiveTab] = useState<
    'activity' | 'friends' | 'requests'
  >('activity');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendUsername, setFriendUsername] = useState('');
  const [addingFriend, setAddingFriend] = useState(false);
  const [tmdbPosters, setTmdbPosters] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [requestProfiles, setRequestProfiles] = useState<Record<string, any>>(
    {}
  );

  // Mark as read when viewing
  React.useEffect(() => {
    if (activeTab === 'activity' && unreadActivitiesCount > 0) {
      markActivitiesAsRead();
    } else if (activeTab === 'requests' && unreadRequestsCount > 0) {
      markRequestsAsRead();
    }
  }, [activeTab, unreadActivitiesCount, unreadRequestsCount]);

  // Load friend profiles from Firebase Database (like desktop version)
  React.useEffect(() => {
    if (friends.length === 0) {
      setFriendProfiles({});
      return;
    }

    const loadFriendProfiles = async () => {
      const newProfiles: Record<string, any> = {};

      // Load all profiles in parallel
      await Promise.all(
        friends.map(async (friend) => {
          try {
            const userRef = firebase.database().ref(`users/${friend.uid}`);
            const snapshot = await userRef.once('value');
            if (snapshot.exists()) {
              newProfiles[friend.uid] = snapshot.val();
            }
          } catch (error) {
            console.warn(`Failed to load profile for ${friend.uid}:`, error);
          }
        })
      );

      setFriendProfiles(newProfiles);
    };

    loadFriendProfiles();
  }, [friends]);

  // Load request profiles from Firebase Database (like desktop version)
  React.useEffect(() => {
    const loadRequestProfiles = async () => {
      const profiles: Record<string, any> = {};

      for (const request of friendRequests) {
        try {
          const userRef = firebase
            .database()
            .ref(`users/${request.fromUserId}`);
          const snapshot = await userRef.once('value');
          if (snapshot.exists()) {
            profiles[request.fromUserId] = snapshot.val();
          }
        } catch (error) {}
      }

      setRequestProfiles(profiles);
    };

    if (friendRequests.length > 0) {
      loadRequestProfiles();
    }
  }, [friendRequests]);

  // Search for users when friendUsername changes
  React.useEffect(() => {
    if (friendUsername.length < 3) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [friendUsername]);

  const searchUsers = async () => {
    if (!user || friendUsername.length < 3) return;

    try {
      setSearching(true);

      const usersRef = firebase.database().ref('users');
      const snapshot = await usersRef.once('value');
      const usersData = snapshot.val();

      if (!usersData) {
        setSearchResults([]);
        return;
      }

      const results: UserSearchResult[] = [];

      const currentFriendIds = friends.map((f) => f.uid);
      const sentRequestIds = sentRequests.map((r) => r.toUserId);

      Object.keys(usersData).forEach((uid) => {
        const userData = usersData[uid];

        if (uid === user.uid) return;
        if (!userData.username) return;

        const searchInUsername = userData.username
          .toLowerCase()
          .includes(friendUsername.toLowerCase());
        const searchInDisplayName = userData.displayName
          ?.toLowerCase()
          .includes(friendUsername.toLowerCase());

        if (searchInUsername || searchInDisplayName) {
          const isAlreadyFriend = currentFriendIds.includes(uid);
          const hasPendingRequest = sentRequestIds.includes(uid);

          results.push({
            uid,
            username: userData.username,
            displayName: userData.displayName,
            photoURL: userData.photoURL,
            isAlreadyFriend,
            hasPendingRequest,
          });
        }
      });

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  // Get item details for activity
  const getItemDetails = (activity: FriendActivity) => {
    const tmdbId = (activity as any).tmdbId || (activity as any).itemId;

    if (
      activity.type === 'series_added' ||
      activity.type === 'series_rated' ||
      (activity as any).itemType === 'series'
    ) {
      const series = seriesList.find(
        (s) => s.id === tmdbId || s.id === Number(tmdbId)
      );
      // If not found, create a minimal object with the poster path
      if (!series) {
        return {
          id: tmdbId,
          title: (activity as any).itemTitle || 'Unbekannte Serie',
          poster: (activity as any).posterPath || (activity as any).poster,
        };
      }
      return series;
    } else if (
      activity.type === 'movie_added' ||
      activity.type === 'movie_rated' ||
      (activity as any).itemType === 'movie'
    ) {
      const movie = movieList.find(
        (m) => m.id === tmdbId || m.id === Number(tmdbId)
      );
      // If not found, create a minimal object with the poster path
      if (!movie) {
        return {
          id: tmdbId,
          title: (activity as any).itemTitle || 'Unbekannter Film',
          poster: (activity as any).posterPath || (activity as any).poster,
        };
      }
      return movie;
    }
    return null;
  };

  // Get TMDB image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';
    const path = typeof posterObj === 'object' ? posterObj.poster : posterObj;
    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w185${path}`;
  };

  // Format activity message
  const formatActivityMessage = (activity: FriendActivity): string => {
    const rating = (activity as any).rating;
    const itemTitle = (activity as any).itemTitle;

    if (activity.type === 'series_added') {
      return `hat "${itemTitle}" hinzugefügt`;
    } else if (
      activity.type === 'series_rated' ||
      ((activity as any).itemType === 'series' && rating)
    ) {
      return `hat "${itemTitle}" bewertet (${rating}/10)`;
    } else if (activity.type === 'movie_added') {
      return `hat "${itemTitle}" hinzugefügt`;
    } else if (
      activity.type === 'movie_rated' ||
      ((activity as any).itemType === 'movie' && rating)
    ) {
      return `hat "${itemTitle}" bewertet (${rating}/10)`;
    }
    return 'hat etwas gemacht';
  };

  // Format time ago
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'gerade eben';
    if (minutes < 60)
      return `vor ${minutes} ${minutes === 1 ? 'Minute' : 'Minuten'}`;
    if (hours < 24) return `vor ${hours} ${hours === 1 ? 'Stunde' : 'Stunden'}`;
    if (days < 7) return `vor ${days} ${days === 1 ? 'Tag' : 'Tagen'}`;

    return new Date(timestamp).toLocaleDateString('de-DE');
  };

  // Sort activities by timestamp
  const sortedActivities = useMemo(() => {
    console.log('Friend activities:', friendActivities);
    if (friendActivities.length > 0) {
      console.log('First activity details:', friendActivities[0]);
    }
    return [...friendActivities].sort((a, b) => b.timestamp - a.timestamp);
  }, [friendActivities]);

  // Fetch missing posters from TMDB - only when friendActivities change, not tmdbPosters
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey || friendActivities.length === 0) return;

    const fetchMissingPosters = async () => {
      const postersToFetch: { id: string; type: 'series' | 'movie' }[] = [];

      for (const activity of friendActivities) {
        const tmdbId = (activity as any).tmdbId || (activity as any).itemId;
        const itemType = (activity as any).itemType;

        if (!tmdbId) continue;

        // Check if we already have this poster cached
        const cacheKey = `${itemType}_${tmdbId}`;
        if (tmdbPosters[cacheKey]) continue;

        // Check if it's in local list (without using getItemDetails to avoid loops)
        if (
          itemType === 'series' ||
          activity.type === 'series_added' ||
          activity.type === 'series_rated'
        ) {
          const series = seriesList.find(
            (s) => s.id === tmdbId || s.id === Number(tmdbId)
          );
          if (
            series &&
            series.poster &&
            typeof series.poster === 'object' &&
            series.poster.poster
          )
            continue;
        } else if (
          itemType === 'movie' ||
          activity.type === 'movie_added' ||
          activity.type === 'movie_rated'
        ) {
          const movie = movieList.find(
            (m) => m.id === tmdbId || m.id === Number(tmdbId)
          );
          if (
            movie &&
            movie.poster &&
            typeof movie.poster === 'object' &&
            movie.poster.poster
          )
            continue;
        }

        // Check if activity already has posterPath
        if ((activity as any).posterPath || (activity as any).poster) continue;

        postersToFetch.push({
          id: String(tmdbId),
          type: itemType === 'movie' ? 'movie' : 'series',
        });
      }

      // Only fetch if we have posters to fetch
      if (postersToFetch.length === 0) return;

      // Batch fetch all missing posters
      const newPosters: Record<string, string> = {};
      const promises = postersToFetch.map(async ({ id, type }) => {
        try {
          const endpoint = type === 'movie' ? 'movie' : 'tv';
          const response = await fetch(
            `https://api.themoviedb.org/3/${endpoint}/${id}?api_key=${apiKey}&language=de-DE`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.poster_path) {
              newPosters[`${type}_${id}`] = data.poster_path;
            }
          }
        } catch (error) {
          console.error(`Failed to fetch poster for ${type} ${id}:`, error);
        }
      });

      await Promise.all(promises);

      if (Object.keys(newPosters).length > 0) {
        setTmdbPosters((prev) => ({ ...prev, ...newPosters }));
      }
    };

    fetchMissingPosters();
  }, [friendActivities.length]); // Only depend on activities length, not tmdbPosters

  // Handle add friend
  const handleAddFriend = async (targetUser?: UserSearchResult) => {
    const username = targetUser ? targetUser.username : friendUsername.trim();
    if (!username) return;

    setAddingFriend(true);
    try {
      const success = await sendFriendRequest(username);
      if (success) {
        setFriendUsername('');
        setSearchResults([]);
        setShowAddFriend(false);
        alert('Freundschaftsanfrage gesendet!');
      } else {
        alert('Benutzer nicht gefunden oder bereits befreundet');
      }
    } catch (error) {
      alert('Fehler beim Senden der Anfrage');
    } finally {
      setAddingFriend(false);
    }
  };

  return (
    <div
      style={{
        ...getMobilePageStyle(),
        height: '100dvh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {/* Header */}
      <header
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          borderBottom: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                background: currentTheme.background.surface,
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
                height: '40px',
              }}
            >
              <ArrowBack />
            </button>
            <div>
              <h1
                style={{
                  fontSize: '32px',
                  fontWeight: 800,
                  margin: 0,
                  background: currentTheme.primary,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Aktivität
              </h1>
              <p
                style={{
                  color: currentTheme.text.secondary,
                  fontSize: '16px',
                  margin: '4px 0 0 0',
                }}
              >
                {friends.length} Freunde • {sortedActivities.length} Aktivitäten
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddFriend(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: currentTheme.primary,
              border: 'none',
              color: 'white', // Always white text on primary background
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <PersonAdd />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          padding: '0 20px',
          marginTop: '20px',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('activity')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'activity'
                ? `${currentTheme.primary}33`
                : currentTheme.background.surface,
            border:
              activeTab === 'activity'
                ? `1px solid ${currentTheme.primary}66`
                : `1px solid ${currentTheme.border.default}`,
            borderRadius: '8px',
            color: currentTheme.text.primary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Aktivität
          {unreadActivitiesCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '6px',
                right: '6px',
                width: '8px',
                height: '8px',
                background: currentTheme.status.error,
                borderRadius: '50%',
              }}
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('friends')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'friends'
                ? `${currentTheme.primary}33`
                : currentTheme.background.surface,
            border:
              activeTab === 'friends'
                ? `1px solid ${currentTheme.primary}66`
                : `1px solid ${currentTheme.border.default}`,
            borderRadius: '8px',
            color: currentTheme.text.primary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Freunde ({friends.length})
        </button>

        <button
          onClick={() => setActiveTab('requests')}
          style={{
            flex: 1,
            padding: '10px',
            background:
              activeTab === 'requests'
                ? `${currentTheme.primary}33`
                : currentTheme.background.surface,
            border:
              activeTab === 'requests'
                ? `1px solid ${currentTheme.primary}66`
                : `1px solid ${currentTheme.border.default}`,
            borderRadius: '8px',
            color: currentTheme.text.primary,
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            position: 'relative',
          }}
        >
          Anfragen
          {friendRequests.length > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                padding: '2px 6px',
                background: currentTheme.status.error,
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {friendRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '20px' }}>
        {activeTab === 'activity' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {sortedActivities.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <Groups
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                />
                <p>Noch keine Aktivitäten von Freunden</p>
              </div>
            ) : (
              sortedActivities.map((activity) => {
                const item = getItemDetails(activity);
                const isNew =
                  activity.timestamp > Date.now() - 24 * 60 * 60 * 1000;
                // userName is now added when loading activities
                const friendName = activity.userName || 'Unbekannt';
                // Find the friend object and get their updated profile
                const friendObj = friends.find(
                  (f) => f.uid === activity.userId
                );
                const activityProfile = friendObj
                  ? friendProfiles[friendObj.uid] || friendObj
                  : null;

                return (
                  <div
                    key={activity.id}
                    style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px',
                      background: isNew
                        ? 'rgba(102, 126, 234, 0.05)'
                        : 'rgba(255, 255, 255, 0.02)',
                      border: isNew
                        ? '1px solid rgba(102, 126, 234, 0.2)'
                        : '1px solid rgba(255, 255, 255, 0.05)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => {
                      const tmdbId =
                        (activity as any).tmdbId || (activity as any).itemId;
                      const itemType = (activity as any).itemType;

                      if (tmdbId) {
                        navigate(
                          itemType === 'movie'
                            ? `/movie/${tmdbId}`
                            : `/series/${tmdbId}`
                        );
                      }
                    }}
                  >
                    {/* User Avatar */}
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        ...(activityProfile?.photoURL
                          ? {
                              backgroundImage: `url("${activityProfile.photoURL}")`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : {
                              background:
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {!activityProfile?.photoURL && (
                        <Person style={{ fontSize: '20px' }} />
                      )}
                    </div>

                    {/* Activity Content */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          marginBottom: '4px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            color: 'white',
                          }}
                        >
                          {activityProfile?.displayName || friendName}
                        </span>
                        <span
                          style={{
                            fontSize: '13px',
                            color: 'rgba(255, 255, 255, 0.5)',
                          }}
                        >
                          {formatActivityMessage(activity)}
                        </span>
                      </div>

                      {/* Remove duplicate title display since it's in the message now */}

                      <span
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.4)',
                        }}
                      >
                        {formatTimeAgo(activity.timestamp)}
                      </span>
                    </div>

                    {/* Item Poster */}
                    {(() => {
                      const tmdbId =
                        (activity as any).tmdbId || (activity as any).itemId;
                      const itemType = (activity as any).itemType;
                      const cacheKey = `${itemType}_${tmdbId}`;
                      const tmdbPoster = tmdbPosters[cacheKey];

                      if (item || tmdbPoster) {
                        const posterUrl = tmdbPoster
                          ? `https://image.tmdb.org/t/p/w185${tmdbPoster}`
                          : getImageUrl(item?.poster);

                        return (
                          <img
                            src={posterUrl}
                            alt={item?.title || (activity as any).itemTitle}
                            style={{
                              width: '50px',
                              height: '75px',
                              objectFit: 'cover',
                              borderRadius: '6px',
                              flexShrink: 0,
                            }}
                          />
                        );
                      }
                      return null;
                    })()}
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {friends.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <Groups
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                />
                <p>Noch keine Freunde hinzugefügt</p>
                <button
                  onClick={() => setShowAddFriend(true)}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: currentTheme.primary,
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Freund hinzufügen
                </button>
              </div>
            ) : (
              friends.map((friend) => {
                const currentProfile = friendProfiles[friend.uid] || friend;
                return (
                  <button
                    key={(friend as any).id || friend.uid || Math.random()}
                    onClick={() =>
                      navigate(`/friend/${(friend as any).id || friend.uid}`)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: currentTheme.text.primary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        ...(currentProfile.photoURL
                          ? {
                              backgroundImage: `url("${currentProfile.photoURL}")`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : {
                              background:
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!currentProfile.photoURL && (
                        <Person style={{ fontSize: '24px' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <h4
                        style={{
                          fontSize: '15px',
                          fontWeight: 600,
                          margin: '0 0 4px 0',
                        }}
                      >
                        {currentProfile.displayName || currentProfile.username}
                      </h4>
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'rgba(255, 255, 255, 0.5)',
                          margin: 0,
                        }}
                      >
                        @{currentProfile.username}
                      </p>
                    </div>

                    {friend.isOnline && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          background: '#4cd137',
                          borderRadius: '50%',
                        }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'requests' && (
          <div>
            {friendRequests.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '12px',
                  }}
                >
                  Eingehende Anfragen
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {friendRequests.map((request) => {
                    const requestProfile =
                      requestProfiles[request.fromUserId] || {};
                    return (
                      <div
                        key={request.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '12px',
                          background: 'rgba(102, 126, 234, 0.05)',
                          border: '1px solid rgba(102, 126, 234, 0.2)',
                          borderRadius: '8px',
                        }}
                      >
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            ...(requestProfile.photoURL
                              ? {
                                  backgroundImage: `url("${requestProfile.photoURL}")`,
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                }
                              : {
                                  background:
                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                }),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {!requestProfile.photoURL && (
                            <Person style={{ fontSize: '20px' }} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <h4
                            style={{
                              fontSize: '14px',
                              fontWeight: 600,
                              margin: 0,
                            }}
                          >
                            {requestProfile.displayName || request.fromUsername}
                          </h4>
                          <p
                            style={{
                              fontSize: '12px',
                              color: 'rgba(255, 255, 255, 0.5)',
                              margin: 0,
                            }}
                          >
                            {formatTimeAgo(
                              (request as any).timestamp || Date.now()
                            )}
                          </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => acceptFriendRequest(request.id)}
                            style={{
                              padding: '8px',
                              background: 'rgba(76, 209, 55, 0.2)',
                              border: '1px solid rgba(76, 209, 55, 0.4)',
                              borderRadius: '6px',
                              color: '#4cd137',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <CheckCircle style={{ fontSize: '20px' }} />
                          </button>
                          <button
                            onClick={() => declineFriendRequest(request.id)}
                            style={{
                              padding: '8px',
                              background: 'rgba(255, 107, 107, 0.2)',
                              border: '1px solid rgba(255, 107, 107, 0.4)',
                              borderRadius: '6px',
                              color: '#ff6b6b',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Cancel style={{ fontSize: '20px' }} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {sentRequests.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginBottom: '12px',
                  }}
                >
                  Gesendete Anfragen
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {sentRequests.map((request) => (
                    <div
                      key={request.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '8px',
                      }}
                    >
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          ...((request as any).toPhotoURL
                            ? {
                                backgroundImage: `url("${
                                  (request as any).toPhotoURL
                                }")`,
                                backgroundPosition: 'center',
                                backgroundSize: 'cover',
                              }
                            : {
                                background:
                                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              }),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!(request as any).toPhotoURL && (
                          <Person style={{ fontSize: '20px' }} />
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        <h4
                          style={{
                            fontSize: '14px',
                            fontWeight: 600,
                            margin: 0,
                          }}
                        >
                          {request.toUsername}
                        </h4>
                        <p
                          style={{
                            fontSize: '12px',
                            color: 'rgba(255, 255, 255, 0.5)',
                            margin: 0,
                          }}
                        >
                          Ausstehend •{' '}
                          {formatTimeAgo(
                            (request as any).timestamp || Date.now()
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {friendRequests.length === 0 && sentRequests.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                <PersonAdd
                  style={{
                    fontSize: '48px',
                    marginBottom: '16px',
                    opacity: 0.3,
                  }}
                />
                <p>Keine offenen Anfragen</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div
          style={{
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
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Freund hinzufügen
              </h2>
              <button
                onClick={() => setShowAddFriend(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.5)',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                <Close />
              </button>
            </div>

            <input
              type='text'
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder='Benutzername eingeben...'
              style={{
                width: '100%',
                padding: '12px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                color: currentTheme.text.primary,
                fontSize: '16px',
                marginBottom: '20px',
                outline: 'none',
              }}
            />

            {/* Search Results */}
            {searching && (
              <div
                style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'rgba(255, 255, 255, 0.5)',
                }}
              >
                Suche...
              </div>
            )}

            {searchResults.length > 0 && (
              <div
                style={{
                  marginBottom: '20px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}
              >
                {searchResults.map((result) => (
                  <button
                    key={result.uid}
                    onClick={() => handleAddFriend(result)}
                    disabled={
                      result.isAlreadyFriend ||
                      result.hasPendingRequest ||
                      addingFriend
                    }
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      color: currentTheme.text.primary,
                      cursor:
                        result.isAlreadyFriend ||
                        result.hasPendingRequest ||
                        addingFriend
                          ? 'not-allowed'
                          : 'pointer',
                      opacity:
                        result.isAlreadyFriend ||
                        result.hasPendingRequest ||
                        addingFriend
                          ? 0.5
                          : 1,
                      marginBottom: '8px',
                      textAlign: 'left',
                    }}
                  >
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        ...(result.photoURL
                          ? {
                              backgroundImage: `url("${result.photoURL}")`,
                              backgroundPosition: 'center',
                              backgroundSize: 'cover',
                            }
                          : {
                              background:
                                'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            }),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {!result.photoURL && (
                        <Person style={{ fontSize: '20px' }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 600,
                          marginBottom: '2px',
                        }}
                      >
                        {result.displayName || result.username}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: 'rgba(255, 255, 255, 0.5)',
                        }}
                      >
                        @{result.username}
                        {result.isAlreadyFriend && ' • Bereits befreundet'}
                        {result.hasPendingRequest && ' • Anfrage gesendet'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {friendUsername.length >= 3 &&
              searchResults.length === 0 &&
              !searching && (
                <div
                  style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'rgba(255, 255, 255, 0.5)',
                    marginBottom: '20px',
                  }}
                >
                  Keine Benutzer gefunden
                </div>
              )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setShowAddFriend(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: currentTheme.text.primary,
                  fontSize: '16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleAddFriend()}
                disabled={addingFriend || !friendUsername.trim()}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: currentTheme.primary,
                  border: 'none',
                  borderRadius: '8px',
                  color: currentTheme.text.primary,
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor:
                    addingFriend || !friendUsername.trim()
                      ? 'not-allowed'
                      : 'pointer',
                  opacity: addingFriend || !friendUsername.trim() ? 0.5 : 1,
                }}
              >
                {addingFriend ? 'Sende...' : 'Senden'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
