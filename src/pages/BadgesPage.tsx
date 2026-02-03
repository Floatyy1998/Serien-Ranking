/**
 * BadgesPage - Premium Achievement Gallery
 * Beautiful badge showcase with animated progress
 */

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
        const { getOfflineBadgeSystem } = await import('../features/badges/offlineBadgeSystem');
        const badgeSystem = getOfflineBadgeSystem(user!.uid);
        badgeSystem.invalidateCache();

        setEarnedBadges((prevBadges) => {
          const existingIds = new Set(prevBadges.map((b) => b.id));
          const uniqueNewBadges = newBadges.filter((badge: EarnedBadge) => !existingIds.has(badge.id));
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

    setLoading(true);
    try {
      const { getOfflineBadgeSystem } = await import('../features/badges/offlineBadgeSystem');
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
        return '#8b5cf6';
      case 'legendary':
        return currentTheme.status.warning;
      default:
        return currentTheme.text.muted;
    }
  };

  const getRarityLabel = (rarity: string) => {
    switch (rarity) {
      case 'common':
        return 'Gewöhnlich';
      case 'rare':
        return 'Selten';
      case 'epic':
        return 'Episch';
      case 'legendary':
        return 'Legendär';
      default:
        return rarity;
    }
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

  const renderBadgeCard = (badge: Badge, index: number) => {
    const earned = isBadgeEarned(badge.id);
    const progress = getBadgeProgress(badge.id);
    const nextTierInfo = getNextTierInfo(badge, earned);

    return (
      <motion.div
        key={badge.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          background: earned
            ? `linear-gradient(145deg, ${badge.color}25, ${currentTheme.background.surface})`
            : currentTheme.background.surface,
          border: earned
            ? `2px solid ${badge.color}60`
            : nextTierInfo?.isNextTier
              ? `2px solid ${badge.color}40`
              : `1px solid ${currentTheme.border.default}`,
          borderRadius: '20px',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: earned ? `0 8px 32px ${badge.color}20` : '0 4px 16px rgba(0,0,0,0.1)',
        }}
      >
        {/* Decorative Glow */}
        {earned && (
          <div
            style={{
              position: 'absolute',
              top: '-50%',
              right: '-30%',
              width: '150px',
              height: '150px',
              background: `radial-gradient(circle, ${badge.color}30, transparent)`,
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Rarity Badge */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div
            style={{
              padding: '4px 10px',
              borderRadius: '12px',
              background: `${getRarityColor(badge.rarity)}15`,
              border: `1px solid ${getRarityColor(badge.rarity)}30`,
              fontSize: '10px',
              fontWeight: 700,
              color: getRarityColor(badge.rarity),
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {getRarityLabel(badge.rarity)}
          </div>
          {earned && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentTheme.status.success}, #22c55e)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 2px 8px ${currentTheme.status.success}50`,
              }}
            >
              <span style={{ fontSize: '12px' }}>✓</span>
            </motion.div>
          )}
          {nextTierInfo?.isNextTier && !earned && (
            <div
              style={{
                padding: '4px 8px',
                borderRadius: '8px',
                background: `linear-gradient(135deg, ${badge.color}, ${badge.color}cc)`,
                fontSize: '9px',
                fontWeight: 700,
                color: 'white',
              }}
            >
              NEXT
            </div>
          )}
        </div>

        {/* Badge Icon */}
        <div style={{ textAlign: 'center', marginBottom: '14px', position: 'relative', zIndex: 1 }}>
          <motion.div
            whileHover={{ rotate: earned ? [0, -5, 5, 0] : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              background: earned
                ? `linear-gradient(145deg, ${badge.color}, ${badge.color}cc)`
                : nextTierInfo?.isNextTier
                  ? `linear-gradient(145deg, ${badge.color}40, ${badge.color}20)`
                  : `${currentTheme.background.paper}`,
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              boxShadow: earned ? `0 8px 24px ${badge.color}40` : 'none',
            }}
          >
            <BadgeIcon
              badgeId={badge.id}
              sx={{
                fontSize: '2.8rem',
                color: earned ? 'white' : currentTheme.text.muted,
                opacity: earned ? 1 : 0.5,
              }}
            />
            {!earned && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock style={{ color: currentTheme.text.secondary, fontSize: '1.8rem' }} />
              </div>
            )}
          </motion.div>
        </div>

        {/* Badge Info */}
        <h4
          style={{
            fontSize: '16px',
            fontWeight: 700,
            margin: '0 0 6px 0',
            textAlign: 'center',
            color: earned ? badge.color : currentTheme.text.primary,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {badge.name}
        </h4>

        <p
          style={{
            fontSize: '12px',
            color: currentTheme.text.muted,
            margin: 0,
            textAlign: 'center',
            lineHeight: 1.4,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {badge.description}
        </p>

        {/* Progress Bar */}
        {progress && !earned && (
          <div style={{ marginTop: '14px', position: 'relative', zIndex: 1 }}>
            <div
              style={{
                height: '6px',
                borderRadius: '3px',
                backgroundColor: `${badge.color}20`,
                overflow: 'hidden',
              }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((progress.current / progress.total) * 100, 100)}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                style={{
                  height: '100%',
                  background: progress.sessionActive
                    ? `linear-gradient(90deg, ${badge.color}, ${badge.color}cc)`
                    : `linear-gradient(90deg, ${badge.color}80, ${badge.color}60)`,
                  borderRadius: '3px',
                }}
              />
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  color: progress.sessionActive ? badge.color : currentTheme.text.muted,
                  fontWeight: progress.sessionActive ? 600 : 400,
                }}
              >
                {progress.current} / {progress.total}
              </span>
              {progress.sessionActive && progress.timeRemaining && (
                <span
                  style={{
                    fontSize: '10px',
                    color: badge.color,
                    fontWeight: 600,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    background: `${badge.color}15`,
                  }}
                >
                  {formatTimeRemaining(progress.timeRemaining)}
                </span>
              )}
            </div>
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
              ? 'repeat(auto-fill, minmax(260px, 1fr))'
              : window.innerWidth >= 768
                ? 'repeat(auto-fill, minmax(220px, 1fr))'
                : 'repeat(2, 1fr)',
          gap: window.innerWidth >= 768 ? '20px' : '12px',
          padding: '20px',
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
    return categoryBadges.filter((b) => isBadgeEarned(b.id)).length;
  };

  const getTotalCount = (category: BadgeCategory | 'all') => {
    return category === 'all'
      ? BADGE_DEFINITIONS.length
      : BADGE_DEFINITIONS.filter((b) => b.category === category).length;
  };

  const progressPercent = Math.round((earnedBadges.length / BADGE_DEFINITIONS.length) * 100);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
      }}
    >
      {/* Decorative Background */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '400px',
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.status.warning}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.primary}20, transparent)
          `,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Header */}
      <header
        style={{
          padding: '20px',
          paddingTop: 'calc(20px + env(safe-area-inset-top))',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}ee`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* Title Row */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <BackButton />
          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: '26px',
                fontWeight: 800,
                margin: 0,
                background: `linear-gradient(135deg, ${currentTheme.text.primary}, ${currentTheme.status.warning})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Erfolge
            </h1>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={checkForNewBadges}
            disabled={loading}
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`,
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '13px',
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
        </motion.div>

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
          <div
            style={{
              height: '8px',
              borderRadius: '4px',
              background: `${currentTheme.status.warning}20`,
              overflow: 'hidden',
            }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: `linear-gradient(90deg, ${currentTheme.status.warning}, #fbbf24)`,
                borderRadius: '4px',
              }}
            />
          </div>
          <p style={{ fontSize: '12px', color: currentTheme.text.muted, marginTop: '8px' }}>
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
                onClick={() => setTabValue(index)}
                className={`mobile-badges-tab ${isActive ? 'active' : ''}`}
                style={{
                  background: isActive
                    ? `linear-gradient(135deg, ${currentTheme.primary}, #8b5cf6)`
                    : hasEarned
                      ? `${currentTheme.primary}10`
                      : currentTheme.background.surface,
                  border: isActive
                    ? 'none'
                    : hasEarned
                      ? `1px solid ${currentTheme.primary}30`
                      : `1px solid ${currentTheme.border.default}`,
                  color: isActive ? 'white' : hasEarned ? currentTheme.primary : currentTheme.text.muted,
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
      </header>

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
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '56px',
                height: '56px',
                border: `3px solid ${currentTheme.status.warning}20`,
                borderTop: `3px solid ${currentTheme.status.warning}`,
                borderRadius: '50%',
              }}
            />
            <p style={{ color: currentTheme.text.muted, fontSize: '15px' }}>
              Badges werden geladen...
            </p>

            {loadingProgress && (
              <div style={{ width: '200px' }}>
                <div
                  style={{
                    height: '6px',
                    borderRadius: '3px',
                    background: `${currentTheme.status.warning}20`,
                    overflow: 'hidden',
                  }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(loadingProgress.current / loadingProgress.total) * 100}%` }}
                    style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${currentTheme.status.warning}, #fbbf24)`,
                      borderRadius: '3px',
                    }}
                  />
                </div>
                <p
                  style={{
                    color: currentTheme.text.muted,
                    fontSize: '11px',
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
                    {renderCategoryBadges(category.key)}
                  </motion.div>
                )
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Bottom Spacer */}
      <div style={{ height: '100px' }} />
    </div>
  );
};
