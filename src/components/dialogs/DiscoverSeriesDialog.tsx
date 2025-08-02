import {
  Clear as ClearIcon,
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
  FormControl,
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
import { useState } from 'react';
import { useAuth } from '../../App';
import { genreIdMapForSeries } from '../../constants/menuItems';
import { Series } from '../../interfaces/Series';
import DiscoverSeriesCard from '../series/DiscoverSeriesCard';
import { DialogHeader } from './shared/SharedDialogComponents';

interface DiscoverSeriesDialogProps {
  open: boolean;
  onClose: () => void;
}

const DiscoverSeriesDialog = ({ open, onClose }: DiscoverSeriesDialogProps) => {
  const [searchResults, setSearchResults] = useState<Series[]>([]);
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
      .map((name) => genreIdMapForSeries.find((item) => item.name === name)?.id)
      .filter((id) => id !== undefined)
      .join('|');

    const countryCodes = filters.country.join('|');

    const startDate = filters.startDate || today.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.VITE_API_TMDB}&with_genres=${genreIds}&first_air_date.gte=${startDate}&first_air_date.lte=${filters.endDate}&with_origin_country=${countryCodes}&sort_by=${filters.sortBy}&page=${page}`
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
            genreIdMapForSeries.find((genre) => genre.id === id)?.name || ''
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
      title: result.name,
      wo: {
        wo: '',
      },
      watchlist: false,
      status: result.first_air_date ? 'Released' : 'Unreleased',
      release_date: result.first_air_date,
      collection_id: null,
      origin_country: result.origin_country,
      original_language: result.original_language,
      original_name: result.original_name,
      popularity: result.popularity,
      vote_average: result.vote_average,
      vote_count: result.vote_count,
    }));
    setSearchResults(mappedResults);
    setCurrentPage(page);
    document.querySelector('.MuiDialogContent-root')?.scrollTo(0, 0); // Scroll to top
  };

  // React 19: Automatische Memoization - kein useCallback nötig
  const handleAddSeries = async (series: Series) => {
    if (!user) {
      setSnackbarMessage(
        'Bitte loggen Sie sich ein, um eine Serie hinzuzufügen.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    setSnackbarMessage('Serie wird hinzugefügt');
    setSnackbarSeverity('warning');
    setSnackbarOpen(true);
    const seriesData = {
      id: series.id.toString(),
      data: {
        user: import.meta.env.VITE_USER,
        id: series.id,
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
        setSnackbarMessage('Serie hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
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
      setSnackbarMessage('Fehler beim Hinzufügen der Serie.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

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
      PaperProps={{
        sx: {
          borderRadius: 2,
          backgroundColor: '#1a1a1a',
        },
      }}
    >
      <DialogHeader title='📺 Neue Serien entdecken' onClose={handleClose} />
      <DialogContent>
        {/* Filter Sektion */}
        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 3,
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
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
                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      backgroundColor: '#2a2a2a',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                    }}
                  >
                    Genre auswählen
                  </InputLabel>
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
                    {genreIdMapForSeries.map((item) => (
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
                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      backgroundColor: '#2a2a2a',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                    }}
                  >
                    Länder auswählen
                  </InputLabel>
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
                <FormControl fullWidth>
                  <InputLabel
                    sx={{
                      backgroundColor: '#2a2a2a',
                      paddingLeft: '4px',
                      paddingRight: '4px',
                    }}
                  >
                    Sortieren nach
                  </InputLabel>
                  <Select
                    name='sortBy'
                    value={filters.sortBy}
                    onChange={handleSortChange}
                  >
                    <MenuItem value='popularity.desc'>Beliebtheit ↓</MenuItem>
                    <MenuItem value='popularity.asc'>Beliebtheit ↑</MenuItem>
                    <MenuItem value='first_air_date.desc'>
                      Neueste zuerst
                    </MenuItem>
                    <MenuItem value='first_air_date.asc'>
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
                sx={{ px: 4 }}
              >
                Serien suchen
              </Button>
              <Button
                variant='outlined'
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
                size='large'
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
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
            }}
          >
            <Typography variant='h6' sx={{ mb: 2 }}>
              Suchergebnisse ({searchResults.length} Serien)
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
              {searchResults.map((series) => (
                <Box
                  key={series.id}
                  sx={{
                    width: '230px',
                    height: '444px',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'scale(1.02)',
                    },
                  }}
                >
                  <DiscoverSeriesCard
                    providers={[]}
                    series={series}
                    onAdd={handleAddSeries}
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
              Keine Serien gefunden
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
              Versuchen Sie andere Filter oder erweitern Sie den Datumsbereich
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
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

export default DiscoverSeriesDialog;
