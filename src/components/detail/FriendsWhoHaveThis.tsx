import { Person, Star } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../App';
import { useOptimizedFriends } from '../../contexts/OptimizedFriendsProvider';
import { useTheme } from '../../contexts/ThemeContext';
import { calculateOverallRating } from '../../lib/rating/rating';
import { Series } from '../../types/Series';
import { Movie } from '../../types/Movie';

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

export const FriendsWhoHaveThis: React.FC<FriendsWhoHaveThisProps> = ({ itemId, mediaType }) => {
  const { user } = useAuth()!;
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
        // Check each friend's list for this item
        await Promise.all(
          friends.map(async (friend) => {
            try {
              const path = mediaType === 'series' ? `${friend.uid}/serien` : `${friend.uid}/filme`;
              const itemsRef = firebase.database().ref(path);
              const snapshot = await itemsRef.once('value');
              const itemsData = snapshot.val();

              if (itemsData) {
                // Find the item with matching ID
                const foundItem = Object.values(itemsData).find(
                  (item) => (item as Series | Movie).id === itemId
                ) as Series | Movie | undefined;

                if (foundItem) {
                  // Calculate rating
                  const rating = calculateOverallRating(foundItem);

                  // Load profile from users/{uid} to get photoURL
                  const userRef = firebase.database().ref(`users/${friend.uid}`);
                  const userSnapshot = await userRef.once('value');
                  const userData = userSnapshot.val();

                  friendsWithThisItem.push({
                    uid: friend.uid,
                    displayName: friend.displayName || friend.email?.split('@')[0] || 'Unbekannt',
                    photoURL: userData?.photoURL,
                    rating,
                  });
                }
              }
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
      {/* Friend Avatars - no overlap */}
      {friendsWithItem.slice(0, 4).map((friend) => {
        const hasRating = parseFloat(friend.rating) > 0;
        const rating = parseFloat(friend.rating);
        const isHighRating = rating >= 8.5;

        return (
          <div
            key={friend.uid}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/friend/${friend.uid}`);
            }}
            style={{
              position: 'relative',
              cursor: 'pointer',
              transition: 'transform 0.2s ease',
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
                fontSize: '12px',
                fontWeight: 700,
                color: 'white',
                border: hasRating
                  ? `2px solid ${isHighRating ? '#FFD700' : '#FFA500'}`
                  : '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: hasRating
                  ? isHighRating
                    ? '0 0 10px rgba(255, 215, 0, 0.5), 0 2px 6px rgba(0, 0, 0, 0.3)'
                    : '0 0 6px rgba(255, 165, 0, 0.3), 0 2px 6px rgba(0, 0, 0, 0.3)'
                  : '0 2px 6px rgba(0, 0, 0, 0.3)',
              }}
              title={`${friend.displayName}${hasRating ? ` · ${friend.rating}⭐` : ''}`}
            >
              {!friend.photoURL && <Person style={{ fontSize: '14px', color: 'white' }} />}
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
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                    : 'linear-gradient(135deg, #FFA500 0%, #FF8C00 100%)',
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
                <Star style={{ fontSize: '8px', color: '#000', filter: 'drop-shadow(0 0 1px rgba(255,255,255,0.4))' }} />
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 900,
                    color: '#000',
                    lineHeight: 1,
                    textShadow: '0 0 3px rgba(255,255,255,0.3)',
                  }}
                >
                  {friend.rating}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* +X More Badge */}
      {friendsWithItem.length > 4 && (
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.7) 0%, rgba(118, 75, 162, 0.7) 100%)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 800,
            color: 'white',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
            cursor: 'default',
          }}
          title={`+${friendsWithItem.length - 4} weitere Freunde`}
        >
          +{friendsWithItem.length - 4}
        </div>
      )}
    </div>
  );
};
