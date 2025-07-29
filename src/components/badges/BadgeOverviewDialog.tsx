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
  useTheme
} from '@mui/material';
import { Close as CloseIcon, Lock, Star } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { 
  BADGE_DEFINITIONS, 
  BadgeSystem, 
  EarnedBadge, 
  Badge, 
  BadgeProgress,
  BadgeCategory 
} from '../../utils/badgeSystem';

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
  onClose
}) => {
  const theme = useTheme();
  const auth = useAuth();
  const user = auth?.user;

  const [earnedBadges, setEarnedBadges] = useState<EarnedBadge[]>([]);
  const [badgeProgress, setBadgeProgress] = useState<Record<string, BadgeProgress>>({});
  const [, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const categories: { key: BadgeCategory; label: string; icon: string }[] = [
    { key: 'binge', label: 'Binge-Watching', icon: '🍿' },
    { key: 'quickwatch', label: 'Quickwatch', icon: '⚡' },
    { key: 'marathon', label: 'Marathon', icon: '📺' },
    { key: 'streak', label: 'Streak', icon: '🔥' },
    { key: 'rewatch', label: 'Rewatch', icon: '🔄' },
    { key: 'series_explorer', label: 'Explorer', icon: '🗺️' }
  ];

  useEffect(() => {
    if (open && user) {
      loadBadgeData();
    }
  }, [open, user]);

  const loadBadgeData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const badgeSystem = new BadgeSystem(user.uid);
      const earned = await badgeSystem.getUserBadges();
      setEarnedBadges(earned);
      
      // Lade Progress für alle Badges
      const progressData: Record<string, BadgeProgress> = {};
      for (const badge of BADGE_DEFINITIONS) {
        const progress = await badgeSystem.getBadgeProgress(badge.id);
        if (progress) {
          progressData[badge.id] = progress;
        }
      }
      setBadgeProgress(progressData);
    } catch (error) {
      console.error('Error loading badge data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9e9e9e';
      case 'rare': return '#2196f3';
      case 'epic': return '#9c27b0';
      case 'legendary': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getRarityStars = (rarity: string) => {
    const count = rarity === 'legendary' ? 5 : rarity === 'epic' ? 4 : rarity === 'rare' ? 3 : 2;
    return [...Array(count)].map((_, i) => (
      <Star key={i} sx={{ fontSize: 14, color: getRarityColor(rarity) }} />
    ));
  };

  const isBadgeEarned = (badgeId: string) => {
    return earnedBadges.some(b => b.id === badgeId);
  };

  const getBadgeProgress = (badgeId: string) => {
    return badgeProgress[badgeId];
  };

  const renderBadgeCard = (badge: Badge) => {
    const earned = isBadgeEarned(badge.id);
    const progress = getBadgeProgress(badge.id);
    const earnedBadge = earnedBadges.find(b => b.id === badge.id);

    return (
      <Card
        key={badge.id}
        sx={{
          height: '100%',
          background: earned 
            ? `linear-gradient(135deg, ${badge.color}20 0%, ${theme.palette.grey[900]} 100%)`
            : `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[900]} 100%)`,
          border: earned ? `1px solid ${badge.color}60` : `1px solid ${theme.palette.grey[700]}`,
          position: 'relative',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: earned 
              ? `0 8px 25px ${badge.color}30`
              : `0 8px 25px rgba(0,0,0,0.3)`
          }
        }}
      >
        <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Rarity Stars */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {getRarityStars(badge.rarity)}
            </Box>
            {earned && earnedBadge && (
              <Chip
                label={new Date(earnedBadge.earnedAt).toLocaleDateString('de-DE')}
                size="small"
                sx={{
                  backgroundColor: `${badge.color}20`,
                  color: badge.color,
                  fontSize: '0.7rem'
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
                backgroundColor: earned ? badge.color : theme.palette.grey[700],
                margin: '0 auto',
                opacity: earned ? 1 : 0.5,
                position: 'relative'
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
                    backgroundColor: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
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
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                color: earned ? badge.color : theme.palette.grey[400]
              }}
            >
              {badge.name}
            </Typography>
            
            <Typography 
              variant="body2" 
              sx={{ 
                color: theme.palette.grey[300],
                mb: 2,
                lineHeight: 1.4
              }}
            >
              {badge.description}
            </Typography>

            {/* Progress Bar */}
            {progress && !earned && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress
                  variant="determinate"
                  value={(progress.current / progress.total) * 100}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: theme.palette.grey[700],
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: badge.color
                    }
                  }}
                />
                <Typography 
                  variant="caption" 
                  sx={{ color: theme.palette.grey[400], mt: 0.5, display: 'block' }}
                >
                  {progress.current} / {progress.total}
                </Typography>
              </Box>
            )}

            {/* Badge Details */}
            {earnedBadge?.details && (
              <Typography 
                variant="caption" 
                sx={{ 
                  color: '#00fed7',
                  backgroundColor: 'rgba(0, 254, 215, 0.1)',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  display: 'inline-block'
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
              size="small"
              sx={{
                backgroundColor: `${getRarityColor(badge.rarity)}20`,
                color: getRarityColor(badge.rarity),
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  };

  const renderCategoryBadges = (category: BadgeCategory) => {
    const categoryBadges = BADGE_DEFINITIONS.filter(b => b.category === category);
    
    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
        {categoryBadges.map((badge) => (
          <Box key={badge.id}>
            {renderBadgeCard(badge)}
          </Box>
        ))}
      </Box>
    );
  };

  const getEarnedCount = (category: BadgeCategory) => {
    const categoryBadges = BADGE_DEFINITIONS.filter(b => b.category === category);
    const earnedCount = categoryBadges.filter(b => isBadgeEarned(b.id)).length;
    return `${earnedCount}/${categoryBadges.length}`;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          backgroundColor: theme.palette.grey[900],
          color: 'white'
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette.grey[800]} 0%, ${theme.palette.grey[900]} 100%)`,
          borderBottom: `1px solid ${theme.palette.grey[700]}`
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Typography component="div" variant="h4" sx={{ fontWeight: 'bold', color: '#ffd700' }}>
            🏆 Meine Badges
          </Typography>
        </Box>
        <Typography component="div" variant="subtitle1" sx={{ color: theme.palette.grey[400], mt: 1 }}>
          {earnedBadges.length} / {BADGE_DEFINITIONS.length} Badges verdient
        </Typography>
        
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white'
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        {/* Category Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: theme.palette.grey[700] }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                color: theme.palette.grey[400],
                '&.Mui-selected': {
                  color: '#00fed7'
                }
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00fed7'
              }
            }}
          >
            {categories.map((category) => (
              <Tab
                key={category.key}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{category.icon}</span>
                    <span>{category.label}</span>
                    <Chip
                      label={getEarnedCount(category.key)}
                      size="small"
                      sx={{
                        backgroundColor: theme.palette.grey[700],
                        color: 'white',
                        height: 20,
                        fontSize: '0.7rem'
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
          {categories.map((category, index) => (
            <TabPanel key={category.key} value={tabValue} index={index}>
              {renderCategoryBadges(category.key)}
            </TabPanel>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeOverviewDialog;