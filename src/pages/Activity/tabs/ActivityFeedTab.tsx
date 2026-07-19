/**
 * ActivityFeedTab - The friends activity hub.
 * Spotlight hero · active-friends rail · live stats · date-grouped timeline.
 */

import BoltRounded from '@mui/icons-material/BoltRounded';
import GroupRounded from '@mui/icons-material/GroupRounded';
import WhatshotRounded from '@mui/icons-material/WhatshotRounded';
import TimelineRounded from '@mui/icons-material/TimelineRounded';
import { motion } from 'framer-motion';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { EmptyState } from '../../../components/ui';
import { ActiveFriendsRow } from '../ActiveFriendsRow';
import { ActivityEntryCard } from '../ActivityEntryCard';
import { ActivitySpotlight } from '../ActivitySpotlight';
import { CountUp } from '../CountUp';
import { getDateGroup, isMovieActivity } from '../activityMeta';
import { useActivityGrouping } from '../useActivityGrouping';
import type { ActivityFilterType, FirebaseUserProfile } from '../types';
import type { Friend, FriendActivity } from '../../../types/Friend';

interface ActivityFeedTabProps {
  friendActivities: FriendActivity[];
  friends: Friend[];
  friendProfiles: Record<string, FirebaseUserProfile>;
  saveScrollPosition: () => void;
}

const FILTERS: { key: ActivityFilterType; label: string }[] = [
  { key: 'all', label: t('Alle') },
  { key: 'series', label: t('Serien') },
  { key: 'movies', label: t('Filme') },
];

const DATE_ORDER = ['Heute', 'Gestern', 'Diese Woche', 'Älter'];

export const ActivityFeedTab = ({
  friendActivities,
  friends,
  friendProfiles,
  saveScrollPosition,
}: ActivityFeedTabProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const {
    filteredActivities,
    getItemDetails,
    formatTimeAgo,
    filterType,
    setFilterType,
    getPosterUrl,
  } = useActivityGrouping(friendActivities);

  // Fallback display names taken straight from the activity payload.
  const fallbackNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const a of friendActivities) {
      if (a.userName && !map[a.userId]) map[a.userId] = a.userName;
    }
    return map;
  }, [friendActivities]);

  const resolveUser = useCallback(
    (userId: string) => {
      const friendObj = friends.find((f) => f.uid === userId);
      const profile = friendObj ? friendProfiles[friendObj.uid] || friendObj : undefined;
      return {
        name: profile?.displayName || profile?.username || fallbackNames[userId] || t('Unbekannt'),
        photoURL: profile?.photoURL,
      };
    },
    [friends, friendProfiles, fallbackNames]
  );

  const openFriend = useCallback(
    (userId: string) => {
      saveScrollPosition();
      navigate(`/friend/${userId}`);
    },
    [navigate, saveScrollPosition]
  );

  const openItem = useCallback(
    (activity: FriendActivity) => {
      const tmdbId = activity.tmdbId || activity.itemId;
      if (!tmdbId) return;
      saveScrollPosition();
      navigate(isMovieActivity(activity) ? `/movie/${tmdbId}` : `/series/${tmdbId}`);
    },
    [navigate, saveScrollPosition]
  );

  const titleOf = useCallback(
    (activity: FriendActivity) =>
      activity.itemTitle || getItemDetails(activity)?.title || t('Unbekannt'),
    [getItemDetails]
  );

  // Overview stats (from the full, unfiltered feed)
  const stats = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- "today" bucket needs the current time
    const startOfToday = new Date(Date.now());
    startOfToday.setHours(0, 0, 0, 0);
    const todayMs = startOfToday.getTime();
    const activeFriends = new Set(friendActivities.map((a) => a.userId)).size;
    const today = friendActivities.filter((a) => a.timestamp >= todayMs).length;
    return { total: friendActivities.length, activeFriends, today };
  }, [friendActivities]);

  // Spotlight = freshest item in the current filter; timeline = the rest.
  const featured = filteredActivities[0];
  const rest = useMemo(() => filteredActivities.slice(1), [filteredActivities]);

  const sections = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity -- relative date buckets need the current time
    const now = Date.now();
    const map = new Map<string, FriendActivity[]>();
    for (const activity of rest) {
      const group = getDateGroup(activity.timestamp, now);
      const bucket = map.get(group);
      if (bucket) bucket.push(activity);
      else map.set(group, [activity]);
    }
    return DATE_ORDER.filter((g) => map.has(g)).map((g) => [g, map.get(g) ?? []] as const);
  }, [rest]);

  const statTiles = [
    {
      key: 'total',
      icon: <BoltRounded style={{ fontSize: 17 }} />,
      value: stats.total,
      decimals: 0 as const,
      label: t('Aktivitäten'),
      color: currentTheme.primary,
    },
    {
      key: 'active',
      icon: <GroupRounded style={{ fontSize: 17 }} />,
      value: stats.activeFriends,
      decimals: 0 as const,
      label: t('aktiv'),
      color: currentTheme.accent,
    },
    {
      key: 'today',
      icon: <WhatshotRounded style={{ fontSize: 17 }} />,
      value: stats.today,
      decimals: 0 as const,
      label: t('Heute'),
      color: currentTheme.status.warning,
    },
  ];

  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
    >
      {/* Active friends rail */}
      <ActiveFriendsRow
        activities={friendActivities}
        resolveUser={resolveUser}
        theme={currentTheme}
        onSelect={openFriend}
      />

      {/* Spotlight hero */}
      {featured && (
        <ActivitySpotlight
          activity={featured}
          posterUrl={getPosterUrl(featured)}
          itemTitle={titleOf(featured)}
          userName={resolveUser(featured.userId).name}
          userPhotoURL={resolveUser(featured.userId).photoURL}
          timeLabel={formatTimeAgo(featured.timestamp)}
          theme={currentTheme}
          onClick={() => openItem(featured)}
          onAvatarClick={() => openFriend(featured.userId)}
        />
      )}

      {/* Live stats */}
      {friendActivities.length > 0 && (
        <div className="activity-stats">
          {statTiles.map((tile) => (
            <div
              key={tile.key}
              className="activity-stat"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <span
                className="activity-stat__icon"
                style={{ background: `${tile.color}1f`, color: tile.color }}
              >
                {tile.icon}
              </span>
              <span className="activity-stat__value" style={{ color: currentTheme.text.secondary }}>
                <CountUp value={tile.value} decimals={tile.decimals} />
              </span>
              <span className="activity-stat__label" style={{ color: currentTheme.text.muted }}>
                {tile.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Segmented media filter */}
      <div
        className="activity-segmented"
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${currentTheme.border.default}`,
        }}
      >
        {FILTERS.map((filter) => {
          const active = filterType === filter.key;
          return (
            <button
              key={filter.key}
              onClick={() => setFilterType(filter.key)}
              className="activity-filter-btn activity-segmented__btn"
              style={{ color: active ? currentTheme.primary : currentTheme.text.muted }}
            >
              {active && (
                <motion.span
                  layoutId="activity-filter-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="activity-segmented__pill"
                  style={{
                    background: `color-mix(in srgb, ${currentTheme.primary} 18%, rgba(255, 255, 255, 0.04))`,
                    boxShadow: `inset 0 0 0 1px ${currentTheme.primary}45, 0 4px 14px ${currentTheme.primary}22`,
                  }}
                />
              )}
              <span style={{ position: 'relative', zIndex: 1 }}>{filter.label}</span>
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      {filteredActivities.length === 0 ? (
        <EmptyState
          icon={<TimelineRounded style={{ fontSize: 'inherit' }} />}
          title={t('Noch keine Aktivitäten')}
          description={
            filterType !== 'all'
              ? filterType === 'movies'
                ? t('Keine Film-Aktivitäten deiner Freunde.')
                : t('Keine Serien-Aktivitäten deiner Freunde.')
              : t(
                  'Sobald deine Freunde etwas schauen, bewerten oder hinzufügen, erscheint es hier.'
                )
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {sections.map(([group, activities]) => (
            <div key={group}>
              <div className="activity-date-head">
                <span
                  className="activity-date-head__label"
                  style={{ color: currentTheme.text.muted }}
                >
                  {t(group)}
                </span>
                <span
                  className="activity-date-head__line"
                  style={{
                    background: `linear-gradient(90deg, ${currentTheme.border.default}, transparent)`,
                  }}
                />
                <span
                  className="activity-date-head__count"
                  style={{ color: currentTheme.text.muted }}
                >
                  {activities.length}
                </span>
              </div>

              <div
                className="activity-rail"
                style={{ ['--rail-color' as string]: `${currentTheme.primary}33` }}
              >
                {activities.map((activity, idx) => {
                  const user = resolveUser(activity.userId);
                  return (
                    <ActivityEntryCard
                      key={activity.id}
                      activity={activity}
                      index={idx}
                      posterUrl={getPosterUrl(activity)}
                      itemTitle={titleOf(activity)}
                      userName={user.name}
                      userPhotoURL={user.photoURL}
                      timeLabel={formatTimeAgo(activity.timestamp)}
                      theme={currentTheme}
                      onClick={() => openItem(activity)}
                      onAvatarClick={() => openFriend(activity.userId)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};
