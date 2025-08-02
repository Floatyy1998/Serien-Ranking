import AddIcon from '@mui/icons-material/Add';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  InputAdornment,
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../App';
import notFound from '../../assets/notFound.jpg';
import { useFriends } from '../../contexts/FriendsProvider';
import { logMovieAddedUnified } from '../../utils/unifiedActivityLogger';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role='tabpanel'
      hidden={value !== index}
      id={`movie-tabpanel-${index}`}
      aria-labelledby={`movie-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const AddMovieDialog: React.FC<AddMovieDialogProps> = ({
  open,
  onClose,
  inputRef,
}) => {
  const auth = useAuth();
  const { user } = auth || {};
  const {} = useFriends();

  // States für Tabs und Search
  const [activeTab, setActiveTab] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Filme[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // States für Empfehlungen
  const [trendingMovies, setTrendingMovies] = useState<Filme[]>([]);
  const [popularMovies, setPopularMovies] = useState<Filme[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Filme[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Globales Grid-Layout für bessere mobile Darstellung
  const gridLayoutSx = {
    display: 'grid',
    gridTemplateColumns: {
      xs: 'repeat(2, 1fr)', // 2 Spalten auf mobile für größere Poster
      sm: 'repeat(3, 1fr)', // 3 Spalten auf kleine Tablets
      md: 'repeat(4, 1fr)', // 4 Spalten auf mittlere Bildschirme
      lg: 'repeat(5, 1fr)', // 5 Spalten auf große Bildschirme
      xl: 'repeat(6, 1fr)', // 6 Spalten auf extra große Bildschirme
    },
    gap: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
    pb: 2,
  };

  // Pagination states
  const [trendingPage, setTrendingPage] = useState(1);
  const [popularPage, setPopularPage] = useState(1);
  const [topRatedPage, setTopRatedPage] = useState(1);
  const [searchPage, setSearchPage] = useState(1);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [hasMorePopular, setHasMorePopular] = useState(true);
  const [hasMoreTopRated, setHasMoreTopRated] = useState(true);
  const [hasMoreSearch, setHasMoreSearch] = useState(true);

  // Loading States für Load More Buttons
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  const [loadingTopRated, setLoadingTopRated] = useState(false);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // States für Dialog
  const [selectedMovie, setSelectedMovie] = useState<Filme | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [keepOpen, setKeepOpen] = useState(false);

  // Empfehlungen laden - Initial Load (30 Filme)
  const loadRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      const [
        trendingRes1,
        trendingRes2,
        popularRes1,
        popularRes2,
        topRatedRes,
      ] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=1`
        ),
        fetch(
          `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=2`
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=1`
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=2`
        ),
        fetch(
          `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        ),
      ]);

      const [
        trendingData1,
        trendingData2,
        popularData1,
        popularData2,
        topRatedData,
      ] = await Promise.all([
        trendingRes1.json(),
        trendingRes2.json(),
        popularRes1.json(),
        popularRes2.json(),
        topRatedRes.json(),
      ]);

      // Kombiniere die ersten 2 Seiten für 30 Filme initial
      setTrendingMovies([
        ...(trendingData1.results || []),
        ...(trendingData2.results || []),
      ]);
      setPopularMovies([
        ...(popularData1.results || []),
        ...(popularData2.results || []),
      ]);
      setTopRatedMovies(topRatedData.results || []);

      // Set pagination to page 3 for next load (da wir schon 1+2 geladen haben)
      setTrendingPage(3);
      setPopularPage(3);
      setTopRatedPage(2);
      setHasMoreTrending(trendingData2.total_pages > 2);
      setHasMorePopular(popularData2.total_pages > 2);
      setHasMoreTopRated(topRatedData.total_pages > 1);
    } catch (error) {
      console.error('Fehler beim Laden der Empfehlungen:', error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, []);

  // Load more functions for infinite scroll (jeweils 20 mehr)
  const loadMoreTrending = useCallback(async () => {
    if (loadingTrending || !hasMoreTrending) return;

    setLoadingTrending(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/movie/week?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=${trendingPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setTrendingMovies((prev) => [...prev, ...data.results]);
        setTrendingPage((prev) => prev + 1);
        setHasMoreTrending(data.page < data.total_pages);
      } else {
        setHasMoreTrending(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer Trending-Filme:', error);
    } finally {
      setLoadingTrending(false);
    }
  }, [trendingPage, hasMoreTrending, loadingTrending]);

  const loadMorePopular = useCallback(async () => {
    if (loadingPopular || !hasMorePopular) return;

    setLoadingPopular(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=${popularPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setPopularMovies((prev) => [...prev, ...data.results]);
        setPopularPage((prev) => prev + 1);
        setHasMorePopular(data.page < data.total_pages);
      } else {
        setHasMorePopular(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer beliebter Filme:', error);
    } finally {
      setLoadingPopular(false);
    }
  }, [popularPage, hasMorePopular, loadingPopular]);

  const loadMoreTopRated = useCallback(async () => {
    if (loadingTopRated || !hasMoreTopRated) return;

    setLoadingTopRated(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=${topRatedPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setTopRatedMovies((prev) => [...prev, ...data.results]);
        setTopRatedPage((prev) => prev + 1);
        setHasMoreTopRated(data.page < data.total_pages);
      } else {
        setHasMoreTopRated(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer top-bewerteter Filme:', error);
    } finally {
      setLoadingTopRated(false);
    }
  }, [topRatedPage, hasMoreTopRated, loadingTopRated]);

  // Search function
  const handleSearch = useCallback(async (value: string) => {
    setSearchValue(value);

    if (value.length >= 2) {
      setIsSearching(true);
      setSearchPage(1);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${value}&language=de-DE&page=1`
        );
        const data = await response.json();
        setSearchResults(data.results || []);
        setSearchPage(2);
        setHasMoreSearch(data.total_pages > 1);
      } catch (error) {
        console.error('Fehler bei der Suche:', error);
        setSearchResults([]);
        setHasMoreSearch(false);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setHasMoreSearch(false);
    }
  }, []);

  const loadMoreSearch = useCallback(async () => {
    if (loadingSearch || !hasMoreSearch || searchValue.length < 2) return;

    setLoadingSearch(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${searchValue}&language=de-DE&page=${searchPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        setSearchResults((prev) => [...prev, ...data.results]);
        setSearchPage((prev) => prev + 1);
        setHasMoreSearch(data.page < data.total_pages);
      } else {
        setHasMoreSearch(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer Suchergebnisse:', error);
    } finally {
      setLoadingSearch(false);
    }
  }, [searchPage, hasMoreSearch, loadingSearch, searchValue]);

  // Movie Card Component - Mobile-Optimized
  const MovieCard: React.FC<{ movie: Filme; onClick: () => void }> = ({
    movie,
    onClick,
  }) => (
    <Box
      onClick={onClick}
      sx={{
        position: 'relative',
        aspectRatio: '2/3',
        borderRadius: { xs: 2, sm: 3 },
        overflow: 'hidden',
        cursor: 'pointer',
        backgroundColor: 'grey.900',
        transition: 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        '&:hover': {
          transform: { xs: 'none', sm: 'translateY(-8px)' },
          boxShadow: { xs: 'none', sm: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' },
        },
        '&:active': {
          transform: 'scale(0.95)',
        },
      }}
    >
      {/* Main Poster Image */}
      <Box
        component='img'
        src={
          movie.poster_path
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
            : notFound
        }
        alt={movie.title}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = notFound;
        }}
      />

      {/* Bottom Info Bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background:
            'linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.8) 60%, transparent 100%)',
          p: { xs: 1.5, sm: 2 },
          color: 'white',
        }}
      >
        <Typography
          variant='body2'
          fontWeight='600'
          sx={{
            mb: 0.5,
            lineHeight: 1.2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
          }}
        >
          {movie.title}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant='caption'
            sx={{
              color: 'grey.300',
              fontWeight: 500,
              fontSize: { xs: '0.65rem', sm: '0.75rem' },
            }}
          >
            {movie.release_date
              ? new Date(movie.release_date).getFullYear()
              : 'TBA'}
          </Typography>

          {movie.vote_average > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.2, sm: 0.3 },
              }}
            >
              <StarIcon
                sx={{ fontSize: { xs: 12, sm: 14 }, color: '#FFC107' }}
              />
              <Typography
                variant='caption'
                fontWeight='600'
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                }}
              >
                {movie.vote_average.toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Quality Badge */}
      {movie.vote_average >= 8.0 && (
        <Box
          sx={{
            position: 'absolute',
            top: { xs: 6, sm: 8 },
            right: { xs: 6, sm: 8 },
            bgcolor: 'success.main',
            color: 'white',
            px: { xs: 0.5, sm: 1 },
            py: { xs: 0.25, sm: 0.5 },
            borderRadius: 1,
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            fontWeight: 'bold',
          }}
        >
          Top
        </Box>
      )}
    </Box>
  );

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleMovieSelect = (movie: Filme) => {
    setSelectedMovie(movie);
  };

  const handleAddMovie = useCallback(async () => {
    if (!user) {
      setSnackbarMessage(
        'Bitte loggen Sie sich ein, um einen Film hinzuzufügen.'
      );
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      onClose();
      return;
    }
    if (!selectedMovie) {
      setSnackbarMessage('Bitte wählen Sie einen Film aus.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
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
        // Unified Activity-Logging für Friend + Badge-System (Explorer-Badges)
        await logMovieAddedUnified(
          user.uid,
          selectedMovie.title || 'Unbekannter Film',
          selectedMovie.id,
          selectedMovie.genre_ids?.map((id) => `Genre_${id}`) || [], // Genres
          selectedMovie.release_date // releaseDate
        );

        setSnackbarMessage('Film hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSearchValue('');
        setSearchResults([]);
        setSelectedMovie(null);
        setActiveTab(0);
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
    }
  }, [user, selectedMovie, onClose, keepOpen]);

  // Neue Funktion zum Schließen des Dialogs
  const handleDialogClose = () => {
    setSearchValue('');
    setSearchResults([]);
    setSelectedMovie(null);
    setActiveTab(0);
    onClose();
  };

  // Load recommendations when dialog opens
  useEffect(() => {
    if (open) {
      loadRecommendations();
    }
  }, [open, loadRecommendations]);

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
        maxWidth='xl'
        fullWidth
        disableAutoFocus={true}
        disableEnforceFocus={false}
        disableRestoreFocus={false}
        keepMounted={false}
        sx={{
          '& .MuiDialog-paper': {
            height: { xs: '90vh', sm: '90vh' }, // Reduzierte Höhe für bessere DialogActions Darstellung
            maxHeight: '900px',
            m: { xs: 0.5, sm: 2 }, // Weniger Margin auf mobile
            display: 'flex',
            flexDirection: 'column',
          },
          '& .MuiDialogContent-root': {
            flex: 1,
            overflow: 'auto',
          },
        }}
      >
        <DialogHeader title='Film hinzufügen' onClose={handleDialogClose} />

        <DialogContent dividers sx={{ p: 0, overflow: 'auto', height: '100%' }}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: { xs: 1.5, sm: 2, md: 3 },
              pt: 2,
              position: 'sticky',
              top: 0,
              bgcolor: 'background.paper',
              zIndex: 1,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              variant='fullWidth'
              sx={{
                '& .MuiTab-root': {
                  minHeight: { xs: 44, sm: 48, md: 64 },
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                  px: { xs: 0.25, sm: 0.5, md: 1 },
                },
                '& .MuiTab-iconWrapper': {
                  fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                },
              }}
            >
              <Tab icon={<SearchIcon />} label='Suchen' iconPosition='start' />
              <Tab
                icon={<LocalFireDepartmentIcon />}
                label='Trending'
                iconPosition='start'
              />
              <Tab
                icon={<TrendingUpIcon />}
                label='Beliebt'
                iconPosition='start'
              />
              <Tab icon={<StarIcon />} label='Top Rated' iconPosition='start' />
            </Tabs>
          </Box>

          {/* Search Tab */}
          <TabPanel value={activeTab} index={0}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3, minHeight: 400 }}>
              <TextField
                fullWidth
                label='Film suchen'
                variant='outlined'
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                inputRef={inputRef}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              {isSearching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography>Suche läuft...</Typography>
                </Box>
              )}

              {searchResults.length > 0 && (
                <>
                  <Box sx={gridLayoutSx}>
                    {searchResults.map((movie) => (
                      <MovieCard
                        key={movie.id}
                        movie={movie}
                        onClick={() => handleMovieSelect(movie)}
                      />
                    ))}
                  </Box>

                  {/* Load More Button für Search */}
                  {!isSearching && hasMoreSearch && (
                    <Box
                      sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                    >
                      <Button
                        variant='outlined'
                        onClick={loadMoreSearch}
                        disabled={loadingSearch}
                        startIcon={
                          loadingSearch ? <CircularProgress size={20} /> : null
                        }
                        sx={{
                          borderRadius: 2,
                          px: 4,
                          py: 1.5,
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        }}
                      >
                        {loadingSearch ? 'Lädt...' : 'Mehr Suchergebnisse'}
                      </Button>
                    </Box>
                  )}
                </>
              )}

              {searchValue.length >= 2 &&
                searchResults.length === 0 &&
                !isSearching && (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color='text.secondary'>
                      Keine Ergebnisse für "{searchValue}" gefunden
                    </Typography>
                  </Box>
                )}

              {searchValue.length < 2 && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color='text.secondary'>
                    Gib mindestens 2 Zeichen ein, um zu suchen
                  </Typography>
                </Box>
              )}
            </Box>
          </TabPanel>

          {/* Trending Tab */}
          <TabPanel value={activeTab} index={1}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 3,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                <LocalFireDepartmentIcon color='primary' />
                Trending diese Woche
              </Typography>
              {loadingRecommendations ? (
                <Box sx={gridLayoutSx}>
                  {Array.from(new Array(8)).map((_, index) => (
                    <Box key={index} sx={{ aspectRatio: '2/3' }}>
                      <Skeleton
                        variant='rectangular'
                        width='100%'
                        height='100%'
                        sx={{ borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={gridLayoutSx}>
                  {trendingMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => handleMovieSelect(movie)}
                    />
                  ))}
                </Box>
              )}

              {/* Load More Button für Trending */}
              {!loadingRecommendations &&
                trendingMovies.length > 0 &&
                hasMoreTrending && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                  >
                    <Button
                      variant='outlined'
                      onClick={loadMoreTrending}
                      disabled={loadingTrending}
                      startIcon={
                        loadingTrending ? <CircularProgress size={20} /> : null
                      }
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {loadingTrending ? 'Lädt...' : 'Mehr anzeigen'}
                    </Button>
                  </Box>
                )}
            </Box>
          </TabPanel>

          {/* Popular Tab */}
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 3,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                <TrendingUpIcon color='primary' />
                Beliebte Filme
              </Typography>
              {loadingRecommendations ? (
                <Box sx={gridLayoutSx}>
                  {Array.from(new Array(8)).map((_, index) => (
                    <Box key={index} sx={{ aspectRatio: '2/3' }}>
                      <Skeleton
                        variant='rectangular'
                        width='100%'
                        height='100%'
                        sx={{ borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={gridLayoutSx}>
                  {popularMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => handleMovieSelect(movie)}
                    />
                  ))}
                </Box>
              )}

              {/* Load More Button für Popular */}
              {!loadingRecommendations &&
                popularMovies.length > 0 &&
                hasMorePopular && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                  >
                    <Button
                      variant='outlined'
                      onClick={loadMorePopular}
                      disabled={loadingPopular}
                      startIcon={
                        loadingPopular ? <CircularProgress size={20} /> : null
                      }
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {loadingPopular ? 'Lädt...' : 'Mehr anzeigen'}
                    </Button>
                  </Box>
                )}
            </Box>
          </TabPanel>

          {/* Top Rated Tab */}
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ px: { xs: 2, sm: 3 }, pb: 3 }}>
              <Typography
                variant='h6'
                gutterBottom
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 3,
                  fontSize: { xs: '1.1rem', sm: '1.25rem' },
                }}
              >
                <StarIcon color='primary' />
                Best bewertete Filme
              </Typography>
              {loadingRecommendations ? (
                <Box sx={gridLayoutSx}>
                  {Array.from(new Array(8)).map((_, index) => (
                    <Box key={index} sx={{ aspectRatio: '2/3' }}>
                      <Skeleton
                        variant='rectangular'
                        width='100%'
                        height='100%'
                        sx={{ borderRadius: 3 }}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={gridLayoutSx}>
                  {topRatedMovies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      onClick={() => handleMovieSelect(movie)}
                    />
                  ))}
                </Box>
              )}

              {/* Load More Button für Top Rated */}
              {!loadingRecommendations &&
                topRatedMovies.length > 0 &&
                hasMoreTopRated && (
                  <Box
                    sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}
                  >
                    <Button
                      variant='outlined'
                      onClick={loadMoreTopRated}
                      disabled={loadingTopRated}
                      startIcon={
                        loadingTopRated ? <CircularProgress size={20} /> : null
                      }
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1.5,
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {loadingTopRated ? 'Lädt...' : 'Mehr anzeigen'}
                    </Button>
                  </Box>
                )}
            </Box>
          </TabPanel>
        </DialogContent>

        {/* Selected Movie Preview */}
        {selectedMovie && (
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
            }}
          >
            <Typography variant='subtitle2' color='primary' gutterBottom>
              Ausgewählter Film:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <img
                src={
                  selectedMovie.poster_path
                    ? `https://image.tmdb.org/t/p/w92${selectedMovie.poster_path}`
                    : notFound
                }
                alt={selectedMovie.title}
                style={{
                  width: 60,
                  height: 90,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant='body1' fontWeight='bold'>
                  {selectedMovie.title}
                </Typography>
                <Typography variant='body2' color='text.secondary'>
                  {selectedMovie.original_title !== selectedMovie.title
                    ? selectedMovie.original_title
                    : ''}
                </Typography>
                <Box
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}
                >
                  <Chip
                    size='small'
                    label={
                      selectedMovie.release_date
                        ? new Date(selectedMovie.release_date).getFullYear()
                        : 'TBA'
                    }
                    variant='outlined'
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <StarIcon sx={{ fontSize: 14, color: 'gold' }} />
                    <Typography variant='caption'>
                      {selectedMovie.vote_average
                        ? selectedMovie.vote_average.toFixed(1)
                        : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <Button
                variant='outlined'
                size='small'
                onClick={() => setSelectedMovie(null)}
              >
                Entfernen
              </Button>
            </Box>
          </Box>
        )}

        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2 }, // Reduziertes Padding auf mobile
            gap: { xs: 1, sm: 2 },
            flexDirection: { xs: 'column', sm: 'row' }, // Vertikale Anordnung auf mobile
            alignItems: 'stretch',
          }}
        >
          <Box
            sx={{
              flexGrow: 1,
              order: { xs: 2, sm: 1 }, // Checkbox unten auf mobile
            }}
          >
            <FormControlLabel
              control={
                <Checkbox
                  checked={keepOpen}
                  onChange={(e) => setKeepOpen(e.target.checked)}
                  size='small'
                />
              }
              label='Dialog nicht schließen?'
              sx={{
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                '& .MuiFormControlLabel-label': {
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                },
              }}
            />
          </Box>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              order: { xs: 1, sm: 2 }, // Buttons oben auf mobile
              width: { xs: '100%', sm: 'auto' },
            }}
          >
            <Button
              onClick={handleDialogClose}
              size='medium'
              sx={{
                flex: { xs: 1, sm: 'none' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleAddMovie}
              disabled={!selectedMovie}
              variant='contained'
              size='medium'
              startIcon={<AddIcon />}
              sx={{
                flex: { xs: 1, sm: 'none' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
              }}
            >
              {/* Kurzer Text auf mobile, langer auf Desktop */}
              <Box
                component='span'
                sx={{ display: { xs: 'none', sm: 'inline' } }}
              >
                Hinzufügen
              </Box>
              <Box
                component='span'
                sx={{ display: { xs: 'inline', sm: 'none' } }}
              >
                Add
              </Box>
            </Button>
          </Box>
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
