import { Box, Typography } from '@mui/material';
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
    const { seriesStatsData } = useStats();
    const dialogShown = useRef(false);
    const filteredSeries = useMemo(() => {
      return seriesList
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
              <Box key={index} sx={{ width: '230px', height: '444px' }}>
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
      </>
    );
  }
);
export default SeriesGrid;
