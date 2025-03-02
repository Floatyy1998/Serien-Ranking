import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ListIcon from '@mui/icons-material/List';
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
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { genreMenuItems, providerMenuItems } from '../../constants/menuItems';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { Series } from '../../interfaces/Series';
import AddSeriesDialog from '../dialogs/AddSeriesDialog';
import DiscoverSeriesDialog from '../dialogs/DiscoverSeriesDialog';
import WatchlistDialog from '../dialogs/Watchlist/WatchlistDialog';
interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}
export const SearchFilters = memo(
  ({ onSearchChange, onGenreChange, onProviderChange }: SearchFiltersProps) => {
    const [searchValue, setSearchValue] = useState('');
    const [selectedGenre, setSelectedGenre] = useState('All');
    const [selectedProvider, setSelectedProvider] = useState('All');
    const [isWatchlist, setIsWatchlist] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogDiscoverOpen, setDialogDiscoverOpen] = useState(false);
    const [watchlistSeries, setWatchlistSeries] = useState<Series[]>([]);
    const [sortOption] = useState('date-desc');
    const { seriesList } = useSeriesList();
    const debouncedSearchValue = useDebounce(searchValue, 300);
    const isSharedListPage = location.pathname.startsWith('/shared-list');
    const authContext = useAuth();
    const user = authContext?.user;
    const [dialogAddOpen, setDialogAddOpen] = useState(false);
    const searchInputRef = useRef<HTMLInputElement>(null);
    const addSeriesInputRef = useRef<HTMLInputElement>(null);

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
      const fetchWatchlistSeries = async () => {
        if (user) {
          const watchlistSeries = seriesList.filter(
            (series) => series.watchlist
          );
          setWatchlistSeries(watchlistSeries);
        }
      };
      fetchWatchlistSeries();
    }, [user, seriesList]);
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
    const handleWatchedToggleWithConfirmation = useCallback(
      (
        seasonNumber: number,
        episodeIndex: number,
        seriesId: number,
        seriesNmr: number
      ) => {
        if (user) {
          const episodeRef = Firebase.database().ref(
            `${user.uid}/serien/${seriesNmr}/seasons/${seasonNumber}/episodes/${episodeIndex}`
          );
          episodeRef.once('value', (snapshot) => {
            const episode = snapshot.val();
            episodeRef.update({ watched: !episode.watched });
          });
        }
        setWatchlistSeries((prevSeries) =>
          prevSeries.map((series) =>
            series.id === seriesId
              ? {
                  ...series,
                  seasons: series.seasons.map((season) =>
                    season.seasonNumber === seasonNumber
                      ? {
                          ...season,
                          episodes: season.episodes.map((episode, index) =>
                            index === episodeIndex
                              ? { ...episode, watched: !episode.watched }
                              : episode
                          ),
                        }
                      : season
                  ),
                }
              : series
          )
        );
      },
      [user]
    );
    const getNextUnwatchedEpisode = (series: Series) => {
      for (const season of series.seasons) {
        for (let i = 0; i < season.episodes.length; i++) {
          const episode = season.episodes[i];
          if (!episode.watched) {
            return {
              ...episode,
              seasonNumber: season.seasonNumber,
              episodeIndex: i,
            };
          }
        }
      }
      return null;
    };
    const filteredWatchlistSeries = watchlistSeries.filter((series) => {
      const nextEpisode = getNextUnwatchedEpisode(series);
      return nextEpisode && new Date(nextEpisode.air_date) <= new Date();
    });
    const sortedWatchlistSeries = [...filteredWatchlistSeries].sort((a, b) => {
      const [sortField, sortOrder] = sortOption.split('-');
      const orderMultiplier = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'name') {
        return a.title.localeCompare(b.title) * orderMultiplier;
      } else if (sortField === 'date') {
        const nextEpisodeA = getNextUnwatchedEpisode(a);
        const nextEpisodeB = getNextUnwatchedEpisode(b);
        if (!nextEpisodeA || !nextEpisodeB) return 0;
        return (
          (new Date(nextEpisodeA.air_date).getTime() -
            new Date(nextEpisodeB.air_date).getTime()) *
          orderMultiplier
        );
      }
      return 0;
    });
    return (
      <Box className='flex flex-col gap-4 md:flex-row md:items-center justify-center mb-6 max-w-[1400px] m-auto'>
        {}
        <Box className='flex items-center gap-2'>
          <Box sx={{ width: { lg: '300px' }, flexShrink: 0 }}>
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
          {!isSharedListPage && (
            <Box sx={{ flexShrink: 0 }}>
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
                  {}
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
              <Divider
                orientation='vertical'
                flexItem
                sx={{ ml: 1, display: { xs: 'none', md: 'block' } }}
              />
            </Box>
          )}
          {!isSharedListPage && (
            <Tooltip title='Serien entdecken'>
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
                aria-label='Serien entdecken'
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
          )}
        </Box>
        <FormControl className='md:w-[250px]' disabled={isWatchlist}>
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
        <FormControl className='md:w-[250px]' disabled={isWatchlist}>
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
        {!isSharedListPage && (
          <>
            <Divider
              orientation='vertical'
              flexItem
              sx={{ display: { xs: 'none', md: 'block' } }}
            />
            <Box className='flex gap-3'>
              <Tooltip
                title={
                  isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'
                }
              >
                <Button
                  variant={isWatchlist ? 'contained' : 'outlined'}
                  onClick={handleWatchlistToggle}
                  sx={{
                    margin: 'auto',
                    borderRadius: '0.5rem',
                    width: 56,
                    height: 56,
                    minWidth: 56,
                  }}
                  aria-label={
                    isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'
                  }
                  role='button'
                >
                  {isWatchlist ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </Button>
              </Tooltip>
              <Tooltip title='Als nächstes schauen'>
                <Button
                  variant='outlined'
                  onClick={handleDialogOpen}
                  sx={{
                    margin: 'auto',
                    borderRadius: '0.5rem',
                    width: 56,
                    height: 56,
                    minWidth: 56,
                  }}
                  aria-label='Als nächstes schauen'
                  role='button'
                >
                  <ListIcon />
                </Button>
              </Tooltip>
            </Box>
          </>
        )}
        <WatchlistDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          sortedWatchlistSeries={sortedWatchlistSeries}
          handleWatchedToggleWithConfirmation={
            handleWatchedToggleWithConfirmation
          }
          setWatchlistSeries={setWatchlistSeries}
        />
        <AddSeriesDialog
          open={dialogAddOpen}
          onClose={() => setDialogAddOpen(false)}
          inputRef={addSeriesInputRef}
        />
        <DiscoverSeriesDialog
          open={dialogDiscoverOpen}
          onClose={() => setDialogDiscoverOpen(false)}
        />
      </Box>
    );
  }
);
export default SearchFilters;
