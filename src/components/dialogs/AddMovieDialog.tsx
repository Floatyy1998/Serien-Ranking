import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
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
import { DialogHeader } from './shared/SharedDialogComponents';

export interface Filme {
  adult: boolean;
  backdrop_path: string;
  genre_ids: number[];
  id: number;
  original_language: string;
  original_title: string;
  overview: string;
  popularity: number;
  poster_path: string;
  release_date: string;
  title: string;
  vote_average: number;
  vote_count: number;
}

interface AddMovieDialogProps {
  open: boolean;
  onClose: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const AddMovieDialog: React.FC<AddMovieDialogProps> = ({
  open,
  onClose,
  inputRef,
}) => {
  const auth = useAuth();
  const { user } = auth || {};
  const [searchValue, setSearchValue] = useState('');
  const [options, setOptions] = useState<Filme[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<Filme | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [keepOpen, setKeepOpen] = useState(false);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open, inputRef]);

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleSearchChange = useCallback(
    async (_event: React.ChangeEvent<unknown>, value: string) => {
      setSearchValue(value);
      if (selectedMovie && value !== selectedMovie.title) {
        setSelectedMovie(null);
      }
      if (value.length >= 3) {
        const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${value}&language=de-DE`
        );
        const data = await response.json();
        setOptions(data.results || []);
      } else {
        setOptions([]);
      }
    },
    [selectedMovie]
  );

  const handleAddMovie = useCallback(async () => {
    if (!user || !selectedMovie) {
      setSnackbarMessage(
        'Bitte loggen Sie sich ein, um einen Film hinzuzufügen.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      onClose();
      return;
    }
    setSnackbarMessage('Film wird hinzugefügt');
    setSnackbarSeverity('warning');
    setSnackbarOpen(true);
    const movieData = {
      id: selectedMovie.id.toString(),
      data: {
        user: import.meta.env.VITE_USER,
        id: selectedMovie.id,
        uuid: user.uid,
      },
    };
    try {
      const res = await fetch(`https://serienapi.konrad-dinges.de/addMovie`, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        body: JSON.stringify(movieData.data),
      });
      if (res.ok) {
        setSnackbarMessage('Film hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);

        if (!keepOpen) {
          onClose();
        }
      } else {
        const msgJson = await res.json();
        if (msgJson.error !== 'Film bereits vorhanden') {
          throw new Error('Fehler beim Hinzufügen des Films.');
        }
        setSnackbarMessage('Film bereits vorhanden');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error sending data to server:', error);
      setSnackbarMessage('Fehler beim Hinzufügen des Films.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setSearchValue('');
      setSelectedMovie(null);

      setOptions([]);
    }
  }, [user, selectedMovie, onClose, keepOpen]);

  const handleDialogClose = () => {
    setSearchValue('');
    setOptions([]);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleDialogClose} fullWidth>
        <DialogHeader title='Film hinzufügen' onClose={handleDialogClose} />
        <DialogContent dividers>
          <Autocomplete
            open={searchValue.length >= 3 && !selectedMovie}
            popupIcon={<SearchIcon />}
            sx={{
              '& .MuiAutocomplete-popupIndicatorOpen': { transform: 'none' },
            }}
            noOptionsText='keine Treffer'
            onChange={(_event, newValue) => setSelectedMovie(newValue)}
            onInputChange={handleSearchChange}
            options={options}
            getOptionLabel={(option) => option.title}
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
                  alt={option.title}
                  style={{ marginRight: 10, width: 92 }}
                />
                <div style={{ flexGrow: 1 }}>
                  <div>{option.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'gray' }}>
                    {option.original_title}
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                  {new Date(option.release_date).getFullYear()}
                </div>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label='Film suchen'
                variant='outlined'
                type='search'
                inputRef={inputRef}
                id='movie-search-input'
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
            onClick={handleAddMovie}
            sx={{
              display: { xs: 'flex', md: 'none' },
            }}
          >
            <AddIcon />
          </Button>
          <Button
            onClick={handleAddMovie}
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

export default AddMovieDialog;
