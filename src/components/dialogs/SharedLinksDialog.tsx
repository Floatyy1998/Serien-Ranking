import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Box,
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';

// Neuer TabPanel-Wrapper
const TabPanel = (props: {
  children: React.ReactNode;
  value: number;
  index: number;
}) => {
  const { children, value, index, ...other } = props;
  return (
    <div role='tabpanel' hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

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

interface ExternalSavedLink {
  key: string;
  name: string;
  link: string;
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
  const [externalSharedLists, setExternalSharedLists] = useState<
    ExternalSavedLink[]
  >([]);
  const [externalName, setExternalName] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

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

  useEffect(() => {
    if (user) {
      const ref = firebase.database().ref(`${user.uid}/savedLists`);
      ref.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const lists = Object.keys(data).map((key) => ({
            key,
            name: data[key].name,
            link: data[key].link,
          }));
          // Sortiere die Listen alphabetisch nach dem Namen
          const sortedLists = lists.sort((a, b) =>
            a.name.localeCompare(b.name)
          );
          setExternalSharedLists(sortedLists);
        } else {
          setExternalSharedLists([]);
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

  const handleSaveExternalLink = () => {
    if (user && externalName && externalLink) {
      const ref = firebase.database().ref(`${user.uid}/savedLists`).push();
      ref
        .set({
          name: externalName,
          link: externalLink,
        })
        .then(() => {
          setExternalName('');
          setExternalLink('');
        });
    }
  };

  const handleDeleteExternalLink = async (key: string) => {
    if (user) {
      try {
        await firebase.database().ref(`${user.uid}/savedLists/${key}`).remove();
      } catch (error) {
        console.error('Error deleting external link:', error);
      }
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
          height: '600px', // Feste Höhe für den Dialog
        },
      }}
    >
      <DialogTitle>
        Shared Links Verwalten
        <IconButton
          aria-label='close'
          onClick={onClose}
          className='closeButton'
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
        {/* Tab-Navigation */}
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          variant='fullWidth' // geändert von "scrollable" zu "fullWidth"
        >
          <Tab label='Meine Links' />
          <Tab label='Externe Links' />
        </Tabs>

        {/* Tab 0: Generieren und Anzeigen der eigenen Shared Links */}
        <TabPanel value={tabIndex} index={0}>
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
            {/* Button zum Link generieren */}
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
              <AddIcon /> {/* Icon statt Text */}
            </Button>
          </div>
          {/* Bestehende Links in scrollbarem Container */}
          <div
            style={{
              maxHeight: '300px',
              overflowY: 'auto',
              marginBottom: '16px',
            }}
          >
            <List sx={{ mt: 2 }}>
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
                    <DeleteIcon /> {/* Icon statt "LÖSCHEN" */}
                  </Button>
                </ListItem>
              ))}
            </List>
          </div>
        </TabPanel>

        {/* Tab 1: Hinzufügen und Anzeigen externer Shared Lists */}
        <TabPanel value={tabIndex} index={1}>
          <Typography variant='h6' sx={{ mb: 2 }}>
            Gespeicherte Listen
          </Typography>
          {/* Ersetzen Sie den Container durch einen Box-Container */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' }, // Auf kleinen Geräten untereinander
              gap: '8px',
              mb: '16px',
            }}
          >
            <TextField
              label='Name'
              value={externalName}
              onChange={(e) => setExternalName(e.target.value)}
              size='small'
              sx={{ flex: { xs: '1 0 auto', md: '1 1 200px' } }}
            />
            <TextField
              label='Link'
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              size='small'
              sx={{ flex: { xs: '1 0 auto', md: '1 1 200px' } }}
            />
            <Button
              variant='contained'
              onClick={handleSaveExternalLink}
              sx={{
                alignSelf: { xs: 'center', md: 'auto' },
                width: 'auto', // Button hat nun gleiche Breite wie bei nebeneinander Anordnung
              }}
            >
              <AddIcon />
            </Button>
          </Box>
          {/* Externe Links in scrollbarem Container */}
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <List>
              {externalSharedLists.map((item) => (
                <ListItem
                  // Änderung: Nutzung eines anklickbaren Listenelements via <a>
                  component='a'
                  href={item.link}
                  target='_blank'
                  key={item.key}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    padding: '12px 16px',
                    backgroundColor: 'rgba(0,0,0,0.4)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <ListItemText
                    primary={item.name}
                    secondary={item.link}
                    sx={{
                      '& .MuiListItemText-primary': { color: '#D1D5DB' },
                      '& .MuiListItemText-secondary': {
                        color: '#00fed7',
                        textDecoration: 'underline',
                      },
                    }}
                  />
                  <Button
                    variant='outlined'
                    color='error'
                    size='small'
                    onClick={(e) => {
                      e.preventDefault();
                      handleDeleteExternalLink(item.key);
                    }}
                  >
                    <DeleteIcon />
                  </Button>
                </ListItem>
              ))}
            </List>
          </div>
        </TabPanel>

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
