import { Close, Refresh } from '@mui/icons-material';
import { Alert, Button, IconButton, Snackbar } from '@mui/material';
import React, { useEffect, useState } from 'react';

export const UpdateNotification: React.FC = () => {
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Check for available updates
    const checkForUpdates = () => {
      const updateAvailable = localStorage.getItem('updateAvailable');
      const cacheUpdated = localStorage.getItem('cacheUpdated');
      
      if (updateAvailable === 'true' || cacheUpdated === 'true') {
        setShowUpdate(true);
      }
    };

    // Check immediately
    checkForUpdates();

    // Check periodically (less aggressive - every 10 minutes)
    const interval = setInterval(checkForUpdates, 600000);

    return () => clearInterval(interval);
  }, []);

  const handleUpdate = () => {
    // Clear the flags
    localStorage.removeItem('updateAvailable');
    localStorage.removeItem('cacheUpdated');
    localStorage.removeItem('cacheVersion');
    
    // Skip waiting and reload
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
    }
    
    // Give SW time to skip waiting, then reload
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleDismiss = () => {
    setShowUpdate(false);
    // Don't clear localStorage - user dismissed but update is still available
  };

  if (!showUpdate) return null;

  return (
    <Snackbar
      open={showUpdate}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      sx={{ mt: 8 }} // Below header
    >
      <Alert
        severity="info"
        sx={{
          backgroundColor: 'rgba(0, 254, 215, 0.1)',
          border: '1px solid rgba(0, 254, 215, 0.3)',
          color: '#ffffff',
          '& .MuiAlert-icon': {
            color: '#00fed7',
          },
        }}
        action={
          <>
            <Button
              color="inherit"
              size="small"
              onClick={handleUpdate}
              startIcon={<Refresh />}
              sx={{
                color: '#00fed7',
                '&:hover': {
                  backgroundColor: 'rgba(0, 254, 215, 0.1)',
                },
              }}
            >
              Aktualisieren
            </Button>
            <IconButton
              size="small"
              color="inherit"
              onClick={handleDismiss}
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: '#ffffff',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </>
        }
      >
        Neue Version verfügbar! Jetzt aktualisieren für die neuesten Features.
      </Alert>
    </Snackbar>
  );
};