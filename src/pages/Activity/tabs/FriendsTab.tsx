/**
 * FriendsTab - Searchable friends list with avatars, online state and removal.
 */

import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { EmptyState } from '../../../components/ui';
import type { FirebaseUserProfile } from '../types';
import type { Friend } from '../../../types/Friend';
import { tapScaleSmall, tapScaleTight } from '../../../lib/motion';

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
  const [query, setQuery] = useState('');

  const resolved = useMemo(
    () =>
      friends.map((friend) => {
        const profile = friendProfiles[friend.uid] || friend;
        return {
          friend,
          displayName: profile.displayName || profile.username || 'Unbekannt',
          username: profile.username || '',
          photoURL: profile.photoURL,
          isOnline: friend.isOnline,
        };
      }),
    [friends, friendProfiles]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return resolved;
    return resolved.filter(
      (r) => r.displayName.toLowerCase().includes(q) || r.username.toLowerCase().includes(q)
    );
  }, [resolved, query]);

  if (friends.length === 0) {
    return (
      <motion.div
        key="friends"
        initial={{ opacity: 0, x: 16 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -16 }}
      >
        <EmptyState
          icon={<GroupRounded style={{ fontSize: 'inherit' }} />}
          title="Noch keine Freunde"
          description="Füge Freunde hinzu, um ihre Aktivitäten, Bewertungen und Watchlists zu verfolgen."
          action={{ label: 'Freund hinzufügen', onClick: onAddFriend }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      key="friends"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '11px 14px',
          marginBottom: '16px',
          borderRadius: '14px',
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <SearchRounded style={{ fontSize: '20px', color: currentTheme.text.muted }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`${friends.length} ${friends.length === 1 ? 'Freund' : 'Freunde'} durchsuchen`}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: currentTheme.text.secondary,
            fontSize: '15px',
          }}
        />
      </div>

      {filtered.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: currentTheme.text.muted,
            fontSize: '15px',
          }}
        >
          Keine Treffer für „{query}“
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(({ friend, displayName, username, photoURL, isOnline }, index) => (
            <motion.div
              key={friend.uid}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.04, 0.3) }}
              whileTap={tapScaleSmall}
              onClick={() => {
                saveScrollPosition();
                navigate(`/friend/${friend.uid}`);
              }}
              className="activity-friend-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '13px 14px',
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
                borderRadius: '16px',
                color: currentTheme.text.primary,
                cursor: 'pointer',
              }}
            >
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div
                  style={{
                    width: '50px',
                    height: '50px',
                    borderRadius: '50%',
                    ...(photoURL
                      ? {
                          backgroundImage: `url("${photoURL}")`,
                          backgroundPosition: 'center',
                          backgroundSize: 'cover',
                        }
                      : {
                          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        }),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {!photoURL && (
                    <PersonRounded
                      style={{ fontSize: '26px', color: currentTheme.text.secondary }}
                    />
                  )}
                </div>
                {isOnline && (
                  <span
                    style={{
                      position: 'absolute',
                      right: '1px',
                      bottom: '1px',
                      width: '13px',
                      height: '13px',
                      borderRadius: '50%',
                      background: currentTheme.status.success,
                      border: `2.5px solid ${currentTheme.background.surface}`,
                    }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    margin: '0 0 3px 0',
                    color: currentTheme.text.secondary,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {displayName}
                </h3>
                <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: 0 }}>
                  {username ? `@${username}` : isOnline ? 'Online' : 'Freund'}
                </p>
              </div>

              <motion.button
                whileTap={tapScaleTight}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFriend({ uid: friend.uid, name: displayName });
                }}
                aria-label={`${displayName} entfernen`}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '11px',
                  background: `${currentTheme.status.error}12`,
                  border: 'none',
                  color: currentTheme.status.error,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <PersonRemoveRounded style={{ fontSize: '18px' }} />
              </motion.button>

              <ChevronRightRounded
                style={{ fontSize: '20px', color: currentTheme.text.muted, flexShrink: 0 }}
              />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
