import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';
import { useStats } from '../../contexts/StatsProvider';
import { useDebounce } from '../../hooks/useDebounce';
import { TodayEpisode } from '../../interfaces/TodayEpisode';
import { activityBatchManager } from '../../utils/activityBatchManager';
import BadgeSystem from '../../utils/badgeSystem';
import { EpisodeWatchData } from '../../utils/batchActivity.utils';
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
  // const { updateUserActivity } = useOptimizedFriends(); // Nicht mehr benötigt - keine Friend-Activities für Episodes
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const [visibleCount, setVisibleCount] = useState(20);
  const [showTodayDialog, setShowTodayDialog] = useState(false);
  const [todayEpisodes, setTodayEpisodes] = useState<TodayEpisode[]>([]);
  const [watchedDialogSeriesId, setWatchedDialogSeriesId] = useState<
    number | null
  >(null);
  const [isWatchedDialogReadOnly, setIsWatchedDialogReadOnly] = useState(false);
  const { seriesStatsData } = useStats();

  // Prüfe ob der Benutzer "heute nicht mehr anzeigen" gewählt hat
  const isDontShowTodayActive = () => {
    const now = Date.now();
    const storedHideUntil = localStorage.getItem('todayDontShow');
    return storedHideUntil && now < parseInt(storedHideUntil);
  };

  // Prüfe ob der Dialog bereits in dieser Session gezeigt wurde
  const isDialogShownThisSession = () => {
    return sessionStorage.getItem('todayDialogShownThisSession') === 'true';
  };

  // Markiere Dialog als in dieser Session gezeigt
  const setDialogShownThisSession = () => {
    sessionStorage.setItem('todayDialogShownThisSession', 'true');
  };

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
    // Nur anzeigen wenn nicht durch "heute nicht mehr anzeigen" verhindert
    // und noch nicht in dieser Session gezeigt
    if (
      !contextSeriesList.length ||
      !user ||
      isDontShowTodayActive() ||
      isDialogShownThisSession() ||
      targetUserId
    )
      return;

    const episodesToday: TodayEpisode[] = contextSeriesList.reduce<
      TodayEpisode[]
    >((acc, series) => {
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
    }, []);

    if (episodesToday.length > 0) {
      setTimeout(() => {
        setTodayEpisodes(episodesToday);
        setShowTodayDialog(true);
        setDialogShownThisSession(); // Markiere als in dieser Session gezeigt
      }, 1000);
    }
  }, [contextSeriesList, user, targetUserId]);

  // 🏆 EINMALIGE BADGE-MIGRATION für Explorer & Collector Badges
  useEffect(() => {
    const runBadgeMigration = async () => {
      if (!user || targetUserId) return;

      // Prüfe ob Migration bereits gelaufen ist
      const migrationKey = `badgeMigration_${user.uid}`;
      const alreadyMigrated = localStorage.getItem(migrationKey);

      if (alreadyMigrated) {
        return;
      }

      try {
        // 1️⃣ SCHRITT: Migriere bestehende Ratings zu Badge-Activities
        await migrateExistingRatings();

        // 2️⃣ SCHRITT: Führe Badge-Neukalkulation durch
        const badgeSystem = new BadgeSystem(user.uid);
        const newBadges = await badgeSystem.recalculateAllBadges();

        if (newBadges.length > 0) {
          // Badge-System Activity logging
        }

        // Markiere Migration als abgeschlossen
        localStorage.setItem(migrationKey, 'completed');
      } catch (error) {
        // Badge-Migration Fehler
      }
    };

    // Funktion zum Migrieren bestehender Ratings
    const migrateExistingRatings = async () => {
      if (!user) return;

      try {
        // Lade alle Serien
        const seriesSnapshot = await firebase
          .database()
          .ref(`${user.uid}/serien`)
          .once('value');

        // Lade alle Filme
        const moviesSnapshot = await firebase
          .database()
          .ref(`${user.uid}/filme`)
          .once('value');

        let ratingCount = 0;

        // Migriere Serien-Ratings
        if (seriesSnapshot.exists()) {
          const seriesData = seriesSnapshot.val();
          for (const series of Object.values(seriesData) as any[]) {
            if (series.rating && typeof series.rating === 'object') {
              // Jede bewertete Serie als rating_added Activity loggen
              const overallRating = calculateOverallRating(series);
              if (parseFloat(overallRating) > 0) {
                // Import der badgeActivityLogger Funktion direkt
                const { logBadgeRating } = await import(
                  '../../utils/badgeActivityLogger'
                );
                await logBadgeRating(
                  user.uid,
                  series.title || 'Unbekannte Serie',
                  parseFloat(overallRating),
                  series.id,
                  'series'
                );
                ratingCount++;
              }
            }
          }
        }

        // Migriere Film-Ratings
        if (moviesSnapshot.exists()) {
          const moviesData = moviesSnapshot.val();
          for (const movie of Object.values(moviesData) as any[]) {
            if (movie.rating && typeof movie.rating === 'object') {
              // Jeden bewerteten Film als rating_added Activity loggen
              const overallRating = calculateOverallRating(movie);
              if (parseFloat(overallRating) > 0) {
                const { logBadgeRating } = await import(
                  '../../utils/badgeActivityLogger'
                );
                await logBadgeRating(
                  user.uid,
                  movie.title || 'Unbekannter Film',
                  parseFloat(overallRating),
                  movie.id,
                  'movie'
                );
                ratingCount++;
              }
            }
          }
        }
      } catch (error) {
        // Fehler bei Rating-Migration
      }
    };

    // Verzögerung um sicherzustellen, dass Serien geladen sind
    if (contextSeriesList.length > 0) {
      setTimeout(runBadgeMigration, 2000);
    }
  }, [user, contextSeriesList.length, targetUserId]);

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
    forceWatched: boolean = false,
    isRewatch: boolean = false,
    forceUnwatch: boolean = false
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

      if (forceUnwatch) {
        // Unwatch für gesamte Staffel: Reduziere watchCount schrittweise für alle Episoden
        updatedEpisodes = season.episodes.map((e: any) => {
          if (!e.watched) return e; // Ungesehene Episoden bleiben unverändert

          const currentWatchCount = e.watchCount || 1;
          if (currentWatchCount > 2) {
            // Von 3x auf 2x, 4x auf 3x, etc.
            return { ...e, watched: true, watchCount: currentWatchCount - 1 };
          } else if (currentWatchCount === 2) {
            // Von 2x auf 1x (normaler Haken)
            return { ...e, watched: true, watchCount: 1 };
          } else {
            // Von 1x (Haken) auf ungesehen - entferne watchCount Feld komplett
            const { watchCount, ...episodeWithoutWatchCount } = e;
            return { ...episodeWithoutWatchCount, watched: false };
          }
        });
      } else if (isRewatch === true) {
        // Rewatch für gesamte Staffel
        const watchCounts = season.episodes.map((e: any) => e.watchCount || 1);
        const maxWatchCount = Math.max(...watchCounts);
        const minWatchCount = Math.min(...watchCounts);

        // Wenn alle Episoden den gleichen watchCount haben, erhöhe alle um 1
        // Sonst setze alle auf die höchste watchCount
        const targetWatchCount =
          maxWatchCount === minWatchCount ? maxWatchCount + 1 : maxWatchCount;

        updatedEpisodes = season.episodes.map((e: any) => {
          return { ...e, watched: true, watchCount: targetWatchCount };
        });
      } else if (forceWatched) {
        updatedEpisodes = season.episodes.map((e: any) => ({
          ...e,
          watched: true,
          watchCount: e.watched ? e.watchCount : 1,
        }));
      } else {
        updatedEpisodes = season.episodes.map((e: any) => {
          if (!allWatched && !e.watched) {
            // Episode wird als watched markiert
            return { ...e, watched: true, watchCount: 1 };
          } else if (allWatched) {
            // Episode wird als unwatch markiert - entferne watchCount Feld
            const { watchCount, ...episodeWithoutWatchCount } = e;
            return { ...episodeWithoutWatchCount, watched: false };
          } else {
            // Keine Änderung
            return e;
          }
        });
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

        // Activity tracken für ganze Staffel
        if (!targetUserId) {
          const seriesTitle =
            series.title || series.original_name || 'Unbekannte Serie';

          if (isRewatch) {
            // Rewatch der gesamten Staffel
            const watchCounts = updatedEpisodes.map(
              (e: any) => e.watchCount || 1
            );
            const minWatchCount = Math.min(...watchCounts);

            // 🚫 Keine Friend-Activity für Season-Rewatch
            // Nur Badge-System Activity logging für Season Rewatch
            const { logSeasonWatched } = await import(
              '../../utils/badgeActivityLogger'
            );
            await logSeasonWatched(
              user.uid,
              seriesTitle,
              seasonNumber,
              updatedEpisodes.length,
              series.id,
              true // isRewatch
            );
          } else if (forceUnwatch) {
            // Season Unwatch - nur loggen wenn watchCount reduziert wurde
            const hasReducedWatchCount = updatedEpisodes.some((e: any) => {
              const originalEpisode = season.episodes.find(
                (orig: any) => orig.id === e.id
              );
              return (
                originalEpisode &&
                (originalEpisode.watchCount || 1) > (e.watchCount || 1)
              );
            });

            if (hasReducedWatchCount) {
              const watchCounts = updatedEpisodes
                .filter((e: any) => e.watched)
                .map((e: any) => e.watchCount || 1);
              const avgWatchCount =
                watchCounts.length > 0
                  ? Math.round(
                      watchCounts.reduce((a: number, b: number) => a + b, 0) /
                        watchCounts.length
                    )
                  : 1;

              // 🚫 Keine Friend-Activity für Season-Watch-Count-Änderung
            }
          } else if (forceWatched || !allWatched) {
            // Finde die Episoden die GERADE als watched markiert wurden (waren vorher unwatched)
            const previouslyUnwatched = season.episodes.filter(
              (e: any) => !e.watched
            );
            const nowWatched = updatedEpisodes.filter((e: any) => e.watched);
            const newlyWatchedCount =
              nowWatched.length -
              (season.episodes.length - previouslyUnwatched.length);

            if (newlyWatchedCount > 0) {
              // Direkte Activity für Staffel-Checkbox mit korrekter Staffelnummer
              if (previouslyUnwatched.length === season.episodes.length) {
                // Ganze Staffel wurde komplett geschaut - Nur Badge-System
                // 🚫 Keine Friend-Activity für Season-Complete

                // NUR Badge-System für Achievements
                const { logSeasonWatched } = await import(
                  '../../utils/badgeActivityLogger'
                );
                await logSeasonWatched(
                  user.uid,
                  seriesTitle,
                  seasonNumber,
                  season.episodes.length,
                  series.id,
                  false // nicht rewatch
                );
              } else {
                // Teilweise Staffel geschaut - Nur Badge-System Logging
                // 🏆 Badge für einzelne Episoden loggen (KEINE Friend-Activities)
                const { logEpisodeWatched } = await import(
                  '../../utils/badgeActivityLogger'
                );
                for (const episode of previouslyUnwatched) {
                  await logEpisodeWatched(
                    user.uid,
                    seriesTitle,
                    seasonNumber,
                    episode.episode || 1,
                    series.id,
                    episode.air_date || episode.airDate,
                    false // nicht rewatch
                  );
                }
              }
            }
          }
        }
      } catch (error) {
        // Error updating watched status
      }
      return;
    }

    const episodeIndex = season.episodes.findIndex(
      (e: any) => e.id === episodeId
    );
    if (episodeIndex === -1) return;

    const updatedEpisodes = season.episodes.map((e: any) => {
      if (e.id === episodeId) {
        if (forceUnwatch) {
          // Unwatch: Reduziere watchCount schrittweise
          const currentWatchCount = e.watchCount || 1;
          if (currentWatchCount > 2) {
            // Von 3x auf 2x, 4x auf 3x, etc.
            return { ...e, watched: true, watchCount: currentWatchCount - 1 };
          } else if (currentWatchCount === 2) {
            // Von 2x auf 1x (normaler Haken)
            return { ...e, watched: true, watchCount: 1 };
          } else {
            // Von 1x (Haken) auf ungesehen - entferne watchCount Feld komplett
            const { watchCount, ...episodeWithoutWatchCount } = e;
            return { ...episodeWithoutWatchCount, watched: false };
          }
        } else if (isRewatch === true) {
          // Rewatch: Erhöhe watchCount
          const currentWatchCount = e.watchCount || 1;
          return { ...e, watched: true, watchCount: currentWatchCount + 1 };
        } else {
          // Normaler Toggle
          return {
            ...e,
            watched: !e.watched,
            watchCount: e.watched ? undefined : 1,
          };
        }
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

      // Activity tracken für Freunde mit Batch-System
      const episode = season.episodes.find((e: any) => e.id === episodeId);
      if (episode && !targetUserId && user?.uid) {
        const episodeNumber = episode.episode || episodeIndex + 1;
        const seriesTitle =
          series.title || series.original_name || 'Unbekannte Serie';

        // Erstelle Episode-Daten für Batch-System
        const episodeData: EpisodeWatchData = {
          seriesTitle,
          seasonNumber,
          episodeNumber,
          episodeName: episode.name || `Episode ${episodeNumber}`,
          airDate: episode.air_date || '',
          watchedTimestamp: Date.now(),
          tmdbId: series.id,
          isRewatch: false,
          watchCount: 1,
        };

        if (isRewatch && episode.watched) {
          // Rewatch-Activity
          const newWatchCount = (episode.watchCount || 1) + 1;
          episodeData.isRewatch = true;
          episodeData.watchCount = newWatchCount;
        } else if (forceUnwatch && episode.watched) {
          // Unwatch-Activity: Erstelle direkte Activity (nicht batchbar)
          const currentWatchCount = episode.watchCount || 1;
          const newWatchCount =
            currentWatchCount > 1 ? currentWatchCount - 1 : 0;

          // 🚫 Keine Friend-Activity für Episode-Unwatch
          // Das ist auch eine Episode-bezogene Aktivität

          return; // Kein Batch für Unwatch
        }

        // Normale Episode oder Rewatch: Über Batch-System verarbeiten
        if (!forceUnwatch) {
          await activityBatchManager.addEpisodeActivity(user.uid, episodeData);

          // Badge-System Activity logging für einzelne Episode (KEINE Friend-Activity)
          if (!episode.watched) {
            // Neue Episode geschaut - nur Badge loggen
            const { logEpisodeWatched } = await import(
              '../../utils/badgeActivityLogger'
            );
            await logEpisodeWatched(
              user.uid,
              seriesTitle,
              seasonNumber,
              episodeNumber,
              series.id,
              episode.air_date || episode.airDate, // Beide Varianten berücksichtigen
              false // nicht rewatch
            );

            // 🎯 ZUSÄTZLICHE PRÜFUNG: Ist die ganze Staffel jetzt komplett nach einzelner Episode?
            const currentSeason = updatedSeasons.find(
              (s: any) => s.seasonNumber === seasonNumber
            );
            if (currentSeason) {
              const allEpisodesWatched = currentSeason.episodes.every(
                (e: any) => e.watched
              );
              if (allEpisodesWatched) {
                // ⚠️ WICHTIG: NUR Season-Badge loggen, KEINE Friend-Activity
                const { logSeasonWatched } = await import(
                  '../../utils/badgeActivityLogger'
                );
                await logSeasonWatched(
                  user.uid,
                  seriesTitle,
                  seasonNumber,
                  currentSeason.episodes.length,
                  series.id,
                  false // nicht rewatch
                );
              }
            }
          }
        }
      }
    } catch (error) {
      // Error updating watched status
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
        const seriesTitle =
          series.title || series.original_name || 'Unbekannte Serie';

        // Füge alle neu markierten Episoden zum Batch-Manager hinzu
        for (const episode of episodesToMark) {
          const episodeData: EpisodeWatchData = {
            seriesTitle,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episode || 1,
            episodeName: episode.name || `Episode ${episode.episode || 1}`,
            airDate: episode.air_date || episode.airDate || '',
            watchedTimestamp: Date.now(),
            tmdbId: series.id,
            isRewatch: false,
            watchCount: 1,
          };
          await activityBatchManager.addEpisodeActivity(user.uid, episodeData);
        }
      }
    } catch (error) {
      // Error updating watched status in batch
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
        const seriesTitle =
          series.title || series.original_name || 'Unbekannte Serie';

        // Füge alle neu markierten Episoden zum Batch-Manager hinzu
        for (const episode of episodesToMark) {
          const episodeData: EpisodeWatchData = {
            seriesTitle,
            seasonNumber: episode.seasonNumber,
            episodeNumber: episode.episode || 1,
            episodeName: episode.name || `Episode ${episode.episode || 1}`,
            airDate: episode.air_date || episode.airDate || '',
            watchedTimestamp: Date.now(),
            tmdbId: series.id,
            isRewatch: false,
            watchCount: 1,
          };
          await activityBatchManager.addEpisodeActivity(user.uid, episodeData);
        }
      }
    } catch (error) {
      // Error updating watched status in episode batch
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
            <Box
              key={series.id || series.nmr || index}
              sx={{ width: '230px', height: '444px' }}
            >
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
