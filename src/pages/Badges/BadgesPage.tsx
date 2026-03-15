/**
 * BadgesPage - Premium Achievement Gallery
 * Beautiful badge showcase with animated progress
 */

import {
  EmojiEvents,
  Explore,
  Groups,
  LocalFireDepartment,
  Movie,
  Refresh,
  Speed,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BADGE_DEFINITIONS,
  Badge,
  BadgeCategory,
  BadgeProgress,
  EarnedBadge,
} from '../../features/badges/badgeDefinitions';
import { trackBadgeCategoryTabSwitched, trackBadgeCheckTriggered } from '../../firebase/analytics';
import { LoadingSpinner, PageHeader, PageLayout, ProgressBar } from '../../components/ui';
import { BadgeCard } from './BadgeCard';
import './BadgesPage.css';

const categories: { key: BadgeCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'Alle', icon: <EmojiEvents /> },
  { key: 'binge', label: 'Binge', icon: <Movie /> },
  { key: 'quickwatch', label: 'Quick', icon: <Speed /> },
  { key: 'marathon', label: 'Marathon', icon: <LocalFireDepartment /> },
  { key: 'streak', label: 'Streak', icon: <TrendingUp /> },
  { key: 'rewatch', label: 'Rewatch', icon: <Refresh /> },
  { key: 'series_explorer', label: 'Explorer', icon: <Explore /> },
  { key: 'collector', label: 'Collector', icon: <Star /> },
  { key: 'social', label: 'Social', icon: <Groups /> },
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

  useEffect(() => {
    const handleBadgeUpdate = async (event: CustomEvent) => {
      const { newBadges } = event.detail;
      if (newBadges && newBadges.length > 0) {
        const { getOfflineBadgeSystem } = await import('../../features/badges/offlineBadgeSystem');
        const badgeSystem = getOfflineBadgeSystem(user!.uid);
        badgeSystem.invalidateCache();

        setEarnedBadges((prevBadges) => {
          const existingIds = new Set(prevBadges.map((b) => b.id));
          const uniqueNewBadges = newBadges.filter(
            (badge: EarnedBadge) => !existingIds.has(badge.id)
          );
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

  useEffect(() => {
    const hasActiveSessions = Object.values(badgeProgress).some((p) => p.sessionActive);
    if (!hasActiveSessions) return;

    const interval = setInterval(() => {
      setRefreshTick((tick) => tick + 1);
      loadBadgeData();
    }, 1000);

    return () => clearInterval(interval);
  }, [badgeProgress]);

  const checkForNewBadges = async () => {
    if (!user) return;
    trackBadgeCheckTriggered();
    setLoading(true);
    try {
      const { getOfflineBadgeSystem } = await import('../../features/badges/offlineBadgeSystem');
      const badgeSystem = getOfflineBadgeSystem(user.uid);
      badgeSystem.invalidateCache();
      const newBadges = await badgeSystem.checkForNewBadges();

      if (newBadges.length > 0) {
        window.dispatchEvent(
          new CustomEvent('badgeProgressUpdate', {
            detail: { newBadges },
          })
        );
      }

      await loadBadgeData();
    } catch (error) {
      console.error('Fehler beim Badge-Check:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBadgeData = async () => {
    if (!user) return;

    const { getOfflineBadgeSystem } = await import('../../features/badges/offlineBadgeSystem');
    const badgeSystem = getOfflineBadgeSystem(user.uid);
    const isCached = badgeSystem.isCacheValid();

    if (!isCached) {
      setLoading(true);
      setLoadingProgress({ current: 0, total: 4 });
      setLoadingProgress({ current: 1, total: 4 });
      const { badgeCounterService } = await import('../../features/badges/badgeCounterService');
      await badgeCounterService.finalizeBingeSession(user.uid);
      setLoadingProgress({ current: 2, total: 4 });
    } else {
      const { badgeCounterService } = await import('../../features/badges/badgeCounterService');
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

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some((b) => b.id === badgeId);
  };

  const getNextTierInfo = (badge: Badge, earned: boolean) => {
    if (earned) return null;

    const sameCategoryBadges = BADGE_DEFINITIONS.filter((b) => b.category === badge.category);
    const badgeGroups: Record<string, typeof sameCategoryBadges> = {};

    sameCategoryBadges.forEach((b) => {
      const reqKey = Object.keys(b.requirements)
        .filter((k) => k !== 'timeframe')
        .sort()
        .join('_');

      if (!badgeGroups[reqKey]) {
        badgeGroups[reqKey] = [];
      }
      badgeGroups[reqKey].push(b);
    });

    const myReqKey = Object.keys(badge.requirements)
      .filter((k) => k !== 'timeframe')
      .sort()
      .join('_');

    const myGroup = badgeGroups[myReqKey];
    if (!myGroup || myGroup.length <= 1) return null;

    const tierOrder: Record<string, number> = {
      bronze: 1,
      silver: 2,
      gold: 3,
      platinum: 4,
      diamond: 5,
    };

    myGroup.sort((a, b) => {
      const aValue =
        a.requirements.episodes || a.requirements.series || a.requirements.seasons || 0;
      const bValue =
        b.requirements.episodes || b.requirements.series || b.requirements.seasons || 0;
      if (aValue !== bValue) return aValue - bValue;
      return (tierOrder[a.tier] || 0) - (tierOrder[b.tier] || 0);
    });

    const currentIndex = myGroup.findIndex((b) => b.id === badge.id);
    if (currentIndex === -1 || currentIndex === 0) return null;

    const previousBadges = myGroup.slice(0, currentIndex);
    const earnedPreviousBadges = previousBadges.filter((b) => isBadgeEarned(b.id));

    if (earnedPreviousBadges.length === previousBadges.length) {
      return { isNextTier: true };
    }

    return null;
  };

  const getEarnedCount = (category: BadgeCategory | 'all') => {
    const categoryBadges =
      category === 'all'
        ? BADGE_DEFINITIONS
        : BADGE_DEFINITIONS.filter((b) => b.category === category);
    return categoryBadges.filter((b) => isBadgeEarned(b.id)).length;
  };

  const getTotalCount = (category: BadgeCategory | 'all') => {
    return category === 'all'
      ? BADGE_DEFINITIONS.length
      : BADGE_DEFINITIONS.filter((b) => b.category === category).length;
  };

  const getCategoryBadges = (category: BadgeCategory | 'all') => {
    return category === 'all'
      ? BADGE_DEFINITIONS
      : BADGE_DEFINITIONS.filter((b) => b.category === category);
  };

  const progressPercent = Math.round((earnedBadges.length / BADGE_DEFINITIONS.length) * 100);

  return (
    <PageLayout gradientColors={[currentTheme.status.warning, currentTheme.primary]}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <PageHeader
          title="Erfolge"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.status.warning}
          sticky={false}
          actions={
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={checkForNewBadges}
              disabled={loading}
              style={{
                background: `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                boxShadow: `0 4px 15px ${currentTheme.primary}40`,
              }}
            >
              <Refresh style={{ fontSize: '18px' }} />
              Prüfen
            </motion.button>
          }
        />

        {/* Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            padding: '16px',
            borderRadius: '16px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            marginBottom: '16px',
            marginLeft: '20px',
            marginRight: '20px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <EmojiEvents style={{ fontSize: '24px', color: currentTheme.status.warning }} />
              <span style={{ fontSize: '15px', fontWeight: 600, color: currentTheme.text.primary }}>
                Gesamtfortschritt
              </span>
            </div>
            <span
              style={{
                fontSize: '20px',
                fontWeight: 800,
                color: currentTheme.status.warning,
              }}
            >
              {progressPercent}%
            </span>
          </div>
          <ProgressBar
            value={progressPercent}
            color={currentTheme.status.warning}
            toColor="#fbbf24"
          />
          <p style={{ fontSize: '13px', color: currentTheme.text.muted, marginTop: '8px' }}>
            {earnedBadges.length} von {BADGE_DEFINITIONS.length} Badges freigeschaltet
          </p>
        </motion.div>

        {/* Category Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mobile-badges-tabs-container"
          style={{
            margin: '0 -20px',
            padding: '0 20px 8px',
          }}
        >
          {categories.map((category, index) => {
            const earnedCount = getEarnedCount(category.key);
            const totalCount = getTotalCount(category.key);
            const isActive = tabValue === index;
            const hasEarned = earnedCount > 0;

            return (
              <motion.button
                key={category.key}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setTabValue(index);
                  trackBadgeCategoryTabSwitched(category.key);
                }}
                className={`mobile-badges-tab ${isActive ? 'active' : ''}`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${currentTheme.primary}, var(--theme-secondary-gradient, #8b5cf6))`
                    : hasEarned
                      ? `${currentTheme.primary}10`
                      : currentTheme.background.surface,
                  border: isActive
                    ? 'none'
                    : hasEarned
                      ? `1px solid ${currentTheme.primary}30`
                      : `1px solid ${currentTheme.border.default}`,
                  color: isActive
                    ? 'white'
                    : hasEarned
                      ? currentTheme.primary
                      : currentTheme.text.muted,
                  boxShadow: isActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
                }}
              >
                <div className="mobile-badges-tab-icon">{category.icon}</div>
                <div className="mobile-badges-tab-content">
                  <span className="mobile-badges-tab-label">{category.label}</span>
                  <span
                    className="mobile-badges-tab-count"
                    style={{
                      color: isActive
                        ? 'rgba(255,255,255,0.8)'
                        : hasEarned
                          ? currentTheme.primary
                          : currentTheme.text.muted,
                    }}
                  >
                    {earnedCount}/{totalCount}
                  </span>
                </div>
              </motion.button>
            );
          })}
        </motion.div>
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '300px',
              gap: '20px',
              padding: '40px',
            }}
          >
            <LoadingSpinner
              size={56}
              color={currentTheme.status.warning}
              text="Badges werden geladen..."
            />

            {loadingProgress && (
              <div style={{ width: '200px' }}>
                <ProgressBar
                  value={(loadingProgress.current / loadingProgress.total) * 100}
                  color={currentTheme.status.warning}
                  toColor="#fbbf24"
                  height={6}
                />
                <p
                  style={{
                    color: currentTheme.text.muted,
                    fontSize: '12px',
                    textAlign: 'center',
                    marginTop: '8px',
                  }}
                >
                  Schritt {loadingProgress.current} von {loadingProgress.total}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <AnimatePresence mode="wait">
            {categories.map(
              (category, index) =>
                tabValue === index && (
                  <motion.div
                    key={category.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="badges-grid">
                      {getCategoryBadges(category.key).map((badge, badgeIndex) => {
                        const earned = isBadgeEarned(badge.id);
                        const nextTierInfo = getNextTierInfo(badge, earned);
                        return (
                          <BadgeCard
                            key={badge.id}
                            badge={badge}
                            index={badgeIndex}
                            theme={currentTheme}
                            earned={earned}
                            progress={badgeProgress[badge.id]}
                            isNextTier={nextTierInfo?.isNextTier ?? false}
                          />
                        );
                      })}
                    </div>
                  </motion.div>
                )
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Spacer */}
      <div style={{ height: '100px' }} />
    </PageLayout>
  );
};
