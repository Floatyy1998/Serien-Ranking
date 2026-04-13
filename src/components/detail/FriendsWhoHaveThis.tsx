import { Person, Star } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { memo, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { calculateOverallRating } from '../../lib/rating/rating';
import type { Series } from '../../types/Series';
import type { Movie } from '../../types/Movie';

interface FriendWithItem {
  uid: string;
  displayName: string;
  photoURL?: string;
  rating: string;
}

interface FriendsWhoHaveThisProps {
  itemId: number;
  mediaType: 'series' | 'movie';
}

const FriendsWhoHaveThisInner: React.FC<FriendsWhoHaveThisProps> = ({ itemId, mediaType }) => {
  const { user } = useAuth() || {};
  const { friends } = useOptimizedFriends();
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [friendsWithItem, setFriendsWithItem] = useState<FriendWithItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFriendsWithItem = async () => {
      if (!user || friends.length === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const friendsWithThisItem: FriendWithItem[] = [];

      try {
        // Gezielter Punkt-Query statt Full-Read: nur den einen Eintrag pro Friend
        // lesen (~500 Bytes) statt die gesamte series/movies-Liste (~100-200 KB).
        // photoURL kommt aus dem Friend-Objekt des Contexts — kein users/{uid}
        // Read noetig.
        const subPath = mediaType === 'series' ? 'series' : 'movies';
        await Promise.all(
          friends.map(async (friend) => {
            try {
              const itemRef = firebase.database().ref(`users/${friend.uid}/${subPath}/${itemId}`);
              const snapshot = await itemRef.once('value');
              const foundItem = snapshot.val() as Record<string, unknown> | null;
              if (!foundItem) return;

              // Fallback: photoURL aus users/{uid}/photoURL nachladen, falls der
              // Snapshot im Friend-Objekt veraltet/leer ist.
              let photoURL = friend.photoURL;
              if (!photoURL) {
                try {
                  const photoSnap = await firebase
                    .database()
                    .ref(`users/${friend.uid}/photoURL`)
                    .once('value');
                  photoURL = photoSnap.val() || undefined;
                } catch {
                  // ignore
                }
              }

              const rating = calculateOverallRating(foundItem as unknown as Series | Movie);
              friendsWithThisItem.push({
                uid: friend.uid,
                displayName: friend.displayName || friend.email?.split('@')[0] || 'Unbekannt',
                photoURL,
                rating,
              });
            } catch (error) {
              console.error(`Error loading ${mediaType} for friend ${friend.uid}:`, error);
            }
          })
        );

        // Sort by rating (descending)
        friendsWithThisItem.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        setFriendsWithItem(friendsWithThisItem);
      } catch (error) {
        console.error('Error loading friends with this item:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFriendsWithItem();
  }, [user, friends, itemId, mediaType]);

  if (loading) {
    return null;
  }

  if (friendsWithItem.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}
    >
      {/* Friend Avatars */}
      {friendsWithItem.slice(0, 3).map((friend) => {
        const hasRating = parseFloat(friend.rating) > 0;
        const rating = parseFloat(friend.rating);
        const isHighRating = rating >= 8.5;

        return (
          <Tooltip
            key={friend.uid}
            title={`${friend.displayName}${hasRating ? ` · ${friend.rating}` : ''}`}
            arrow
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/friend/${friend.uid}`);
              }}
              style={{
                position: 'relative',
                cursor: 'pointer',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Avatar Circle */}
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  ...(friend.photoURL
                    ? {
                        backgroundImage: `url("${friend.photoURL}")`,
                        backgroundPosition: 'center',
                        backgroundSize: 'cover',
                      }
                    : {
                        background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.status.info})`,
                      }),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                  border: hasRating
                    ? `2px solid ${currentTheme.accent}`
                    : '2px solid rgba(255, 255, 255, 0.4)',
                  boxShadow: hasRating
                    ? isHighRating
                      ? '0 0 10px rgba(255, 215, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3)'
                      : '0 0 6px rgba(255, 165, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3)'
                    : '0 2px 6px rgba(0, 0, 0, 0.3)',
                }}
                // tooltip handled by parent Tooltip wrapper
              >
                {!friend.photoURL && <Person style={{ fontSize: '15px', color: 'white' }} />}
              </div>

              {/* Rating Badge - Bottom Center */}
              {hasRating && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isHighRating
                      ? `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent} 100%)`
                      : `linear-gradient(135deg, ${currentTheme.accent} 0%, ${currentTheme.accent} 100%)`,
                    borderRadius: '8px',
                    padding: '1px 5px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '2px',
                    border: '1.5px solid rgba(0, 0, 0, 0.8)',
                    boxShadow: isHighRating
                      ? '0 0 6px rgba(255, 215, 0, 0.6), 0 1px 3px rgba(0, 0, 0, 0.5)'
                      : '0 1px 3px rgba(0, 0, 0, 0.5)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Star
                    style={{
                      fontSize: '8px',
                      color: currentTheme.background.default,
                      filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.4))',
                    }}
                  />
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      color: currentTheme.background.default,
                      lineHeight: 1,
                      textShadow: '0 0 3px rgba(255,255,255,0.3)',
                    }}
                  >
                    {friend.rating}
                  </span>
                </div>
              )}
            </div>
          </Tooltip>
        );
      })}

      {/* +X More Badge */}
      {friendsWithItem.length > 3 && (
        <Tooltip title={`+${friendsWithItem.length - 3} weitere Freunde`} arrow>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background:
                'linear-gradient(135deg, rgba(102, 126, 234, 0.5) 0%, rgba(118, 75, 162, 0.5) 100%)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 800,
              color: currentTheme.text.primary,
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
              cursor: 'default',
            }}
          >
            +{friendsWithItem.length - 3}
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export const FriendsWhoHaveThis = memo(FriendsWhoHaveThisInner);
FriendsWhoHaveThis.displayName = 'FriendsWhoHaveThis';
