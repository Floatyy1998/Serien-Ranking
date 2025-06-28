import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  Snackbar,
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
import { DialogHeader } from './shared/SharedDialogComponents';

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
        console.error('Error sending data to server:', error);
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
      maxWidth='lg'
      disableAutoFocus={true}
      disableEnforceFocus={false}
      disableRestoreFocus={false}
      keepMounted={false}
    >
      <DialogHeader
        title='Unveröffentlichte Filme entdecken'
        onClose={handleClose}
      />
      <DialogContent>
        <Box display='flex' flexDirection='column' gap={2} mt={2}>
          <Box
            display='flex'
            flexDirection='column'
            gap={2}
            sx={{ '@media (min-width: 600px)': { flexDirection: 'row' } }}
          >
            <FormControl sx={{ flex: 2 }}>
              <InputLabel
                sx={{
                  backgroundColor: '#0C0C0C',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
              >
                Genre
              </InputLabel>
              <Select
                name='genre'
                multiple
                value={filters.genre}
                onChange={handleSelectChange}
                renderValue={(selected) => selected.join(', ')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                      width: 250,
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
            <Box
              display='flex'
              flexDirection='column'
              gap={2}
              sx={{
                flex: 2,
                '@media (min-width: 600px)': { flexDirection: 'row' },
              }}
            >
              <LocalizationProvider
                dateAdapter={AdapterDayjs}
                adapterLocale='de'
              >
                <DatePicker
                  label='Startdatum'
                  value={startDate}
                  onChange={handleStartDateChange}
                  minDate={today}
                  sx={{ flex: 1 }}
                />
                <DatePicker
                  label='Enddatum'
                  value={endDate}
                  onChange={handleEndDateChange}
                  minDate={today}
                  sx={{ flex: 1 }}
                />
              </LocalizationProvider>
            </Box>
          </Box>
          <Box
            display='flex'
            flexDirection='column'
            gap={2}
            sx={{ '@media (min-width: 600px)': { flexDirection: 'row' } }}
          >
            <FormControl fullWidth>
              <InputLabel
                sx={{
                  backgroundColor: '#0C0C0C',
                  paddingLeft: '4px',
                  paddingRight: '4px',
                }}
              >
                Land
              </InputLabel>
              <Select
                name='country'
                multiple
                value={filters.country}
                onChange={handleCountryChange}
                renderValue={(selected) => selected.join(', ')}
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 224,
                      width: 250,
                    },
                  },
                }}
              >
                <MenuItem value='US'>USA</MenuItem>
                <MenuItem value='DE'>Deutschland</MenuItem>
                <MenuItem value='FR'>Frankreich</MenuItem>
                <MenuItem value='GB'>Großbritannien</MenuItem>
                <MenuItem value='JP'>Japan</MenuItem>
                <MenuItem value='KR'>Südkorea</MenuItem>
                <MenuItem value='IN'>Indien</MenuItem>
                <MenuItem value='CN'>China</MenuItem>
                <MenuItem value='IT'>Italien</MenuItem>
                <MenuItem value='ES'>Spanien</MenuItem>
                <MenuItem value='CA'>Kanada</MenuItem>
                <MenuItem value='AU'>Australien</MenuItem>
                <MenuItem value='BR'>Brasilien</MenuItem>
                <MenuItem value='RU'>Russland</MenuItem>
                <MenuItem value='MX'>Mexiko</MenuItem>
                <MenuItem value='SE'>Schweden</MenuItem>
                <MenuItem value='NO'>Norwegen</MenuItem>
                <MenuItem value='FI'>Finnland</MenuItem>
                <MenuItem value='DK'>Dänemark</MenuItem>
                <MenuItem value='NL'>Niederlande</MenuItem>
                <MenuItem value='BE'>Belgien</MenuItem>
                <MenuItem value='CH'>Schweiz</MenuItem>
                <MenuItem value='AT'>Österreich</MenuItem>
                <MenuItem value='IE'>Irland</MenuItem>
                <MenuItem value='NZ'>Neuseeland</MenuItem>
                <MenuItem value='ZA'>Südafrika</MenuItem>
                <MenuItem value='AR'>Argentinien</MenuItem>
                <MenuItem value='CL'>Chile</MenuItem>
                <MenuItem value='CO'>Kolumbien</MenuItem>
                <MenuItem value='PE'>Peru</MenuItem>
                <MenuItem value='VE'>Venezuela</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel
                sx={{
                  backgroundColor: '#0C0C0C',
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
                <MenuItem value='popularity.desc'>
                  Beliebtheit absteigend
                </MenuItem>
                <MenuItem value='popularity.asc'>
                  Beliebtheit aufsteigend
                </MenuItem>
                <MenuItem value='primary_release_date.asc'>
                  Veröffentlichungsdatum aufsteigend
                </MenuItem>
                <MenuItem value='primary_release_date.desc'>
                  Veröffentlichungsdatum absteigend
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
        <Box display='flex' justifyContent='center' mt={2}>
          <Button variant='contained' onClick={() => handleSearch()}>
            Suchen
          </Button>
        </Box>
        <Box display='flex' justifyContent='center' mt={2}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '50px',
              justifyContent: 'center',
              p: 2,
              boxSizing: 'border-box',
            }}
          >
            {searchResults.map((movie) => (
              <Box key={movie.id} sx={{ width: '230px', height: '444px' }}>
                <DiscoverMovieCard
                  movie={movie}
                  onAdd={handleAddMovie}
                  providers={[]}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        {searchResults.length > 0 && (
          <Box
            display='flex'
            alignItems='center'
            flexGrow={1}
            justifyContent={{ xs: 'center', sm: 'flex-start' }}
          >
            <Button
              variant='contained'
              size='small'
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
            >
              &lt;
            </Button>
            <Box mx={2}>
              Seite {currentPage} von {totalPages}
            </Box>
            <Button
              variant='contained'
              size='small'
              onClick={handleNextPage}
              disabled={currentPage === totalPages}
            >
              &gt;
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
