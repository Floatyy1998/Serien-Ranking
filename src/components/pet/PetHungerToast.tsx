import {
  Alert,
  Box,
  Snackbar,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';

interface PetHungerToastProps {
  open: boolean;
  onClose: () => void;
  petName: string;
  level: 'warning' | 'critical';
  onFeed: () => void;
}

export const PetHungerToast: React.FC<PetHungerToastProps> = ({
  open,
  onClose,
  petName,
  level,
  onFeed,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isCritical = level === 'critical';
  const bgColor = isCritical ? '#dc2626' : '#f97316';
  const title = isCritical
    ? `${petName} verhungert bald!`
    : `${petName} hat Hunger!`;
  const icon = isCritical ? '⚠️' : '🍖';

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={onClose}
      anchorOrigin={{
        vertical: isMobile ? 'top' : 'bottom',
        horizontal: 'right',
      }}
    >
      <Alert
        variant="filled"
        severity={isCritical ? 'error' : 'warning'}
        onClose={onClose}
        action={
          <Typography
            variant="body2"
            onClick={onFeed}
            sx={{
              cursor: 'pointer',
              textDecoration: 'underline',
              mr: 1,
              fontSize: '0.8rem',
              color: '#fff',
              '&:hover': { opacity: 0.8 },
            }}
          >
            Jetzt füttern
          </Typography>
        }
        sx={{
          minWidth: isMobile ? '280px' : '320px',
          maxWidth: isMobile ? '90vw' : '400px',
          backgroundColor: bgColor,
          color: '#fff',
          '& .MuiAlert-message': { width: '100%', color: '#fff' },
          '& .MuiAlert-action': { alignItems: 'center', pt: 0 },
          '& .MuiAlert-icon': { color: '#fff' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ fontSize: '1.4rem', flexShrink: 0 }}>{icon}</Box>
          <Box>
            <Typography
              variant="body1"
              sx={{ fontWeight: 600, fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: 1.2, color: '#fff' }}
            >
              {title}
            </Typography>
            <Typography
              variant="body2"
              sx={{ opacity: 0.9, fontSize: isMobile ? '0.75rem' : '0.85rem', lineHeight: 1.1, mt: 0.5, color: '#fff' }}
            >
              {isCritical ? 'Füttere dein Pet bevor es zu spät ist!' : 'Dein Pet braucht bald etwas zu essen.'}
            </Typography>
          </Box>
        </Box>
      </Alert>
    </Snackbar>
  );
};
