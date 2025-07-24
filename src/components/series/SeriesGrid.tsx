import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../App';
import { useFriends } from '../../contexts/FriendsProvider';
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
  viewOnlyMode?: boolean;
  targetUserId?: string;
}
// React 19: Automatische Memoization - kein memo nötig
export const SeriesGrid = ({
  searchValue,
  selectedGenre,
  selectedProvider,
  viewOnlyMode = false,
  targetUserId,
}: SeriesGridProps) => {
  const { seriesList: contextSeriesList } = useSeriesList();
  const auth = useAuth();
  const user = auth?.user;
  const { updateUserActivity } = useFriends();
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showTodayDialog, setShowTodayDialog] = useState(false);
  const [todayEpisodes, setTodayEpisodes] = useState<TodayEpisode[]>([]);
  const [watchedDialogSeriesId, setWatchedDialogSeriesId] = useState<
    number | null
  >(null);
  const [isWatchedDialogReadOnly, setIsWatchedDialogReadOnly] = useState(false);
  const { seriesStatsData } = useStats();
  const dialogShown = useRef(false);
  const initialLoadComplete = useRef(false);

  // Freund-Serien State
  const [friendSeriesList, setFriendSeriesList] = useState<any[]>([]);
  const [friendSeriesLoading, setFriendSeriesLoading] = useState(false);

  // Verwende entweder Freund-Serien oder eigene Serien
  // Aber nur wenn Freund-Daten geladen wurden oder kein targetUserId gesetzt ist
  const seriesList = targetUserId
    ? friendSeriesLoading
      ? []
      : friendSeriesList
    : contextSeriesList;

  // Lade Freund-Serien wenn targetUserId gesetzt ist
  useEffect(() => {
    if (!targetUserId) {
      setFriendSeriesList([]);
      return;
    }

    setFriendSeriesLoading(true);
    const friendSeriesRef = firebase.database().ref(`${targetUserId}/serien`);

    const listener = friendSeriesRef.on('value', (snapshot) => {
      const data = snapshot.val();

      if (data === null && !snapshot.exists()) {
        setFriendSeriesList([]);
      } else if (data) {
        const seriesArray = Object.values(data);
        setFriendSeriesList(seriesArray);
      } else {
        setFriendSeriesList([]);
      }

      setFriendSeriesLoading(false);
    });

    return () => {
      friendSeriesRef.off('value', listener);
    };
  }, [targetUserId]);

  // Finde die aktuelle Serie für den Dialog aus der aktuellen seriesList
  const [watchedDialogSeries, setWatchedDialogSeries] = useState<any>(null);

  // Explizit auf watchedDialogSeriesId Änderungen reagieren
  useEffect(() => {
    if (watchedDialogSeriesId === null || watchedDialogSeriesId === undefined) {
      setWatchedDialogSeries(null);
      return;
    }

    const foundSeries =
      seriesList.find((s) => s.nmr === watchedDialogSeriesId) || null;
    setWatchedDialogSeries(foundSeries);
  }, [watchedDialogSeriesId, seriesList]);

  // React 19: Automatische Memoization - kein useMemo nötig
  // Direkte Filterung ohne stableFilteredSeries für bessere Datenintegrität
  const filteredSeries = (() => {
    const filtered = seriesList.filter((series) => {
      const matchesSearch =
        series.title
          ?.toLowerCase()
          ?.includes(debouncedSearchValue?.toLowerCase() || '') ?? true;
      const matchesGenre =
        selectedGenre === 'All' ||
        (selectedGenre === 'Neue Episoden' &&
          typeof series.nextEpisode?.episode === 'number') ||
        (selectedGenre === 'Ohne Bewertung' &&
          calculateOverallRating(series) === '0.00') ||
        selectedGenre === 'Zuletzt Hinzugefügt' ||
        (selectedGenre === 'Watchlist' && series.watchlist) ||
        series.genre?.genres?.includes(selectedGenre);
      const matchesProvider =
        selectedProvider === 'All' ||
        (series.provider?.provider &&
          series.provider.provider.some(
            (p: any) => p.name === selectedProvider
          ));
      return matchesSearch && matchesGenre && matchesProvider;
    });

    const sorted = filtered.sort((a, b) => {
      if (selectedGenre === 'Neue Episoden') {
        const dateA = a.nextEpisode?.nextEpisode
          ? new Date(a.nextEpisode.nextEpisode).getTime()
          : 0;
        const dateB = b.nextEpisode?.nextEpisode
          ? new Date(b.nextEpisode.nextEpisode).getTime()
          : 0;
        return dateA - dateB;
      }
      if (selectedGenre === 'Zuletzt Hinzugefügt') {
        return b.nmr - a.nmr;
      }
      // Für Freund-Profile: immer nach Rating sortieren
      if (targetUserId) {
        const ratingA = parseFloat(calculateOverallRating(a));
        const ratingB = parseFloat(calculateOverallRating(b));
        return ratingB - ratingA;
      }
      const ratingA = parseFloat(calculateOverallRating(a));
      const ratingB = parseFloat(calculateOverallRating(b));
      return ratingB - ratingA;
    });

    return sorted;
  })();
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
  }, [
    debouncedSearchValue,
    selectedGenre,
    selectedProvider,
    filteredSeries?.length,
  ]);
  useEffect(() => {
    // Today Dialog nur für eigene Serien, nicht für Freunde
    // Nur beim ersten Laden der Serien anzeigen, nicht bei Filter-Änderungen
    if (
      !seriesList.length ||
      !user ||
      dialogShown.current ||
      targetUserId ||
      initialLoadComplete.current
    )
      return;

    initialLoadComplete.current = true;

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
              seriesTitle: series.title || 'Unbekannte Serie',
              episodeTitle: series.nextEpisode?.title || 'Unbekannte Episode',
              releaseTime: getFormattedTime(episodeDate.toISOString()),
              releaseTimestamp: episodeDate.getTime(),
              poster: series.poster?.poster || '',
              seasonNumber: series.nextEpisode?.season || 0,
              episodeNumber: series.nextEpisode?.episode || 0,
            });
          }
        }
        return acc;
      },
      []
    );
    if (episodesToday.length > 0) {
      setTimeout(() => {
        setTodayEpisodes(episodesToday);
        setShowTodayDialog(true);
        dialogShown.current = true;
      }, 1000);
    }
  }, [seriesList, user, targetUserId]);
  const handleDialogClose = () => {
    setShowTodayDialog(false);
  };

  // React 19: Automatische Memoization - kein useCallback nötig
  const handleWatchedDialogClose = () => {
    setWatchedDialogSeriesId(null);
  };

  // Event Listener für Dialog öffnen
  useEffect(() => {
    const handleOpenWatchedDialog = (event: any) => {
      const { series, isReadOnly } = event.detail;
      setWatchedDialogSeriesId(series.nmr);
      setIsWatchedDialogReadOnly(isReadOnly);
    };

    window.addEventListener('openWatchedDialog', handleOpenWatchedDialog);
    return () => {
      window.removeEventListener('openWatchedDialog', handleOpenWatchedDialog);
    };
  }, []);

  const handleWatchedToggleWithConfirmation = async (
    seasonNumber: number,
    episodeId: number,
    forceWatched: boolean = false
  ) => {
    if (!user || !watchedDialogSeries || viewOnlyMode) return;

    const series = watchedDialogSeries;
    const season = series.seasons.find(
      (s: any) => s.seasonNumber === seasonNumber
    );
    if (!season) return;

    if (episodeId === -1) {
      let updatedEpisodes;
      const allWatched = season.episodes.every((e: any) => e.watched);

      if (forceWatched) {
        updatedEpisodes = season.episodes.map((e: any) => ({
          ...e,
          watched: true,
        }));
      } else {
        updatedEpisodes = season.episodes.map((e: any) => ({
          ...e,
          watched: !allWatched,
        }));
      }

      const updatedSeasons = series.seasons.map((s: any) => {
        if (s.seasonNumber === seasonNumber) {
          return { ...s, episodes: updatedEpisodes };
        }
        return s;
      });

      try {
        await firebase
          .database()
          .ref(`${targetUserId || user?.uid}/serien/${series.nmr}/seasons`)
          .set(updatedSeasons);

        // Activity tracken für ganze Staffel (nur wenn nicht targetUserId und Episoden als gesehen markiert werden)
        if (!targetUserId && (forceWatched || !allWatched)) {
          const unwatchedEpisodes = season.episodes.filter(
            (e: any) => !e.watched
          );
          if (unwatchedEpisodes.length > 0) {
            // Sortiere Episoden nach Episode-Nummer
            const sortedUnwatched = unwatchedEpisodes.sort(
              (a: any, b: any) => (a.episode || 0) - (b.episode || 0)
            );
            const firstEpisode = sortedUnwatched[0];
            const lastEpisode = sortedUnwatched[sortedUnwatched.length - 1];

            let activityText;
            if (unwatchedEpisodes.length === 1) {
              activityText = `Staffel ${seasonNumber} Episode ${
                firstEpisode.episode || 'X'
              }`;
            } else if (unwatchedEpisodes.length === season.episodes.length) {
              activityText = `Staffel ${seasonNumber} komplett (Episode ${
                firstEpisode.episode || 1
              }-${lastEpisode.episode || season.episodes.length})`;
            } else {
              activityText = `Staffel ${seasonNumber} Episode ${
                firstEpisode.episode || 1
              }-${lastEpisode.episode || unwatchedEpisodes.length}`;
            }

            await updateUserActivity({
              type: 'episodes_watched',
              itemTitle: `${
                series.title || series.original_name || 'Unbekannte Serie'
              } - ${activityText}`,
              itemId: series.nmr,
            });
          }
        }
      } catch (error) {
        console.error('Error updating watched status:', error);
      }
      return;
    }

    const episodeIndex = season.episodes.findIndex(
      (e: any) => e.id === episodeId
    );
    if (episodeIndex === -1) return;

    const updatedEpisodes = season.episodes.map((e: any) => {
      if (e.id === episodeId) {
        return { ...e, watched: !e.watched };
      }
      return e;
    });
    const updatedSeasons = series.seasons.map((s: any) => {
      if (s.seasonNumber === seasonNumber) {
        return { ...s, episodes: updatedEpisodes };
      }
      return s;
    });
    try {
      await firebase
        .database()
        .ref(`${targetUserId || user?.uid}/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);

      // Activity tracken für Freunde (nur wenn Episode als geschaut markiert wird)
      const episode = season.episodes.find((e: any) => e.id === episodeId);
      if (episode && !episode.watched && !targetUserId) {
        // Ermittle Episode-Nummer aus Index wenn episode.episode nicht verfügbar ist
        const episodeNumber = episode.episode || episodeIndex + 1;
        // nur wenn von unwatched zu watched
        await updateUserActivity({
          type: 'episode_watched',
          itemTitle: `${
            series.title || series.original_name || 'Unbekannte Serie'
          } - Staffel ${seasonNumber} Episode ${episodeNumber}`,
          itemId: series.nmr,
        });
      }
    } catch (error) {
      console.error('Error updating watched status:', error);
    }
  };

  const handleBatchWatchedToggle = async (confirmSeason: number) => {
    if (!user || !watchedDialogSeries || viewOnlyMode) return;

    const series = watchedDialogSeries;

    // Sammle alle Episoden, die als gesehen markiert werden
    let episodesToMark: any[] = [];

    const updatedSeasons = series.seasons.map((s: any) => {
      if (s.seasonNumber <= confirmSeason) {
        // Sammle unwatched Episoden für Activity-Logging
        const unwatchedEpisodes = s.episodes.filter((e: any) => !e.watched);
        episodesToMark = episodesToMark.concat(
          unwatchedEpisodes.map((e: any) => ({
            ...e,
            seasonNumber: s.seasonNumber,
          }))
        );

        return {
          ...s,
          episodes: s.episodes.map((e: any) => ({ ...e, watched: true })),
        };
      }
      return s;
    });

    try {
      await firebase
        .database()
        .ref(`${targetUserId || user?.uid}/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);

      // Activity tracken für Batch-Operationen (nur wenn nicht targetUserId)
      if (!targetUserId && episodesToMark.length > 0) {
        // Gruppiere nach Staffeln
        const seasonGroups = episodesToMark.reduce((acc: any, episode) => {
          if (!acc[episode.seasonNumber]) {
            acc[episode.seasonNumber] = [];
          }
          acc[episode.seasonNumber].push(episode);
          return acc;
        }, {});

        // Erstelle Activity-Text
        const seasonTexts = Object.keys(seasonGroups)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((seasonNum) => {
            const episodes = seasonGroups[seasonNum];
            // Filtere und sortiere Episoden mit gültigen Episode-Nummern
            const validEpisodes = episodes
              .filter((e: any) => e.episode !== undefined && e.episode !== null)
              .sort((a: any, b: any) => a.episode - b.episode);

            if (validEpisodes.length === 0) {
              return `Staffel ${seasonNum} (${episodes.length} Episoden)`;
            }

            const firstEp = validEpisodes[0].episode;
            const lastEp = validEpisodes[validEpisodes.length - 1].episode;

            if (validEpisodes.length === 1) {
              return `Staffel ${seasonNum} Episode ${firstEp}`;
            } else {
              return `Staffel ${seasonNum} Episode ${firstEp}-${lastEp}`;
            }
          });

        let activityText;
        if (seasonTexts.length === 1) {
          activityText = seasonTexts[0];
        } else {
          activityText = seasonTexts.join(', ');
        }

        await updateUserActivity({
          type: 'episodes_watched',
          itemTitle: `${
            series.title || series.original_name || 'Unbekannte Serie'
          } - ${activityText}`,
          itemId: series.nmr,
        });
      }
    } catch (error) {
      console.error('Error updating watched status in batch:', error);
    }
  };

  const handleEpisodeBatchWatchedToggle = async (
    seasonNumber: number,
    episodeId: number
  ) => {
    if (!user || !watchedDialogSeries || viewOnlyMode) return;

    const series = watchedDialogSeries;

    // Sammle alle Episoden, die als gesehen markiert werden
    let episodesToMark: any[] = [];

    const updatedSeasons = series.seasons.map((s: any) => {
      if (s.seasonNumber < seasonNumber) {
        // Markiere alle Episoden in vorherigen Staffeln als gesehen
        const unwatchedEpisodes = s.episodes.filter((e: any) => !e.watched);
        episodesToMark = episodesToMark.concat(
          unwatchedEpisodes.map((e: any) => ({
            ...e,
            seasonNumber: s.seasonNumber,
          }))
        );

        return {
          ...s,
          episodes: s.episodes.map((e: any) => ({ ...e, watched: true })),
        };
      } else if (s.seasonNumber === seasonNumber) {
        // Markiere alle Episoden bis zur gewählten Episode (inklusive) als gesehen
        const episodeIndex = s.episodes.findIndex(
          (e: any) => e.id === episodeId
        );
        const unwatchedEpisodes = s.episodes
          .slice(0, episodeIndex + 1)
          .filter((e: any) => !e.watched);
        episodesToMark = episodesToMark.concat(
          unwatchedEpisodes.map((e: any) => ({
            ...e,
            seasonNumber: s.seasonNumber,
          }))
        );

        return {
          ...s,
          episodes: s.episodes.map((e: any, index: any) => ({
            ...e,
            watched: index <= episodeIndex ? true : e.watched,
          })),
        };
      }
      return s;
    });

    try {
      await firebase
        .database()
        .ref(`${targetUserId || user?.uid}/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);

      // Activity tracken für Episode-Batch-Operationen (nur wenn nicht targetUserId)
      if (!targetUserId && episodesToMark.length > 0) {
        // Gruppiere nach Staffeln
        const seasonGroups = episodesToMark.reduce((acc: any, episode) => {
          if (!acc[episode.seasonNumber]) {
            acc[episode.seasonNumber] = [];
          }
          acc[episode.seasonNumber].push(episode);
          return acc;
        }, {});

        // Erstelle Activity-Text
        const seasonTexts = Object.keys(seasonGroups)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .map((seasonNum) => {
            const episodes = seasonGroups[seasonNum];
            // Filtere und sortiere Episoden mit gültigen Episode-Nummern
            const validEpisodes = episodes
              .filter((e: any) => e.episode !== undefined && e.episode !== null)
              .sort((a: any, b: any) => a.episode - b.episode);

            if (validEpisodes.length === 0) {
              return `Staffel ${seasonNum} (${episodes.length} Episoden)`;
            }

            const firstEp = validEpisodes[0].episode;
            const lastEp = validEpisodes[validEpisodes.length - 1].episode;

            if (validEpisodes.length === 1) {
              return `Staffel ${seasonNum} Episode ${firstEp}`;
            } else {
              return `Staffel ${seasonNum} Episode ${firstEp}-${lastEp}`;
            }
          });

        let activityText;
        if (seasonTexts.length === 1) {
          activityText = seasonTexts[0];
        } else {
          activityText = seasonTexts.join(', ');
        }

        await updateUserActivity({
          type: 'episodes_watched',
          itemTitle: `${
            series.title || series.original_name || 'Unbekannte Serie'
          } - ${activityText}`,
          itemId: series.nmr,
        });
      }
    } catch (error) {
      console.error('Error updating watched status in episode batch:', error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.body.offsetHeight;

      if (
        scrollTop + windowHeight >= fullHeight - 1000 &&
        visibleCount < (filteredSeries?.length || 0)
      ) {
        const cardWidth = 230;
        const gap = 75;
        let columns = Math.floor(window.innerWidth / (cardWidth + gap));
        if (columns < 1) columns = 1;
        const remainder = visibleCount % columns;
        const itemsToAdd = remainder === 0 ? columns : columns - remainder;

        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, filteredSeries?.length || 0)
        );
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visibleCount, filteredSeries?.length]);

  // Kein Loading-State mehr - das globale Skeleton regelt das
  if (targetUserId && friendSeriesLoading) {
    return (
      <Box className='flex justify-center items-center w-full h-full'>
        <Typography variant='h2' className='text-center'>
          Lade Serien...
        </Typography>
      </Box>
    );
  }

  // Wenn targetUserId gesetzt ist, aber noch keine Daten geladen wurden
  if (targetUserId && !friendSeriesLoading && friendSeriesList.length === 0) {
    // Prüfe ob wirklich keine Serien vorhanden sind oder noch geladen wird
    const filteredEmptySeries = (friendSeriesList || []).filter((series) => {
      const matchesSearch = series.title
        .toLowerCase()
        .includes(debouncedSearchValue.toLowerCase());
      return matchesSearch;
    });

    if (filteredEmptySeries.length === 0 && selectedGenre === 'All') {
      return (
        <Box className='flex justify-center items-center w-full h-full'>
          <Typography variant='h2' className='text-center'>
            Dieser Benutzer hat noch keine Serien hinzugefügt.
          </Typography>
        </Box>
      );
    }
  }

  if (filteredSeries?.length === 0 && selectedGenre === 'All') {
    return (
      <Box className='flex justify-center items-center w-full h-full'>
        <Typography variant='h2' className='text-center'>
          {targetUserId
            ? 'Dieser Benutzer hat noch keine Serien hinzugefügt.'
            : 'Noch keine Serien vorhanden. Füge eine Serie über das Menü hinzu.'}
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
                disableRatingDialog={viewOnlyMode}
                forceReadOnlyDialogs={viewOnlyMode}
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
          handleEpisodeBatchWatchedToggle={handleEpisodeBatchWatchedToggle}
          isReadOnly={isWatchedDialogReadOnly}
        />
      )}
    </>
  );
};
export default SeriesGrid;
