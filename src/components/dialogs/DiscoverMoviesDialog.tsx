import {
  Clear as ClearIcon,
  Close as CloseIcon,
  FilterAlt as FilterIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/de';
import { useCallback, useState } from 'react';
import { useAuth } from '../../App';
import { genreIdMap } from '../../constants/menuItems';
import { Movie } from '../../interfaces/Movie';
import DiscoverMovieCard from '../movies/DiscoverMovieCard';

interface DiscoverMoviesDialogProps {
  open: boolean;
  onClose: () => void;
}

const DiscoverMoviesDialog = ({ open, onClose }: DiscoverMoviesDialogProps) => {
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [filters, setFilters] = useState({
    genre: [] as string[],
    startDate: '',
    endDate: '',
    country: [] as string[],
    sortBy: 'popularity.desc',
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState<Dayjs | null>(null);
  const [endDate, setEndDate] = useState<Dayjs | null>(null);
  const auth = useAuth();
  const { user } = auth || {};
  const today = dayjs();

  // Länder-Mapping für bessere Darstellung
  const countryMap: Record<string, string> = {
    US: 'USA',
    DE: 'Deutschland',
    FR: 'Frankreich',
    GB: 'Großbritannien',
    JP: 'Japan',
    KR: 'Südkorea',
    IN: 'Indien',
    CN: 'China',
    IT: 'Italien',
    ES: 'Spanien',
    CA: 'Kanada',
    AU: 'Australien',
    BR: 'Brasilien',
    RU: 'Russland',
    MX: 'Mexiko',
    SE: 'Schweden',
    NO: 'Norwegen',
    FI: 'Finnland',
    DK: 'Dänemark',
    NL: 'Niederlande',
    BE: 'Belgien',
    CH: 'Schweiz',
    AT: 'Österreich',
    IE: 'Irland',
    NZ: 'Neuseeland',
    ZA: 'Südafrika',
    AR: 'Argentinien',
    CL: 'Chile',
    CO: 'Kolumbien',
    PE: 'Peru',
    VE: 'Venezuela',
  };

  const handleClearFilters = () => {
    setFilters({
      genre: [],
      startDate: '',
      endDate: '',
      country: [],
      sortBy: 'popularity.desc',
    });
    setStartDate(null);
    setEndDate(null);
    setSearchResults([]);
    setCurrentPage(1);
    setTotalPages(1);
  };

  const handleSelectChange = (e: SelectChangeEvent<string[]>) => {
    setFilters({ ...filters, genre: e.target.value as string[] });
  };

  const handleCountryChange = (e: SelectChangeEvent<string[]>) => {
    setFilters({ ...filters, country: e.target.value as string[] });
  };

  const handleSortChange = (e: SelectChangeEvent<string>) => {
    setFilters({ ...filters, sortBy: e.target.value });
  };

  const handleStartDateChange = (date: Dayjs | null) => {
    setStartDate(date);
    setFilters({
      ...filters,
      startDate: date ? date.startOf('day').format('YYYY-MM-DD') : '',
    });
  };

  const handleEndDateChange = (date: Dayjs | null) => {
    setEndDate(date);
    setFilters({
      ...filters,
      endDate: date ? date.startOf('day').format('YYYY-MM-DD') : '',
    });
  };

  const handleSearch = async (page = 1) => {
    const genreIds = filters.genre
      .map((name) => genreIdMap.find((item) => item.name === name)?.id)
      .filter((id) => id !== undefined)
      .join('|');

    const countryCodes = filters.country.join('|');

    const startDate = filters.startDate || today.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.VITE_API_TMDB}&with_genres=${genreIds}&primary_release_date.gte=${startDate}&primary_release_date.lte=${filters.endDate}&with_origin_country=${countryCodes}&sort_by=${filters.sortBy}&page=${page}`
    );
    const data = await response.json();
    setTotalPages(data.total_pages);
    const mappedResults = data.results.map((result: any) => ({
      nmr: result.id,
      begründung: '',
      beschreibung: result.overview,
      genre: {
        genres: result.genre_ids.map(
          (id: number) =>
            genreIdMap.find((genre) => genre.id === id)?.name || ''
        ),
      },
      id: result.id,
      imdb: {
        imdb_id: '',
      },
      poster: {
        poster: result.poster_path
          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
          : '',
      },
      provider: null,
      rating: {},
      runtime: 0,
      title: result.title,
      wo: {
        wo: '',
      },
      watchlist: false,
      status: result.release_date ? 'Released' : 'Unreleased',
      release_date: result.release_date,
      collection_id: null,
    }));
    setSearchResults(mappedResults);
    setCurrentPage(page);
    document.querySelector('.MuiDialogContent-root')?.scrollTo(0, 0); // Scroll to top
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      handleSearch(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      handleSearch(currentPage + 1);
    }
  };

  const handleAddMovie = useCallback(
    async (movie: Movie) => {
      if (!user) {
        setSnackbarMessage(
          'Bitte loggen Sie sich ein, um einen Film hinzuzufügen.'
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      setSnackbarMessage('Film wird hinzugefügt');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      const movieData = {
        id: movie.id.toString(),
        data: {
          user: import.meta.env.VITE_USER,
          id: movie.id,
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
        setSnackbarMessage('Fehler beim Hinzufügen des Films.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    },
    [user]
  );

  const handleClose = () => {
    setFilters({
      genre: [],
      startDate: '',
      endDate: '',
      country: [],
      sortBy: 'popularity.desc',
    });
    setSearchResults([]);
    setCurrentPage(1);
    setTotalPages(1);
    onClose();
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth='xl'
      disableAutoFocus={true}
      disableEnforceFocus={false}
      disableRestoreFocus={false}
      keepMounted={false}
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
            Neue Filme entdecken
          </Typography>
        </Box>

        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '&:hover': {
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              transform: 'translateY(-50%) scale(1.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 3,
          background:
            'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
        }}
      >
        {/* Filter Sektion */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Typography
            variant='h6'
            sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <FilterIcon /> Filter
          </Typography>

          <Stack spacing={3}>
            {/* Erste Zeile: Genre und Datumsbereich */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(45,45,48,0.8)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        background: 'rgba(55,55,58,0.9)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(65,65,68,0.95)',
                        border: '1px solid #00fed7',
                        boxShadow: '0 0 20px rgba(0, 254, 215, 0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                      '&.Mui-focused': {
                        color: '#00fed7',
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  <InputLabel>Genre auswählen</InputLabel>
                  <Select
                    name='genre'
                    multiple
                    value={filters.genre}
                    onChange={handleSelectChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size='small' />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 300,
                        },
                      },
                    }}
                  >
                    {genreIdMap.map((item) => (
                      <MenuItem key={item.id} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1 }}>
                <LocalizationProvider
                  dateAdapter={AdapterDayjs}
                  adapterLocale='de'
                >
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <DatePicker
                      label='Von Datum'
                      value={startDate}
                      onChange={handleStartDateChange}
                      minDate={today}
                      sx={{ flex: 1 }}
                      slotProps={{
                        textField: {
                          size: 'medium',
                        },
                      }}
                    />
                    <DatePicker
                      label='Bis Datum'
                      value={endDate}
                      onChange={handleEndDateChange}
                      minDate={startDate || today}
                      sx={{ flex: 1 }}
                      slotProps={{
                        textField: {
                          size: 'medium',
                        },
                      }}
                    />
                  </Stack>
                </LocalizationProvider>
              </Box>
            </Box>

            {/* Zweite Zeile: Land und Sortierung */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(45,45,48,0.8)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        background: 'rgba(55,55,58,0.9)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(65,65,68,0.95)',
                        border: '1px solid #00fed7',
                        boxShadow: '0 0 20px rgba(0, 254, 215, 0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                      '&.Mui-focused': {
                        color: '#00fed7',
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  <InputLabel>Länder auswählen</InputLabel>
                  <Select
                    name='country'
                    multiple
                    value={filters.country}
                    onChange={handleCountryChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip
                            key={value}
                            label={countryMap[value] || value}
                            size='small'
                          />
                        ))}
                      </Box>
                    )}
                    MenuProps={{
                      PaperProps: {
                        style: {
                          maxHeight: 300,
                          width: 300,
                        },
                      },
                    }}
                  >
                    {Object.entries(countryMap).map(([code, name]) => (
                      <MenuItem key={code} value={code}>
                        {name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ flex: 1 }}>
                <FormControl
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      background: 'rgba(45,45,48,0.8)',
                      backdropFilter: 'blur(10px)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.2)',
                      color: '#ffffff',
                      '& fieldset': {
                        border: 'none',
                      },
                      '&:hover': {
                        background: 'rgba(55,55,58,0.9)',
                        border: '1px solid rgba(255,255,255,0.3)',
                      },
                      '&.Mui-focused': {
                        background: 'rgba(65,65,68,0.95)',
                        border: '1px solid #00fed7',
                        boxShadow: '0 0 20px rgba(0, 254, 215, 0.3)',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255,255,255,0.7)',
                      '&.Mui-focused': {
                        color: '#00fed7',
                      },
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255,255,255,0.7)',
                    },
                  }}
                >
                  <InputLabel>Sortieren nach</InputLabel>
                  <Select
                    name='sortBy'
                    value={filters.sortBy}
                    onChange={handleSortChange}
                  >
                    <MenuItem value='popularity.desc'>Beliebtheit ↓</MenuItem>
                    <MenuItem value='popularity.asc'>Beliebtheit ↑</MenuItem>
                    <MenuItem value='primary_release_date.desc'>
                      Neueste zuerst
                    </MenuItem>
                    <MenuItem value='primary_release_date.asc'>
                      Älteste zuerst
                    </MenuItem>
                    <MenuItem value='vote_average.desc'>
                      Beste Bewertung
                    </MenuItem>
                    <MenuItem value='vote_count.desc'>Meist bewertet</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Action Buttons */}
            <Stack
              direction='row'
              spacing={2}
              justifyContent='center'
              sx={{ pt: 1 }}
            >
              <Button
                variant='contained'
                startIcon={<SearchIcon />}
                onClick={() => handleSearch()}
                size='large'
                sx={{
                  px: 4,
                  background:
                    'linear-gradient(135deg, #00fed7 0%, #00d4aa 100%)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: 600,
                  textTransform: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 254, 215, 0.4)',
                  },
                }}
              >
                Filme suchen
              </Button>
              <Button
                variant='outlined'
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size='large'
                sx={{
                  background:
                    'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontWeight: 500,
                  textTransform: 'none',
                  border: '1px solid rgba(255,255,255,0.1)',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    transform: 'translateX(2px)',
                  },
                }}
              >
                Filter zurücksetzen
              </Button>
            </Stack>
          </Stack>
        </Paper>
        {/* Suchergebnisse */}
        {searchResults.length > 0 && (
          <Paper
            elevation={1}
            sx={{
              p: 3,
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Typography variant='h6' sx={{ mb: 2 }}>
              Suchergebnisse ({searchResults.length} Filme)
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center',
                minHeight: '200px',
              }}
            >
              {searchResults.map((movie) => (
                <Box
                  key={movie.id}
                  sx={{
                    width: '230px',
                    height: '444px',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <DiscoverMovieCard
                    movie={movie}
                    onAdd={handleAddMovie}
                    providers={[]}
                  />
                </Box>
              ))}
            </Box>
          </Paper>
        )}

        {/* Keine Ergebnisse */}
        {searchResults.length === 0 && currentPage > 0 && (
          <Paper
            elevation={1}
            sx={{
              p: 4,
              textAlign: 'center',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
            }}
          >
            <Typography variant='h6' color='text.secondary'>
              Keine Filme gefunden
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Versuchen Sie andere Filter oder erweitern Sie den Datumsbereich
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions
        sx={{
          p: 3,
          justifyContent: 'space-between',
          background:
            'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Button variant='outlined' onClick={handleClose} sx={{ px: 3 }}>
          Schließen
        </Button>

        {searchResults.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flex: 1,
              justifyContent: 'center',
            }}
          >
            <Button
              variant='contained'
              size='medium'
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              sx={{ minWidth: '50px' }}
            >
              ‹ Zurück
            </Button>
            <Paper
              elevation={0}
              sx={{
                px: 2,
                py: 1,
                backgroundColor: '#333',
                borderRadius: 1,
              }}
            >
              <Typography variant='body2' sx={{ whiteSpace: 'nowrap' }}>
                Seite {currentPage} von {totalPages}
              </Typography>
            </Paper>
            <Button
              variant='contained'
              size='medium'
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
              sx={{ minWidth: '50px' }}
            >
              Weiter ›
            </Button>
          </Box>
        )}
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default DiscoverMoviesDialog;
