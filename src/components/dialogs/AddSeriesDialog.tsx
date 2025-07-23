import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search'; // Neuer Import
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  Snackbar,
  TextField,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { useFriends } from '../../contexts/FriendsProvider';
import { DialogHeader } from './shared/SharedDialogComponents'; // Neuer Import

export interface Serien {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  origin_country: string[];
  original_language: string;
  original_name: string;
  overview: string;
  popularity: number;
  poster_path: string;
  first_air_date: string;
  name: string;
  vote_average: number;
  vote_count: number;
}

interface AddSeriesDialogProps {
  open: boolean;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const AddSeriesDialog: React.FC<AddSeriesDialogProps> = ({
  open,
  onClose,
  inputRef,
}) => {
  const auth = useAuth();
  const { user } = auth || {};
  const { updateUserActivity } = useFriends();
  const [searchValue, setSearchValue] = useState(''); // Änderung: searchValue auslesen
  const [options, setOptions] = useState<Serien[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<Serien | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [keepOpen, setKeepOpen] = useState(false);
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  const handleSearchChange = useCallback(
    async (_event: React.ChangeEvent<unknown>, value: string) => {
      setSearchValue(value); // Speicherung des eingegebenen Werts
      if (selectedSeries && value !== selectedSeries.name) {
        setSelectedSeries(null);
      }
      if (value.length >= 3) {
        const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
        const response = await fetch(
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${value}&language=de-DE`
        );
        const data = await response.json();
        setOptions(data.results || []);
      } else {
        setOptions([]); // Optionen leeren, wenn weniger als 3 Zeichen
      }
    },
    [selectedSeries]
  );

  const handleAddSeries = useCallback(async () => {
    if (!user) {
      setSnackbarMessage(
        'Bitte loggen Sie sich ein, um eine Serie hinzuzufügen.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      onClose();
      return;
    }
    if (!selectedSeries) {
      setSnackbarMessage('Bitte wählen Sie eine Serie aus.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setSnackbarMessage('Serie wird hinzugefügt');
    setSnackbarSeverity('warning');
    setSnackbarOpen(true);
    const seriesData = {
      id: selectedSeries.id.toString(),
      data: {
        user: import.meta.env.VITE_USER,
        id: selectedSeries.id,
        uuid: user.uid,
      },
    };
    try {
      const res = await fetch(`https://serienapi.konrad-dinges.de/add`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(seriesData.data),
      });
      if (res.ok) {
        // Activity tracken für Freunde
        await updateUserActivity({
          type: 'series_added',
          itemTitle: selectedSeries.name || 'Unbekannte Serie',
          itemId: selectedSeries.id,
        });

        setSnackbarMessage('Serie hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSearchValue('');
        setOptions([]);
        setSelectedSeries(null);
        const inputElement = document.getElementById(
          'series-search-input'
        ) as HTMLInputElement;
        if (inputElement) {
          inputElement.value = '';
          inputElement.focus();
        }
        if (!keepOpen) {
          onClose();
        }
      } else {
        const msgJson = await res.json();
        if (msgJson.error !== 'Serie bereits vorhanden') {
          throw new Error('Fehler beim Hinzufügen der Serie.');
        }
        setSnackbarMessage('Serie bereits vorhanden');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sending data to server:', error);
      setSnackbarMessage('Fehler beim Hinzufügen der Serie.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [user, selectedSeries, onClose, keepOpen]);

  // Neue Funktion zum Schließen des Dialogs
  const handleDialogClose = () => {
    setSearchValue('');
    setOptions([]);
    onClose();
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, inputRef]);

  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        disableAutoFocus={true}
        disableEnforceFocus={false}
        disableRestoreFocus={false}
        keepMounted={false}
      >
        <DialogHeader title='Serie hinzufügen' onClose={handleDialogClose} />
        <DialogContent dividers>
          <Autocomplete
            open={searchValue.length >= 3 && !selectedSeries} // Options öffnen nur bei >= 3 Zeichen und keine Serie ausgewählt
            popupIcon={<SearchIcon />} // Neue Eigenschaft
            sx={{
              '& .MuiAutocomplete-popupIndicatorOpen': { transform: 'none' }, // Kein Drehen der Lupe
            }}
            noOptionsText='keine Treffer' // Neue Eigenschaft
            onChange={(_event, newValue) => setSelectedSeries(newValue)}
            onInputChange={handleSearchChange}
            options={options}
            getOptionLabel={(option) => option.name}
            className='w-full'
            itemProp='name'
            renderOption={(props, option) => (
              <li
                {...props}
                key={option.id}
                style={{ display: 'flex', alignItems: 'center' }}
              >
                <img
                  src={
                    option.poster_path
                      ? `https://image.tmdb.org/t/p/w92${option.poster_path}`
                      : notFound
                  }
                  alt={option.name}
                  style={{ marginRight: 10, width: 92 }}
                />
                <div style={{ flexGrow: 1 }}>
                  <div>{option.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                    {option.original_name}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                  {new Date(option.first_air_date).getFullYear()}
                </div>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Serie suchen'
                variant='outlined'
                type='search'
                inputRef={inputRef}
                id='series-search-input'
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Box sx={{ flexGrow: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={keepOpen}
                  onChange={(e) => setKeepOpen(e.target.checked)}
                />
              }
              label='Dialog nicht schließen?'
            />
          </Box>
          <Button onClick={handleDialogClose}>Abbrechen</Button>
          <Button
            onClick={handleAddSeries}
            sx={{
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <AddIcon />
          </Button>
          <Button
            onClick={handleAddSeries}
            sx={{
              display: { xs: 'none', md: 'flex' },
            }}
          >
            Hinzufügen
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={snackbarSeverity === 'warning' ? null : 6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddSeriesDialog;
