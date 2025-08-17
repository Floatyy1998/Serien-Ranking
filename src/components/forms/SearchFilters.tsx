import { ExpandLess, ExpandMore } from '@mui/icons-material';
import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ExploreIcon from '@mui/icons-material/Explore';
import FilterListIcon from '@mui/icons-material/FilterList';
import ListIcon from '@mui/icons-material/List';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { genreMenuItems, providerMenuItems } from '../../config/menuItems';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { generateRecommendations } from '../../features/recommendations/recommendationEngine';
import { useDebounce } from '../../hooks/useDebounce';
import { calculateOverallRating } from '../../lib/rating/rating';
import { Series } from '../../types/Series';
import AddSeriesDialog from '../domain/dialogs/AddSeriesDialog';
import DiscoverSeriesDialog from '../domain/dialogs/DiscoverSeriesDialog';
import RecommendationsDialog from '../domain/dialogs/RecommendationsDialog';
import WatchlistDialog from '../domain/dialogs/Watchlist/WatchlistDialog';

interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
  onSpecialFilterChange?: (value: string) => void;
}

// React 19: Automatische Memoization - kein memo nötig
export const SearchFilters = ({
  onSearchChange,
  onGenreChange,
  onProviderChange,
  onSpecialFilterChange,
}: SearchFiltersProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDiscoverOpen, setDialogDiscoverOpen] = useState(false);
  const { seriesList } = useSeriesList();
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const authContext = useAuth();
  const user = authContext?.user;
  const [dialogAddOpen, setDialogAddOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addSeriesInputRef = useRef<HTMLInputElement>(null);
  const [dialogRecommendationsOpen, setDialogRecommendationsOpen] =
    useState(false);
  const [recommendations, setRecommendations] = useState<Series[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  const [basedOnSeries, setBasedOnSeries] = useState<Series[]>([]);
  const [mobileFiltersExpanded, setMobileFiltersExpanded] = useState(false);

  // Reset lokale Filterstates, wenn sich der Benutzer ändert
  useEffect(() => {
    setSearchValue('');
    setSelectedGenre('All');
    setSelectedProvider('All');
    onSearchChange('');
    onGenreChange('All');
    onProviderChange('All');
    if (onSpecialFilterChange) onSpecialFilterChange('');
  }, [user, onSpecialFilterChange]);

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

  const handleWatchlistToggle = useCallback(() => {
    setIsWatchlist((prev) => {
      const newState = !prev;
      if (prev) {
        setSelectedProvider('All');
        setSelectedGenre('All');
        onProviderChange('All');
        onGenreChange('All');
      } else {
        setSelectedGenre('All');
        setSelectedProvider('All');
        onGenreChange('Watchlist');
        onProviderChange('All');
      }
      return newState;
    });
  }, [onGenreChange, onProviderChange]);

  const handleDialogOpen = () => {
    setDialogOpen(true);
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  };

  const handleDialogAddOpen = () => {
    setDialogAddOpen(true);
    setTimeout(() => {
      if (addSeriesInputRef.current) {
        addSeriesInputRef.current.focus();
      }
    }, 100);
  };

  const handleDialogDiscoverOpen = () => {
    setDialogDiscoverOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleDialogRecommendationsOpen = async () => {
    setLoadingRecommendations(true);
    setDialogRecommendationsOpen(true);

    try {
      // Verwende eine zufällige Auswahl bewerteter Serien als Basis
      const ratedSeries = seriesList.filter((series) => {
        if (!series.rating || typeof series.rating !== 'object') return false;
        const overallRating = calculateOverallRating(series);
        const numericRating = parseFloat(overallRating);
        return !isNaN(numericRating) && numericRating > 0;
      });

      // Fisher-Yates Shuffle für echte Randomisierung
      const shuffleArray = (array: Series[]) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const shuffledRatedSeries = shuffleArray(ratedSeries).slice(0, 5);

      const basedOnSeriesItems =
        shuffledRatedSeries.length > 0
          ? shuffledRatedSeries
          : seriesList.slice(0, 5);

      // Verwende die optimierte Recommendation Engine MIT spezifischen Items
      const result = await generateRecommendations(
        [],
        seriesList,
        'series',
        basedOnSeriesItems
      );

      // Konvertiere die Ergebnisse in das erwartete Format
      const formattedRecommendations = result.series.map((result: any) => ({
        nmr: result.id,
        begründung: '',
        beschreibung: result.overview,
        genre: {
          genres:
            result.genre_ids?.map((id: number) => {
              // Einfache Genre-Mapping für TV direkt hier
              const genreMap: { [key: number]: string } = {
                10759: 'Action & Adventure',
                16: 'Animation',
                35: 'Comedy',
                80: 'Crime',
                99: 'Documentary',
                18: 'Drama',
                10751: 'Family',
                10762: 'Kids',
                9648: 'Mystery',
                10763: 'News',
                10764: 'Reality',
                10765: 'Sci-Fi & Fantasy',
                10766: 'Soap',
                10767: 'Talk',
                10768: 'War & Politics',
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
        title: result.name,
        wo: { wo: '' },
        watchlist: false,
        status: result.first_air_date ? 'Released' : 'Unreleased',
        release_date: result.first_air_date,
        collection_id: undefined,
        origin_country: result.origin_country,
        original_language: result.original_language,
        original_name: result.original_name,
        popularity: result.popularity,
        vote_average: result.vote_average,
        vote_count: result.vote_count,
        media_type: 'tv',
        // Zusätzliche Series-spezifische Felder
        episodeCount: 0,
        episodeRuntime: 0,
        nextEpisode: undefined,
        seasonCount: 0,
        seasons: [],
        lastEpisodeDate: undefined,
        tvMaze: undefined,
        watchtime: undefined,
      }));

      setRecommendations(formattedRecommendations as unknown as Series[]);
      setBasedOnSeries(basedOnSeriesItems);
    } catch (error) {
      console.error('Fehler beim Laden der Empfehlungen:', error);
      setRecommendations([]);
      setBasedOnSeries([]);
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
          data-tour='mobile-filters-button'
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
              <Tooltip title='Serie hinzufügen'>
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
                  aria-label='Serie hinzufügen'
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
              title='Unveröffentlichte Serien entdecken'
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
                aria-label='Unveröffentlichte Serien entdecken'
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
          <FormControl
            className='w-[250px]'
            disabled={isWatchlist}
            data-tour='genre-filter'
          >
            <InputLabel id='genre-label'>Genre</InputLabel>
            <Select
              labelId='genre-label'
              label='Genre'
              value={selectedGenre}
              onChange={handleGenreChange}
            >
              {genreMenuItems.map((item) => (
                <MenuItem key={item.value} value={item.value}>
                  {item.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            className='w-[250px]'
            disabled={isWatchlist}
            data-tour='provider-filter'
          >
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
        <Divider
          className='hidden'
          orientation='vertical'
          flexItem
          sx={{ display: { xl: 'block' } }}
        />
        <Box className='flex gap-3 justify-center md:justify-start mt-0'>
          <Tooltip
            title={isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'}
            data-tour='watchlist-button'
          >
            <Button
              variant={isWatchlist ? 'contained' : 'outlined'}
              onClick={handleWatchlistToggle}
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
              aria-label={
                isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'
              }
              role='button'
            >
              {isWatchlist ? <BookmarkIcon /> : <BookmarkBorderIcon />}
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
                {isWatchlist ? 'Ausblenden' : 'Anzeigen'}
              </Box>
            </Button>
          </Tooltip>
          <Tooltip title='Als nächstes schauen' data-tour='next-watch-button'>
            <Button
              variant='outlined'
              onClick={handleDialogOpen}
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
              aria-label='Als nächstes schauen'
              role='button'
            >
              <ListIcon />
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
                Nächstes
              </Box>
            </Button>
          </Tooltip>
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
            <FormControl
              fullWidth
              disabled={isWatchlist}
              data-tour='genre-filter'
            >
              <InputLabel id='genre-label'>Genre</InputLabel>
              <Select
                labelId='genre-label'
                label='Genre'
                value={selectedGenre}
                onChange={handleGenreChange}
              >
                {genreMenuItems.map((item) => (
                  <MenuItem key={item.value} value={item.value}>
                    {item.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl
              fullWidth
              disabled={isWatchlist}
              data-tour='provider-filter'
            >
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
              <Tooltip title='Serie hinzufügen'>
                <Button
                  variant='outlined'
                  onClick={handleDialogAddOpen}
                  startIcon={<AddIcon />}
                  fullWidth
                  data-tour='add-button'
                >
                  Hinzufügen
                </Button>
              </Tooltip>
              <Tooltip title='Unveröffentlichte Serien entdecken'>
                <Button
                  variant='outlined'
                  onClick={handleDialogDiscoverOpen}
                  startIcon={<ExploreIcon />}
                  fullWidth
                  data-tour='discover-button'
                >
                  Entdecken
                </Button>
              </Tooltip>
            </Box>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
              }}
            >
              <Tooltip title='Empfehlungen anzeigen'>
                <Button
                  variant='outlined'
                  onClick={handleDialogRecommendationsOpen}
                  startIcon={<RecommendIcon />}
                  fullWidth
                  data-tour='recommendations-button'
                >
                  Empfehlung
                </Button>
              </Tooltip>
              <Tooltip
                title={
                  isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'
                }
              >
                <Button
                  variant={isWatchlist ? 'contained' : 'outlined'}
                  onClick={handleWatchlistToggle}
                  startIcon={
                    isWatchlist ? <BookmarkIcon /> : <BookmarkBorderIcon />
                  }
                  fullWidth
                  data-tour='watchlist-button'
                >
                  {isWatchlist ? 'Ausblenden' : 'Watchlist'}
                </Button>
              </Tooltip>
            </Box>
            <Tooltip title='Als nächstes schauen'>
              <Button
                variant='outlined'
                onClick={handleDialogOpen}
                startIcon={<ListIcon />}
                fullWidth
                data-tour='next-watch-button'
              >
                Nächstes
              </Button>
            </Tooltip>
          </Box>
        </Box>
      </Collapse>

      <WatchlistDialog open={dialogOpen} onClose={handleDialogClose} />
      <AddSeriesDialog
        open={dialogAddOpen}
        onClose={() => setDialogAddOpen(false)}
        inputRef={addSeriesInputRef}
      />
      <DiscoverSeriesDialog
        open={dialogDiscoverOpen}
        onClose={() => setDialogDiscoverOpen(false)}
      />
      <RecommendationsDialog
        open={dialogRecommendationsOpen}
        onClose={() => setDialogRecommendationsOpen(false)}
        recommendations={recommendations}
        loading={loadingRecommendations}
        basedOnItems={basedOnSeries}
      />
    </Box>
  );
};

export default SearchFilters;
