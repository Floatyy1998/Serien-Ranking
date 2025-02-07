import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  TextField,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';

interface SharedLink {
  key: string;
  link: string;
  expiresAt: number;
}

interface SharedLinksDialogProps {
  open: boolean;
  onClose: () => void;
  handleGenerateShareLink: () => void;
  shareLink: string | null;
  linkDuration: number;
  setLinkDuration: (duration: number) => void;
}

const SharedLinksDialog = ({
  open,
  onClose,
  handleGenerateShareLink,
  //shareLink,
  linkDuration,
  setLinkDuration,
}: SharedLinksDialogProps) => {
  const auth = useAuth();
  const { user } = auth || {};
  const [sharedLinks, setSharedLinks] = useState<SharedLink[]>([]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [isEndless, setIsEndless] = useState(false);

  useEffect(() => {
    if (user) {
      const ref = firebase
        .database()
        .ref('sharedLists')
        .orderByChild('userId')
        .equalTo(user.uid);
      ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const links = Object.keys(data).map((key) => ({
            key,
            link: `${window.location.origin}/shared-list/${key}`,
            expiresAt: data[key].expiresAt,
          }));
          setSharedLinks(links);
        }
      });
      return () => ref.off();
    }
  }, [user]);

  const handleDeleteLink = async (key: string) => {
    try {
      await firebase.database().ref(`sharedLists/${key}`).remove();
      setSharedLinks((prevLinks) =>
        prevLinks.filter((link) => link.key !== key)
      );
    } catch (error) {
      console.error('Error deleting link:', error);
    }
  };

  const handleCopyToClipboard = (link: string) => {
    navigator.clipboard.writeText(link).then(
      () => {
        setSnackbarMessage('Link in die Zwischenablage kopiert!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      },
      (err) => {
        console.error('Error copying link to clipboard:', err);
        setSnackbarMessage('Fehler beim Kopieren des Links.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    );
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleGenerateLink = () => {
    if (isEndless) {
      setLinkDuration(100 * 365 * 24); // 100 Jahre in Stunden
    }
    handleGenerateShareLink();
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setLinkDuration(0);
    } else {
      setLinkDuration(Number(value));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '8px',
        },
      }}
    >
      <DialogTitle
        sx={{ textAlign: 'center', position: 'relative', fontSize: '1.5rem' }}
      >
        Shared Links Verwalten
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'red',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 3,
          '&.MuiDialogContent-root': {
            padding: '24px',
          },
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
          }}
        >
          <TextField
            label='Gültigkeitsdauer (Stunden)'
            type='number'
            value={isEndless ? '' : linkDuration || ''}
            onChange={handleDurationChange}
            sx={{
              width: {
                xs: '100%',
                md: 200,
              },
              '& .MuiInputLabel-root': {
                backgroundColor: 'rgba(0, 254, 215, 0.02) !important', // Darker input background
                color: '#D1D5DB',
              },
              '& .MuiOutlinedInput-root': {
                color: '#D1D5DB',
                '& fieldset': {
                  borderColor: '#374151',
                },
                '&:hover fieldset': {
                  borderColor: '#4B5563',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#10B981',
                },
              },
              '& .MuiInputBase-input': {
                color: '#D1D5DB',
              },
            }}
            disabled={isEndless}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isEndless}
                onChange={(e) => {
                  setIsEndless(e.target.checked);
                  if (e.target.checked) {
                    setLinkDuration(100 * 365 * 24); // 100 Jahre in Stunden
                  } else {
                    setLinkDuration(24); // Zurücksetzen auf 24 Stunden
                  }
                }}
                sx={{
                  '& .MuiCheckbox-root': {
                    color: '#6B7280',
                  },
                  '& .MuiCheckbox-root.Mui-checked': {
                    color: '#10B981',
                  },
                }}
              />
            }
            label='Endlos gültig'
            sx={{
              color: '#D1D5DB',
            }}
          />
          <Button
            variant='contained'
            onClick={handleGenerateLink}
            sx={{
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              fontWeight: 'medium',
              color: '#000',
            }}
          >
            Link Generieren
          </Button>
        </div>
        <List
          sx={{
            mt: 2,
          }}
        >
          {sharedLinks.map((link) => (
            <ListItem
              className='bg-black/40'
              key={link.key}
              sx={{
                mb: 1,
                borderRadius: 1,
                padding: '12px 16px',
              }}
            >
              <ListItemText
                primary={
                  <span
                    onClick={() => handleCopyToClipboard(link.link)}
                    style={{ cursor: 'pointer', color: '#00fed7' }}
                    className='hover:underline'
                  >
                    {link.link}
                  </span>
                }
                secondary={`Gültig bis: ${new Date(
                  link.expiresAt
                ).toLocaleString()}`}
                sx={{
                  '& .MuiListItemText-primary': {
                    color: '#D1D5DB',
                  },
                  '& .MuiListItemText-secondary': {
                    color: '#9CA3AF',
                  },
                }}
              />
              <Button
                variant='outlined'
                color='error'
                size='small'
                onClick={() => handleDeleteLink(link.key)}
                sx={{
                  color: '#EF4444',
                }}
              >
                LÖSCHEN
              </Button>
            </ListItem>
          ))}
        </List>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={handleSnackbarClose}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </DialogContent>
    </Dialog>
  );
};

export default SharedLinksDialog;
