import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Fade,
  IconButton,
  Slide,
  Snackbar,
  Typography,
  useTheme
} from '@mui/material';
import { Close as CloseIcon, EmojiEvents, Star } from '@mui/icons-material';
import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';
import { EarnedBadge } from '../../utils/badgeSystem';

interface BadgeNotificationProps {
  badge: EarnedBadge | null;
  open: boolean;
  onClose: () => void;
  onViewAllBadges?: () => void;
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({
  badge,
  open,
  onClose,
  onViewAllBadges
}) => {
  const theme = useTheme();
  const [showConfetti, setShowConfetti] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (open && badge) {
      // Kurze Verzögerung vor Konfetti
      const timer = setTimeout(() => {
        setShowConfetti(true);
      }, 300);
      
      // Animation als vollständig markieren nach 2 Sekunden
      const completeTimer = setTimeout(() => {
        setAnimationComplete(true);
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearTimeout(completeTimer);
      };
    } else {
      setShowConfetti(false);
      setAnimationComplete(false);
    }
  }, [open, badge]);

  if (!badge) return null;

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return '#9e9e9e';
      case 'rare': return '#2196f3';
      case 'epic': return '#9c27b0';
      case 'legendary': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getRarityGlow = (rarity: string) => {
    const color = getRarityColor(rarity);
    return {
      boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20, 0 0 60px ${color}10`,
      border: `2px solid ${color}60`
    };
  };

  return (
    <>
      {/* Konfetti-Effekt */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
          gravity={0.3}
          colors={[badge.color, getRarityColor(badge.rarity), '#ffd700', '#ff6b35']}
        />
      )}

      {/* Haupt-Popup */}
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{ 
          mt: 8,
          '& .MuiSnackbarContent-root': {
            padding: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none'
          }
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' } as any}
      >
        <Fade in={open} timeout={600}>
          <Card
            sx={{
              minWidth: 400,
              maxWidth: 500,
              background: `linear-gradient(135deg, 
                ${theme.palette.grey[900]} 0%, 
                ${theme.palette.grey[800]} 50%, 
                ${badge.color}20 100%)`,
              color: 'white',
              position: 'relative',
              overflow: 'visible',
              ...getRarityGlow(badge.rarity)
            }}
          >
            {/* Close Button */}
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'white',
                zIndex: 10
              }}
            >
              <CloseIcon />
            </IconButton>

            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              {/* Achievement Header */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <EmojiEvents sx={{ fontSize: 28, color: '#ffd700', mr: 1 }} />
                  <Typography variant="h6" sx={{ color: '#ffd700', fontWeight: 'bold' }}>
                    BADGE VERDIENT!
                  </Typography>
                  <EmojiEvents sx={{ fontSize: 28, color: '#ffd700', ml: 1 }} />
                </Box>
                
                {/* Rarity Indicator */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  {[...Array(badge.rarity === 'legendary' ? 5 : badge.rarity === 'epic' ? 4 : badge.rarity === 'rare' ? 3 : 2)].map((_, i) => (
                    <Star 
                      key={i} 
                      sx={{ 
                        fontSize: 16, 
                        color: getRarityColor(badge.rarity),
                        mr: 0.5
                      }} 
                    />
                  ))}
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      ml: 1, 
                      color: getRarityColor(badge.rarity),
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}
                  >
                    {badge.rarity}
                  </Typography>
                </Box>
              </Box>

              {/* Badge Icon */}
              <Box sx={{ mb: 3 }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: '3rem',
                    backgroundColor: badge.color,
                    margin: '0 auto',
                    ...getRarityGlow(badge.rarity)
                  }}
                >
                  {badge.emoji}
                </Avatar>
              </Box>

              {/* Badge Info */}
              <Box sx={{ mb: 3 }}>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 'bold', 
                    mb: 1,
                    color: badge.color,
                    textShadow: `0 0 10px ${badge.color}50`
                  }}
                >
                  {badge.name}
                </Typography>
                
                <Typography 
                  variant="h6" 
                  sx={{ 
                    opacity: 0.9, 
                    mb: 2,
                    fontWeight: 500
                  }}
                >
                  {badge.description}
                </Typography>

                {badge.details && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#00fed7',
                      fontWeight: 'bold',
                      backgroundColor: 'rgba(0, 254, 215, 0.1)',
                      padding: '8px 16px',
                      borderRadius: '16px',
                      display: 'inline-block'
                    }}
                  >
                    {badge.details}
                  </Typography>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={onClose}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.5)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  Schließen
                </Button>
                
                {onViewAllBadges && (
                  <Button
                    variant="contained"
                    onClick={() => {
                      onViewAllBadges();
                      onClose();
                    }}
                    sx={{
                      backgroundColor: badge.color,
                      color: 'white',
                      fontWeight: 'bold',
                      '&:hover': {
                        backgroundColor: badge.color,
                        opacity: 0.9
                      }
                    }}
                  >
                    Alle Badges ansehen
                  </Button>
                )}
              </Box>
            </CardContent>

            {/* Animated Border */}
            <Box
              sx={{
                position: 'absolute',
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: 'inherit',
                background: `linear-gradient(45deg, 
                  ${getRarityColor(badge.rarity)}, 
                  transparent, 
                  ${badge.color}, 
                  transparent, 
                  ${getRarityColor(badge.rarity)})`,
                backgroundSize: '400% 400%',
                animation: animationComplete ? 'none' : 'borderGlow 2s ease infinite',
                zIndex: -1,
                '@keyframes borderGlow': {
                  '0%': { backgroundPosition: '0% 50%' },
                  '50%': { backgroundPosition: '100% 50%' },
                  '100%': { backgroundPosition: '0% 50%' }
                }
              }}
            />
          </Card>
        </Fade>
      </Snackbar>
    </>
  );
};

export default BadgeNotification;