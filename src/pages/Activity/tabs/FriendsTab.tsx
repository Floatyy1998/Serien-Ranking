/**
 * FriendsTab - Friends list with profile pictures and remove functionality
 */

import { Person, PersonRemove } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { trackFriendProfileClicked } from '../../../firebase/analytics';
import type { FirebaseUserProfile } from '../types';
import type { Friend } from '../../../types/Friend';

interface FriendsTabProps {
  friends: Friend[];
  friendProfiles: Record<string, FirebaseUserProfile>;
  saveScrollPosition: () => void;
  onAddFriend: () => void;
  onRemoveFriend: (friend: { uid: string; name: string }) => void;
}

export const FriendsTab = ({
  friends,
  friendProfiles,
  saveScrollPosition,
  onAddFriend,
  onRemoveFriend,
}: FriendsTabProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <motion.div
      key="friends"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {friends.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', padding: '60px 20px' }}
        >
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              background: `${currentTheme.text.muted}10`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Person style={{ fontSize: '40px', color: currentTheme.text.muted }} />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: 700,
              color: currentTheme.text.primary,
            }}
          >
            Noch keine Freunde
          </h2>
          <p style={{ margin: '0 0 20px', color: currentTheme.text.muted, fontSize: '15px' }}>
            Füge Freunde hinzu um ihre Aktivitäten zu sehen
          </p>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onAddFriend}
            style={{
              padding: '12px 24px',
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `0 4px 15px ${currentTheme.primary}40`,
            }}
          >
            Freund hinzufügen
          </motion.button>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {friends.map((friend, index) => {
            const currentProfile = friendProfiles[friend.uid] || friend;
            return (
              <motion.div
                key={friend.uid}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => {
                  saveScrollPosition();
                  trackFriendProfileClicked(
                    currentProfile.displayName || currentProfile.username || 'unknown'
                  );
                  navigate(`/friend/${friend.uid}`);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '14px',
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  borderRadius: '14px',
                  color: currentTheme.text.primary,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    ...(currentProfile.photoURL
                      ? {
                          backgroundImage: `url("${currentProfile.photoURL}")`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : {
                          background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
                        }),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {!currentProfile.photoURL && (
                    <Person style={{ fontSize: '24px', color: 'white' }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      margin: '0 0 4px 0',
                    }}
                  >
                    {currentProfile.displayName || currentProfile.username}
                  </h3>
                  <p
                    style={{
                      fontSize: '14px',
                      color: currentTheme.text.muted,
                      margin: 0,
                    }}
                  >
                    @{currentProfile.username}
                  </p>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFriend({
                      uid: friend.uid,
                      name: currentProfile.displayName || currentProfile.username || 'Unbekannt',
                    });
                  }}
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: `${currentTheme.status.error}10`,
                    border: 'none',
                    color: currentTheme.text.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <PersonRemove style={{ fontSize: '18px' }} />
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
