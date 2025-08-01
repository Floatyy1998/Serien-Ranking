import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Typography,
} from '@mui/material';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import {
  GenreChangeDetector,
  GenreChangeNotification,
} from '../../utils/genreChangeDetection';

interface GenreChangeDialogProps {
  open: boolean;
  notifications: GenreChangeNotification[];
  onClose: () => void;
  onAcceptChange: (
    notification: GenreChangeNotification,
    openRatingDialog: () => void
  ) => void;
  onDeclineChange: (notification: GenreChangeNotification) => void;
  userId: string;
}

const GenreChangeDialog = ({
  open,
  notifications,
  onClose,
  onAcceptChange,
  onDeclineChange,
  userId,
}: GenreChangeDialogProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'info'
  >('info');

  const currentNotification = notifications[currentIndex];
  const hasMoreNotifications = currentIndex < notifications.length - 1;

  const handleAccept = async () => {
    if (!currentNotification) return;

    try {
      const detector = new GenreChangeDetector(userId);

      // Aktualisiere Genres in Firebase
      if (currentNotification.type === 'series') {
        await detector.updateSeriesGenres(
          currentNotification.tmdbId,
          currentNotification.newGenres
        );
      } else {
        await detector.updateMovieGenres(
          currentNotification.tmdbId,
          currentNotification.newGenres
        );
      }

      // Markiere Benachrichtigung als verarbeitet
      await detector.markNotificationAsProcessed(currentNotification.id);

      setSnackbarMessage(
        `Genres für "${currentNotification.title}" wurden aktualisiert!`
      );
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // Callback für Rating-Dialog
      const openRatingDialog = () => {
        // Wird vom Parent-Component gehandhabt
      };

      // Führe Parent-Callback aus
      onAcceptChange(currentNotification, openRatingDialog);

      // Gehe zur nächsten Benachrichtigung oder schließe Dialog
      if (hasMoreNotifications) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('❌ Fehler beim Akzeptieren der Genre-Änderung:', error);
      setSnackbarMessage('Fehler beim Aktualisieren der Genres');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDecline = async () => {
    if (!currentNotification) return;

    try {
      const detector = new GenreChangeDetector(userId);
      await detector.markNotificationAsProcessed(currentNotification.id);

      setSnackbarMessage(
        `Genre-Änderung für "${currentNotification.title}" wurde ignoriert`
      );
      setSnackbarSeverity('info');
      setSnackbarOpen(true);

      onDeclineChange(currentNotification);

      // Gehe zur nächsten Benachrichtigung oder schließe Dialog
      if (hasMoreNotifications) {
        setCurrentIndex(currentIndex + 1);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('❌ Fehler beim Ablehnen der Genre-Änderung:', error);
      setSnackbarMessage('Fehler beim Verarbeiten der Benachrichtigung');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleClose = () => {
    setCurrentIndex(0);
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (!currentNotification) {
    return null;
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth='md'
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
            color: 'white',
          },
        }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            backgroundColor: '#1e1e1e',
            color: 'white',
            position: 'relative',
            borderBottom: '2px solid #00fed7',
            background: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
          }}
        >
          <Box>
            <Typography
              variant='h5'
              component='div'
              sx={{ fontWeight: 'bold' }}
            >
              🔄 Genre-Änderung erkannt
            </Typography>
            {notifications.length > 1 && (
              <Chip
                label={`${currentIndex + 1} von ${notifications.length}`}
                size='small'
                sx={{
                  mt: 1,
                  backgroundColor: '#00fed7',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              />
            )}
          </Box>
          <IconButton
            aria-label='close'
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'red' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3, backgroundColor: '#1e1e1e' }}>
          <Box>
            <Typography variant='h6' gutterBottom sx={{ color: '#00fed7' }}>
              {currentNotification.title}
            </Typography>
            <Typography variant='body1' sx={{ mb: 3 }}>
              Die Genres für{' '}
              {currentNotification.type === 'series'
                ? 'diese Serie'
                : 'diesen Film'}{' '}
              haben sich geändert. Da Sie bereits eine Bewertung abgegeben
              haben, möchten Sie Ihre Bewertung möglicherweise anpassen.
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Typography variant='body2' sx={{ color: '#9e9e9e', mb: 1 }}>
                Bisherige Genres:
              </Typography>
              <Box display='flex' gap={1} flexWrap='wrap' mb={2}>
                {currentNotification.oldGenres.map((genre, index) => (
                  <Chip
                    key={index}
                    label={genre}
                    size='small'
                    sx={{
                      backgroundColor: '#ff6b6b',
                      color: 'white',
                    }}
                  />
                ))}
              </Box>

              <Box
                display='flex'
                alignItems='center'
                justifyContent='center'
                mb={2}
              >
                <ArrowRight size={24} color='#00fed7' />
              </Box>

              <Typography variant='body2' sx={{ color: '#9e9e9e', mb: 1 }}>
                Neue Genres:
              </Typography>
              <Box display='flex' gap={1} flexWrap='wrap'>
                {currentNotification.newGenres.map((genre, index) => (
                  <Chip
                    key={index}
                    label={genre}
                    size='small'
                    sx={{
                      backgroundColor: '#4ecdc4',
                      color: 'white',
                    }}
                  />
                ))}
              </Box>
            </Box>

            <Box
              sx={{
                bgcolor: '#333333',
                p: 2,
                borderRadius: 2,
                border: '1px solid #00fed7',
              }}
            >
              <Typography variant='body2' sx={{ fontStyle: 'italic' }}>
                💡 Wenn Sie diese Änderung akzeptieren, werden die Genres
                aktualisiert und Sie können anschließend Ihre Bewertung
                anpassen.
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, backgroundColor: '#1e1e1e' }}>
          <Button
            variant='outlined'
            onClick={handleDecline}
            sx={{
              color: '#ff6b6b',
              borderColor: '#ff6b6b',
              '&:hover': {
                backgroundColor: 'rgba(255, 107, 107, 0.1)',
              },
            }}
          >
            Ignorieren
          </Button>
          <Button
            variant='contained'
            onClick={handleAccept}
            sx={{
              backgroundColor: '#00fed7',
              color: '#000',
              fontWeight: 'bold',
              '&:hover': {
                backgroundColor: '#00d4b8',
              },
            }}
          >
            Akzeptieren & Bewertung anpassen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default GenreChangeDialog;
