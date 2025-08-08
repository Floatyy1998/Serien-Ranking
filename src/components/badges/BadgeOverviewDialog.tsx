import { Close as CloseIcon, Lock, Star } from '@mui/icons-material';
import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  LinearProgress,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import {
  Badge,
  BADGE_DEFINITIONS,
  BadgeCategory,
  BadgeProgress,
  EarnedBadge,
} from '../../utils/badgeDefinitions';

interface BadgeOverviewDialogProps {
  open: boolean;
  onClose: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = ({ children, value, index }: TabPanelProps) => (
  <div hidden={value !== index}>
    {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
  </div>
);

const BadgeOverviewDialog: React.FC<BadgeOverviewDialogProps> = ({
  open,
  onClose,
}) => {
  const theme = useTheme();
  const auth = useAuth();
  const user = auth?.user;

  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<
    Record<string, BadgeProgress>
  >({});
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<{current: number; total: number} | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [, setRefreshTick] = useState(0);

  const categories: { key: BadgeCategory; label: string; icon: string }[] = [
    { key: 'binge', label: 'Binge-Watching', icon: '' },
    { key: 'quickwatch', label: 'Quickwatch', icon: '' },
    { key: 'marathon', label: 'Marathon', icon: '' },
    { key: 'streak', label: 'Streak', icon: '' },
    { key: 'rewatch', label: 'Rewatch', icon: '' },
    { key: 'series_explorer', label: 'Explorer', icon: '' },
    { key: 'collector', label: 'Collector', icon: '' },
    { key: 'social', label: 'Social', icon: '' },
  ];

  useEffect(() => {
    if (open && user) {
      loadBadgeData();
    }
  }, [open, user]);

  // Auto-refresh für laufende Sessions (jede Sekunde)
  useEffect(() => {
    if (!open) return;
    
    const hasActiveSessions = Object.values(badgeProgress).some(p => p.sessionActive);
    if (!hasActiveSessions) return;

    const interval = setInterval(() => {
      setRefreshTick(tick => tick + 1);
      loadBadgeData(); // Refresh progress data
    }, 1000);

    return () => clearInterval(interval);
  }, [open, badgeProgress]);

  const loadBadgeData = async () => {
    if (!user) return;

    const { getOfflineBadgeSystem } = await import('../../utils/offlineBadgeSystem');
    const badgeSystem = getOfflineBadgeSystem(user.uid);
    
    // Prüfe Cache mit öffentlicher Methode
    const isCached = badgeSystem.isCacheValid();

    if (!isCached) {
      // Nur bei fehlenden/alten Daten Loading zeigen
      setLoading(true);
      setLoadingProgress({ current: 0, total: 4 });
      
      // Step 1: Cleanup abgelaufener Sessions
      setLoadingProgress({ current: 1, total: 4 });
      const { badgeCounterService } = await import('../../utils/badgeCounterService');
      await badgeCounterService.finalizeBingeSession(user.uid);
      
      // Step 2: Badge System bereit
      setLoadingProgress({ current: 2, total: 4 });
    } else {
      // Cache gültig - kein Loading, aber trotzdem cleanup im Hintergrund
      const { badgeCounterService } = await import('../../utils/badgeCounterService');
      badgeCounterService.finalizeBingeSession(user.uid); // Ohne await - läuft im Hintergrund
    }
    
    try {
      // Step 3: Erreichte Badges laden
      if (!isCached) setLoadingProgress({ current: 3, total: 4 });
      const earned = await badgeSystem.getUserBadges();
      setEarnedBadges(earned);

      // Step 4: Badge-Progress laden
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
        return '#9e9e9e';
      case 'rare':
        return '#2196f3';
      case 'epic':
        return '#9c27b0';
      case 'legendary':
        return '#ff9800';
      default:
        return '#9e9e9e';
    }
  };

  const getRarityStars = (rarity: string) => {
    const count =
      rarity === 'legendary'
        ? 5
        : rarity === 'epic'
        ? 4
        : rarity === 'rare'
        ? 3
        : 2;
    return [...Array(count)].map((_, i) => (
      <Star key={i} sx={{ fontSize: 14, color: getRarityColor(rarity) }} />
    ));
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some((b) => b.id === badgeId);
  };

  const getBadgeProgress = (badgeId: string) => {
    return badgeProgress[badgeId];
  };

  const formatTimeRemaining = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.slice(0, 2).join(' '); // Maximal 2 Einheiten
  };

  const renderBadgeCard = (badge: Badge) => {
    const earned = isBadgeEarned(badge.id);
    const progress = getBadgeProgress(badge.id);
    const earnedBadge = earnedBadges.find((b) => b.id === badge.id);

    // Multi-Tier Progress: Zeige auch Fortschritt zu höheren Tiers
    const getSameCategoryBadges = () => {
      return BADGE_DEFINITIONS.filter(b => 
        b.category === badge.category && 
        b.requirements.episodes === badge.requirements.episodes &&
        b.requirements.timeframe === badge.requirements.timeframe &&
        b.requirements.series === badge.requirements.series &&
        b.requirements.ratings === badge.requirements.ratings &&
        b.requirements.friends === badge.requirements.friends &&
        b.requirements.days === badge.requirements.days
      ).sort((a, b) => {
        const tierOrder = { bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5 };
        return tierOrder[a.tier] - tierOrder[b.tier];
      });
    };

    const getNextTierInfo = () => {
      if (earned) return null;
      
      const sameCategoryBadges = getSameCategoryBadges();
      if (sameCategoryBadges.length <= 1) return null;
      
      const currentIndex = sameCategoryBadges.findIndex(b => b.id === badge.id);
      if (currentIndex === -1 || currentIndex === 0) return null;
      
      // Prüfe ob niedrigere Tiers erreicht sind
      const lowerTiers = sameCategoryBadges.slice(0, currentIndex);
      const earnedLowerTiers = lowerTiers.filter(b => isBadgeEarned(b.id));
      
      if (earnedLowerTiers.length === lowerTiers.length) {
        return { isNextTier: true, prevTier: lowerTiers[lowerTiers.length - 1] };
      }
      
      return null;
    };

    const nextTierInfo = getNextTierInfo();

    return (
      <Card
        key={badge.id}
        sx={{
          height: '100%',
          background: earned
            ? `linear-gradient(135deg, ${badge.color}20 0%, ${theme.palette.grey[900]} 100%)`
            : nextTierInfo?.isNextTier
            ? `linear-gradient(135deg, ${badge.color}10 0%, ${theme.palette.grey[800]} 100%)`
            : `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[900]} 100%)`,
          border: earned
            ? `1px solid ${badge.color}60`
            : nextTierInfo?.isNextTier
            ? `1px solid ${badge.color}30`
            : `1px solid ${theme.palette.grey[700]}`,
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: earned
              ? `0 8px 25px ${badge.color}30`
              : `0 8px 25px rgba(0,0,0,0.3)`,
          },
        }}
      >
        <CardContent
          sx={{
            p: 3,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Rarity Stars */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {getRarityStars(badge.rarity)}
            </Box>
            {earned && earnedBadge && (
              <Chip
                label={new Date(earnedBadge.earnedAt).toLocaleDateString(
                  'de-DE',
                  {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  }
                )}
                size='small'
                sx={{
                  backgroundColor: `${badge.color}20`,
                  color: badge.color,
                  fontSize: '0.7rem',
                }}
              />
            )}
            {nextTierInfo?.isNextTier && (
              <Chip
                label="NÄCHSTES ZIEL"
                size='small'
                sx={{
                  backgroundColor: `${badge.color}20`,
                  color: badge.color,
                  fontSize: '0.6rem',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>

          {/* Badge Icon */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Avatar
              sx={{
                width: 64,
                height: 64,
                fontSize: '2rem',
                backgroundColor: earned 
                  ? badge.color 
                  : nextTierInfo?.isNextTier 
                  ? `${badge.color}40`
                  : theme.palette.grey[700],
                margin: '0 auto',
                opacity: earned ? 1 : nextTierInfo?.isNextTier ? 0.8 : 0.5,
                position: 'relative',
              }}
            >
              {badge.emoji}
              {!earned && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: nextTierInfo?.isNextTier ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Lock sx={{ color: 'white', fontSize: '1.5rem' }} />
                </Box>
              )}
            </Avatar>
          </Box>

          {/* Badge Info */}
          <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
            <Typography
              variant='h6'
              sx={{
                fontWeight: 'bold',
                mb: 1,
                color: earned ? badge.color : nextTierInfo?.isNextTier ? `${badge.color}80` : theme.palette.grey[400],
              }}
            >
              {badge.name}
            </Typography>

            <Typography
              variant='body2'
              sx={{
                color: theme.palette.grey[300],
                mb: 2,
                lineHeight: 1.4,
              }}
            >
              {badge.description}
            </Typography>

            {/* Progress Bar mit Tier-Info */}
            {progress && !earned && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant='determinate'
                  value={Math.min((progress.current / progress.total) * 100, 100)}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.palette.grey[700],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: progress.sessionActive 
                        ? badge.color 
                        : nextTierInfo?.isNextTier 
                        ? badge.color 
                        : `${badge.color}60`,
                      borderRadius: 4,
                      animation: progress.sessionActive ? 'pulse 2s infinite' : 'none',
                    },
                  }}
                />
                <Typography
                  variant='caption'
                  sx={{
                    color: progress.sessionActive 
                      ? badge.color 
                      : nextTierInfo?.isNextTier 
                      ? badge.color 
                      : theme.palette.grey[400],
                    mt: 0.5,
                    display: 'block',
                    fontWeight: progress.sessionActive || nextTierInfo?.isNextTier ? 'bold' : 'normal',
                  }}
                >
                  {progress.current} / {progress.total}
                  {nextTierInfo?.isNextTier && ` (noch ${progress.total - progress.current})`}
                </Typography>
                
                {/* Countdown Timer */}
                {progress.sessionActive && progress.timeRemaining && (
                  <Typography
                    variant='caption'
                    sx={{
                      color: badge.color,
                      display: 'block',
                      fontSize: '0.7rem',
                      fontWeight: 'bold',
                      mt: 0.5,
                    }}
                  >
                    🔥 Session endet in: {formatTimeRemaining(progress.timeRemaining)}
                  </Typography>
                )}
                
                {nextTierInfo?.isNextTier && (
                  <Typography
                    variant='caption'
                    sx={{
                      color: theme.palette.grey[500],
                      display: 'block',
                      fontSize: '0.65rem',
                    }}
                  >
                    Aufbauend auf {nextTierInfo.prevTier.name} ✓
                  </Typography>
                )}
              </Box>
            )}

            {/* Badge Details */}
            {earnedBadge?.details && (
              <Typography
                variant='caption'
                sx={{
                  color: '#fff',
                  backgroundColor: 'rgba(0, 254, 215, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  display: 'inline-block',
                }}
              >
                {earnedBadge.details}
              </Typography>
            )}
          </Box>

          {/* Rarity Label */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Chip
              label={badge.rarity.toUpperCase()}
              size='small'
              sx={{
                backgroundColor: `${getRarityColor(badge.rarity)}20`,
                color: getRarityColor(badge.rarity),
                fontWeight: 'bold',
                fontSize: '0.7rem',
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCategoryBadges = (category: BadgeCategory) => {
    const categoryBadges = BADGE_DEFINITIONS.filter(
      (b) => b.category === category
    );

    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 3,
        }}
      >
        {categoryBadges.map((badge) => (
          <Box key={badge.id}>{renderBadgeCard(badge)}</Box>
        ))}
      </Box>
    );
  };

  const getEarnedCount = (category: BadgeCategory) => {
    const categoryBadges = BADGE_DEFINITIONS.filter(
      (b) => b.category === category
    );
    const earnedCount = categoryBadges.filter((b) =>
      isBadgeEarned(b.id)
    ).length;
    return `${earnedCount}/${categoryBadges.length}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            minHeight: '80vh',
            background:
              'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow:
              '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)',
            color: 'white',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '1.25rem',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Typography
            component='div'
            variant='h4'
            sx={{ fontWeight: 'bold', color: '#ffd700' }}
          >
            Meine Badges
          </Typography>
        </Box>
        <Typography
          component='div'
          variant='subtitle1'
          sx={{ color: theme.palette.grey[400], mt: 1 }}
        >
          {earnedBadges.length} / {BADGE_DEFINITIONS.length} Badges verdient
        </Typography>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '&:hover': {
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              transform: 'translateY(-50%) scale(1.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          p: 0,
          background:
            'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
        }}
      >
        {/* Category Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant='scrollable'
            scrollButtons='auto'
            sx={{
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '12px 12px 0 0',
                margin: '0 4px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  color: '#ffffff',
                },
                '&.Mui-selected': {
                  color: '#00fed7',
                  background:
                    'linear-gradient(135deg, rgba(0, 254, 215,0,.15) 0%, #00fed7, 0.1) 100%)',
                  boxShadow: '0 8px 25px #00fed7, 0.2)',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00fed7',
                height: '3px',
                borderRadius: '2px',
              },
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{category.label}</span>
                    <Chip
                      label={getEarnedCount(category.key)}
                      size='small'
                      sx={{
                        background:
                          'linear-gradient(135deg, rgba(0, 254, 215, 0.2) 0%, rgba(0, 212, 170, 0.15) 100%)',
                        border: '1px solid rgba(0, 254, 215, 0.3)',
                        color: '#ffffff',
                        height: 20,
                        fontSize: '0.7rem',
                        '&:hover': {
                          background:
                            'linear-gradient(135deg, rgba(0, 254, 215, 0.3) 0%, rgba(0, 212, 170, 0.25) 100%)',
                          border: '1px solid rgba(0, 254, 215, 0.4)',
                        },
                      }}
                    />
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* Tab Panels */}
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: 3,
              }}
            >
              <Typography
                variant='h5'
                sx={{
                  color: '#00fed7',
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                🏆 Badges werden geladen...
              </Typography>
              
              {loadingProgress && (
                <>
                  <Box sx={{ width: '300px' }}>
                    <LinearProgress
                      variant='determinate'
                      value={(loadingProgress.current / loadingProgress.total) * 100}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: theme.palette.grey[700],
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: '#00fed7',
                          borderRadius: 4,
                        },
                      }}
                    />
                  </Box>
                  
                  <Typography
                    variant='body1'
                    sx={{
                      color: theme.palette.grey[300],
                      textAlign: 'center',
                    }}
                  >
                    Schritt {loadingProgress.current} von {loadingProgress.total}
                  </Typography>
                  
                  <Typography
                    variant='caption'
                    sx={{
                      color: theme.palette.grey[400],
                      textAlign: 'center',
                    }}
                  >
                    {loadingProgress.current === 1 && 'Sessions aufräumen...'}
                    {loadingProgress.current === 2 && 'Badge-System initialisieren...'}
                    {loadingProgress.current === 3 && 'Erreichte Badges laden...'}
                    {loadingProgress.current === 4 && 'Fortschritt berechnen...'}
                  </Typography>
                </>
              )}
            </Box>
          ) : (
            categories.map((category, index) => (
              <TabPanel key={category.key} value={tabValue} index={index}>
                {renderCategoryBadges(category.key)}
              </TabPanel>
            ))
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeOverviewDialog;
