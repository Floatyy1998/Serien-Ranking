import CloseIcon from '@mui/icons-material/Close';
import {
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
import { useAuth } from '../App';

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
        setSnackbarOpen(true);
      },
      (err) => {
        console.error('Error copying link to clipboard:', err);
        setSnackbarMessage('Fehler beim Kopieren des Links.');
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth='md' fullWidth>
      <DialogTitle className='flex justify-between items-center border-b'>
        <span>Share-Links verwalten</span>
        <IconButton onClick={onClose} size='small'>
          <CloseIcon className='h-5 w-5' />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <div className='py-4'>
          <div className='flex flex-col gap-4 mb-6 sm:flex-row'>
            <TextField
              label='Gültigkeitsdauer (Stunden)'
              type='number'
              value={isEndless ? '' : linkDuration}
              onChange={(e) => setLinkDuration(Number(e.target.value))}
              size='small'
              className='w-full sm:w-48'
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
                    }
                  }}
                />
              }
              label='Endlos gültig'
            />
            <Button
              variant='contained'
              style={{
                backgroundColor: '#00C8B3',
                color: 'white',
              }}
              onClick={handleGenerateLink}
            >
              LINK GENERIEREN
            </Button>
          </div>
          <List className='rounded-lg'>
            {sharedLinks.map((link) => (
              <ListItem
                key={link.key}
                className='border-b last:border-b-0 flex flex-col sm:flex-row'
              >
                <ListItemText
                  primary={
                    <span
                      onClick={() => handleCopyToClipboard(link.link)}
                      style={{ cursor: 'pointer', color: '#00C8B3' }}
                    >
                      {link.link}
                    </span>
                  }
                  secondary={`Gültig bis: ${new Date(
                    link.expiresAt
                  ).toLocaleString()}`}
                  slotProps={{
                    primary: {
                      className: 'break-all',
                    },
                  }}
                />
                <Button
                  variant='outlined'
                  color='error'
                  size='small'
                  onClick={() => handleDeleteLink(link.key)}
                  className='mt-2 sm:mt-0'
                >
                  LÖSCHEN
                </Button>
              </ListItem>
            ))}
          </List>
          <div className='flex justify-end mt-6'></div>
        </div>
        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
        />
      </DialogContent>
    </Dialog>
  );
};

export default SharedLinksDialog;
