import AddIcon from '@mui/icons-material/Add';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ExploreIcon from '@mui/icons-material/Explore';
import ListIcon from '@mui/icons-material/List';
import RecommendIcon from '@mui/icons-material/Recommend';
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
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { genreMenuItems, providerMenuItems } from '../../constants/menuItems';
import { useFriends } from '../../contexts/FriendsProvider';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { useProtectedEpisodeUpdate } from '../../hooks/useProtectedEpisodeUpdate';
import { Series } from '../../interfaces/Series';
import {
  logBadgeRewatch,
  logEpisodeWatched,
} from '../../utils/badgeActivityLogger';
import { calculateOverallRating } from '../../utils/rating';
import { generateRecommendations } from '../../utils/recommendationEngine';
import {
  getNextRewatchEpisode,
  hasActiveRewatch,
} from '../../utils/rewatch.utils';
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

  // 🛡️ Hook für geschützte Episode-Updates
  const { updateEpisode } = useProtectedEpisodeUpdate();

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

        let updateData: any;

        if (wasWatched) {
          // Episode ist bereits geschaut - erhöhe watchCount für Rewatch
          const currentWatchCount = episode.watchCount || 1;
          updateData = {
            watched: true,
            watchCount: currentWatchCount + 1,
          };
        } else {
          // Episode war noch nicht geschaut - markiere als geschaut
          updateData = {
            watched: true,
            watchCount: 1,
          };
        }

        // �️ Geschütztes Firebase-Update (mit automatischem Retry)
        try {
          await updateEpisode(
            user.uid,
            seriesNmr,
            seasonNumber,
            episodeIndex,
            updateData
          );
        } catch (error) {
          console.error('Episode update failed:', error);
          // Update wird automatisch erneut versucht durch useProtectedEpisodeUpdate
        }

        // Optimiertes Activity-Logging - nur bei wichtigen Changes
        if (!wasWatched) {
          // Finde die Serie um den Titel zu bekommen
          const series = seriesList.find((s) => s.nmr === seriesNmr);
          if (series) {
            // Ermittle Episode-Nummer aus Index wenn episode.episode nicht verfügbar ist
            const episodeNumber = episode.episode || episodeIndex + 1;
            const seriesTitle =
              series.title || series.original_name || 'Unbekannte Serie';

            await updateUserActivity({
              type: 'episode_watched',
              itemTitle: `${seriesTitle} - Staffel ${seasonNumber} Episode ${episodeNumber}`,
              tmdbId: series.id, // TMDB ID verwenden
            });

            // 🏆 BADGE-SYSTEM: Episode-Watching Activity loggen
            await logEpisodeWatched(
              user.uid,
              seriesTitle,
              seasonNumber,
              episodeNumber,
              series.id,
              episode.air_date || episode.airDate, // airDate für Quickwatch-Detection
              false // isRewatch = false für neue Episoden
            );
          }
        } else if (wasWatched) {
          // 🏆 BADGE-SYSTEM: Rewatch Activity loggen
          const series = seriesList.find((s) => s.nmr === seriesNmr);
          if (series) {
            const seriesTitle =
              series.title || series.original_name || 'Unbekannte Serie';

            await logBadgeRewatch(
              user.uid,
              seriesTitle,
              series.id,
              episode.air_date || episode.airDate,
              1 // episodeCount = 1 für einzelne Episode
            );
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
                              ? { ...episode, ...updateData }
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
    if (!series.seasons || !Array.isArray(series.seasons)) {
      return null;
    }

    // Prüfe zuerst auf echte ungesehene Episoden (haben immer Vorrang!)
    for (const season of series.seasons) {
      if (!season.episodes || !Array.isArray(season.episodes)) {
        continue;
      }

      for (let i = 0; i < season.episodes.length; i++) {
        const episode = season.episodes[i];
        if (!episode.watched) {
          return {
            ...episode,
            seasonNumber: season.seasonNumber,
            episodeIndex: i,
            isRewatch: false,
          };
        }
      }
    }

    // Nur wenn keine ungesehenen Episoden vorhanden sind: Prüfe auf Rewatch-Episoden
    if (hasActiveRewatch(series)) {
      const nextRewatch = getNextRewatchEpisode(series);
      if (nextRewatch) {
        return {
          ...nextRewatch,
          seasonNumber: nextRewatch.seasonNumber,
          episodeIndex: nextRewatch.episodeIndex,
          isRewatch: true,
        };
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
