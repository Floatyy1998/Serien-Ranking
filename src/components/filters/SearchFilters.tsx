import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ListIcon from '@mui/icons-material/List';
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
import Firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { shuffle } from 'lodash';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import {
  genreIdMapForSeries,
  genreMenuItems,
  providerMenuItems,
} from '../../constants/menuItems';
import { useFriends } from '../../contexts/FriendsProvider';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { Series } from '../../interfaces/Series';
import AddSeriesDialog from '../dialogs/AddSeriesDialog';
import DiscoverSeriesDialog from '../dialogs/DiscoverSeriesDialog';
import RecommendationsDialog from '../dialogs/RecommendationsDialog';
import WatchlistDialog from '../dialogs/Watchlist/WatchlistDialog';
interface SearchFiltersProps {
  onSearchChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onProviderChange: (value: string) => void;
}
// React 19: Automatische Memoization - kein memo nötig
export const SearchFilters = ({
  onSearchChange,
  onGenreChange,
  onProviderChange,
}: SearchFiltersProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedProvider, setSelectedProvider] = useState('All');
  const [isWatchlist, setIsWatchlist] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogDiscoverOpen, setDialogDiscoverOpen] = useState(false);
  const [watchlistSeries, setWatchlistSeries] = useState<Series[]>([]);
  const [sortOption] = useState('date-desc');
  const { seriesList } = useSeriesList();
  const { updateUserActivity } = useFriends();
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
        const watchlistSeries = (seriesList || []).filter(
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
    async (
      seasonNumber: number,
      episodeIndex: number,
      seriesId: number,
      seriesNmr: number
    ) => {
      if (user) {
        const episodeRef = Firebase.database().ref(
          `${user.uid}/serien/${seriesNmr}/seasons/${seasonNumber}/episodes/${episodeIndex}`
        );

        // Erst die Episode-Daten abrufen für Activity-Logging
        const snapshot = await episodeRef.once('value');
        const episode = snapshot.val();
        const wasWatched = episode.watched;
        const newWatchedStatus = !wasWatched;

        // Episode-Status umschalten
        await episodeRef.update({ watched: newWatchedStatus });

        // Activity tracken für Freunde (nur wenn Episode als geschaut markiert wird)
        if (!wasWatched) {
          // Finde die Serie um den Titel zu bekommen
          const series = seriesList.find((s) => s.nmr === seriesNmr);
          if (series) {
            // Ermittle Episode-Nummer aus Index wenn episode.episode nicht verfügbar ist
            const episodeNumber = episode.episode || episodeIndex + 1;

            await updateUserActivity({
              type: 'episode_watched',
              itemTitle: `${
                series.title || series.original_name || 'Unbekannte Serie'
              } - Staffel ${seasonNumber} Episode ${episodeNumber}`,
              tmdbId: series.id, // TMDB ID verwenden
            });
          }
        }

        // Lokalen State mit dem korrekten neuen Wert aktualisieren
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
                              ? { ...episode, watched: newWatchedStatus }
                              : episode
                          ),
                        }
                      : season
                  ),
                }
              : series
          )
        );
      }
    },
    [user, updateUserActivity, seriesList]
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

  const handleDialogRecommendationsOpen = async () => {
    setLoadingRecommendations(true);
    setDialogRecommendationsOpen(true);

    const randomSeries = shuffle(seriesList).slice(0, 5);
    const allRecommendations = [];

    for (const series of randomSeries) {
      const response = await fetch(
        `https://api.themoviedb.org/3/tv/${series.id}/recommendations?api_key=d812a3cdd27ca10d95979a2d45d100cd&language=de-DE`
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
          media_type: 'tv',
        }))
      );
    }

    const uniqueRecommendations = allRecommendations.filter(
      (rec, index, self) =>
        index === self.findIndex((r) => r.id === rec.id) &&
        !seriesList.some((series) => series.id === rec.id)
    );

    setRecommendations(uniqueRecommendations.sort(() => 0.5 - Math.random()));
    setBasedOnSeries(randomSeries);
    setLoadingRecommendations(false);
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
          <>
            <Tooltip title='Unveröffentlichte Serien entdecken'>
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
          <Divider
            className='hidden'
            orientation='vertical'
            flexItem
            sx={{ display: { xl: 'block' }, ml: 1 }}
          />
        </Box>
      </Box>
      <Box className='flex flex-col lg:flex-row items-center gap-2'>
        <FormControl className='w-[250px]' disabled={isWatchlist}>
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
        <FormControl className='w-[250px]' disabled={isWatchlist}>
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
      <>
        <Divider
          className='hidden'
          orientation='vertical'
          flexItem
          sx={{ display: { xl: 'block' } }}
        />
        <Box className='flex gap-3 justify-center md:justify-start mt-0'>
          <Tooltip
            title={isWatchlist ? 'Watchlist ausblenden' : 'Watchlist anzeigen'}
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
          <Tooltip title='Als nächstes schauen'>
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
      </>
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
