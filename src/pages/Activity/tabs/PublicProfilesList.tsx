import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import PersonAddRounded from '@mui/icons-material/PersonAddRounded';
import PublicRounded from '@mui/icons-material/PublicRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FilterPill } from '../../../components/ui/input/FilterPill';
import { useOwnInterests } from '../../../hooks/profile/useInterests';
import { interestById, matchInterests } from '../../../lib/interests/interests';
import { useAuth } from '../../../contexts/AuthContext';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { EmptyState } from '../../../components/ui';
import { NameBadges } from '../../../components/ui/display/NameBadges';
import { UserAvatar } from '../../../components/ui/media/UserAvatar';
import { tapScaleSmall, tapScaleTight } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import { fetchPublicDirectory } from '../../../services/social/publicDirectoryService';
import type { PublicDirectoryEntry } from '../../../types/PublicDirectory';
import { libraryCountLabel } from '../libraryCountLabel';

type Relation = 'friend' | 'sent' | 'received' | 'none';

interface PublicProfilesListProps {
  saveScrollPosition: () => void;
}

export const PublicProfilesList = ({ saveScrollPosition }: PublicProfilesListProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { friends, friendRequests, sentRequests, sendFriendRequest } = useOptimizedFriends();
  const [entries, setEntries] = useState<PublicDirectoryEntry[] | null>(null);
  const [query, setQuery] = useState('');
  const [sending, setSending] = useState<string | null>(null);
  const [sentNow, setSentNow] = useState<Set<string>>(() => new Set());
  const [searchParams, setSearchParams] = useSearchParams();
  const interestParam = searchParams.get('interest');
  const interestFilter = interestParam && interestById(interestParam) ? interestParam : null;
  const ownInterests = useOwnInterests(user?.uid);
  const ownInterestSet = useMemo(() => new Set(ownInterests ?? []), [ownInterests]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicDirectory()
      .then((list) => {
        if (!cancelled) setEntries(list);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const relationOf = useMemo(() => {
    const friendIds = new Set(friends.map((f) => f.uid));
    const sentIds = new Set(
      sentRequests.filter((r) => r.status === 'pending').map((r) => r.toUserId)
    );
    const receivedIds = new Set(
      friendRequests.filter((r) => r.status === 'pending').map((r) => r.fromUserId)
    );
    return (uid: string): Relation => {
      if (friendIds.has(uid)) return 'friend';
      if (sentIds.has(uid) || sentNow.has(uid)) return 'sent';
      if (receivedIds.has(uid)) return 'received';
      return 'none';
    };
  }, [friends, sentRequests, friendRequests, sentNow]);

  const others = useMemo(
    () => (entries ?? []).filter((e) => e.uid !== user?.uid),
    [entries, user?.uid]
  );

  const filterChips = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of others)
      for (const id of e.interests ?? []) counts.set(id, (counts.get(id) ?? 0) + 1);
    const mine = (ownInterests ?? []).filter((id) => counts.has(id));
    const popular = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id)
      .filter((id) => !mine.includes(id));
    const ids = [...mine, ...popular].slice(0, 10);
    if (interestFilter && !ids.includes(interestFilter)) ids.unshift(interestFilter);
    return ids.map((id) => ({ id, count: counts.get(id) ?? 0 }));
  }, [others, ownInterests, interestFilter]);

  const visible = useMemo(() => {
    const mine = new Set(ownInterests ?? []);
    const sharedCount = (e: PublicDirectoryEntry) =>
      (e.interests ?? []).filter((id) => mine.has(id)).length;
    let list = interestFilter
      ? others.filter((e) => (e.interests ?? []).includes(interestFilter))
      : others;
    const q = query.trim().toLowerCase();
    if (q) {
      const matched = new Set(matchInterests(q, t).map((i) => i.id));
      list = list.filter(
        (e) =>
          e.displayName.toLowerCase().includes(q) ||
          (e.username ?? '').toLowerCase().includes(q) ||
          (e.interests ?? []).some((id) => matched.has(id))
      );
    }
    return mine.size > 0 ? [...list].sort((a, b) => sharedCount(b) - sharedCount(a)) : list;
  }, [others, query, interestFilter, ownInterests]);

  const setInterestFilter = (id: string | null) =>
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (id) params.set('interest', id);
        else params.delete('interest');
        return params;
      },
      { replace: true }
    );

  // Eingeloggt immer ins Profil in der App; /public bleibt für Gäste mit Link.
  const openProfile = (entry: PublicDirectoryEntry) => {
    saveScrollPosition();
    navigate(`/friend/${entry.uid}`);
  };

  const handleRequest = async (entry: PublicDirectoryEntry) => {
    if (sending) return;
    setSending(entry.uid);
    try {
      const ok = await sendFriendRequest(entry.username ?? '', entry.uid);
      if (ok) setSentNow((prev) => new Set(prev).add(entry.uid));
    } finally {
      setSending(null);
    }
  };

  if (entries === null) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: currentTheme.text.muted }}>
        {t('Lädt …')}
      </div>
    );
  }

  if (others.length === 0) {
    return (
      <EmptyState
        icon={<PublicRounded style={{ fontSize: 'inherit' }} />}
        title={t('Noch keine öffentlichen Profile')}
        description={t(
          'Hier erscheint, wer sein Profil in den Einstellungen öffentlich geschaltet hat.'
        )}
      />
    );
  }

  return (
    <>
      <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: '0 0 12px 2px' }}>
        {t('Hier erscheint, wer sein Profil in den Einstellungen öffentlich geschaltet hat.')}
      </p>

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
          placeholder={t('Name oder Interesse, z. B. Marvel')}
          aria-label={t('Öffentliche Profile durchsuchen')}
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

      {filterChips.length > 0 && (
        <div
          role="group"
          aria-label={t('Nach Interesse filtern')}
          style={{
            display: 'flex',
            // Umbrechen statt seitlich scrollen: so sind alle Interessen sichtbar und es gibt keine Scroll-Leiste.
            flexWrap: 'wrap',
            gap: 8,
            margin: '-4px 0 16px',
          }}
        >
          {filterChips.map(({ id, count }) => {
            const interest = interestById(id);
            if (!interest) return null;
            const active = interestFilter === id;
            return (
              <FilterPill
                key={id}
                label={t(interest.label)}
                active={active}
                badge={active ? undefined : count}
                onClick={() => setInterestFilter(active ? null : id)}
              />
            );
          })}
        </div>
      )}

      {visible.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: currentTheme.text.muted,
            fontSize: '15px',
          }}
        >
          {query
            ? t('Keine Treffer für „{query}“', { query })
            : t('Noch niemand mit diesem Interesse')}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))',
            gap: '10px',
          }}
        >
          {visible.map((entry, index) => {
            const relation = relationOf(entry.uid);
            const meta = libraryCountLabel(entry);
            return (
              <motion.div
                key={entry.uid}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.3) }}
                whileTap={tapScaleSmall}
                role="button"
                tabIndex={0}
                aria-label={t('Profil von {name} öffnen', { name: entry.displayName })}
                onClick={() => {
                  openProfile(entry);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openProfile(entry);
                  }
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
                <UserAvatar
                  userId={entry.uid}
                  username={entry.displayName}
                  photoURL={entry.photoURL ?? undefined}
                  size={50}
                  bordered={false}
                  decorative
                />

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
                    {entry.displayName}
                    <NameBadges uid={entry.uid} />
                  </h3>
                  <p style={{ fontSize: '13px', color: currentTheme.text.muted, margin: 0 }}>
                    {meta || t('Öffentliches Profil')}
                  </p>
                  {(entry.interests ?? []).length > 0 && (
                    <p
                      style={{
                        fontSize: '12.5px',
                        margin: '3px 0 0',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: currentTheme.text.muted,
                      }}
                    >
                      {(entry.interests ?? []).slice(0, 4).map((id, i) => {
                        const interest = interestById(id);
                        if (!interest) return null;
                        const shared = ownInterestSet.has(id) || id === interestFilter;
                        return (
                          <span key={id}>
                            {i > 0 && ' · '}
                            <span
                              style={
                                shared
                                  ? { color: currentTheme.primary, fontWeight: 600 }
                                  : undefined
                              }
                            >
                              {t(interest.label)}
                            </span>
                          </span>
                        );
                      })}
                    </p>
                  )}
                </div>

                {relation === 'none' ? (
                  <motion.button
                    type="button"
                    whileTap={tapScaleTight}
                    disabled={sending === entry.uid}
                    onClick={(e) => {
                      e.stopPropagation();
                      void handleRequest(entry);
                    }}
                    aria-label={t('{name} eine Freundschaftsanfrage senden', {
                      name: entry.displayName,
                    })}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '11px',
                      background: `${currentTheme.primary}1f`,
                      border: 'none',
                      color: currentTheme.primary,
                      cursor: sending === entry.uid ? 'default' : 'pointer',
                      opacity: sending === entry.uid ? 0.6 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <PersonAddRounded style={{ fontSize: '18px' }} />
                  </motion.button>
                ) : (
                  <span
                    className="ft-share-chip"
                    style={{
                      color: currentTheme.text.muted,
                      borderColor: `${currentTheme.text.muted}40`,
                    }}
                  >
                    {relation === 'friend'
                      ? t('Freund')
                      : relation === 'sent'
                        ? t('Angefragt')
                        : t('Hat dich angefragt')}
                  </span>
                )}

                <ChevronRightRounded
                  style={{ fontSize: '20px', color: currentTheme.text.muted, flexShrink: 0 }}
                />
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
};
