/**
 * TasteMatchCard - Kompakte Karte für Taste Match auf der HomePage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CompareArrows, Person, ChevronRight, Close } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useTheme } from '../contexts/ThemeContext';
import { useOptimizedFriends } from '../contexts/OptimizedFriendsProvider';

interface FriendProfile {
  photoURL?: string;
  displayName?: string;
  username?: string;
}

export const TasteMatchCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { friends } = useOptimizedFriends();
  const [showSelector, setShowSelector] = useState(false);
  const [friendProfiles, setFriendProfiles] = useState<Record<string, FriendProfile>>({});

  // Lade aktuelle Profilbilder von Firebase
  useEffect(() => {
    if (friends.length === 0) return;

    const loadProfiles = async () => {
      const profiles: Record<string, FriendProfile> = {};
      await Promise.all(
        friends.map(async (friend) => {
          try {
            const snapshot = await firebase.database().ref(`users/${friend.uid}`).once('value');
            if (snapshot.exists()) {
              const data = snapshot.val();
              profiles[friend.uid] = {
                photoURL: data.photoURL,
                displayName: data.displayName,
                username: data.username,
              };
            }
          } catch (error) {
            // Fallback to cached data
          }
        })
      );
      setFriendProfiles(profiles);
    };

    loadProfiles();
  }, [friends]);

  // Keine Freunde = keine Karte anzeigen
  if (friends.length === 0) return null;

  const handleSelectFriend = (friendId: string) => {
    setShowSelector(false);
    navigate(`/taste-match/${friendId}`);
  };

  return (
    <>
      {/* Main Card */}
      <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowSelector(true)}
        style={{
          margin: '0 20px',
          padding: '12px 14px',
          borderRadius: '14px',
          background: `linear-gradient(135deg, ${currentTheme.primary}15, ${currentTheme.primary}05)`,
          border: `1px solid ${currentTheme.primary}30`,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${currentTheme.primary}, #764ba2)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CompareArrows style={{ fontSize: 20, color: 'white' }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 600,
              color: currentTheme.text.primary,
              whiteSpace: 'nowrap',
            }}
          >
            Taste Match
          </h3>
          <p
            style={{
              margin: '1px 0 0',
              fontSize: 12,
              color: currentTheme.text.secondary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Geschmack vergleichen
          </p>
        </div>

        {/* Friend Avatars Preview */}
        <div style={{ display: 'flex', marginRight: 8 }}>
          {friends.slice(0, 3).map((friend, i) => (
            <div
              key={friend.uid}
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentTheme.primary,
                border: `2px solid ${currentTheme.background.default}`,
                marginLeft: i > 0 ? -10 : 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 600,
                color: 'white',
                overflow: 'hidden',
              }}
            >
              {(friendProfiles[friend.uid]?.photoURL || friend.photoURL) ? (
                <img
                  src={friendProfiles[friend.uid]?.photoURL || friend.photoURL}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                (friendProfiles[friend.uid]?.displayName || friend.displayName)?.charAt(0).toUpperCase() || '?'
              )}
            </div>
          ))}
          {friends.length > 3 && (
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                background: currentTheme.background.paper,
                border: `2px solid ${currentTheme.background.default}`,
                marginLeft: -10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                color: currentTheme.text.secondary,
              }}
            >
              +{friends.length - 3}
            </div>
          )}
        </div>

        <ChevronRight style={{ color: currentTheme.text.secondary, fontSize: 20 }} />
      </motion.div>

      {/* Friend Selector Modal */}
      <AnimatePresence>
        {showSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowSelector(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
            }}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: 'calc(100% - 16px)',
                maxWidth: 500,
                maxHeight: '60vh',
                background: currentTheme.background.paper,
                borderRadius: '24px',
                padding: '20px',
                marginBottom: 'calc(70px + env(safe-area-inset-bottom))',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 700,
                    color: currentTheme.text.primary,
                  }}
                >
                  Freund auswählen
                </h2>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowSelector(false)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: currentTheme.text.primary,
                  }}
                >
                  <Close />
                </motion.button>
              </div>

              {/* Friend List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {friends.map((friend, i) => (
                  <motion.button
                    key={friend.uid}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectFriend(friend.uid)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 16px',
                      background: currentTheme.background.surface,
                      border: 'none',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${currentTheme.primary}, #764ba2)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        flexShrink: 0,
                      }}
                    >
                      {(friendProfiles[friend.uid]?.photoURL || friend.photoURL) ? (
                        <img
                          src={friendProfiles[friend.uid]?.photoURL || friend.photoURL}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Person style={{ fontSize: 24, color: 'white' }} />
                      )}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 500,
                          color: currentTheme.text.primary,
                        }}
                      >
                        {friendProfiles[friend.uid]?.displayName || friend.displayName || friend.username || 'Friend'}
                      </div>
                      {(friendProfiles[friend.uid]?.username || friend.username) && (friendProfiles[friend.uid]?.displayName || friend.displayName) && (
                        <div
                          style={{
                            fontSize: 13,
                            color: currentTheme.text.secondary,
                          }}
                        >
                          @{friendProfiles[friend.uid]?.username || friend.username}
                        </div>
                      )}
                    </div>

                    <CompareArrows
                      style={{ color: currentTheme.primary, fontSize: 20 }}
                    />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default TasteMatchCard;
