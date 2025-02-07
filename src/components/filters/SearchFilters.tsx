import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ListIcon from '@mui/icons-material/List';
import { Box, SelectChangeEvent, Tooltip } from '@mui/material';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { memo, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useDebounce } from '../../hooks/useDebounce';
import { Series } from '../../interfaces/Series';
import WatchlistDialog from '../dialogs/WatchlistDialog';

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
    const [watchlistSeries, setWatchlistSeries] = useState<Series[]>([]);
    const [sortOption] = useState('date-desc');

    const debouncedSearchValue = useDebounce(searchValue, 300);

    const authContext = useAuth();
    const user = authContext?.user;

    useEffect(() => {
      const fetchWatchlistSeries = async () => {
        if (user) {
          const userSeriesRef = Firebase.database().ref(`${user.uid}/serien`);
          userSeriesRef.on('value', (snapshot) => {
            const seriesData: { [key: string]: Series } = snapshot.val();
            const watchlistSeries = Object.values(seriesData).filter(
              (series) => series.watchlist
            );
            setWatchlistSeries(watchlistSeries);
          });
        }
      };

      fetchWatchlistSeries();
    }, [user]);

    useEffect(() => {
      onSearchChange(debouncedSearchValue);
    }, [debouncedSearchValue, onSearchChange]);

    const handleSearchChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchValue(value);
      },
      []
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
      setIsWatchlist((prev) => !prev);
      onGenreChange(isWatchlist ? 'All' : 'Watchlist');
    }, [isWatchlist, onGenreChange]);

    const handleDialogOpen = () => {
      setDialogOpen(true);
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
      <Box className='flex flex-col gap-4 md:flex-row md:items-center mb-6 max max-w-[1400px] m-auto'>
        <TextField
          label='Suchen'
          variant='outlined'
          className='flex-1'
          type='search'
          value={searchValue}
          onChange={handleSearchChange}
        />
        <FormControl className='md:w-[250px]' disabled={isWatchlist}>
          <InputLabel id='genre-label'>Genre</InputLabel>
          <Select
            labelId='genre-label'
            label='Genre'
            value={selectedGenre}
            onChange={handleGenreChange}
          >
            <MenuItem value='All'>All</MenuItem>
            <MenuItem value='Action & Adventure'>Action & Adventure</MenuItem>
            <MenuItem value='Animation'>Animation</MenuItem>
            <MenuItem value='Comedy'>Comedy</MenuItem>
            <MenuItem value='Crime'>Crime</MenuItem>
            <MenuItem value='Drama'>Drama</MenuItem>
            <MenuItem value='Documentary'>Documentary</MenuItem>
            <MenuItem value='Family'>Family</MenuItem>
            <MenuItem value='Kids'>Kids</MenuItem>
            <MenuItem value='Mystery'>Mystery</MenuItem>
            <MenuItem value='Reality'>Reality</MenuItem>
            <MenuItem value='Sci-Fi & Fantasy'>Sci-Fi & Fantasy</MenuItem>
            <MenuItem value='Talk'>Talk</MenuItem>
            <MenuItem value='War & Politics'>War & Politics</MenuItem>
            <MenuItem value='Western'>Western</MenuItem>
            <MenuItem value='Ohne Bewertung'>Ohne Bewertung</MenuItem>
            <MenuItem value='Neue Episoden'>Neue Episoden</MenuItem>
            <MenuItem value='Zuletzt Hinzugefügt'>Zuletzt Hinzugefügt</MenuItem>
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
            <MenuItem value='All'>Alle</MenuItem>
            <MenuItem value='Amazon Prime Video'>Prime Video</MenuItem>
            <MenuItem value='Animation Digital Network'>ADN</MenuItem>
            <MenuItem value='Apple TV Plus'>AppleTV+</MenuItem>
            <MenuItem value='Crunchyroll'>Crunchyroll</MenuItem>
            <MenuItem value='Disney Plus'>Disney+</MenuItem>
            <MenuItem value='Freevee'>Freevee</MenuItem>
            <MenuItem value='Joyn Plus'>Joyn+</MenuItem>
            <MenuItem value='MagentaTV'>MagentaTV</MenuItem>
            <MenuItem value='Netflix'>Netflix</MenuItem>
            <MenuItem value='Paramount Plus'>Paramount+</MenuItem>
            <MenuItem value='RTL+'>RTL+</MenuItem>
            <MenuItem value='WOW'>WOW</MenuItem>
          </Select>
        </FormControl>
        <Box className='flex gap-3'>
          <Tooltip
            title={isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'}
          >
            <Button
              variant={isWatchlist ? 'contained' : 'outlined'}
              onClick={handleWatchlistToggle}
              sx={{
                margin: 'auto',
                borderRadius: '0.5rem',
                width: 48,
                height: 48,
                minWidth: 48,
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
                width: 48,
                height: 48,
                minWidth: 48,
              }}
              aria-label='Als nächstes schauen'
              role='button'
            >
              <ListIcon />
            </Button>
          </Tooltip>
        </Box>
        <WatchlistDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          sortedWatchlistSeries={sortedWatchlistSeries}
          handleWatchedToggleWithConfirmation={
            handleWatchedToggleWithConfirmation
          }
          setWatchlistSeries={setWatchlistSeries}
        />
      </Box>
    );
  }
);
export default SearchFilters;
