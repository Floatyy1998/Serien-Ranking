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
  TextField,
} from '@mui/material';
import { useCallback, useState } from 'react';
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
    year: '',
    country: [] as string[],
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const auth = useAuth();
  const { user } = auth || {};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (e: SelectChangeEvent<string[]>) => {
    setFilters({ ...filters, genre: e.target.value as string[] });
  };

  const handleCountryChange = (e: SelectChangeEvent<string[]>) => {
    setFilters({ ...filters, country: e.target.value as string[] });
  };

  const handleSearch = async (page = 1) => {
    const genreIds = filters.genre
      .map((name) => genreIdMapForSeries.find((item) => item.name === name)?.id)
      .filter((id) => id !== undefined)
      .join('|');

    const countryCodes = filters.country.join('|');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const releaseDateGte = tomorrow.toISOString().split('T')[0];

    const response = await fetch(
      `https://api.themoviedb.org/3/discover/tv?api_key=${process.env.VITE_API_TMDB}&with_genres=${genreIds}&first_air_date_year=${filters.year}&first_air_date.gte=${releaseDateGte}&with_origin_country=${countryCodes}&page=${page}`
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

  const handleAddSeries = useCallback(
    async (series: Series) => {
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
        console.error('Error sending data to server:', error);
        setSnackbarMessage('Fehler beim Hinzufügen der Serie.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    },
    [user]
  );

  const handleClose = () => {
    setFilters({
      genre: [],
      year: '',
      country: [],
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
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth='lg'>
      <DialogHeader title='Serien entdecken' onClose={handleClose} />
      <DialogContent>
        <Box display='flex' flexDirection='row' gap={2} mt={2}>
          <FormControl fullWidth>
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
              {genreIdMapForSeries.map((item) => (
                <MenuItem key={item.id} value={item.name}>
                  {item.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label='Jahr'
            name='year'
            value={filters.year}
            onChange={handleInputChange}
            fullWidth
            InputLabelProps={{
              style: {
                backgroundColor: '#0C0C0C',
                paddingLeft: '4px',
                paddingRight: '4px',
              },
            }}
          />
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
            {searchResults.map((series) => (
              <Box key={series.id} sx={{ width: '230px', height: '444px' }}>
                <DiscoverSeriesCard series={series} onAdd={handleAddSeries} />
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

export default DiscoverSeriesDialog;
