import { Cancel, CheckCircle, Person, PersonAdd, Movie as MovieIcon, Tv as TvIcon, Star, ExpandMore } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovieList } from '../contexts/MovieListProvider';
import { useOptimizedFriends } from '../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../contexts/OptimizedSeriesListProvider';
import { useTheme } from '../contexts/ThemeContext';
import { FriendActivity } from '../types/Friend';
import { BackButton } from '../components/BackButton';
import { AddFriendDialog } from '../components/AddFriendDialog';

export const ActivityPage = () => {
  const navigate = useNavigate();
  const { currentTheme, getMobileHeaderStyle } = useTheme();
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
    cancelFriendRequest,
  } = useOptimizedFriends();

  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  const [activeTab, setActiveTab] = useState<'activity' | 'friends' | 'requests'>('activity');
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [tmdbPosters, setTmdbPosters] = useState<Record<string, string>>({});
  const [friendProfiles, setFriendProfiles] = useState<Record<string, any>>({});
  const [requestProfiles, setRequestProfiles] = useState<Record<string, any>>({});
  const [filterType, setFilterType] = useState<'all' | 'movies' | 'series'>('all');
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  // Mark as read
  useEffect(() => {
    if (activeTab === 'activity' && unreadActivitiesCount > 0) {
      markActivitiesAsRead();
    } else if (activeTab === 'requests' && unreadRequestsCount > 0) {
      markRequestsAsRead();
    }
  }, [activeTab, unreadActivitiesCount, unreadRequestsCount]);

  // Load profiles
  useEffect(() => {
    if (friends.length === 0) return;

    const loadProfiles = async () => {
      const newProfiles: Record<string, any> = {};
      await Promise.all(
        friends.map(async (friend) => {
          try {
            const userRef = firebase.database().ref(`users/${friend.uid}`);
            const snapshot = await userRef.once('value');
            if (snapshot.exists()) {
              newProfiles[friend.uid] = snapshot.val();
            }
          } catch (error) {}
        })
      );
      setFriendProfiles(newProfiles);
    };

    loadProfiles();
  }, [friends]);

  // Load request profiles
  useEffect(() => {
    const loadRequestProfiles = async () => {
      const profiles: Record<string, any> = {};
      for (const request of friendRequests) {
        try {
          const userRef = firebase.database().ref(`users/${request.fromUserId}`);
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

  // Get item details
  const getItemDetails = (activity: FriendActivity) => {
    const tmdbId = (activity as any).tmdbId || (activity as any).itemId;

    if (
      activity.type === 'series_added' ||
      activity.type === 'series_rated' ||
      activity.type === 'rating_updated' ||
      activity.type === 'series_added_to_watchlist' ||
      (activity as any).itemType === 'series'
    ) {
      const series = seriesList.find((s) => s.id === tmdbId || s.id === Number(tmdbId));
      if (!series) {
        return {
          id: tmdbId,
          title: (activity as any).itemTitle || 'Unbekannte Serie',
          poster: (activity as any).posterPath || (activity as any).poster,
        };
      }
      return series;
    } else {
      const movie = movieList.find((m) => m.id === tmdbId || m.id === Number(tmdbId));
      if (!movie) {
        return {
          id: tmdbId,
          title: (activity as any).itemTitle || 'Unbekannter Film',
          poster: (activity as any).posterPath || (activity as any).poster,
        };
      }
      return movie;
    }
  };

  // Get image URL
  const getImageUrl = (posterObj: any): string => {
    if (!posterObj) return '/placeholder.jpg';

    let path: string;
    if (typeof posterObj === 'object' && posterObj.poster) {
      path = posterObj.poster;
    } else if (typeof posterObj === 'string') {
      path = posterObj;
    } else {
      return '/placeholder.jpg';
    }

    if (!path) return '/placeholder.jpg';
    if (path.startsWith('http')) return path;
    return `https://image.tmdb.org/t/p/w342${path}`;
  };

  // Format time
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'gerade eben';
    if (minutes < 60) return `vor ${minutes}m`;
    if (hours < 24) return `vor ${hours}h`;
    if (days < 7) return `vor ${days}d`;

    return new Date(timestamp).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter and group activities by user
  const groupedActivities = useMemo(() => {
    let filtered = [...friendActivities];

    // Apply type filter
    if (filterType === 'movies') {
      filtered = filtered.filter(activity =>
        activity.type === 'movie_added' ||
        activity.type === 'movie_rated' ||
        activity.type === 'rating_updated_movie' ||
        (activity as any).itemType === 'movie'
      );
    } else if (filterType === 'series') {
      filtered = filtered.filter(activity =>
        activity.type === 'series_added' ||
        activity.type === 'series_rated' ||
        activity.type === 'rating_updated' ||
        activity.type === 'series_added_to_watchlist' ||
        ((activity as any).itemType === 'series' || (!(activity as any).itemType && activity.type !== 'movie_added' && activity.type !== 'movie_rated' && activity.type !== 'rating_updated_movie'))
      );
    }

    // Group by user
    const groups = new Map<string, FriendActivity[]>();

    filtered.forEach(activity => {
      const userId = activity.userId;
      if (!groups.has(userId)) {
        groups.set(userId, []);
      }
      groups.get(userId)!.push(activity);
    });

    // Sort activities within each group by timestamp (newest first)
    groups.forEach(activities => {
      activities.sort((a, b) => b.timestamp - a.timestamp);
    });

    // Convert to array and sort by most recent activity per user
    const sortedGroups = Array.from(groups.entries()).sort((a, b) => {
      const aLatest = a[1][0]?.timestamp || 0;
      const bLatest = b[1][0]?.timestamp || 0;
      return bLatest - aLatest;
    });

    return sortedGroups;
  }, [friendActivities, filterType]);

  // Toggle user expansion
  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  // Fetch missing posters
  useEffect(() => {
    const apiKey = import.meta.env.VITE_API_TMDB;
    if (!apiKey || friendActivities.length === 0) return;

    const fetchMissingPosters = async () => {
      const postersToFetch: { id: string; type: 'series' | 'movie' }[] = [];

      for (const activity of friendActivities) {
        const tmdbId = (activity as any).tmdbId || (activity as any).itemId;
        const itemType = (activity as any).itemType;

        if (!tmdbId) continue;

        const cacheKey = `${itemType}_${tmdbId}`;
        if (tmdbPosters[cacheKey]) continue;

        // Check if already in local list
        if (itemType === 'series') {
          const series = seriesList.find((s) => s.id === tmdbId || s.id === Number(tmdbId));
          if (series?.poster?.poster) continue;
        } else {
          const movie = movieList.find((m) => m.id === tmdbId || m.id === Number(tmdbId));
          if (movie?.poster?.poster) continue;
        }

        if ((activity as any).posterPath || (activity as any).poster) continue;

        postersToFetch.push({
          id: String(tmdbId),
          type: itemType === 'movie' ? 'movie' : 'series',
        });
      }

      if (postersToFetch.length === 0) return;

      const newPosters: Record<string, string> = {};
      await Promise.all(
        postersToFetch.map(async ({ id, type }) => {
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
          } catch (error) {}
        })
      );

      if (Object.keys(newPosters).length > 0) {
        setTmdbPosters((prev) => ({ ...prev, ...newPosters }));
      }
    };

    fetchMissingPosters();
  }, [friendActivities.length]);

  return (
    <div style={{ minHeight: '100vh', background: currentTheme.background.default }}>
      {/* Header */}
      <header
        style={{
          ...getMobileHeaderStyle('transparent'),
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          background: currentTheme.background.default,
          borderBottom: `1px solid ${currentTheme.border.default}22`,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <BackButton />
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                margin: 0,
                color: currentTheme.text.primary,
              }}
            >
              Aktivität
            </h1>
          </div>

          <button
            onClick={() => setShowAddFriend(true)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: currentTheme.primary,
              border: 'none',
              color: 'white',
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
          {unreadActivitiesCount > 0 && activeTab !== 'activity' && (
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
                color: 'white',
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
          <div>
            {/* Filter Pills */}
            <div style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
            }}>
              <button
                onClick={() => setFilterType('all')}
                style={{
                  padding: '8px 16px',
                  background: filterType === 'all' ? currentTheme.primary : currentTheme.background.surface,
                  border: `1px solid ${filterType === 'all' ? currentTheme.primary : currentTheme.border.default}33`,
                  borderRadius: '20px',
                  color: filterType === 'all' ? 'white' : currentTheme.text.primary,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Alle
              </button>
              <button
                onClick={() => setFilterType('series')}
                style={{
                  padding: '8px 16px',
                  background: filterType === 'series' ? currentTheme.primary : currentTheme.background.surface,
                  border: `1px solid ${filterType === 'series' ? currentTheme.primary : currentTheme.border.default}33`,
                  borderRadius: '20px',
                  color: filterType === 'series' ? 'white' : currentTheme.text.primary,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Serien
              </button>
              <button
                onClick={() => setFilterType('movies')}
                style={{
                  padding: '8px 16px',
                  background: filterType === 'movies' ? currentTheme.primary : currentTheme.background.surface,
                  border: `1px solid ${filterType === 'movies' ? currentTheme.primary : currentTheme.border.default}33`,
                  borderRadius: '20px',
                  color: filterType === 'movies' ? 'white' : currentTheme.text.primary,
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Filme
              </button>
            </div>

            {/* Activities List with Accordions */}
            {groupedActivities.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: currentTheme.text.secondary,
                }}
              >
                <div style={{ fontSize: '60px', marginBottom: '16px', opacity: 0.2 }}>
                  🎬
                </div>
                <p style={{ fontSize: '16px', marginBottom: '8px' }}>Noch keine Aktivitäten</p>
                <p style={{ fontSize: '14px', opacity: 0.7 }}>
                  {filterType !== 'all'
                    ? `Keine ${filterType === 'movies' ? 'Filme' : 'Serien'} vorhanden`
                    : 'Deine Freunde haben noch nichts geteilt'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {groupedActivities.map(([userId, activities]) => {
                  const friendObj = friends.find((f) => f.uid === userId);
                  const userProfile = friendObj
                    ? friendProfiles[friendObj.uid] || friendObj
                    : null;
                  const isExpanded = expandedUsers.has(userId);
                  const latestActivity = activities[0];

                  return (
                    <div
                      key={userId}
                      style={{
                        background: currentTheme.background.surface,
                        borderRadius: '12px',
                        border: `1px solid ${currentTheme.border.default}22`,
                        overflow: 'hidden',
                      }}
                    >
                      {/* Accordion Header */}
                      <button
                        onClick={() => toggleUserExpanded(userId)}
                        style={{
                          width: '100%',
                          padding: '16px',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${currentTheme.primary}08`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {/* User Avatar */}
                        <div
                          style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            ...(userProfile?.photoURL
                              ? {
                                  backgroundImage: `url("${userProfile.photoURL}")`,
                                  backgroundPosition: 'center',
                                  backgroundSize: 'cover',
                                }
                              : {
                                  background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}66)`,
                                }),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {!userProfile?.photoURL && (
                            <Person style={{ fontSize: '24px', color: 'white' }} />
                          )}
                        </div>

                        {/* User Info */}
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <div style={{
                            fontSize: '16px',
                            fontWeight: 600,
                            color: currentTheme.text.primary,
                            marginBottom: '4px',
                          }}>
                            {userProfile?.displayName || latestActivity.userName || 'Unbekannt'}
                          </div>
                          <div style={{
                            fontSize: '13px',
                            color: currentTheme.text.secondary,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}>
                            <span>{activities.length} {activities.length === 1 ? 'Aktivität' : 'Aktivitäten'}</span>
                            <span>·</span>
                            <span>{formatTimeAgo(latestActivity.timestamp)}</span>
                          </div>
                        </div>

                        {/* Expand/Collapse Icon */}
                        <div style={{
                          color: currentTheme.text.secondary,
                          transition: 'transform 0.3s',
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        }}>
                          <ExpandMore />
                        </div>
                      </button>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div style={{
                          borderTop: `1px solid ${currentTheme.border.default}22`,
                          padding: '12px',
                        }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {activities.map((activity) => {
                              const item = getItemDetails(activity);
                              const isMovie = activity.type === 'movie_added' ||
                                              activity.type === 'movie_rated' ||
                                              activity.type === 'rating_updated_movie' ||
                                              (activity as any).itemType === 'movie';
                              const rating = (activity as any).rating;
                              const hasRating = rating && rating > 0;
                              const isAdded = activity.type === 'movie_added' || activity.type === 'series_added';
                              const isRated = activity.type === 'movie_rated' || activity.type === 'series_rated' ||
                                            activity.type === 'rating_updated_movie' || activity.type === 'rating_updated';
                              const isWatchlisted = activity.type === 'series_added_to_watchlist' || activity.type === 'movie_added_to_watchlist';

                              const tmdbId = (activity as any).tmdbId || (activity as any).itemId;
                              const itemType = (activity as any).itemType;
                              const cacheKey = `${itemType}_${tmdbId}`;
                              const tmdbPoster = tmdbPosters[cacheKey];
                              const posterUrl = tmdbPoster
                                ? `https://image.tmdb.org/t/p/w342${tmdbPoster}`
                                : getImageUrl(item?.poster);

                              return (
                                <div
                                  key={activity.id}
                                  onClick={() => {
                                    if (tmdbId) {
                                      navigate(isMovie ? `/movie/${tmdbId}` : `/series/${tmdbId}`);
                                    }
                                  }}
                                  style={{
                                    display: 'flex',
                                    gap: '12px',
                                    padding: '12px',
                                    background: currentTheme.background.default,
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateX(4px)';
                                    e.currentTarget.style.background = `${currentTheme.primary}08`;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateX(0)';
                                    e.currentTarget.style.background = currentTheme.background.default;
                                  }}
                                >
                                  {/* Poster Thumbnail */}
                                  {posterUrl && posterUrl !== '/placeholder.jpg' && (
                                    <div style={{
                                      width: '60px',
                                      height: '90px',
                                      borderRadius: '6px',
                                      overflow: 'hidden',
                                      flexShrink: 0,
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                    }}>
                                      <img
                                        src={posterUrl}
                                        alt={item?.title || (activity as any).itemTitle}
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          objectFit: 'cover',
                                        }}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}

                                  {/* Content */}
                                  <div style={{
                                    flex: 1,
                                    minWidth: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                  }}>
                                    {/* Title with Type Icon */}
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                    }}>
                                      {isMovie ? (
                                        <MovieIcon style={{
                                          fontSize: '16px',
                                          color: currentTheme.text.secondary,
                                          opacity: 0.6,
                                        }} />
                                      ) : (
                                        <TvIcon style={{
                                          fontSize: '16px',
                                          color: currentTheme.text.secondary,
                                          opacity: 0.6,
                                        }} />
                                      )}
                                      <span style={{
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: currentTheme.text.primary,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                      }}>
                                        {(activity as any).itemTitle || item?.title || 'Unbekannt'}
                                      </span>
                                    </div>

                                    {/* Action and Rating */}
                                    <div style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                    }}>
                                      <span style={{
                                        fontSize: '13px',
                                        color: currentTheme.text.secondary,
                                      }}>
                                        {isAdded ? 'Hinzugefügt' : isWatchlisted ? 'Auf Watchlist' : (isRated || hasRating) ? 'Bewertet' : 'Aktivität'}
                                      </span>
                                      {hasRating && (
                                        <div style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '3px',
                                          padding: '2px 6px',
                                          background: `${currentTheme.primary}15`,
                                          borderRadius: '10px',
                                        }}>
                                          <Star style={{ fontSize: '12px', color: currentTheme.primary }} />
                                          <span style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: currentTheme.primary,
                                          }}>
                                            {rating}
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    {/* Time */}
                                    <span style={{
                                      fontSize: '12px',
                                      color: currentTheme.text.secondary,
                                      opacity: 0.7,
                                    }}>
                                      {formatTimeAgo(activity.timestamp)}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: currentTheme.text.secondary,
                }}
              >
                <Person style={{ fontSize: '60px', opacity: 0.2, marginBottom: '16px' }} />
                <p>Noch keine Freunde hinzugefügt</p>
                <button
                  onClick={() => setShowAddFriend(true)}
                  style={{
                    marginTop: '16px',
                    padding: '12px 24px',
                    background: currentTheme.primary,
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
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
                    key={friend.uid}
                    onClick={() => navigate(`/friend/${friend.uid}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: currentTheme.background.surface,
                      border: `1px solid ${currentTheme.border.default}22`,
                      borderRadius: '8px',
                      color: currentTheme.text.primary,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      marginBottom: '8px',
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
                              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}66)`,
                            }),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!currentProfile.photoURL && <Person style={{ fontSize: '24px', color: 'white' }} />}
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
                          color: currentTheme.text.secondary,
                          margin: 0,
                        }}
                      >
                        @{currentProfile.username}
                      </p>
                    </div>
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
                    color: currentTheme.text.secondary,
                    marginBottom: '12px',
                  }}
                >
                  Eingehende Anfragen
                </h3>
                {friendRequests.map((request) => {
                  const requestProfile = requestProfiles[request.fromUserId] || {};
                  return (
                    <div
                      key={request.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: currentTheme.background.surface,
                        border: `1px solid ${currentTheme.primary}33`,
                        borderRadius: '8px',
                        marginBottom: '8px',
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
                                background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}66)`,
                              }),
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!requestProfile.photoURL && <Person style={{ fontSize: '20px', color: 'white' }} />}
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
                            color: currentTheme.text.secondary,
                            margin: 0,
                          }}
                        >
                          {formatTimeAgo((request as any).timestamp || Date.now())}
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          style={{
                            padding: '8px',
                            background: '#4cd137',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCircle style={{ fontSize: '20px' }} />
                        </button>
                        <button
                          onClick={() => declineFriendRequest(request.id)}
                          style={{
                            padding: '8px',
                            background: '#e84118',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            cursor: 'pointer',
                          }}
                        >
                          <Cancel style={{ fontSize: '20px' }} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {sentRequests.length > 0 && (
              <div>
                <h3
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: currentTheme.text.secondary,
                    marginBottom: '12px',
                  }}
                >
                  Gesendete Anfragen
                </h3>
                {sentRequests.map((request) => (
                  <div
                    key={request.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: currentTheme.background.surface,
                      border: `1px solid ${currentTheme.border.default}22`,
                      borderRadius: '8px',
                      marginBottom: '8px',
                    }}
                  >
                    <Person style={{ fontSize: '20px', color: currentTheme.text.secondary }} />
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
                          color: currentTheme.text.secondary,
                          margin: 0,
                        }}
                      >
                        Ausstehend
                      </p>
                    </div>
                    <button
                      onClick={() => cancelFriendRequest(request.id)}
                      style={{
                        padding: '8px',
                        background: currentTheme.background.surface,
                        border: `1px solid ${currentTheme.border.default}`,
                        borderRadius: '6px',
                        color: currentTheme.text.secondary,
                        cursor: 'pointer',
                      }}
                    >
                      <Cancel style={{ fontSize: '20px' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {friendRequests.length === 0 && sentRequests.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  color: currentTheme.text.secondary,
                }}
              >
                <PersonAdd style={{ fontSize: '60px', opacity: 0.2, marginBottom: '16px' }} />
                <p>Keine offenen Anfragen</p>
              </div>
            )}
          </div>
        )}
      </div>

      <AddFriendDialog
        isOpen={showAddFriend}
        onClose={() => setShowAddFriend(false)}
      />
    </div>
  );
};