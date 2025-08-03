/**
 * 🚀 Offline Status Indicator Component
 * Zeigt Online/Offline Status und Cache-Statistiken
 */

import {
  Cloud,
  CloudOff,
  Speed,
  Storage,
  Sync,
  Update,
  Wifi,
  WifiOff,
} from '@mui/icons-material';
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Snackbar,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { offlineFirebaseService } from '../../services/offlineFirebaseService';
import { serviceWorkerManager } from '../../services/serviceWorkerManager';

interface OfflineStatusProps {
  showDetails?: boolean;
  position?: 'fixed' | 'relative';
}

interface CacheStats {
  indexedDBSize: number;
  serviceWorkerSize: number;
  offlineQueueSize: number;
}

export const OfflineStatusIndicator: React.FC<OfflineStatusProps> = ({
  showDetails = false,
  position = 'fixed',
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDialog, setShowDialog] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats>({
    indexedDBSize: 0,
    serviceWorkerSize: 0,
    offlineQueueSize: 0,
  });
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [showUpdateSnackbar, setShowUpdateSnackbar] = useState(false);

  useEffect(() => {
    // Online/Offline Status überwachen
    const handleOnline = () => {
      setIsOnline(true);
      console.log('🌐 Wieder online - Synchronisation startet...');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('📱 Offline Modus aktiviert');
    };

    // Service Worker Update Detection
    const handleUpdateAvailable = () => {
      setUpdateAvailable(true);
      setShowUpdateSnackbar(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sw-update-available', handleUpdateAvailable);

    // Initial Cache Stats laden
    loadCacheStats();

    // Cache Stats alle 30 Sekunden aktualisieren
    const statsInterval = setInterval(loadCacheStats, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sw-update-available', handleUpdateAvailable);
      clearInterval(statsInterval);
    };
  }, []);

  const loadCacheStats = async () => {
    try {
      const stats = await offlineFirebaseService.getCacheStatistics();
      setCacheStats(stats);
    } catch (error) {
      console.error('❌ Fehler beim Laden der Cache-Statistiken:', error);
    }
  };

  const handleUpdateApp = async () => {
    try {
      await serviceWorkerManager.updateServiceWorker();
      setUpdateAvailable(false);
      setShowUpdateSnackbar(false);
    } catch (error) {
      console.error('❌ App-Update fehlgeschlagen:', error);
    }
  };

  const handleClearCache = async () => {
    try {
      await offlineFirebaseService.clearAllCaches();
      await serviceWorkerManager.clearCache();
      await loadCacheStats();
      console.log('🗑️ Alle Caches geleert');
    } catch (error) {
      console.error('❌ Cache-Löschung fehlgeschlagen:', error);
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return '#f44336'; // Rot für offline
    if (cacheStats.offlineQueueSize > 0) return '#ff9800'; // Orange für pending
    return '#4caf50'; // Grün für online
  };

  const getStatusIcon = () => {
    if (!isOnline) {
      return <WifiOff sx={{ color: '#f44336' }} />;
    }
    if (cacheStats.offlineQueueSize > 0) {
      return (
        <Badge badgeContent={cacheStats.offlineQueueSize} color='warning'>
          <Sync sx={{ color: '#ff9800' }} />
        </Badge>
      );
    }
    return <Wifi sx={{ color: '#4caf50' }} />;
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (cacheStats.offlineQueueSize > 0)
      return `${cacheStats.offlineQueueSize} Pending`;
    return 'Online';
  };

  return (
    <>
      {/* Status Indicator */}
      <Box
        sx={{
          position,
          bottom: position === 'fixed' ? 20 : 'auto',
          right: position === 'fixed' ? 20 : 'auto',
          zIndex: 1000,
          cursor: 'pointer',
        }}
        onClick={() => setShowDialog(true)}
      >
        <Paper
          elevation={4}
          sx={{
            p: 1.5,
            borderRadius: 3,
            backgroundColor: '#2d2d30',
            border: `2px solid ${getStatusColor()}`,
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
            },
          }}
        >
          <Box display='flex' alignItems='center' gap={1}>
            {getStatusIcon()}
            {showDetails && (
              <Typography variant='body2' color='white'>
                {getStatusText()}
              </Typography>
            )}
            {updateAvailable && (
              <Update
                sx={{ color: '#00fed7', animation: 'pulse 2s infinite' }}
              />
            )}
          </Box>
        </Paper>
      </Box>

      {/* Details Dialog */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth='sm'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
            color: 'white',
          },
        }}
      >
        <DialogTitle>
          <Box display='flex' alignItems='center' gap={2}>
            {getStatusIcon()}
            <Typography variant='h6'>App Status & Cache-Management</Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Online/Offline Status */}
          <Card sx={{ mb: 2, backgroundColor: '#333333' }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                🌐 Verbindungsstatus
              </Typography>
              <Chip
                icon={isOnline ? <Cloud /> : <CloudOff />}
                label={isOnline ? 'Online' : 'Offline'}
                color={isOnline ? 'success' : 'error'}
                sx={{ mb: 1 }}
              />
              {!isOnline && (
                <Alert severity='info' sx={{ mt: 1 }}>
                  Offline-Modus aktiv. Änderungen werden automatisch
                  synchronisiert, sobald eine Verbindung verfügbar ist.
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Cache Statistiken */}
          <Card sx={{ mb: 2, backgroundColor: '#333333' }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                📊 Cache-Statistiken
              </Typography>

              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Storage sx={{ color: '#00fed7' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary='IndexedDB Cache'
                    secondary={`${cacheStats.indexedDBSize} Einträge`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Speed sx={{ color: '#4caf50' }} />
                  </ListItemIcon>
                  <ListItemText
                    primary='Service Worker Cache'
                    secondary={`${cacheStats.serviceWorkerSize} Items`}
                  />
                </ListItem>

                <ListItem>
                  <ListItemIcon>
                    <Sync
                      sx={{
                        color:
                          cacheStats.offlineQueueSize > 0
                            ? '#ff9800'
                            : '#9e9e9e',
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary='Offline Queue'
                    secondary={`${cacheStats.offlineQueueSize} ausstehende Operationen`}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* App Update */}
          {updateAvailable && (
            <Card sx={{ mb: 2, backgroundColor: '#333333' }}>
              <CardContent>
                <Typography variant='h6' gutterBottom>
                  🔄 App-Update verfügbar
                </Typography>
                <Alert severity='info' sx={{ mb: 2 }}>
                  Eine neue Version der App ist verfügbar. Klicken Sie auf
                  "Aktualisieren", um die neueste Version zu laden.
                </Alert>
                <Button
                  variant='contained'
                  color='primary'
                  startIcon={<Update />}
                  onClick={handleUpdateApp}
                  fullWidth
                >
                  App aktualisieren
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Performance Tipps */}
          <Card sx={{ backgroundColor: '#333333' }}>
            <CardContent>
              <Typography variant='h6' gutterBottom>
                💡 Performance-Tipps
              </Typography>

              <Typography variant='body2' color='#b0b0b0' paragraph>
                • App funktioniert offline dank Service Worker
              </Typography>
              <Typography variant='body2' color='#b0b0b0' paragraph>
                • Daten werden intelligent gecacht für bessere Performance
              </Typography>
              <Typography variant='body2' color='#b0b0b0' paragraph>
                • Offline-Änderungen werden automatisch synchronisiert
              </Typography>

              <Divider sx={{ my: 2, backgroundColor: '#404040' }} />

              <Button
                variant='outlined'
                color='warning'
                onClick={handleClearCache}
                size='small'
              >
                Cache leeren
              </Button>
            </CardContent>
          </Card>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setShowDialog(false)} color='primary'>
            Schließen
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Snackbar */}
      <Snackbar
        open={showUpdateSnackbar}
        autoHideDuration={10000}
        onClose={() => setShowUpdateSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setShowUpdateSnackbar(false)}
          severity='info'
          action={
            <Button color='inherit' size='small' onClick={handleUpdateApp}>
              Aktualisieren
            </Button>
          }
          sx={{
            backgroundColor: '#00fed7',
            color: 'black',
            '& .MuiAlert-icon': { color: 'black' },
          }}
        >
          Neue App-Version verfügbar!
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineStatusIndicator;
