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
import { useAuth } from '../../../App';
import { useEnhancedFirebaseCache } from '../../../hooks/useEnhancedFirebaseCache';
import { colors } from '../../../theme';
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
              background: colors.background.gradient.dark,
              borderRadius: '20px',
              border: `1px solid ${colors.border.light}`,
              overflow: 'hidden',
              boxShadow: colors.shadow.card,
              color: colors.text.primary,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            position: 'relative',
            background: colors.overlay.dark,
            backdropFilter: 'blur(15px)',
            borderBottom: `1px solid ${colors.border.subtle}`,
            color: colors.text.primary,
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
              sx={{ fontWeight: 'bold', color: colors.text.secondary }}
            >
              Benutzername erforderlich
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            background: colors.background.gradient.light,
            backdropFilter: 'blur(10px)',
            color: colors.text.primary,
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box display='flex' flexDirection='column' gap={2}>
              <Alert
                severity='info'
                sx={{
                  background: colors.status.info.gradient,
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${colors.status.info.main}30`,
                  borderRadius: '12px',
                  color: colors.text.primary,
                  '& .MuiAlert-icon': {
                    color: colors.status.info.main,
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
            borderTop: `1px solid ${colors.border.light}`,
            background: colors.background.gradient.dark,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Button
            onClick={handleSetupProfile}
            variant='contained'
            fullWidth
            sx={{
              maxWidth: 280,
              background: colors.button.primary,
              borderRadius: '12px',
              padding: '12px 24px',
              color: colors.text.secondary,
              fontWeight: 600,
              textTransform: 'none',
              border: `1px solid ${colors.border.light}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: colors.button.primaryHover,
                transform: 'translateY(-2px)',
                boxShadow: colors.shadow.buttonHover,
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
