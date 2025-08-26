import { Close as CloseIcon } from '@mui/icons-material';
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
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../../App';
import notFound from '../../../assets/notFound.jpg';
import { useMovieList } from '../../../contexts/MovieListProvider';
import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsProvider';
import { useSeriesList } from '../../../contexts/OptimizedSeriesListProvider';
import { logSeriesAdded } from '../../../features/badges/minimalActivityLogger';
import { generateRecommendations } from '../../../features/recommendations/recommendationEngine';
import { colors } from '../../../theme';

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
      id={`series-tabpanel-${index}`}
      aria-labelledby={`series-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const AddSeriesDialog: React.FC<AddSeriesDialogProps> = ({
  open,
  onClose,
  inputRef,
}) => {
  const auth = useAuth();
  const { user } = auth || {};
  const {} = useOptimizedFriends();
  const { movieList } = useMovieList();
  const { seriesList } = useSeriesList();

  // States für Tabs und Search
  const [activeTab, setActiveTab] = useState(0);
  const [searchValue, setSearchValue] = useState('');
  const [searchResults, setSearchResults] = useState<Serien[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // States für Empfehlungen
  const [trendingSeries, setTrendingSeries] = useState<Serien[]>([]);
  const [popularSeries, setPopularSeries] = useState<Serien[]>([]);
  const [topRatedSeries, setTopRatedSeries] = useState<Serien[]>([]);
  const [recommendedSeries, setRecommendedSeries] = useState<Serien[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [isPersonalized, setIsPersonalized] = useState(false);

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
  const [selectedSeries, setSelectedSeries] = useState<Serien | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const [keepOpen, setKeepOpen] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Fokus beim Öffnen des Dialogs
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (activeTab === 0 && inputRef.current) {
          let attempts = 0;
          const maxAttempts = 10;

          const focusInterval = setInterval(() => {
            if (
              inputRef.current &&
              document.activeElement !== inputRef.current
            ) {
              inputRef.current.focus();
              attempts++;
            }

            if (
              document.activeElement === inputRef.current ||
              attempts >= maxAttempts
            ) {
              clearInterval(focusInterval);
            }
          }, 50);
        }
      }, 300); // Warten bis Dialog vollständig geladen ist

      return () => clearTimeout(timer);
    }
  }, [open]);

  // Fokus beim Tab-Wechsel
  useEffect(() => {
    if (open && activeTab === 0) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  // Filter-Funktion für bereits hinzugefügte Serien
  const filterAlreadyAdded = useCallback(
    (items: Serien[]) => {
      if (!seriesList || seriesList.length === 0) return items;

      const addedSeriesIds = new Set(seriesList.map((series) => series.id));
      return items.filter((item) => !addedSeriesIds.has(item.id));
    },
    [seriesList]
  );

  // Empfehlungen laden - Initial Load mit intelligenten Empfehlungen
  const loadRecommendations = useCallback(async () => {
    setLoadingRecommendations(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      // Parallel laden: Standard-Kategorien + personalisierte Empfehlungen
      const [
        trendingRes1,
        trendingRes2,
        popularRes1,
        popularRes2,
        topRatedRes,
        recommendations,
      ] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=1`
        ),
        fetch(
          `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=2`
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=1`
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=2`
        ),
        fetch(
          `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=1`
        ),
        generateRecommendations(movieList, seriesList, 'series'),
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

      // Kombiniere die ersten 2 Seiten für 30 Serien initial und filtere bereits hinzugefügte
      const allTrending = [
        ...(trendingData1.results || []),
        ...(trendingData2.results || []),
      ];
      const allPopular = [
        ...(popularData1.results || []),
        ...(popularData2.results || []),
      ];
      const allTopRated = topRatedData.results || [];

      setTrendingSeries(filterAlreadyAdded(allTrending));
      setPopularSeries(filterAlreadyAdded(allPopular));
      setTopRatedSeries(filterAlreadyAdded(allTopRated));

      // Setze personalisierte Empfehlungen (bereits gefiltert von der Engine)
      setRecommendedSeries(filterAlreadyAdded(recommendations.series));
      setIsPersonalized(recommendations.isPersonalized);

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
  }, [movieList, seriesList, filterAlreadyAdded]);

  // Load more functions for infinite scroll (jeweils 20 mehr)
  const loadMoreTrending = useCallback(async () => {
    if (loadingTrending || !hasMoreTrending) return;

    setLoadingTrending(true);
    const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/trending/tv/week?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=${trendingPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const filteredResults = filterAlreadyAdded(data.results);
        setTrendingSeries((prev) => [...prev, ...filteredResults]);
        setTrendingPage((prev) => prev + 1);
        setHasMoreTrending(data.page < data.total_pages);
      } else {
        setHasMoreTrending(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer Trending-Serien:', error);
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
        `https://api.themoviedb.org/3/tv/popular?api_key=${TMDB_API_KEY}&language=de-DE&region=US&page=${popularPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const filteredResults = filterAlreadyAdded(data.results);
        setPopularSeries((prev) => [...prev, ...filteredResults]);
        setPopularPage((prev) => prev + 1);
        setHasMorePopular(data.page < data.total_pages);
      } else {
        setHasMorePopular(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer beliebter Serien:', error);
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
        `https://api.themoviedb.org/3/tv/top_rated?api_key=${TMDB_API_KEY}&language=de-DE&page=${topRatedPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const filteredResults = filterAlreadyAdded(data.results);
        setTopRatedSeries((prev) => [...prev, ...filteredResults]);
        setTopRatedPage((prev) => prev + 1);
        setHasMoreTopRated(data.page < data.total_pages);
      } else {
        setHasMoreTopRated(false);
      }
    } catch (error) {
      console.error('Fehler beim Laden weiterer top-bewerteter Serien:', error);
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
          `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${value}&language=de-DE&page=1`
        );
        const data = await response.json();
        setSearchResults(filterAlreadyAdded(data.results || []));
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
        `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${searchValue}&language=de-DE&page=${searchPage}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const filteredResults = filterAlreadyAdded(data.results);
        setSearchResults((prev) => [...prev, ...filteredResults]);
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

  // Serie Card Component - Mobile-Optimized
  const SeriesCard: React.FC<{ series: Serien; onClick: () => void }> = ({
    series,
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
          boxShadow: { xs: 'none', sm: colors.shadow.dialog },
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
          series.poster_path
            ? `https://image.tmdb.org/t/p/w500${series.poster_path}`
            : notFound
        }
        alt={series.name}
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
          {series.name}
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
            {series.first_air_date
              ? new Date(series.first_air_date).getFullYear()
              : 'TBA'}
          </Typography>

          {series.vote_average > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.2, sm: 0.3 },
              }}
            >
              <StarIcon
                sx={{ fontSize: { xs: 12, sm: 14 }, color: colors.status.warning }}
              />
              <Typography
                variant='caption'
                fontWeight='600'
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.65rem', sm: '0.75rem' },
                }}
              >
                {series.vote_average.toFixed(1)}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Quality Badge */}
      {series.vote_average >= 8.0 && (
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

  const handleSeriesSelect = (series: Serien) => {
    setSelectedSeries(series);
  };

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
        // Unified Activity-Logging für Friend + Badge-System (Explorer-Badges)
        await logSeriesAdded(
          user.uid,
          selectedSeries.name || 'Unbekannte Serie',
          selectedSeries.id
        );

        setSnackbarMessage('Serie hinzugefügt!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setSearchValue('');
        setSearchResults([]);
        setSelectedSeries(null);
        setActiveTab(0);
        if (!keepOpen) {
          onClose();
        } else {
          // Input fokussieren wenn Dialog offen bleibt
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 100);
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
    setSearchResults([]);
    setSelectedSeries(null);
    setActiveTab(0);
    onClose();
  };

  // Load recommendations only when dialog opens for the first time
  useEffect(() => {
    if (open) {
      // Nur laden wenn noch keine Empfehlungen vorhanden sind
      if (
        trendingSeries.length === 0 &&
        popularSeries.length === 0 &&
        topRatedSeries.length === 0
      ) {
        loadRecommendations();
      }
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
        disableEnforceFocus={true}
        disableRestoreFocus={true}
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
              display: 'flex',
              flexDirection: 'column',
            },
          },
        }}
        sx={{
          '& .MuiDialogContent-root': {
            flex: 1,
            overflow: 'auto',
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
            color: colors.text.secondary,
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
              sx={{ fontWeight: 'bold', color: colors.status.warning }}
            >
              Serie hinzufügen
            </Typography>
          </Box>

          <IconButton
            onClick={handleDialogClose}
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
                color: colors.text.secondary,
                transform: 'translateY(-50%) scale(1.05)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            p: 0,
            background:
              'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
            backdropFilter: 'blur(10px)',
            color: colors.text.secondary,
            overflow: 'auto',
            height: '100%',
          }}
        >
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
              variant={isMobile ? 'scrollable' : 'fullWidth'}
              scrollButtons={isMobile ? 'auto' : false}
              sx={{
                width: '100%',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  background: 'rgba(255,255,255,0.05)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '12px 12px 0 0',
                  margin: '0 4px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  minHeight: { xs: 44, sm: 48, md: 64 },
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.875rem' },
                  px: { xs: 0.25, sm: 0.5, md: 1 },
                  '&:hover': {
                    background: 'rgba(255,255,255,0.1)',
                    color: colors.text.secondary,
                  },
                  '&.Mui-selected': {
                    color: 'var(--theme-primary)',
                    background: colors.overlay.medium,
                    boxShadow: `0 8px 25px ${colors.overlay.medium}`,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: 'var(--theme-primary)',
                  height: '3px',
                  borderRadius: '2px',
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
                label='Serie suchen'
                variant='outlined'
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                inputRef={inputRef}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position='start'>
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(45,45,48,0.8)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '12px',
                    color: colors.text.secondary,
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.2)',
                      borderWidth: '1px',
                    },
                    '&:hover': {
                      background: 'rgba(55,55,58,0.9)',
                      '& fieldset': {
                        borderColor: 'rgba(255,255,255,0.3)',
                      },
                    },
                    '&.Mui-focused': {
                      background: 'rgba(65,65,68,0.95)',
                      boxShadow: colors.shadow.hover,
                      '& fieldset': {
                        borderColor: 'var(--theme-primary)',
                      },
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255,255,255,0.7)',
                    '&.Mui-focused': {
                      color: 'var(--theme-primary)',
                    },
                  },
                }}
              />

              {isSearching && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <Typography>Suche läuft...</Typography>
                </Box>
              )}

              {searchResults.length > 0 && (
                <>
                  <Box sx={gridLayoutSx}>
                    {searchResults.map((series) => (
                      <SeriesCard
                        key={series.id}
                        series={series}
                        onClick={() => handleSeriesSelect(series)}
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
                          background: colors.primary,
                          borderRadius: '12px',
                          padding: '12px 24px',
                          color: colors.text.secondary,
                          fontWeight: 600,
                          textTransform: 'none',
                          border: '1px solid rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(10px)',
                          transition: 'all 0.3s ease',
                          fontSize: { xs: '0.75rem', sm: '0.875rem' },
                          '&:hover': {
                            background: colors.text.accent,
                            transform: 'translateY(-2px)',
                            boxShadow: colors.shadow.buttonHover,
                          },
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

              {searchValue.length < 2 && !isSearching && (
                <>
                  <Typography
                    variant='h6'
                    gutterBottom
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 3,
                      fontSize: { xs: '1rem', sm: '1.1rem' },
                    }}
                  >
                    <LocalFireDepartmentIcon color='primary' />
                    {isPersonalized
                      ? 'Empfehlungen für dich'
                      : 'Trending Serien'}
                  </Typography>

                  {loadingRecommendations ? (
                    <Box sx={gridLayoutSx}>
                      {Array.from(new Array(12)).map((_, index) => (
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
                    <>
                      {/* Personalisierte Empfehlungen oder Fallback */}
                      <Box sx={gridLayoutSx}>
                        {recommendedSeries.length > 0
                          ? recommendedSeries.map((series) => (
                              <SeriesCard
                                key={series.id}
                                series={series}
                                onClick={() => handleSeriesSelect(series)}
                              />
                            ))
                          : [
                              ...trendingSeries.slice(0, 6),
                              ...popularSeries.slice(0, 6),
                            ]
                              .slice(0, 12)
                              .map((series) => (
                                <SeriesCard
                                  key={series.id}
                                  series={series}
                                  onClick={() => handleSeriesSelect(series)}
                                />
                              ))}
                      </Box>

                      <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Typography variant='body2' color='text.secondary'>
                          {isPersonalized
                            ? 'Basierend auf deinen Lieblings-Genres'
                            : 'Gib mindestens 2 Zeichen ein, um gezielt zu suchen'}
                        </Typography>
                      </Box>
                    </>
                  )}
                </>
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
                  {trendingSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                      onClick={() => handleSeriesSelect(series)}
                    />
                  ))}
                </Box>
              )}

              {/* Load More Button für Trending */}
              {!loadingRecommendations && trendingSeries.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                  <Button
                    variant='outlined'
                    onClick={loadMoreTrending}
                    disabled={loadingTrending}
                    startIcon={
                      loadingTrending ? <CircularProgress size={20} /> : null
                    }
                    sx={{
                      background:
                        'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      color: colors.text.secondary,
                      fontWeight: 500,
                      textTransform: 'none',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backdropFilter: 'blur(10px)',
                      transition: 'all 0.3s ease',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      '&:hover': {
                        background:
                          'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.1) 100%)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        transform: 'translateY(-2px)',
                      },
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
                Beliebte Serien
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
                  {popularSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                      onClick={() => handleSeriesSelect(series)}
                    />
                  ))}
                </Box>
              )}

              {/* Load More Button für Popular */}
              {!loadingRecommendations &&
                popularSeries.length > 0 &&
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
                        background:
                          `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.light} 100%)`,
                        border: `1px solid ${colors.border.primary}`,
                        borderRadius: '12px',
                        padding: '12px 24px',
                        color: colors.text.secondary,
                        fontWeight: 500,
                        textTransform: 'none',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '&:hover': {
                          background:
                            `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.medium} 100%)`,
                          border: `1px solid ${colors.border.primary}`,
                          transform: 'translateY(-2px)',
                        },
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
                Best bewertete Serien
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
                  {topRatedSeries.map((series) => (
                    <SeriesCard
                      key={series.id}
                      series={series}
                      onClick={() => handleSeriesSelect(series)}
                    />
                  ))}
                </Box>
              )}

              {/* Load More Button für Top Rated */}
              {!loadingRecommendations &&
                topRatedSeries.length > 0 &&
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
                        background:
                          `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.light} 100%)`,
                        border: `1px solid ${colors.border.primary}`,
                        borderRadius: '12px',
                        padding: '12px 24px',
                        color: colors.text.secondary,
                        fontWeight: 500,
                        textTransform: 'none',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                        '&:hover': {
                          background:
                            `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.medium} 100%)`,
                          border: `1px solid ${colors.border.primary}`,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      {loadingTopRated ? 'Lädt...' : 'Mehr anzeigen'}
                    </Button>
                  </Box>
                )}
            </Box>
          </TabPanel>
        </DialogContent>

        {/* Selected Series Preview */}
        {selectedSeries && (
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: 1,
              borderColor: 'divider',
              bgcolor: 'action.hover',
              background:
                'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
            }}
          >
            <Typography variant='subtitle2' color='primary' gutterBottom>
              Ausgewählte Serie:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' },
                gap: 2,
              }}
            >
              {/* Content Container */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flex: 1,
                }}
              >
                <img
                  src={
                    selectedSeries.poster_path
                      ? `https://image.tmdb.org/t/p/w92${selectedSeries.poster_path}`
                      : notFound
                  }
                  alt={selectedSeries.name}
                  style={{
                    width: 60,
                    height: 90,
                    objectFit: 'cover',
                    borderRadius: 4,
                  }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant='body1' fontWeight='bold'>
                    {selectedSeries.name}
                  </Typography>
                  <Typography variant='body2' color='text.secondary'>
                    {selectedSeries.original_name !== selectedSeries.name
                      ? selectedSeries.original_name
                      : ''}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Chip
                      size='small'
                      label={
                        selectedSeries.first_air_date
                          ? new Date(
                              selectedSeries.first_air_date
                            ).getFullYear()
                          : 'TBA'
                      }
                      variant='outlined'
                      sx={{
                        backgroundColor: `${colors.text.accent}20`,
                        borderColor: colors.text.accent,
                        color: colors.text.accent,
                        '&:hover': {
                          backgroundColor: `${colors.text.accent}30`,
                          borderColor: colors.text.accent,
                        },
                      }}
                    />
                    <Box
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <StarIcon sx={{ fontSize: 14, color: 'gold' }} />
                      <Typography variant='caption'>
                        {selectedSeries.vote_average
                          ? selectedSeries.vote_average.toFixed(1)
                          : 'N/A'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Remove Button */}
              <Button
                variant='outlined'
                size='small'
                startIcon={<CloseIcon />}
                onClick={() => setSelectedSeries(null)}
                sx={{
                  alignSelf: { xs: 'center', sm: 'flex-start' },
                  minWidth: { xs: 120, sm: 'auto' },
                  px: { xs: 2, sm: 1.5 },
                  py: 0.75,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  borderRadius: 2,
                  background:
                    `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.light} 100%)`,
                  border: `1px solid ${colors.border.primary}`,
                  color: colors.text.secondary,
                  '&:hover': {
                    background:
                      `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.medium} 100%)`,
                    border: `1px solid ${colors.border.primary}`,
                    transform: 'translateY(-1px)',
                  },
                }}
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
            background:
              'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
            backdropFilter: 'blur(10px)',
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
                background:
                  `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.light} 100%)`,
                border: `1px solid ${colors.border.primary}`,
                borderRadius: '12px',
                padding: '12px 24px',
                color: colors.text.secondary,
                fontWeight: 600,
                textTransform: 'none',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  background:
                    `linear-gradient(135deg, ${colors.overlay.medium} 0%, ${colors.overlay.medium} 100%)`,
                  border: '1px solid var(--theme-primary)',
                  transform: 'translateY(-2px)',
                  boxShadow: colors.shadow.hover,
                },
              }}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleAddSeries}
              disabled={!selectedSeries}
              variant='contained'
              size='medium'
              startIcon={<AddIcon />}
              sx={{
                flex: { xs: 1, sm: 'none' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                background: colors.primary,
                borderRadius: '12px',
                padding: '12px 24px',
                color: colors.background.default,
                fontWeight: 600,
                textTransform: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  cursor: 'pointer ',
                  background: colors.text.accent,
                  transform: 'translateY(-2px)',
                  boxShadow: colors.shadow.buttonHover,
                },
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

export default AddSeriesDialog;
