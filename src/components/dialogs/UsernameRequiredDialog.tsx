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
      >
        <DialogTitle>Benutzername erforderlich</DialogTitle>

        <DialogContent>
          <Box display='flex' flexDirection='column' gap={2}>
            <Alert severity='info'>
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
        </DialogContent>

        <DialogActions>
          <Button onClick={handleSetupProfile} variant='contained' fullWidth>
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
