/**
 * ActivityFeedTab - Activity feed with filter pills and grouped activities
 */

import { ExpandMore, Person, Timeline } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { ActivityEntryCard } from '../ActivityEntryCard';
import { useActivityGrouping } from '../useActivityGrouping';
import type { ActivityFilterType, FirebaseUserProfile } from '../types';
import type { Friend, FriendActivity } from '../../../types/Friend';

interface ActivityFeedTabProps {
  friendActivities: FriendActivity[];
  friends: Friend[];
  friendProfiles: Record<string, FirebaseUserProfile>;
  saveScrollPosition: () => void;
}

export const ActivityFeedTab = ({
  friendActivities,
  friends,
  friendProfiles,
  saveScrollPosition,
}: ActivityFeedTabProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());

  const {
    groupedActivities,
    getItemDetails,
    formatTimeAgo,
    filterType,
    setFilterType,
    getPosterUrl,
  } = useActivityGrouping(friendActivities);

  const toggleUserExpanded = useCallback((userId: string) => {
    setExpandedUsers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  }, []);

  return (
    <motion.div
      key="activity"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      {/* Filter Pills */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {(
          [
            { key: 'all', label: 'Alle' },
            { key: 'series', label: 'Serien' },
            { key: 'movies', label: 'Filme' },
          ] as const
        ).map((filter) => (
          <button
            key={filter.key}
            className="activity-filter-btn"
            onClick={() => {
              setFilterType(filter.key as ActivityFilterType);
            }}
            style={{
              padding: '10px 18px',
              background:
                filterType === filter.key
                  ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                  : currentTheme.background.surface,
              border:
                filterType === filter.key ? 'none' : `1px solid ${currentTheme.border.default}`,
              borderRadius: '20px',
              color: filterType === filter.key ? 'white' : currentTheme.text.primary,
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow:
                filterType === filter.key ? `0 4px 12px ${currentTheme.primary}40` : 'none',
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Activities List */}
      {groupedActivities.length === 0 ? (
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
            <Timeline style={{ fontSize: '40px', color: currentTheme.text.muted }} />
          </div>
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '18px',
              fontWeight: 700,
              color: currentTheme.text.primary,
            }}
          >
            Noch keine Aktivitäten
          </h2>
          <p style={{ margin: 0, color: currentTheme.text.muted, fontSize: '15px' }}>
            {filterType !== 'all'
              ? `Keine ${filterType === 'movies' ? 'Film' : 'Serien'}-Aktivitäten`
              : 'Deine Freunde haben noch nichts geteilt'}
          </p>
        </motion.div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {groupedActivities.map(([userId, activities]) => {
            const friendObj = friends.find((f) => f.uid === userId);
            const userProfile = friendObj ? friendProfiles[friendObj.uid] || friendObj : null;
            const isExpanded = expandedUsers.has(userId);
            const latestActivity = activities[0];

            return (
              <div
                key={userId}
                className="activity-group-item"
                style={{
                  background: currentTheme.background.surface,
                  borderRadius: '16px',
                  border: `1px solid ${currentTheme.border.default}`,
                  overflow: 'hidden',
                }}
              >
                {/* Accordion Header */}
                <button
                  className="activity-accordion-btn"
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
                  }}
                >
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
                            background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
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

                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <div
                      style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: currentTheme.text.primary,
                        marginBottom: '4px',
                      }}
                    >
                      {userProfile?.displayName || latestActivity.userName || 'Unbekannt'}
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        color: currentTheme.text.secondary,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <span>
                        {activities.length} {activities.length === 1 ? 'Aktivität' : 'Aktivitäten'}
                      </span>
                      <span>·</span>
                      <span>{formatTimeAgo(latestActivity.timestamp)}</span>
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ color: currentTheme.text.secondary }}
                  >
                    <ExpandMore />
                  </motion.div>
                </button>

                {/* Accordion Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{
                        borderTop: `1px solid ${currentTheme.border.default}`,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          padding: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                        }}
                      >
                        {activities.map((activity) => {
                          const item = getItemDetails(activity);
                          const isMovie =
                            activity.type === 'movie_added' ||
                            activity.type === 'movie_rated' ||
                            activity.type === 'rating_updated_movie' ||
                            activity.itemType === 'movie';
                          const tmdbId = activity.tmdbId || activity.itemId;
                          const posterUrl = getPosterUrl(activity);

                          return (
                            <ActivityEntryCard
                              key={activity.id}
                              activity={activity}
                              posterUrl={posterUrl}
                              itemTitle={activity.itemTitle || item?.title || 'Unbekannt'}
                              theme={currentTheme}
                              onClick={() => {
                                if (tmdbId) {
                                  saveScrollPosition();
                                  navigate(isMovie ? `/movie/${tmdbId}` : `/series/${tmdbId}`);
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};
