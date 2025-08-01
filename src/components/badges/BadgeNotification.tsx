import { Close as CloseIcon, EmojiEvents, Star } from '@mui/icons-material';
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
  useTheme,
} from '@mui/material';
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
  onViewAllBadges,
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
      case 'common':
        return '#64748b';
      case 'rare':
        return '#3b82f6';
      case 'epic':
        return '#a855f7';
      case 'legendary':
        return '#f59e0b';
      default:
        return '#64748b';
    }
  };

  const getStarCount = (rarity: string) => {
    switch (rarity) {
      case 'legendary':
        return 5;
      case 'epic':
        return 4;
      case 'rare':
        return 3;
      case 'common':
        return 2;
      default:
        return 1;
    }
  };

  return (
    <>
      {/* Konfetti-Effekt */}
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={300}
          gravity={0.2}
          colors={[
            badge.color,
            getRarityColor(badge.rarity),
            '#ffd700',
            '#ff6b35',
            '#00fed7',
            '#ffffff',
          ]}
          wind={0.05}
          initialVelocityY={-20}
        />
      )}

      {/* Haupt-Popup */}
      <Snackbar
        open={open}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          mt: 6,
          '& .MuiSnackbarContent-root': {
            padding: 0,
            backgroundColor: 'transparent',
            boxShadow: 'none',
          },
        }}
        TransitionComponent={Slide}
        TransitionProps={{ direction: 'down' } as any}
      >
        <Fade in={open} timeout={800}>
          <Card
            sx={{
              minWidth: 420,
              maxWidth: 520,
              background: `
                linear-gradient(135deg, 
                  ${theme.palette.grey[800]} 0%, 
                  ${theme.palette.grey[700]} 50%,
                  ${theme.palette.grey[800]} 100%)
              `,
              color: 'white',
              position: 'relative',
              overflow: 'visible',
              borderRadius: '20px',
              backdropFilter: 'blur(10px)',
              transform: open
                ? 'scale(1) rotateY(0deg)'
                : 'scale(0.8) rotateY(-10deg)',
              transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: `
                0 0 30px ${getRarityColor(badge.rarity)}80, 
                0 0 60px ${getRarityColor(badge.rarity)}40, 
                0 20px 40px rgba(0,0,0,0.5)
              `,
              border: `3px solid ${getRarityColor(badge.rarity)}`,
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
                zIndex: 10,
              }}
            >
              <CloseIcon />
            </IconButton>

            <CardContent
              sx={{ p: 5, textAlign: 'center', position: 'relative' }}
            >
              {/* Achievement Header */}
              <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 3,
                  }}
                >
                  <EmojiEvents
                    sx={{
                      fontSize: 32,
                      color: '#ffd700',
                      mr: 1.5,
                    }}
                  />
                  <Typography
                    variant='h5'
                    sx={{
                      color: '#ffd700',
                      fontWeight: 900,
                      letterSpacing: '2px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Badge Verdient!
                  </Typography>
                  <EmojiEvents
                    sx={{
                      fontSize: 32,
                      color: '#ffd700',
                      ml: 1.5,
                    }}
                  />
                </Box>

                {/* Rarity Indicator */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {[...Array(getStarCount(badge.rarity))].map((_, i) => (
                    <Star
                      key={i}
                      sx={{
                        fontSize: 20,
                        color: getRarityColor(badge.rarity),
                        mr: 0.5,
                        filter: `drop-shadow(0 0 8px ${getRarityColor(
                          badge.rarity
                        )})`,
                        animation: `sparkle 2s ease-in-out infinite ${
                          i * 0.2
                        }s`,
                        '@keyframes sparkle': {
                          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
                          '50%': { transform: 'scale(1.2)', opacity: 0.8 },
                        },
                      }}
                    />
                  ))}
                  <Typography
                    variant='body1'
                    sx={{
                      ml: 2,
                      color: getRarityColor(badge.rarity),
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      textShadow: `0 0 15px ${getRarityColor(badge.rarity)}`,
                    }}
                  >
                    {badge.rarity}
                  </Typography>
                </Box>
              </Box>

              {/* Badge Icon */}
              <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
                <Box
                  sx={{
                    position: 'relative',
                    display: 'inline-block',
                    animation: 'bounce 3s ease-in-out infinite',
                    '@keyframes bounce': {
                      '0%, 100%': { transform: 'translateY(0px) scale(1)' },
                      '25%': { transform: 'translateY(-10px) scale(1.05)' },
                      '50%': { transform: 'translateY(-5px) scale(1.1)' },
                      '75%': { transform: 'translateY(-15px) scale(1.05)' },
                    },
                  }}
                >
                  <Avatar
                    sx={{
                      width: 120,
                      height: 120,
                      fontSize: '4rem',
                      background: `
                        linear-gradient(135deg, ${badge.color}, ${badge.color}CC)
                      `,
                      margin: '0 auto',
                      border: `4px solid ${getRarityColor(badge.rarity)}`,
                      position: 'relative',
                      boxShadow: `0 0 20px ${getRarityColor(badge.rarity)}80`,
                    }}
                  >
                    {badge.emoji}
                  </Avatar>
                </Box>
              </Box>

              {/* Badge Info */}
              <Box sx={{ mb: 4, position: 'relative', zIndex: 1 }}>
                <Typography
                  variant='h3'
                  sx={{
                    fontWeight: 900,
                    mb: 2,
                    color: 'white',
                    fontSize: { xs: '2rem', sm: '2.5rem' },
                    letterSpacing: '1px',
                    textShadow: `0 0 10px ${getRarityColor(badge.rarity)}`,
                  }}
                >
                  {badge.name}
                </Typography>

                <Typography
                  variant='h6'
                  sx={{
                    opacity: 0.95,
                    mb: 3,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    color: '#e2e8f0',
                  }}
                >
                  {badge.description}
                </Typography>

                {badge.details && (
                  <Box
                    sx={{
                      background: 'rgba(0, 254, 215, 0.2)',
                      border: '2px solid rgba(0, 254, 215, 0.5)',
                      borderRadius: '12px',
                      padding: '12px 20px',
                      display: 'inline-block',
                      backdropFilter: 'blur(5px)',
                    }}
                  >
                    <Typography
                      variant='body1'
                      sx={{
                        color: '#00fed7',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      ✨ {badge.details}
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  gap: 3,
                  justifyContent: 'center',
                  mt: 4,
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Button
                  variant='outlined'
                  onClick={onClose}
                  sx={{
                    color: 'white',
                    borderColor: 'rgba(255, 255, 255, 0.4)',
                    borderWidth: '2px',
                    borderRadius: '12px',
                    padding: '10px 24px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    backdropFilter: 'blur(5px)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: 'rgba(255, 255, 255, 0.8)',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 25px rgba(255, 255, 255, 0.1)',
                    },
                  }}
                >
                  Schließen
                </Button>

                {onViewAllBadges && (
                  <Button
                    variant='contained'
                    onClick={() => {
                      onViewAllBadges();
                      onClose();
                    }}
                    sx={{
                      background: `linear-gradient(135deg, ${
                        badge.color
                      }, ${getRarityColor(badge.rarity)})`,
                      color: 'white',
                      fontWeight: 700,
                      fontSize: '1rem',
                      borderRadius: '12px',
                      padding: '10px 24px',
                      textTransform: 'none',
                      boxShadow: `0 8px 25px ${badge.color}40`,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        background: `linear-gradient(135deg, ${
                          badge.color
                        }dd, ${getRarityColor(badge.rarity)}dd)`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 12px 35px ${badge.color}60`,
                      },
                    }}
                  >
                    🏆 Alle Badges ansehen
                  </Button>
                )}
              </Box>
            </CardContent>

            {/* Enhanced Animated Border */}
            <Box
              sx={{
                position: 'absolute',
                top: -4,
                left: -4,
                right: -4,
                bottom: -4,
                borderRadius: '24px',
                background: `
                  conic-gradient(
                    ${getRarityColor(badge.rarity)}, 
                    ${badge.color}, 
                    transparent, 
                    ${getRarityColor(badge.rarity)}, 
                    ${badge.color},
                    transparent
                  )
                `,
                backgroundSize: '200% 200%',
                animation: animationComplete
                  ? 'none'
                  : 'epicBorderGlow 3s ease infinite',
                zIndex: -1,
                opacity: 0.8,
                '@keyframes epicBorderGlow': {
                  '0%': {
                    backgroundPosition: '0% 50%',
                    transform: 'rotate(0deg)',
                  },
                  '50%': {
                    backgroundPosition: '100% 50%',
                    transform: 'rotate(180deg)',
                  },
                  '100%': {
                    backgroundPosition: '0% 50%',
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            />
          </Card>
        </Fade>
      </Snackbar>
    </>
  );
};

export default BadgeNotification;
