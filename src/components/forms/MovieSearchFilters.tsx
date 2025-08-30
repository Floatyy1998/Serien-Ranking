import { ExpandLess, ExpandMore } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import ExploreIcon from '@mui/icons-material/Explore';
import FilterListIcon from '@mui/icons-material/FilterList';
import RecommendIcon from '@mui/icons-material/Recommend';
import {
  Box,
  Button,
  Collapse,
  Divider,
  SelectChangeEvent,
  TextField,
  Tooltip,
} from '@mui/material';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import 'firebase/compat/database';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import {
  genreMenuItemsForMovies,
  providerMenuItems,
} from '../../config/menuItems';
import { useMovieList } from '../../contexts/MovieListProvider';
import { generateRecommendations } from '../../features/recommendations/recommendationEngine';
import { useDebounce } from '../../hooks/useDebounce';
import { calculateOverallRating } from '../../lib/rating/rating';
import { Movie } from '../../types/Movie';
import AddMovieDialog from '../domain/dialogs/AddMovieDialog';
import DiscoverMoviesDialog from '../domain/dialogs/DiscoverMoviesDialog';
import RecommendationsDialog from '../domain/dialogs/RecommendationsDialog';

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}
// React 19: Automatische Memoization - kein memo nötig
export const MovieSearchFilters = ({
  onSearchChange,
  onGenreChange,
  onProviderChange,
}: SearchFiltersProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const authContext = useAuth();
  const user = authContext?.user;
  const [dialogAddOpen, setDialogAddOpen] = useState(false);
  const [dialogDiscoverOpen, setDialogDiscoverOpen] = useState(false);
  const [dialogRecommendationsOpen, setDialogRecommendationsOpen] =
    useState(false);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [basedOnItems, setBasedOnItems] = useState<Movie[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addMovieInputRef = useRef<HTMLInputElement>(null);
  const { movieList } = useMovieList();
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  // Reset lokale Filterstates, wenn sich der Benutzer ändert
  useEffect(() => {
    setSearchValue('');
    setSelectedGenre('All');
    setSelectedProvider('All');
    onSearchChange('');
    onGenreChange('All');
    onProviderChange('All');
  }, [user]);

  useEffect(() => {
    onSearchChange(debouncedSearchValue);
  }, [debouncedSearchValue, onSearchChange]);
  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchValue(value);
      onSearchChange(value);
    },
    [onSearchChange]
  );
  const handleGenreChange = useCallback(
    (event: SelectChangeEvent<unknown>) => {
      const value = event.target.value as string;
      setSelectedGenre(value);
      onGenreChange(value);
    },
    [onGenreChange]
  );
  const handleProviderChange = useCallback(
    (event: SelectChangeEvent<unknown>) => {
      const value = event.target.value as string;
      setSelectedProvider(value);
      onProviderChange(value);
    },
    [onProviderChange]
  );

  const handleDialogAddOpen = () => {
    setDialogAddOpen(true);
    setTimeout(() => {
      if (addMovieInputRef.current) {
        addMovieInputRef.current.focus();
      }
    }, 100);
  };

  const handleDialogDiscoverOpen = () => {
    setDialogDiscoverOpen(true);
  };

  const handleDialogRecommendationsOpen = async () => {
    setLoadingRecommendations(true);
    setDialogRecommendationsOpen(true);

    try {
      // Verwende eine zufällige Auswahl bewerteter Filme als Basis
      const ratedMovies = movieList.filter((movie) => {
        if (!movie.rating || typeof movie.rating !== 'object') return false;
        const overallRating = calculateOverallRating(movie);
        const numericRating = parseFloat(overallRating);
        return !isNaN(numericRating) && numericRating > 0;
      });

      // Fisher-Yates Shuffle für echte Randomisierung
      const shuffleArray = (array: Movie[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledRatedMovies = shuffleArray(ratedMovies).slice(0, 5);

      const basedOnMovies =
        shuffledRatedMovies.length > 0
          ? shuffledRatedMovies
          : movieList.slice(0, 5);

      // Verwende die optimierte Recommendation Engine MIT spezifischen Items
      const result = await generateRecommendations(
        movieList,
        [],
        'movies',
        basedOnMovies
      );

      // Konvertiere die Ergebnisse in das erwartete Format
      const formattedRecommendations = result.movies.map((result: any) => ({
        nmr: result.id,
        begründung: '',
        beschreibung: result.overview,
        genre: {
          genres:
            result.genre_ids?.map((id: number) => {
              // Einfache Genre-Mapping direkt hier
              const genreMap: { [key: number]: string } = {
                28: 'Action',
                12: 'Adventure',
                16: 'Animation',
                35: 'Comedy',
                80: 'Crime',
                99: 'Documentary',
                18: 'Drama',
                10751: 'Family',
                14: 'Fantasy',
                36: 'History',
                27: 'Horror',
                10402: 'Music',
                9648: 'Mystery',
                10749: 'Romance',
                878: 'Science Fiction',
                10770: 'TV Movie',
                53: 'Thriller',
                10752: 'War',
                37: 'Western',
              };
              return genreMap[id] || '';
            }) || [],
        },
        id: result.id,
        imdb: { imdb_id: '' },
        poster: {
          poster: result.poster_path
            ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
            : '',
        },
        provider: undefined,
        rating: {},
        runtime: 0,
        title: result.title,
        wo: { wo: '' },
        watchlist: false,
        status: result.release_date ? 'Released' : 'Unreleased',
        release_date: result.release_date,
        collection_id: undefined,
        origin_country: result.origin_country,
        original_language: result.original_language,
        original_name: result.original_title,
        popularity: result.popularity,
        vote_average: result.vote_average,
        vote_count: result.vote_count,
        media_type: 'movie',
      }));

      setRecommendations(formattedRecommendations);
      setBasedOnItems(basedOnMovies);
    } catch (error) {
      // console.error('Fehler beim Laden der Empfehlungen:', error);
      setRecommendations([]);
      setBasedOnItems([]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  return (
    <Box className='max-w-[1400px] m-auto mb-6'>
      {/* Mobile Filter Toggle Button */}
      <Box sx={{ display: { xs: 'block', xl: 'none' }, mb: 2 }}>
        <Button
          onClick={() => setMobileFiltersExpanded(!mobileFiltersExpanded)}
          variant='outlined'
          fullWidth
          startIcon={<FilterListIcon />}
          endIcon={mobileFiltersExpanded ? <ExpandLess /> : <ExpandMore />}
          sx={{
            justifyContent: 'space-between',
            height: '48px',
            fontSize: '0.875rem',
            backgroundColor: 'var(--theme-surface)',
            borderColor: 'var(--theme-primary)',
            color: 'var(--theme-text-secondary)',
            '&:hover': {
              backgroundColor: 'color-mix(in srgb, var(--theme-primary) 10%, var(--theme-surface))',
              borderColor: 'var(--theme-primary)',
            },
          }}
        >
          Filter & Suche
        </Button>
      </Box>

      {/* Desktop Layout */}
      <Box
        sx={{
          display: { xs: 'none', xl: 'flex' },
          flexDirection: { xs: 'column', xl: 'row' },
          gap: 4,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box className='flex flex-col lg:flex-row items-center gap-2'>
          <Box sx={{ width: '250px', flexShrink: 0 }} data-tour='search-input'>
            <TextField
              label='Suchen'
              variant='outlined'
              type='search'
              value={searchValue}
              onChange={handleSearchChange}
              fullWidth
              inputRef={searchInputRef}
              className='search-input-field'
            />
          </Box>
          <Box className='flex flex-row items-center gap-2 w-[250px] xl:w-auto justify-between'>
            <Box sx={{ flexShrink: 0 }} data-tour='add-button'>
              <Tooltip title='Film hinzufügen'>
                <Button
                  variant='outlined'
                  onClick={handleDialogAddOpen}
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: '0.5rem',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                    justifyContent: 'flex-start',
                    pl: '19px',
                    '@media (min-width:900px)': {
                      '&:hover': { width: 150 },
                      '&:hover .text-wrapper': {
                        opacity: 1,
                        transition: 'opacity 0.5s ease',
                      },
                    },
                  }}
                  aria-label='Film hinzufügen'
                  role='button'
                >
                  <AddIcon />
                  <Box
                    component='span'
                    sx={{
                      whiteSpace: 'nowrap',
                      opacity: 0,
                      transition: 'opacity 0.3s ease',
                      '@media (min-width:900px)': {
                        '&:hover, button:hover &': { opacity: 1 },
                      },
                    }}
                    className='text-wrapper'
                  >
                    Hinzufügen
                  </Box>
                </Button>
              </Tooltip>
            </Box>
            <Tooltip
              title='Unveröffentlichte Filme entdecken'
              data-tour='discover-button'
            >
              <Button
                variant='outlined'
                onClick={handleDialogDiscoverOpen}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  transition: 'width 0.3s ease',
                  justifyContent: 'flex-start',
                  pl: '19px',
                  '@media (min-width:900px)': {
                    '&:hover': { width: 150 },
                    '&:hover .text-wrapper': {
                      opacity: 1,
                      transition: 'opacity 0.5s ease',
                    },
                  },
                }}
                aria-label='Unveröffentlichte Filme entdecken'
                role='button'
              >
                <ExploreIcon />
                <Box
                  component='span'
                  sx={{
                    whiteSpace: 'nowrap',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    '@media (min-width:900px)': {
                      '&:hover, button:hover &': { opacity: 1 },
                    },
                  }}
                  className='text-wrapper'
                >
                  Entdecken
                </Box>
              </Button>
            </Tooltip>
            <Tooltip
              title='Empfehlungen anzeigen'
              data-tour='recommendations-button'
            >
              <Button
                variant='outlined'
                onClick={handleDialogRecommendationsOpen}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  transition: 'width 0.3s ease',
                  justifyContent: 'flex-start',
                  pl: '19px',
                  '@media (min-width:900px)': {
                    '&:hover': { width: 150 },
                    '&:hover .text-wrapper': {
                      opacity: 1,
                      transition: 'opacity 0.5s ease',
                    },
                  },
                }}
                aria-label='Empfehlungen anzeigen'
                role='button'
              >
                <RecommendIcon />
                <Box
                  component='span'
                  sx={{
                    whiteSpace: 'nowrap',
                    opacity: 0,
                    transition: 'opacity 0.3s ease',
                    '@media (min-width:900px)': {
                      '&:hover, button:hover &': { opacity: 1 },
                    },
                  }}
                  className='text-wrapper'
                >
                  Empfehlung
                </Box>
              </Button>
            </Tooltip>
            <Divider
              className='hidden'
              orientation='vertical'
              flexItem
              sx={{ display: { xl: 'block' }, ml: 1 }}
            />
          </Box>
        </Box>
        <Box className='flex flex-col lg:flex-row items-center gap-2'>
          <FormControl className='w-[250px]' data-tour='genre-filter'>
            <InputLabel id='genre-label'>Genre</InputLabel>
            <Select
              labelId='genre-label'
              label='Genre'
              value={selectedGenre}
              onChange={handleGenreChange}
            >
              {genreMenuItemsForMovies.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl className='w-[250px]' data-tour='provider-filter'>
            <InputLabel id='provider-label'>Provider</InputLabel>
            <Select
              labelId='provider-label'
              label='Provider'
              value={selectedProvider}
              onChange={handleProviderChange}
            >
              {providerMenuItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Mobile Collapsible Layout */}
      <Collapse
        in={mobileFiltersExpanded}
        sx={{ display: { xs: 'block', xl: 'none' } }}
      >
        <Box
          sx={{
            p: 2,
            backgroundColor: 'color-mix(in srgb, var(--theme-surface) 50%, transparent)',
            borderRadius: 2,
            border: '1px solid var(--theme-primary)',
            borderColor: 'color-mix(in srgb, var(--theme-primary) 30%, transparent)',
          }}
        >
          {/* Suchfeld */}
          <Box sx={{ mb: 2 }} data-tour='search-input'>
            <TextField
              label='Suchen'
              variant='outlined'
              type='search'
              value={searchValue}
              onChange={handleSearchChange}
              fullWidth
              inputRef={searchInputRef}
              className='search-input-field'
            />
          </Box>

          {/* Dropdown Filters */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <FormControl fullWidth data-tour='genre-filter'>
              <InputLabel id='genre-label'>Genre</InputLabel>
              <Select
                labelId='genre-label'
                label='Genre'
                value={selectedGenre}
                onChange={handleGenreChange}
              >
                {genreMenuItemsForMovies.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth data-tour='provider-filter'>
              <InputLabel id='provider-label'>Provider</InputLabel>
              <Select
                labelId='provider-label'
                label='Provider'
                value={selectedProvider}
                onChange={handleProviderChange}
              >
                {providerMenuItems.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
              }}
            >
              <Tooltip title='Film hinzufügen' data-tour='add-button'>
                <Button
                  variant='outlined'
                  onClick={handleDialogAddOpen}
                  startIcon={<AddIcon />}
                  fullWidth
                >
                  Hinzufügen
                </Button>
              </Tooltip>
              <Tooltip
                title='Unveröffentlichte Filme entdecken'
                data-tour='discover-button'
              >
                <Button
                  variant='outlined'
                  onClick={handleDialogDiscoverOpen}
                  startIcon={<ExploreIcon />}
                  fullWidth
                >
                  Entdecken
                </Button>
              </Tooltip>
            </Box>
            <Tooltip
              title='Empfehlungen anzeigen'
              data-tour='recommendations-button'
            >
              <Button
                variant='outlined'
                onClick={handleDialogRecommendationsOpen}
                startIcon={<RecommendIcon />}
                fullWidth
              >
                Empfehlung
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>

      <AddMovieDialog
        open={dialogAddOpen}
        onClose={() => setDialogAddOpen(false)}
        inputRef={addMovieInputRef}
      />
      <DiscoverMoviesDialog
        open={dialogDiscoverOpen}
        onClose={() => setDialogDiscoverOpen(false)}
      />
      <RecommendationsDialog
        open={dialogRecommendationsOpen}
        onClose={() => setDialogRecommendationsOpen(false)}
        recommendations={recommendations}
        loading={loadingRecommendations}
        basedOnItems={basedOnItems}
      />
    </Box>
  );
};
export default MovieSearchFilters;
