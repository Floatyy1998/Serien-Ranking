import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InfinitySpin } from 'react-loader-spinner';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/SeriesListProvider';
import { useStats } from '../../contexts/StatsProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { TodayEpisode } from '../../interfaces/TodayEpisode';
import { getFormattedTime } from '../../utils/date.utils';
import { calculateOverallRating } from '../../utils/rating';
import SeriesWatchedDialog from '../dialogs/SeriesWatchedDialog';
import TodayEpisodesDialog from '../dialogs/TodayEpisodesDialog';
import { SeriesCard } from './SeriesCard';
interface SeriesGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
}
export const SeriesGrid = memo(
  ({ searchValue, selectedGenre, selectedProvider }: SeriesGridProps) => {
    const { seriesList, loading } = useSeriesList();
    const auth = useAuth();
    const user = auth?.user;
    const isSharedListPage = location.pathname.startsWith('/shared-list');
    const debouncedSearchValue = useDebounce(searchValue, 300);
    const [visibleCount, setVisibleCount] = useState(20);
    const [showTodayDialog, setShowTodayDialog] = useState(false);
    const [todayEpisodes, setTodayEpisodes] = useState<TodayEpisode[]>([]);
    const [watchedDialogSeriesId, setWatchedDialogSeriesId] = useState<
      number | null
    >(null);
    const [isWatchedDialogReadOnly, setIsWatchedDialogReadOnly] =
      useState(false);
    const { seriesStatsData } = useStats();
    const dialogShown = useRef(false);

    // Stabilisiere die Liste mit einem Ref um Re-Rendering zu vermeiden
    const stableFilteredSeries = useRef<any[]>([]);

    // Finde die aktuelle Serie für den Dialog aus der aktuellen seriesList
    const watchedDialogSeries = useMemo(() => {
      if (!watchedDialogSeriesId) return null;
      return seriesList.find((s) => s.nmr === watchedDialogSeriesId) || null;
    }, [seriesList, watchedDialogSeriesId]);

    const filteredSeries = useMemo(() => {
      const filtered = seriesList
        .filter((series) => {
          const matchesSearch = series.title
            .toLowerCase()
            .includes(debouncedSearchValue.toLowerCase());
          const matchesGenre =
            selectedGenre === 'All' ||
            (selectedGenre === 'Neue Episoden' &&
              typeof series.nextEpisode.episode === 'number') ||
            (selectedGenre === 'Ohne Bewertung' &&
              calculateOverallRating(series) === '0.00') ||
            selectedGenre === 'Zuletzt Hinzugefügt' ||
            (selectedGenre === 'Watchlist' && series.watchlist) ||
            series.genre.genres.includes(selectedGenre);
          const matchesProvider =
            selectedProvider === 'All' ||
            (series.provider?.provider &&
              series.provider.provider.some(
                (p) => p.name === selectedProvider
              ));
          return matchesSearch && matchesGenre && matchesProvider;
        })
        .sort((a, b) => {
          if (selectedGenre === 'Neue Episoden') {
            return (
              new Date(a.nextEpisode.nextEpisode).getTime() -
              new Date(b.nextEpisode.nextEpisode).getTime()
            );
          }
          if (selectedGenre === 'Zuletzt Hinzugefügt') {
            return b.nmr - a.nmr;
          }
          const ratingA = parseFloat(calculateOverallRating(a));
          const ratingB = parseFloat(calculateOverallRating(b));
          return ratingB - ratingA;
        });

      if (
        JSON.stringify(filtered.map((s) => s.nmr)) !==
        JSON.stringify(stableFilteredSeries.current.map((s) => s.nmr))
      ) {
        stableFilteredSeries.current = filtered;
      }

      return stableFilteredSeries.current;
    }, [seriesList, debouncedSearchValue, selectedGenre, selectedProvider]);
    useEffect(() => {
      const cardWidth = 230;
      const gap = 75;
      let columns = Math.floor(window.innerWidth / (cardWidth + gap));
      if (columns < 1) columns = 1;
      const base = 20;
      let initialVisible = Math.ceil(base / columns) * columns;
      if (initialVisible > filteredSeries?.length) {
        initialVisible = filteredSeries?.length;
      }
      setVisibleCount(initialVisible);
    }, [debouncedSearchValue, selectedGenre, selectedProvider, filteredSeries]);
    useEffect(() => {
      if (!seriesList.length || !user || dialogShown.current) return;
      const now = Date.now();
      const storedHideUntil = localStorage.getItem('todayDontShow');
      if (storedHideUntil && now < parseInt(storedHideUntil)) return;
      const episodesToday: TodayEpisode[] = seriesList.reduce<TodayEpisode[]>(
        (acc, series) => {
          if (series.nextEpisode && series.nextEpisode.nextEpisode) {
            const episodeDate = new Date(series.nextEpisode.nextEpisode);
            if (
              new Date().getFullYear() === episodeDate.getFullYear() &&
              new Date().getMonth() === episodeDate.getMonth() &&
              new Date().getDate() === episodeDate.getDate()
            ) {
              acc.push({
                id: series.id,
                seriesTitle: series.title,
                episodeTitle: series.nextEpisode.title,
                releaseTime: getFormattedTime(episodeDate.toISOString()),
                releaseTimestamp: episodeDate.getTime(),
                poster: series.poster.poster,
                seasonNumber: series.nextEpisode.season,
                episodeNumber: series.nextEpisode.episode,
              });
            }
          }
          return acc;
        },
        []
      );
      if (episodesToday.length > 0 && !isSharedListPage) {
        setTimeout(() => {
          setTodayEpisodes(episodesToday);
          setShowTodayDialog(true);
          dialogShown.current = true;
        }, 1000);
      }
    }, [
      seriesList,
      user,
      debouncedSearchValue,
      selectedGenre,
      selectedProvider,
    ]);
    const handleDialogClose = () => {
      setShowTodayDialog(false);
    };

    const handleWatchedDialogClose = useCallback(() => {
      setWatchedDialogSeriesId(null);
    }, []);

    // Event Listener für Dialog öffnen
    useEffect(() => {
      const handleOpenWatchedDialog = (event: any) => {
        const { series, isReadOnly } = event.detail;
        setWatchedDialogSeriesId(series.nmr);
        setIsWatchedDialogReadOnly(isReadOnly);
      };

      window.addEventListener('openWatchedDialog', handleOpenWatchedDialog);
      return () => {
        window.removeEventListener(
          'openWatchedDialog',
          handleOpenWatchedDialog
        );
      };
    }, []);

    const handleWatchedToggleWithConfirmation = async (
      seasonNumber: number,
      episodeId: number,
      forceWatched: boolean = false
    ) => {
      if (!user || !watchedDialogSeries) return;

      const series = watchedDialogSeries;
      const season = series.seasons.find(
        (s) => s.seasonNumber === seasonNumber
      );
      if (!season) return;

      if (episodeId === -1) {
        let updatedEpisodes;
        if (forceWatched) {
          updatedEpisodes = season.episodes.map((e) => ({
            ...e,
            watched: true,
          }));
        } else {
          const allWatched = season.episodes.every((e) => e.watched);
          updatedEpisodes = season.episodes.map((e) => ({
            ...e,
            watched: !allWatched,
          }));
        }
        const updatedSeasons = series.seasons.map((s) => {
          if (s.seasonNumber === seasonNumber) {
            return { ...s, episodes: updatedEpisodes };
          }
          return s;
        });
        try {
          await firebase
            .database()
            .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
            .set(updatedSeasons);
        } catch (error) {
          console.error('Error updating watched status:', error);
        }
        return;
      }

      const episodeIndex = season.episodes.findIndex((e) => e.id === episodeId);
      if (episodeIndex === -1) return;

      const updatedEpisodes = season.episodes.map((e) => {
        if (e.id === episodeId) {
          return { ...e, watched: !e.watched };
        }
        return e;
      });
      const updatedSeasons = series.seasons.map((s) => {
        if (s.seasonNumber === seasonNumber) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });
      try {
        await firebase
          .database()
          .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
          .set(updatedSeasons);
      } catch (error) {
        console.error('Error updating watched status:', error);
      }
    };

    const handleBatchWatchedToggle = async (confirmSeason: number) => {
      if (!user || !watchedDialogSeries) return;

      const series = watchedDialogSeries;
      const updatedSeasons = series.seasons.map((s) => {
        if (s.seasonNumber <= confirmSeason) {
          return {
            ...s,
            episodes: s.episodes.map((e) => ({ ...e, watched: true })),
          };
        }
        return s;
      });
      try {
        await firebase
          .database()
          .ref(`${user?.uid}/serien/${series.nmr}/seasons`)
          .set(updatedSeasons);
      } catch (error) {
        console.error('Error updating watched status in batch:', error);
      }
    };

    const handleWindowScroll = useCallback(() => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;
      if (
        scrollTop + windowHeight >= fullHeight - 1000 &&
        visibleCount < filteredSeries?.length
      ) {
        const cardWidth = 230;
        const gap = 75;
        let columns = Math.floor(window.innerWidth / (cardWidth + gap));
        if (columns < 1) columns = 1;
        const remainder = visibleCount % columns;
        const itemsToAdd = remainder === 0 ? columns : columns - remainder;
        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, filteredSeries?.length)
        );
      }
    }, [filteredSeries?.length, visibleCount]);
    useEffect(() => {
      window.addEventListener('scroll', handleWindowScroll);
      return () => window.removeEventListener('scroll', handleWindowScroll);
    }, [handleWindowScroll]);
    if (loading) {
      return (
        <Box className='flex justify-center items-center w-full h-full'>
          <InfinitySpin color='#00fed7' />
        </Box>
      );
    }
    if (filteredSeries?.length === 0 && selectedGenre === 'All') {
      return (
        <Box className='flex justify-center items-center w-full h-full'>
          <Typography variant='h2' className='text-center'>
            Noch keine Serien vorhanden. Füge eine Serie über das Menü hinzu.
          </Typography>
        </Box>
      );
    }
    return (
      <>
        <Box sx={{ width: '100%', m: 0, p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '75px',
              justifyContent: 'center',
              p: 2,
              boxSizing: 'border-box',
            }}
          >
            {filteredSeries?.slice(0, visibleCount).map((series, index) => (
              <Box key={series.nmr} sx={{ width: '230px', height: '444px' }}>
                <SeriesCard
                  series={series}
                  genre={selectedGenre}
                  index={index + 1}
                />
              </Box>
            ))}
          </Box>
        </Box>
        <TodayEpisodesDialog
          open={showTodayDialog}
          onClose={handleDialogClose}
          episodes={todayEpisodes}
          userStats={seriesStatsData?.userStats}
        />
        {watchedDialogSeries && (
          <SeriesWatchedDialog
            open={!!watchedDialogSeries}
            onClose={handleWatchedDialogClose}
            series={watchedDialogSeries}
            user={user}
            handleWatchedToggleWithConfirmation={
              handleWatchedToggleWithConfirmation
            }
            handleBatchWatchedToggle={handleBatchWatchedToggle}
            isReadOnly={isWatchedDialogReadOnly}
          />
        )}
      </>
    );
  }
);
export default SeriesGrid;
