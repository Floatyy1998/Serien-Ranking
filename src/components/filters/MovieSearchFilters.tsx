import AddIcon from '@mui/icons-material/Add';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RateReviewIcon from '@mui/icons-material/RateReview';
import RecommendIcon from '@mui/icons-material/Recommend';
import SearchIcon from '@mui/icons-material/Search';
import {
  Box,
  Button,
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
import { shuffle } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import {
  genreIdMap,
  genreMenuItemsForMovies,
  providerMenuItems,
} from '../../constants/menuItems';
import { useMovieList } from '../../contexts/MovieListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { Movie } from '../../interfaces/Movie';
import AddMovieDialog from '../dialogs/AddMovieDialog';
import AutoRatingDialog from '../dialogs/AutoRatingDialog';
import BulkMovieRatingDialog from '../dialogs/BulkMovieRatingDialog';
import DiscoverMoviesDialog from '../dialogs/DiscoverMoviesDialog';
import RecommendationsDialog from '../dialogs/RecommendationsDialog';

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
  const [dialogBulkRatingOpen, setDialogBulkRatingOpen] = useState(false);
  const [dialogAutoRatingOpen, setDialogAutoRatingOpen] = useState(false);
  const [recommendations, setRecommendations] = useState<Movie[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [basedOnItems, setBasedOnItems] = useState<Movie[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addMovieInputRef = useRef<HTMLInputElement>(null);
  const { movieList } = useMovieList();

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

  const handleDialogBulkRatingOpen = () => {
    setDialogBulkRatingOpen(true);
  };

  const handleDialogAutoRatingOpen = () => {
    setDialogAutoRatingOpen(true);
  };

  const handleDialogRecommendationsOpen = async () => {
    setLoadingRecommendations(true);
    setDialogRecommendationsOpen(true);

    const randomMovies = shuffle(movieList).slice(0, 5);
    const allRecommendations = [];

    for (const movie of randomMovies) {
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/recommendations?api_key=d812a3cdd27ca10d95979a2d45d100cd&language=de-DE`
      );
      const data = await response.json();
      allRecommendations.push(
        ...data.results.map((result: any) => ({
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
          origin_country: result.origin_country,
          original_language: result.original_language,
          original_name: result.original_title,
          popularity: result.popularity,
          vote_average: result.vote_average,
          vote_count: result.vote_count,
          media_type: 'movie',
        }))
      );
    }

    const uniqueRecommendations = allRecommendations.filter(
      (rec, index, self) =>
        index === self.findIndex((r) => r.id === rec.id) &&
        !movieList.some((movie) => movie.id === rec.id)
    );

    setRecommendations(uniqueRecommendations.sort(() => 0.5 - Math.random()));
    setLoadingRecommendations(false);
    setBasedOnItems(randomMovies);
  };

  return (
    <Box className='flex flex-col gap-4 xl:flex-row md:items-center justify-center mb-6 max-w-[1400px] m-auto'>
      <Box className='flex flex-col lg:flex-row items-center gap-2'>
        <Box sx={{ width: '250px', flexShrink: 0 }}>
          <TextField
            label='Suchen'
            variant='outlined'
            type='search'
            value={searchValue}
            onChange={handleSearchChange}
            fullWidth
            inputRef={searchInputRef}
          />
        </Box>
        <Box className='flex flex-row items-center gap-2 w-[250px] xl:w-auto justify-between'>
          <Box sx={{ flexShrink: 0 }}>
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
          <>
            <Tooltip title='Unveröffentlichte Filme entdecken'>
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
                <SearchIcon />
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
            <Tooltip title='Empfehlungen anzeigen'>
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
          </>
          <>
            <Tooltip title='Massenbewertung - Filme schnell bewerten'>
              <Button
                variant='outlined'
                onClick={handleDialogBulkRatingOpen}
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: '0.5rem',
                  overflow: 'hidden',
                  transition: 'width 0.3s ease',
                  justifyContent: 'flex-start',
                  pl: '19px',
                  '@media (min-width:900px)': {
                    '&:hover': { width: 180 },
                    '&:hover .text-wrapper': {
                      opacity: 1,
                      transition: 'opacity 0.5s ease',
                    },
                  },
                }}
                aria-label='Massenbewertung'
                role='button'
              >
                <RateReviewIcon />
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
                  Massenbewertung
                </Box>
              </Button>
            </Tooltip>
          </>
          <>
            <Tooltip title='Alle Filme automatisch mit TMDB bewerten'>
              <Button
                variant='outlined'
                onClick={handleDialogAutoRatingOpen}
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
                aria-label='Auto-Bewertung'
                role='button'
              >
                <AutoFixHighIcon />
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
                  Auto-Rating
                </Box>
              </Button>
            </Tooltip>
          </>
          <Divider
            className='hidden'
            orientation='vertical'
            flexItem
            sx={{ display: { xl: 'block' }, ml: 1 }}
          />
        </Box>
      </Box>
      <Box className='flex flex-col lg:flex-row items-center gap-2'>
        <FormControl className='w-[250px]'>
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
        <FormControl className='w-[250px]'>
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
      <BulkMovieRatingDialog
        open={dialogBulkRatingOpen}
        onClose={() => setDialogBulkRatingOpen(false)}
      />
      <AutoRatingDialog
        open={dialogAutoRatingOpen}
        onClose={() => setDialogAutoRatingOpen(false)}
        mediaType='movies'
      />
    </Box>
  );
};
export default MovieSearchFilters;
