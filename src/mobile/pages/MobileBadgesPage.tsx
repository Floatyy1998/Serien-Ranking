import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  EmojiEvents,
  LocalFireDepartment,
  Explore,
  Star,
  Groups,
  Refresh,
  Speed,
  Movie,
  Lock,
  CheckCircle,
  TrendingUp,
} from '@mui/icons-material';
import { LinearProgress, Chip } from '@mui/material';
import { useBadges } from '../../features/badges/BadgeProvider';
import { BADGE_DEFINITIONS, Badge, EarnedBadge } from '../../features/badges/badgeDefinitions';
import { BadgeIcon } from '../../features/badges/BadgeIcons';
import { useAuth } from '../../App';
import { useTheme } from '../../contexts/ThemeContext';
import { MobileBackButton } from '../components/MobileBackButton';
// import firebase from 'firebase/compat/app';
import './MobileBadgesPage.css';

const categoryIcons: Record<string, React.ReactNode> = {
  binge: <Movie />,
  quickwatch: <Speed />,
  marathon: <LocalFireDepartment />,
  streak: <TrendingUp />,
  rewatch: <Refresh />,
  explorer: <Explore />,
  collector: <Star />,
  social: <Groups />,
};

const categoryColors: Record<string, string> = {
  binge: '#ff6b6b',
  quickwatch: '#4ecdc4',
  marathon: '#667eea',
  streak: '#ff9f43',
  rewatch: '#54a0ff',
  explorer: '#48dbfb',
  collector: '#feca57',
  social: '#ee5a6f',
};

export const MobileBadgesPage: React.FC = () => {
  const { } = useBadges();
  const { user } = useAuth()!;
  const { currentTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [userBadges, setUserBadges] = useState<EarnedBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const allBadges = useMemo(() => BADGE_DEFINITIONS, []);

  const categories = useMemo(() => {
    const cats = new Set(['all']);
    allBadges.forEach(badge => cats.add(badge.category));
    return Array.from(cats);
  }, [allBadges]);

  // Load user badges on component mount
  useEffect(() => {
    const loadUserBadges = async () => {
      if (!user) return;
      
      try {
        // Use the offline badge system like the desktop version
        const { getOfflineBadgeSystem } = await import('../../features/badges/offlineBadgeSystem');
        const badgeSystem = getOfflineBadgeSystem(user.uid);
        
        const earnedBadges = await badgeSystem.getUserBadges();
        setUserBadges(earnedBadges);
      } catch (error) {
        console.error('Failed to load user badges:', error);
        // Fallback to empty array
        setUserBadges([]);
      } finally {
        setLoading(false);
      }
    };

    loadUserBadges();
  }, [user]);

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return allBadges;
    return allBadges.filter((badge: Badge) => badge.category === selectedCategory);
  }, [allBadges, selectedCategory]);

  const earnedBadgeIds = useMemo(() => {
    return new Set(userBadges.map(b => b.id));
  }, [userBadges]);

  const stats = useMemo(() => {
    const total = allBadges.length;
    const earned = userBadges.length;
    const percentage = Math.round((earned / total) * 100);
    
    const byCategory = categories.reduce((acc, cat) => {
      if (cat === 'all') return acc;
      const catBadges = allBadges.filter((b: Badge) => b.category === cat);
      const catEarned = catBadges.filter((b: Badge) => earnedBadgeIds.has(b.id)).length;
      acc[cat] = {
        total: catBadges.length,
        earned: catEarned,
        percentage: Math.round((catEarned / catBadges.length) * 100),
      };
      return acc;
    }, {} as Record<string, { total: number; earned: number; percentage: number }>);

    return { total, earned, percentage, byCategory };
  }, [allBadges, userBadges, categories, earnedBadgeIds]);

  const getRarityStars = (rarity: string): number => {
    switch (rarity) {
      case 'common': return 1;
      case 'rare': return 2; 
      case 'epic': return 3;
      case 'legendary': return 4;
      default: return 1;
    }
  };

  const handleRefresh = async () => {
    if (refreshing || !user) return;
    
    setRefreshing(true);
    if (navigator.vibrate) navigator.vibrate(10);
    
    try {
      // Trigger badge check through the offline system
      const { getOfflineBadgeSystem } = await import('../../features/badges/offlineBadgeSystem');
      const badgeSystem = getOfflineBadgeSystem(user.uid);
      badgeSystem.invalidateCache();
      await badgeSystem.checkForNewBadges();
      
      // Reload badges from the offline system
      const earnedBadges = await badgeSystem.getUserBadges();
      setUserBadges(earnedBadges);
    } catch (error) {
      console.error('Failed to refresh badges:', error);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const getBadgeProgress = (badge: Badge) => {
    const earned = earnedBadgeIds.has(badge.id);
    if (earned) return 100;
    
    // For now, return 0 for unearned badges
    // Real-time progress tracking could be added here
    return 0;
  };

  if (loading) {
    return (
      <div className="mobile-badges-page">
        <div className="badges-header" style={{
        background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`
      }}>
          <MobileBackButton />
          <h1>Achievements</h1>
          <div className="refresh-button">
            <Refresh />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
          <div className="loading-spinner">
            <EmojiEvents style={{ fontSize: 48, color: '#667eea', animation: 'pulse 2s infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-badges-page">
      {/* Header */}
      <div className="badges-header" style={{
        background: `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`
      }}>
        <MobileBackButton />
        <h1>Achievements</h1>
        <button 
          className={`refresh-button ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
        >
          <Refresh />
        </button>
      </div>

      {/* Overall Progress */}
      <div className="overall-progress-card">
        <div className="progress-header">
          <EmojiEvents className="trophy-icon" />
          <div className="progress-text">
            <h2>{stats.earned} / {stats.total}</h2>
            <p>Achievements freigeschaltet</p>
          </div>
          <div className="progress-percentage">
            {stats.percentage}%
          </div>
        </div>
        <LinearProgress 
          variant="determinate" 
          value={stats.percentage}
          className="progress-bar"
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            '& .MuiLinearProgress-bar': {
              borderRadius: 4,
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            },
          }}
        />
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map(cat => (
          <motion.button
            key={cat}
            className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat)}
            whileTap={{ scale: 0.95 }}
            style={{
              '--category-color': categoryColors[cat] || '#667eea'
            } as React.CSSProperties}
          >
            {cat === 'all' ? (
              <>
                <EmojiEvents />
                <span>Alle</span>
                <Chip 
                  label={stats.earned}
                  size="small"
                  className="category-count"
                />
              </>
            ) : (
              <>
                {categoryIcons[cat]}
                <span>{cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
                <Chip 
                  label={`${stats.byCategory[cat]?.earned || 0}/${stats.byCategory[cat]?.total || 0}`}
                  size="small"
                  className="category-count"
                />
              </>
            )}
          </motion.button>
        ))}
      </div>

      {/* Badge Grid */}
      <div className="badges-grid">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge: Badge, index: number) => {
            const earned = earnedBadgeIds.has(badge.id);
            const progress = getBadgeProgress(badge);
            const isActive = progress > 0 && progress < 100;
            const earnedBadge = userBadges.find(b => b.id === badge.id);

            return (
              <motion.div
                key={badge.id}
                className={`badge-card ${earned ? 'earned' : ''} ${isActive ? 'active' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  '--badge-color': categoryColors[badge.category] || '#667eea'
                } as React.CSSProperties}
              >
                {/* Badge Icon */}
                <div className="badge-icon-container">
                  <BadgeIcon badgeId={badge.id} />
                  {earned && (
                    <CheckCircle className="earned-indicator" />
                  )}
                  {!earned && (
                    <Lock className="locked-indicator" />
                  )}
                </div>

                {/* Badge Info */}
                <div className="badge-info">
                  <h3>{badge.name}</h3>
                  <p className="badge-description">{badge.description}</p>
                  
                  {/* Rarity Stars */}
                  <div className="badge-rarity">
                    {[...Array(4)].map((_, i) => (
                      <Star 
                        key={i}
                        className={i < getRarityStars(badge.rarity) ? 'filled' : ''}
                      />
                    ))}
                  </div>

                  {/* Progress or Earned Date */}
                  {earned && earnedBadge ? (
                    <div className="earned-date">
                      <CheckCircle />
                      <span>{new Date(earnedBadge.earnedAt).toLocaleDateString('de-DE')}</span>
                    </div>
                  ) : (
                    <div className="badge-requirement">
                      <span>
                        {badge.requirements.episodes && `${badge.requirements.episodes} Episoden`}
                        {badge.requirements.series && `${badge.requirements.series} Serien`}
                        {badge.requirements.days && `${badge.requirements.days} Tage`}
                        {badge.requirements.ratings && `${badge.requirements.ratings} Bewertungen`}
                        {badge.requirements.friends && `${badge.requirements.friends} Freunde`}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
};