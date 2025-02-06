import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import CloseIcon from '@mui/icons-material/Close';
import ListIcon from '@mui/icons-material/List';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  SelectChangeEvent,
  Tooltip,
} from '@mui/material';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { Check } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { useAuth } from '../App';
import { Series } from '../interfaces/Series';

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
    const [sortOption, setSortOption] = useState('name-asc');

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

    const formatDateWithLeadingZeros = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

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

    const toggleSortOption = (field: string) => {
      setSortOption((prevOption) => {
        const [prevField, prevOrder] = prevOption.split('-');
        if (prevField === field) {
          return `${field}-${prevOrder === 'asc' ? 'desc' : 'asc'}`;
        }
        return `${field}-asc`;
      });
    };

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
        <FormControl className='md:w-[250px]'>
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
        <FormControl className='md:w-[250px]'>
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
        <Dialog open={dialogOpen} onClose={handleDialogClose} fullWidth>
          <DialogTitle variant='h1' textAlign={'center'}>
            Weiterschauen
            <IconButton
              aria-label='close'
              onClick={handleDialogClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'red',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box className='flex flex-col mb-4'>
              <Divider />
              <Box className='flex justify-between items-center mb-2 mt-2'>
                <span className='text-gray-400'>Filter:</span>
                <Box className='flex items-center'>
                  <Tooltip title='Nach Name sortieren'>
                    <Button
                      onClick={() => toggleSortOption('name')}
                      sx={{
                        color: '#00fed7',
                        minWidth: '80px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'normal !important',
                        justifyContent: 'center',
                        // Schrift etwas nach unten verschieben
                      }}
                      endIcon={
                        sortOption.startsWith('name') ? (
                          sortOption === 'name-asc' ? (
                            <ArrowUpwardIcon
                              fontSize='small'
                              style={{ width: '16px' }}
                            />
                          ) : (
                            <ArrowDownwardIcon
                              fontSize='small'
                              style={{ width: '16px' }}
                            />
                          )
                        ) : (
                          <ArrowDownwardIcon
                            style={{ visibility: 'hidden', width: '16px' }}
                            fontSize='small'
                          />
                        )
                      }
                    >
                      Name
                    </Button>
                  </Tooltip>
                  <Tooltip title='Nach Datum sortieren'>
                    <Button
                      onClick={() => toggleSortOption('date')}
                      sx={{
                        color: '#00fed7',
                        minWidth: '80px',
                        fontSize: '0.75rem',
                        display: 'flex',
                        alignItems: 'normal !important',
                        justifyContent: 'center',
                        // Schrift etwas nach unten verschieben
                      }}
                      endIcon={
                        sortOption.startsWith('date') ? (
                          sortOption === 'date-asc' ? (
                            <ArrowUpwardIcon
                              fontSize='small'
                              style={{ width: '16px' }}
                            />
                          ) : (
                            <ArrowDownwardIcon
                              fontSize='small'
                              style={{ width: '16px' }}
                            />
                          )
                        ) : (
                          <ArrowDownwardIcon
                            style={{ visibility: 'hidden', width: '16px' }}
                            fontSize='small'
                          />
                        )
                      }
                    >
                      Datum
                    </Button>
                  </Tooltip>
                </Box>
              </Box>
              <Divider />
            </Box>
            {sortedWatchlistSeries.map((series) => {
              const nextUnwatchedEpisode = getNextUnwatchedEpisode(series);

              return (
                <Box
                  key={series.id}
                  className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm flex items-center'
                >
                  <img
                    className='w-[92px] mr-4'
                    src={series.poster.poster}
                    alt={series.title}
                  />
                  <div className='flex-1'>
                    <div className='font-medium text-[#00fed7]'>
                      {series.title}
                    </div>
                    {nextUnwatchedEpisode ? (
                      <>
                        <div className='mt-1 text-xs text-gray-400'>
                          Nächste Folge: S
                          {nextUnwatchedEpisode.seasonNumber + 1} E
                          {nextUnwatchedEpisode.episodeIndex + 1} -{' '}
                          {nextUnwatchedEpisode.name}
                        </div>
                        <div className='mt-1 text-xs text-gray-400'>
                          Erscheinungsdatum:{' '}
                          {formatDateWithLeadingZeros(
                            new Date(nextUnwatchedEpisode.air_date)
                          )}
                        </div>
                      </>
                    ) : (
                      <div className='mt-1 text-xs text-gray-400'>
                        Alle Episoden gesehen.
                      </div>
                    )}
                  </div>
                  {nextUnwatchedEpisode && (
                    <IconButton
                      onClick={() => {
                        handleWatchedToggleWithConfirmation(
                          nextUnwatchedEpisode.seasonNumber,
                          nextUnwatchedEpisode.episodeIndex,
                          series.id,
                          series.nmr
                        );
                        setWatchlistSeries((prevSeries) =>
                          prevSeries.map((s) =>
                            s.id === series.id
                              ? {
                                  ...s,
                                  seasons: s.seasons.map((season) =>
                                    season.seasonNumber ===
                                    nextUnwatchedEpisode.seasonNumber
                                      ? {
                                          ...season,
                                          episodes: season.episodes.map(
                                            (episode, index) =>
                                              index ===
                                              nextUnwatchedEpisode.episodeIndex
                                                ? {
                                                    ...episode,
                                                    watched: !episode.watched,
                                                  }
                                                : episode
                                          ),
                                        }
                                      : season
                                  ),
                                }
                              : s
                          )
                        );
                      }}
                      sx={{ color: '#00fed7' }}
                    >
                      <Check />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </DialogContent>
        </Dialog>
      </Box>
    );
  }
);
export default SearchFilters;
