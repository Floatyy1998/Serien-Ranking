import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Tab,
  Tabs,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import ExternalSharedLinks from './links/ExternalSharedLinks';
import MySharedLinks from './links/MySharedLinks';
import { TabPanel } from './shared/SharedDialogComponents';
interface SharedLink {
  key: string;
  link: string;
  expiresAt: number;
}
interface SharedLinksDialogProps {
  open: boolean;
  onClose: () => void;
  handleGenerateShareLink: () => void;
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
      setSharedLinks((prev) => prev.filter((link) => link.key !== key));
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
      setLinkDuration(100 * 365 * 24);
    }
    handleGenerateShareLink();
  };
  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLinkDuration(value === '' ? 0 : Number(value));
  };
  const handleSaveExternalLink = () => {
    if (user && externalName && externalLink) {
      const ref = firebase.database().ref(`${user.uid}/savedLists`).push();
      ref.set({ name: externalName, link: externalLink }).then(() => {
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
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: { borderRadius: '8px', height: '600px' },
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
        sx={{ p: 3, '&.MuiDialogContent-root': { padding: '24px' } }}
      >
        <Tabs value={tabIndex} onChange={handleTabChange} variant='fullWidth'>
          <Tab label='Meine Links' />
          <Tab label='Externe Links' />
        </Tabs>
        <TabPanel value={tabIndex} index={0}>
          <MySharedLinks
            linkDuration={linkDuration}
            isEndless={isEndless}
            setIsEndless={setIsEndless}
            setLinkDuration={setLinkDuration}
            handleGenerateLink={handleGenerateLink}
            handleDurationChange={handleDurationChange}
            sharedLinks={sharedLinks}
            handleCopyToClipboard={handleCopyToClipboard}
            handleDeleteLink={handleDeleteLink}
          />
        </TabPanel>
        <TabPanel value={tabIndex} index={1}>
          <ExternalSharedLinks
            externalSharedLists={externalSharedLists}
            externalName={externalName}
            externalLink={externalLink}
            setExternalName={setExternalName}
            setExternalLink={setExternalLink}
            handleSaveExternalLink={handleSaveExternalLink}
            handleDeleteExternalLink={handleDeleteExternalLink}
          />
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
