import {
  Alert,
  Box,
  Snackbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';
import { EarnedBadge } from '../../utils/badgeDefinitions';

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
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  if (!badge) return null;

  // Intelligente Textfarbe basierend auf Badge-Farbe
  const getTextColor = (backgroundColor: string) => {
    // Entferne # falls vorhanden
    const hex = backgroundColor.replace('#', '');
    
    // Konvertiere zu RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Berechne relative Luminanz
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Weiß für dunkle Hintergründe, Schwarz für helle
    return luminance > 0.5 ? '#000000' : '#ffffff';
  };

  const textColor = getTextColor(badge.color);

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ 
        vertical: isMobile ? 'top' : 'bottom', 
        horizontal: 'right' 
      }}
      sx={{
        '& .MuiSnackbarContent-root': {
          padding: 0,
        },
      }}
    >
      <Alert
        variant="filled"
        severity="success"
        onClose={onClose}
        action={
          onViewAllBadges && (
            <Typography
              variant="body2"
              onClick={() => {
                onViewAllBadges();
                onClose();
              }}
              sx={{
                cursor: 'pointer',
                textDecoration: 'underline',
                mr: 1,
                fontSize: '0.8rem',
                color: textColor,
                '&:hover': { opacity: 0.8 },
              }}
            >
              Alle ansehen
            </Typography>
          )
        }
        sx={{
          minWidth: isMobile ? '280px' : '320px',
          maxWidth: isMobile ? '90vw' : '400px',
          backgroundColor: badge.color,
          color: textColor,
          '& .MuiAlert-message': {
            width: '100%',
            color: textColor,
          },
          '& .MuiAlert-action': {
            alignItems: 'center',
            pt: 0,
          },
          '& .MuiAlert-icon': {
            color: textColor,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box
            sx={{
              backgroundColor: textColor === '#ffffff' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.2)',
              borderRadius: '50%',
              width: isMobile ? '32px' : '36px',
              height: isMobile ? '32px' : '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Typography
              sx={{
                fontSize: isMobile ? '1.1rem' : '1.3rem',
                lineHeight: 1,
              }}
            >
              {badge.emoji}
            </Typography>
          </Box>
          <Box>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 600,
                fontSize: isMobile ? '0.9rem' : '1rem',
                lineHeight: 1.2,
                color: textColor,
              }}
            >
              {badge.name}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.85,
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                lineHeight: 1.1,
                mt: 0.5,
                color: textColor,
              }}
            >
              {badge.description}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default BadgeNotification;
