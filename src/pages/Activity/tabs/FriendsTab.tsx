import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import PersonRounded from '@mui/icons-material/PersonRounded';
import PersonRemoveRounded from '@mui/icons-material/PersonRemoveRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import StarRounded from '@mui/icons-material/StarRounded';
import StarBorderRounded from '@mui/icons-material/StarBorderRounded';
import HourglassTopRounded from '@mui/icons-material/HourglassTopRounded';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { t } from '../../../services/i18n';
import { EmptyState } from '../../../components/ui';
import { NameBadges } from '../../../components/ui/display/NameBadges';
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

/**
 * Der Stern merkt vor — und daneben steht, wie es um den Einblick steht.
 * Bewusst getrennt: frueher zeigte der Stern selbst eine Sanduhr fuer alles,
 * was nicht freigegeben war, also auch fuer abgelehnte Bitten. Dieser Zustand
 * loeste sich nie auf und war von "wartet" nicht zu unterscheiden.
 */
const FavoriteStar = ({
  isFavorite,
  name,
  onToggle,
}: {
  isFavorite: boolean;
  name: string;
  onToggle: () => void;
}) => {
  const { currentTheme } = useTheme();
  const farbe = isFavorite ? currentTheme.status.warning : currentTheme.text.muted;

  return (
    <motion.button
      whileTap={tapScaleTight}
      onClick={(e) => {
        // Die ganze Karte navigiert — ohne das hier landet man im Profil.
        e.stopPropagation();
        onToggle();
      }}
      aria-pressed={isFavorite}
      aria-label={
        isFavorite
          ? t('{name} nicht mehr als Favorit', { name })
          : t('{name} als Favorit markieren und um Einblick bitten', { name })
      }
      style={{
        width: '36px',
        height: '36px',
        borderRadius: '11px',
        background: isFavorite ? `${farbe}1f` : `${currentTheme.text.muted}12`,
        border: 'none',
        color: farbe,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {isFavorite ? (
        <StarRounded style={{ fontSize: '18px' }} />
      ) : (
        <StarBorderRounded style={{ fontSize: '18px' }} />
      )}
    </motion.button>
  );
};

/**
 * Zustand des Einblicks als eigenes, immer lesbares Zeichen. „Kein Zugriff"
 * ist antippbar und fragt erneut — so gibt es keinen Zustand, aus dem man
 * nicht wieder herauskommt.
 */
const ShareStatus = ({
  access,
  name,
  onAsk,
}: {
  access: 'granted' | 'pending' | 'none';
  name: string;
  onAsk: () => Promise<void>;
}) => {
  const { currentTheme } = useTheme();
  const [sending, setSending] = useState(false);

  if (access === 'granted') return null;

  if (access === 'pending') {
    return (
      <span
        className="ft-share-chip"
        title={t('Wartet auf Freigabe')}
        style={{ color: currentTheme.text.muted, borderColor: `${currentTheme.text.muted}40` }}
      >
        <HourglassTopRounded style={{ fontSize: '13px' }} />
        {t('wartet')}
      </span>
    );
  }

  return (
    <button
      type="button"
      className="ft-share-chip ft-share-chip--ask"
      disabled={sending}
      aria-label={t('{name} erneut um Einblick bitten', { name })}
      onClick={async (e) => {
        e.stopPropagation();
        if (sending) return;
        setSending(true);
        try {
          await onAsk();
        } finally {
          setSending(false);
        }
      }}
      style={{
        color: currentTheme.primary,
        borderColor: `${currentTheme.primary}50`,
        cursor: sending ? 'default' : 'pointer',
        opacity: sending ? 0.6 : 1,
      }}
    >
      {sending ? t('Wird gesendet …') : t('Kein Zugriff · fragen')}
    </button>
  );
};

export const FriendsTab = ({
  friends,
  friendProfiles,
  saveScrollPosition,
  onAddFriend,
  onRemoveFriend,
}: FriendsTabProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { favoriteIds, toggleFavoriteFriend, shareState, requestShare } = useOptimizedFriends();
  const [query, setQuery] = useState('');

  const resolved = useMemo(
    () =>
      friends.map((friend) => {
        const profile = friendProfiles[friend.uid] || friend;
        return {
          friend,
          displayName: profile.displayName || profile.username || t('Unbekannt'),
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
          title={t('Noch keine Freunde')}
          description={t(
            'Füge Freunde hinzu, um ihre Aktivitäten, Bewertungen und Watchlists zu verfolgen.'
          )}
          action={{ label: t('Freund hinzufügen'), onClick: onAddFriend }}
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
          maxWidth: 720,
          borderRadius: '14px',
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        <SearchRounded style={{ fontSize: '20px', color: currentTheme.text.muted }} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            friends.length === 1
              ? t('{n} Freund durchsuchen', { n: friends.length })
              : t('{n} Freunde durchsuchen', { n: friends.length })
          }
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
          {t('Keine Treffer für „{query}“', { query })}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
            gap: '10px',
          }}
        >
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
                  <NameBadges uid={friend.uid} />
                </h3>
                <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: 0 }}>
                  {username ? `@${username}` : isOnline ? t('Online') : t('Freund')}
                </p>
              </div>

              <ShareStatus
                access={shareState(friend.uid)}
                name={displayName}
                onAsk={async () => {
                  await requestShare(friend.uid);
                }}
              />

              <FavoriteStar
                isFavorite={favoriteIds.has(friend.uid)}
                name={displayName}
                onToggle={() => void toggleFavoriteFriend(friend.uid)}
              />

              <motion.button
                whileTap={tapScaleTight}
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveFriend({ uid: friend.uid, name: displayName });
                }}
                aria-label={t('{name} entfernen', { name: displayName })}
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
