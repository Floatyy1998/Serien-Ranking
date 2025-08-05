import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useEnhancedFirebaseCache } from '../../hooks/useEnhancedFirebaseCache';
import { ProfileDialog } from './ProfileDialog';

export const UsernameRequiredDialog: React.FC = () => {
  const { user } = useAuth()!;
  const [open, setOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  // 🚀 Enhanced User-Profile-Überwachung mit Offline-Support
  const { data: userData } = useEnhancedFirebaseCache<any>(
    user ? `users/${user.uid}` : '',
    {
      ttl: 30 * 1000, // 30 Sekunden für responsive Username-Check
      useRealtimeListener: true, // Realtime für Profile-Updates
      enableOfflineSupport: true, // Offline-Unterstützung
    }
  );

  useEffect(() => {
    if (!user || !userData) return;

    // Zeige Dialog wenn User existiert aber keinen Username hat
    if (userData && !userData.username) {
      setOpen(true);
    } else {
      setOpen(false);
    }
  }, [user, userData]);

  const handleSetupProfile = () => {
    setOpen(false);
    setProfileDialogOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        disableEscapeKeyDown
        onClose={(_, reason) => {
          if (reason !== 'backdropClick') {
            setOpen(false);
          }
        }}
        maxWidth='sm'
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
              Benutzername erforderlich
            </Typography>
          </Box>
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
          <Box sx={{ p: 3 }}>
            <Box display='flex' flexDirection='column' gap={2}>
              <Alert
                severity='info'
                sx={{
                  background:
                    'linear-gradient(135deg, rgba(25, 118, 210, 0.15) 0%, rgba(25, 118, 210, 0.08) 100%)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(25, 118, 210, 0.3)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  '& .MuiAlert-icon': {
                    color: '#1976d2',
                  },
                }}
              >
                Um das neue Freundesystem zu nutzen, benötigst du einen
                Benutzernamen!
              </Alert>

              <Typography variant='body1'>
                Wir haben das Freundesystem überarbeitet. Anstatt per E-Mail
                können Freunde jetzt über Benutzernamen gefunden und hinzugefügt
                werden.
              </Typography>

              <Typography variant='body2' color='text.secondary'>
                Du kannst auch ein Profilbild hochladen und deinen Anzeigenamen
                ändern.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
            padding: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background:
              'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Button
            onClick={handleSetupProfile}
            variant='contained'
            fullWidth
            sx={{
              maxWidth: 280,
              background: 'linear-gradient(135deg, #00fed7 0%, #00b196 100%)',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#ffffff',
              fontWeight: 600,
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #00b196 0%, #00fed7 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px #00fed7, 0.4)',
              },
            }}
          >
            Jetzt Profil einrichten
          </Button>
        </DialogActions>
      </Dialog>

      <ProfileDialog
        open={profileDialogOpen}
        onClose={() => {
          setProfileDialogOpen(false);
          // Nach dem Schließen des Profil-Dialogs nicht mehr anzeigen
          setOpen(false);
        }}
      />
    </>
  );
};
