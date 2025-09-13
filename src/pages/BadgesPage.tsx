import {
  EmojiEvents,
  Explore,
  Groups,
  LocalFireDepartment,
  Lock,
  Movie,
  Refresh,
  Speed,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../App';
import { useTheme } from '../contexts/ThemeContext';
import {
  BADGE_DEFINITIONS,
  Badge,
  BadgeCategory,
  BadgeProgress,
  EarnedBadge,
} from '../features/badges/badgeDefinitions';
import { BadgeIcon } from '../features/badges/BadgeIcons';
import { BackButton } from '../components/BackButton';
import './BadgesPage.css';

const categories: { key: BadgeCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Alle', icon: <EmojiEvents /> },
  { key: 'binge', label: 'Binge Watcher', icon: <Movie /> },
  { key: 'quickwatch', label: 'Quick Watcher', icon: <Speed /> },
  { key: 'marathon', label: 'Marathon', icon: <LocalFireDepartment /> },
  { key: 'streak', label: 'Streak Hunter', icon: <TrendingUp /> },
  { key: 'rewatch', label: 'Rewatcher', icon: <Refresh /> },
  { key: 'series_explorer', label: 'Series Explorer', icon: <Explore /> },
  { key: 'collector', label: 'Collector', icon: <Star /> },
  { key: 'social', label: 'Social Viewer', icon: <Groups /> },
];

export const BadgesPage = () => {
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, BadgeProgress>>({});
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [, setRefreshTick] = useState(0);

  useEffect(() => {
    if (user) {
      loadBadgeData();
    }
  }, [user]);

  // Badge Progress Update Event Listener
  useEffect(() => {
    const handleBadgeUpdate = async (event: CustomEvent) => {
      const { newBadges } = event.detail;
      if (newBadges && newBadges.length > 0) {
        const { getOfflineBadgeSystem } = await import('../features/badges/offlineBadgeSystem');
        const badgeSystem = getOfflineBadgeSystem(user!.uid);
        badgeSystem.invalidateCache();

        setEarnedBadges((prevBadges) => {
          const existingIds = new Set(prevBadges.map((b) => b.id));
          const uniqueNewBadges = newBadges.filter((badge: any) => !existingIds.has(badge.id));
          if (uniqueNewBadges.length > 0) {
            return [...prevBadges, ...uniqueNewBadges];
          }
          return prevBadges;
        });

        window.dispatchEvent(
          new CustomEvent('badgeDialogOpened', {
            detail: { userId: user!.uid, newBadges },
          })
        );

        loadBadgeData();
      }
    };

    window.addEventListener('badgeProgressUpdate', handleBadgeUpdate as unknown as EventListener);

    return () => {
      window.removeEventListener(
        'badgeProgressUpdate',
        handleBadgeUpdate as unknown as EventListener
      );
    };
  }, [user]);

  // Auto-refresh für laufende Sessions (jede Sekunde)
  useEffect(() => {
    const hasActiveSessions = Object.values(badgeProgress).some((p) => p.sessionActive);
    if (!hasActiveSessions) return;

    const interval = setInterval(() => {
      setRefreshTick((tick) => tick + 1);
      loadBadgeData();
    }, 1000);

    return () => clearInterval(interval);
  }, [badgeProgress]);

  const loadBadgeData = async () => {
    if (!user) return;

    const { getOfflineBadgeSystem } = await import('../features/badges/offlineBadgeSystem');
    const badgeSystem = getOfflineBadgeSystem(user.uid);

    const isCached = badgeSystem.isCacheValid();

    if (!isCached) {
      setLoading(true);
      setLoadingProgress({ current: 0, total: 4 });

      setLoadingProgress({ current: 1, total: 4 });
      const { badgeCounterService } = await import('../features/badges/badgeCounterService');
      await badgeCounterService.finalizeBingeSession(user.uid);

      setLoadingProgress({ current: 2, total: 4 });
    } else {
      const { badgeCounterService } = await import('../features/badges/badgeCounterService');
      badgeCounterService.finalizeBingeSession(user.uid);
    }

    try {
      if (!isCached) setLoadingProgress({ current: 3, total: 4 });
      const earned = await badgeSystem.getUserBadges();
      setEarnedBadges(earned);

      if (!isCached) setLoadingProgress({ current: 4, total: 4 });
      const progressData = await badgeSystem.getAllBadgeProgress();
      setBadgeProgress(progressData);
    } catch (error) {
      console.error('Error loading badge data:', error);
    } finally {
      if (!isCached) {
        setLoading(false);
        setLoadingProgress(null);
      }
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return currentTheme.text.muted;
      case 'rare':
        return currentTheme.primary;
      case 'epic':
        return currentTheme.primary;
      case 'legendary':
        return currentTheme.status.warning;
      default:
        return currentTheme.text.muted;
    }
  };

  const getRarityStars = (rarity: string) => {
    const count = rarity === 'legendary' ? 4 : rarity === 'epic' ? 3 : rarity === 'rare' ? 2 : 1;
    return [...Array(count)].map((_, i) => (
      <Star key={i} style={{ fontSize: 10, color: getRarityColor(rarity) }} />
    ));
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some((b) => b.id === badgeId);
  };

  const getBadgeProgress = (badgeId: string) => {
    return badgeProgress[badgeId];
  };

  const formatTimeRemaining = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const renderBadgeCard = (badge: Badge, index: number) => {
    const earned = isBadgeEarned(badge.id);
    const progress = getBadgeProgress(badge.id);
    const earnedBadge = earnedBadges.find((b) => b.id === badge.id);

    const getNextTierInfo = () => {
      if (earned) return null;

      // Get all badges in the same category
      const sameCategoryBadges = BADGE_DEFINITIONS.filter((b) => b.category === badge.category);

      // Group badges by their base type (same requirements type)
      const badgeGroups: Record<string, typeof sameCategoryBadges> = {};

      sameCategoryBadges.forEach((b) => {
        // Create a key based on the requirement type (episodes, seasons, series, etc.)
        const reqKey = Object.keys(b.requirements)
          .filter((k) => k !== 'timeframe')
          .sort()
          .join('_');

        if (!badgeGroups[reqKey]) {
          badgeGroups[reqKey] = [];
        }
        badgeGroups[reqKey].push(b);
      });

      // Find the group this badge belongs to
      const myReqKey = Object.keys(badge.requirements)
        .filter((k) => k !== 'timeframe')
        .sort()
        .join('_');

      const myGroup = badgeGroups[myReqKey];
      if (!myGroup || myGroup.length <= 1) return null;

      // Sort the group by tier and requirement value
      const tierOrder: Record<string, number> = {
        bronze: 1,
        silver: 2,
        gold: 3,
        platinum: 4,
        diamond: 5,
      };

      myGroup.sort((a, b) => {
        // First sort by requirement value (episodes, series, etc.)
        const aValue =
          a.requirements.episodes || a.requirements.series || a.requirements.seasons || 0;
        const bValue =
          b.requirements.episodes || b.requirements.series || b.requirements.seasons || 0;
        if (aValue !== bValue) return aValue - bValue;

        // Then by tier if values are the same
        return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
      });

      // Find current badge position
      const currentIndex = myGroup.findIndex((b) => b.id === badge.id);
      if (currentIndex === -1 || currentIndex === 0) return null;

      // Check if all previous badges in the progression are earned
      const previousBadges = myGroup.slice(0, currentIndex);
      const earnedPreviousBadges = previousBadges.filter((b) => isBadgeEarned(b.id));

      // This is the next badge to earn if all previous ones are earned
      if (earnedPreviousBadges.length === previousBadges.length) {
        return { isNextTier: true };
      }

      return null;
    };

    const nextTierInfo = getNextTierInfo();

    return (
      <motion.div
        key={badge.id}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, delay: index * 0.03 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: earned
            ? `linear-gradient(135deg, ${badge.color}20 0%, ${currentTheme.background.card} 100%)`
            : currentTheme.background.card,
          border: earned
            ? `1px solid ${badge.color}60`
            : nextTierInfo?.isNextTier
              ? `1px solid ${badge.color}30`
              : `1px solid ${currentTheme.border.default}`,
          borderRadius: '16px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Top Row: Stars and Date/Status */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '2px' }}>{getRarityStars(badge.rarity)}</div>
          {earned && earnedBadge && (
            <div
              style={{
                backgroundColor: `${badge.color}20`,
                color: badge.color,
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 600,
              }}
            >
              ✓
            </div>
          )}
          {nextTierInfo?.isNextTier && (
            <div
              style={{
                color: badge.color,
                fontSize: '9px',
                fontWeight: 'bold',
              }}
            >
              NEXT
            </div>
          )}
        </div>

        {/* Badge Icon */}
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: earned
                ? badge.color
                : nextTierInfo?.isNextTier
                  ? `${badge.color}30`
                  : currentTheme.background.paper,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              opacity: earned ? 1 : 0.6,
            }}
          >
            <BadgeIcon
              badgeId={badge.id}
              sx={{
                fontSize: '2.5rem',
                color: earned ? 'white' : currentTheme.text.muted,
              }}
            />
            {!earned && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock style={{ color: currentTheme.text.secondary, fontSize: '1.5rem' }} />
              </div>
            )}
          </div>
        </div>

        {/* Badge Name */}
        <h4
          style={{
            fontSize: '15px',
            fontWeight: 600,
            margin: '0 0 2px 0',
            textAlign: 'center',
            color: earned ? badge.color : currentTheme.text.primary,
          }}
        >
          {badge.name}
        </h4>

        {/* Badge Description */}
        <p
          style={{
            fontSize: '13px',
            color: currentTheme.text.muted,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {badge.description}
        </p>

        {/* Progress Bar */}
        {progress && !earned && (
          <div style={{ marginTop: '8px' }}>
            <div
              style={{
                height: '4px',
                borderRadius: '2px',
                backgroundColor: currentTheme.background.paper,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${Math.min((progress.current / progress.total) * 100, 100)}%`,
                  backgroundColor: progress.sessionActive
                    ? badge.color
                    : nextTierInfo?.isNextTier
                      ? badge.color
                      : `${badge.color}60`,
                  borderRadius: '2px',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <p
              style={{
                fontSize: '9px',
                color: progress.sessionActive ? badge.color : currentTheme.text.muted,
                marginTop: '2px',
                textAlign: 'center',
                fontWeight: progress.sessionActive ? 600 : 400,
              }}
            >
              {progress.current}/{progress.total}
              {progress.sessionActive && progress.timeRemaining && (
                <span style={{ marginLeft: '4px' }}>
                  · {formatTimeRemaining(progress.timeRemaining)}
                </span>
              )}
            </p>
          </div>
        )}
      </motion.div>
    );
  };

  const renderCategoryBadges = (category: BadgeCategory | 'all') => {
    const categoryBadges =
      category === 'all'
        ? BADGE_DEFINITIONS
        : BADGE_DEFINITIONS.filter((b) => b.category === category);

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            window.innerWidth >= 1200
              ? 'repeat(auto-fill, minmax(280px, 1fr))'
              : window.innerWidth >= 768
                ? 'repeat(auto-fill, minmax(240px, 1fr))'
                : 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: window.innerWidth >= 1200 ? '24px' : window.innerWidth >= 768 ? '20px' : '12px',
          padding: window.innerWidth >= 1200 ? '32px' : window.innerWidth >= 768 ? '24px' : '16px',
        }}
      >
        {categoryBadges.map((badge, index) => renderBadgeCard(badge, index))}
      </div>
    );
  };

  const getEarnedCount = (category: BadgeCategory | 'all') => {
    const categoryBadges =
      category === 'all'
        ? BADGE_DEFINITIONS
        : BADGE_DEFINITIONS.filter((b) => b.category === category);
    const earnedCount = categoryBadges.filter((b) => isBadgeEarned(b.id)).length;
    return `${earnedCount}/${categoryBadges.length}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: currentTheme.background.default }}>
      {/* Header */}
      <header
        style={{
          padding: '16px',
          paddingTop: 'calc(16px + env(safe-area-inset-top))',
          background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <BackButton
            style={{
              background: `${currentTheme.background.card}80`,
              border: `1px solid ${currentTheme.border.default}`,
              color: currentTheme.text.primary,
            }}
          />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '18px',
                fontWeight: 'bold',
                margin: 0,
                color: currentTheme.text.primary,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <EmojiEvents style={{ fontSize: '18px', color: currentTheme.primary }} />
              Badges
            </h1>
            <p
              style={{
                fontSize: '11px',
                color: currentTheme.text.muted,
                margin: '2px 0 0 0',
              }}
            >
              {earnedBadges.length} / {BADGE_DEFINITIONS.length} verdient
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div
          className="mobile-badges-tabs-container"
          style={{
            margin: '0 -16px',
            padding: '8px 16px',
          }}
        >
          {categories.map((category, index) => {
            const count = getEarnedCount(category.key);
            const [earned] = count.split('/').map(Number);
            const hasEarned = earned > 0;

            return (
              <button
                key={category.key}
                onClick={() => setTabValue(index)}
                className={`mobile-badges-tab ${tabValue === index ? 'active' : ''} ${hasEarned ? 'has-earned' : ''}`}
                style={{
                  background:
                    tabValue === index
                      ? `linear-gradient(135deg, ${currentTheme.primary}33 0%, ${currentTheme.primary}11 100%)`
                      : hasEarned
                        ? `${currentTheme.primary}0D`
                        : currentTheme.background.card,
                  border:
                    tabValue === index
                      ? `2px solid ${currentTheme.primary}`
                      : hasEarned
                        ? `1px solid ${currentTheme.primary}33`
                        : `1px solid ${currentTheme.border.default}`,
                  color:
                    tabValue === index
                      ? currentTheme.primary
                      : hasEarned
                        ? currentTheme.primary
                        : currentTheme.text.muted,
                }}
              >
                <div className="mobile-badges-tab-icon">{category.icon}</div>
                <div className="mobile-badges-tab-content">
                  <span className="mobile-badges-tab-label">{category.label}</span>
                  <span
                    className="mobile-badges-tab-count"
                    style={{
                      color: hasEarned ? currentTheme.primary : currentTheme.text.muted,
                    }}
                  >
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      {loading ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            gap: '16px',
            padding: '20px',
          }}
        >
          <EmojiEvents
            style={{
              fontSize: '2rem',
              color: currentTheme.primary,
              animation: 'pulse 2s infinite',
            }}
          />
          <p style={{ color: currentTheme.text.secondary, fontSize: '14px' }}>
            Badges werden geladen...
          </p>

          {loadingProgress && (
            <>
              <div style={{ width: '200px' }}>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    backgroundColor: currentTheme.background.card,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(loadingProgress.current / loadingProgress.total) * 100}%`,
                      backgroundColor: currentTheme.primary,
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
              <p style={{ color: currentTheme.text.muted, fontSize: '11px' }}>
                Schritt {loadingProgress.current} von {loadingProgress.total}
              </p>
            </>
          )}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {categories.map(
            (category, index) =>
              tabValue === index && (
                <motion.div
                  key={category.key}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderCategoryBadges(category.key)}
                </motion.div>
              )
          )}
        </AnimatePresence>
      )}
    </div>
  );
};
