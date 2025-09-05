import { Box, Typography } from '@mui/material';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../../../App';
import { useSeriesList } from '../../../contexts/OptimizedSeriesListProvider';
import { useStats } from '../../../features/stats/StatsProvider';
import { useDebounce } from '../../../hooks/useDebounce';
import { useEnhancedFirebaseCache } from '../../../hooks/useEnhancedFirebaseCache';
import { TodayEpisode } from '../../../types/TodayEpisode';
// Removed legacy imports - using minimalActivityLogger instead
// Legacy import entfernt
import { getFormattedTime } from '../../../lib/date/date.utils';
import { calculateOverallRating } from '../../../lib/rating/rating';
import SeriesWatchedDialog from '../dialogs/SeriesWatchedDialog';
import TodayEpisodesDialog from '../dialogs/TodayEpisodesDialog';
import { SeriesCard } from './SeriesCard';
interface SeriesGridProps {
  searchValue: string;
  selectedGenre: string;
  selectedProvider: string;
  selectedSpecialFilter?: string;
  viewOnlyMode?: boolean;
  targetUserId?: string;
}
// React 19: Automatische Memoization - kein memo nötig
export const SeriesGrid = ({
  searchValue,
  selectedGenre,
  selectedProvider,
  selectedSpecialFilter = '',
  viewOnlyMode = false,
  targetUserId,
}: SeriesGridProps) => {
  const { seriesList: contextSeriesList } = useSeriesList();
  const auth = useAuth();
  const user = auth?.user;
  // const { updateUserActivity } = useOptimizedFriends(); // Nicht mehr benötigt - keine Friend-Activities für Episodes
  const debouncedSearchValue = useDebounce(searchValue, 300);
  const [visibleCount, setVisibleCount] = useState(20);
  const [startIndex, setStartIndex] = useState(0);
  const [showTodayDialog, setShowTodayDialog] = useState(false);
  const [todayEpisodes, setTodayEpisodes] = useState<TodayEpisode[]>([]);
  const [watchedDialogSeriesId, setWatchedDialogSeriesId] = useState<
    number | null
  >(null);
  const [isWatchedDialogReadOnly, setIsWatchedDialogReadOnly] = useState(false);
  const { seriesStatsData } = useStats();
  
  // Zeige Empty State nur wenn Daten fertig geladen sind
  // Diese Hooks MÜSSEN vor allen conditional returns stehen!
  const [hasMounted, setHasMounted] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setHasMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

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

  // 🚀 Enhanced Freund-Serien über optimierten Cache laden
  const { data: friendSeriesData, loading: friendSeriesLoading } =
    useEnhancedFirebaseCache<Record<string, any>>(
      targetUserId ? `${targetUserId}/serien` : '',
      {
        ttl: 2 * 60 * 1000, // 2 Minuten Cache
        useRealtimeListener: true, // Realtime für Live-Updates
        enableOfflineSupport: true, // Offline-Unterstützung für Freund-Serien
      }
    );

  const friendSeriesList = friendSeriesData
    ? Object.values(friendSeriesData)
    : [];

  // Verwende entweder Freund-Serien oder eigene Serien
  const seriesList = targetUserId ? friendSeriesList : contextSeriesList;

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
        (selectedGenre === 'Watchlist' && series.watchlist) ||
        series.genre?.genres?.includes(selectedGenre);

      const matchesSpecialFilter =
        !selectedSpecialFilter ||
        (selectedSpecialFilter === 'Neue Episoden' &&
          typeof series.nextEpisode?.episode === 'number' &&
          series.nextEpisode?.nextEpisode &&
          new Date(series.nextEpisode.nextEpisode).getTime() >=
            new Date().setHours(0, 0, 0, 0)) ||
        (selectedSpecialFilter === 'Ohne Bewertung' &&
          calculateOverallRating(series) === '0.00') ||
        (selectedSpecialFilter === 'Begonnen' && (() => {
          // Berechne Fortschritt für "Begonnen" Filter - nur ausgestrahlte Episoden
          if (!series.seasons || series.seasons.length === 0) return false;
          
          const now = new Date();
          
          // Zähle nur ausgestrahlte Episoden
          const airedEpisodes = series.seasons.reduce(
            (sum: number, season: any) => {
              const aired = season.episodes?.filter((e: any) => {
                const airDate = e.air_date || e.airDate;
                if (!airDate) return false; // Kein Datum = nicht ausgestrahlt
                return new Date(airDate) <= now;
              })?.length || 0;
              return sum + aired;
            },
            0
          );
          
          if (airedEpisodes === 0) return false; // Keine ausgestrahlten Episoden
          
          const watchedEpisodes = series.seasons.reduce(
            (sum: number, season: any) => {
              const watched = season.episodes?.filter((e: any) => {
                if (!e.watched) return false;
                const airDate = e.air_date || e.airDate;
                if (!airDate) return false; // Kein Datum = nicht zählen
                return new Date(airDate) <= now;
              })?.length || 0;
              return sum + watched;
            },
            0
          );
          
          // Nur zeigen wenn mindestens eine Episode gesehen wurde, aber nicht alle ausgestrahlten
          return watchedEpisodes > 0 && watchedEpisodes < airedEpisodes;
        })()) ||
        selectedSpecialFilter === 'Zuletzt Hinzugefügt';
      const matchesProvider =
        selectedProvider === 'All' ||
        (series.provider?.provider &&
          series.provider.provider.some(
            (p: any) => p.name === selectedProvider
          ));
      return matchesSearch && matchesGenre && matchesProvider && matchesSpecialFilter;
    });

    const sorted = filtered.sort((a, b) => {
      if (selectedSpecialFilter === 'Neue Episoden') {
        const dateA = a.nextEpisode?.nextEpisode
          ? new Date(a.nextEpisode.nextEpisode).getTime()
          : 0;
        const dateB = b.nextEpisode?.nextEpisode
          ? new Date(b.nextEpisode.nextEpisode).getTime()
          : 0;
        return dateA - dateB;
      }
      if (selectedSpecialFilter === 'Zuletzt Hinzugefügt') {
        return b.nmr - a.nmr;
      }
      if (selectedSpecialFilter === 'Begonnen') {
        // Sortiere nach Fortschritt (höherer Fortschritt zuerst) - nur ausgestrahlte Episoden
        const getProgress = (series: any) => {
          if (!series.seasons || series.seasons.length === 0) return 0;
          
          const now = new Date();
          
          const airedEpisodes = series.seasons.reduce(
            (sum: number, season: any) => {
              const aired = season.episodes?.filter((e: any) => {
                const airDate = e.air_date || e.airDate;
                if (!airDate) return false; // Kein Datum = nicht ausgestrahlt
                return new Date(airDate) <= now;
              })?.length || 0;
              return sum + aired;
            },
            0
          );
          
          const watchedEpisodes = series.seasons.reduce(
            (sum: number, season: any) => {
              const watched = season.episodes?.filter((e: any) => {
                if (!e.watched) return false;
                const airDate = e.air_date || e.airDate;
                if (!airDate) return false; // Kein Datum = nicht zählen
                return new Date(airDate) <= now;
              })?.length || 0;
              return sum + watched;
            },
            0
          );
          
          return airedEpisodes > 0 ? (watchedEpisodes / airedEpisodes) * 100 : 0;
        };
        
        const progressA = getProgress(a);
        const progressB = getProgress(b);
        return progressB - progressA; // Höherer Fortschritt zuerst
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
    if (
      !contextSeriesList.length ||
      !user ||
      isDontShowTodayActive() ||
      isDialogShownThisSession() ||
      targetUserId
    ) {
      return;
    }

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
      // Warte bis Splashscreen fertig ist
      const checkSplashComplete = setInterval(() => {
        if (window.splashScreenComplete) {
          clearInterval(checkSplashComplete);
          setTimeout(() => {
            setTodayEpisodes(episodesToday);
            setShowTodayDialog(true);
            // setDialogShownThisSession(); // Markiere erst beim Schließen als gezeigt
          }, 500); // Kurze Verzögerung nach Splashscreen
        }
      }, 100);
      
      // Fallback nach 10 Sekunden
      setTimeout(() => {
        clearInterval(checkSplashComplete);
        if (!showTodayDialog) {
          setTodayEpisodes(episodesToday);
          setShowTodayDialog(true);
        }
      }, 10000);
    }
  }, [contextSeriesList, user, targetUserId]);

  // BADGE-MIGRATION TEMPORARILY DISABLED (prevents activity spam)
  useEffect(() => {
    const runBadgeMigration = async () => {
      if (!user || targetUserId) return;

      // Prüfe ob Migration bereits gelaufen ist
      const migrationKey = `badgeMigration_${user.uid}`;
      const alreadyMigrated = localStorage.getItem(migrationKey);

      if (alreadyMigrated) {
        return;
      }

      // MIGRATION TEMPORARILY DISABLED to prevent activity spam

      localStorage.setItem(migrationKey, 'disabled_spam_prevention');
      return;
    };

    // Funktion zum Migrieren bestehender Ratings

    // Verzögerung um sicherzustellen, dass Serien geladen sind
    if (contextSeriesList.length > 0) {
      setTimeout(runBadgeMigration, 2000);
    }
  }, [user, contextSeriesList.length, targetUserId]);

  const handleDialogClose = () => {
    setShowTodayDialog(false);
    setDialogShownThisSession(); // Jetzt erst als gezeigt markieren
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
            // Von 1x (Haken) auf ungesehen - entferne watchCount und firstWatchedAt komplett
            const { watchCount, firstWatchedAt, ...episodeWithoutWatchCount } = e;
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
          return { 
            ...e, 
            watched: true, 
            watchCount: targetWatchCount,
            firstWatchedAt: e.firstWatchedAt || new Date().toISOString()
          };
        });
      } else if (forceWatched) {
        updatedEpisodes = season.episodes.map((e: any) => ({
          ...e,
          watched: true,
          watchCount: e.watched ? e.watchCount : 1,
          firstWatchedAt: e.firstWatchedAt || new Date().toISOString(),
        }));
      } else {
        updatedEpisodes = season.episodes.map((e: any) => {
          if (!allWatched && !e.watched) {
            // Episode wird als watched markiert
            return { 
              ...e, 
              watched: true, 
              watchCount: 1,
              firstWatchedAt: e.firstWatchedAt || new Date().toISOString()
            };
          } else if (allWatched) {
            // Episode wird als unwatch markiert - entferne watchCount und firstWatchedAt
            const { watchCount, firstWatchedAt, ...episodeWithoutWatchCount } = e;
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
          if (isRewatch) {
            // Rewatch der gesamten Staffel
            // 🚫 Keine Friend-Activity für Season-Rewatch
            // Nur Badge-System Activity logging für Season Rewatch
            const { logSeasonWatchedClean } = await import(
              '../../../features/badges/minimalActivityLogger'
            );
            await logSeasonWatchedClean(user.uid, updatedEpisodes.length);
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
                const { logSeasonWatchedClean } = await import(
                  '../../../features/badges/minimalActivityLogger'
                );
                await logSeasonWatchedClean(user.uid, season.episodes.length);
              } else {
                // Teilweise Staffel geschaut - Nur Badge-System Logging
                // Badge für einzelne Episoden loggen (KEINE Friend-Activities)
                const { updateEpisodeCounters } = await import(
                  '../../../features/badges/minimalActivityLogger'
                );

                // Alle Episoden einzeln durchgehen für zeitbasierte Binge-Erkennung
                for (const episode of previouslyUnwatched) {
                  await updateEpisodeCounters(
                    user.uid,
                    false, // nicht rewatch
                    episode.air_date || episode.airDate
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
            // Von 1x (Haken) auf ungesehen - entferne watchCount und firstWatchedAt komplett
            const { watchCount, firstWatchedAt, ...episodeWithoutWatchCount } = e;
            return { ...episodeWithoutWatchCount, watched: false };
          }
        } else if (isRewatch === true) {
          // Rewatch: Erhöhe watchCount
          const currentWatchCount = e.watchCount || 1;
          return { ...e, watched: true, watchCount: currentWatchCount + 1 };
        } else {
          // Normaler Toggle
          const nowWatched = !e.watched;
          if (nowWatched) {
            // Episode wird als gesehen markiert
            return {
              ...e,
              watched: true,
              watchCount: 1,
              firstWatchedAt: e.firstWatchedAt || new Date().toISOString(),
            };
          } else {
            // Episode wird als nicht gesehen markiert - entferne watchCount und firstWatchedAt
            const { watchCount, firstWatchedAt, ...episodeWithoutFields } = e;
            return {
              ...episodeWithoutFields,
              watched: false,
            };
          }
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

      // Badge-System Activity logging für Episode-Changes (KEINE Friend-Activity)
      const episode = season.episodes.find((e: any) => e.id === episodeId);
      if (episode && !targetUserId && user?.uid) {
        if (isRewatch && episode.watched) {
          // Rewatch-Activity
          const { updateEpisodeCounters } = await import(
            '../../../features/badges/minimalActivityLogger'
          );
          await updateEpisodeCounters(user.uid, true, episode.air_date);
        } else if (forceUnwatch && episode.watched) {
          // Unwatch-Activity: Keine Badge-Updates
          return; // Kein Batch für Unwatch
        } else if (!forceUnwatch) {
          // Normale Episode geschaut - Badge-System aufrufen
          const { updateEpisodeCounters } = await import(
            '../../../features/badges/minimalActivityLogger'
          );
          await updateEpisodeCounters(
            user.uid,
            isRewatch, // Rewatch-Flag korrekt setzen
            episode.air_date || episode.airDate
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
              const { logSeasonWatchedClean } = await import(
                '../../../features/badges/minimalActivityLogger'
              );
              await logSeasonWatchedClean(
                user.uid,
                currentSeason.episodes.length
              );
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
          episodes: s.episodes.map((e: any) => {
            // Nur neue firstWatchedAt setzen, wenn Episode noch nicht gesehen war
            const updates: any = { 
              ...e, 
              watched: true,
            };
            
            // Setze firstWatchedAt nur wenn es noch nicht existiert und die Episode vorher nicht gesehen war
            if (!e.watched && !e.firstWatchedAt) {
              updates.firstWatchedAt = new Date().toISOString();
            } else if (e.firstWatchedAt) {
              // Behalte existierendes firstWatchedAt
              updates.firstWatchedAt = e.firstWatchedAt;
            }
            // Wenn Episode bereits watched war aber kein firstWatchedAt hat, lass es weg (nicht undefined setzen)
            
            return updates;
          }),
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
        // Badge-System für Batch-Episoden aufrufen
        const { logBatchEpisodesWatchedClean } = await import(
          '../../../features/badges/minimalActivityLogger'
        );
        await logBatchEpisodesWatchedClean(
          user.uid,
          episodesToMark.map((episode) => ({
            tmdbId: series.id,
            isRewatch: false,
            airDate: episode.air_date || episode.airDate || '',
          }))
        );
      }
      
      // Update the watched dialog series state
      setWatchedDialogSeries({
        ...series,
        seasons: updatedSeasons,
      });
    } catch (error) {
      // console.error('Error updating batch watched status:', error);
    }
  };


  // Diese Funktion wird für "Alle markieren" Button verwendet
  const handleEpisodeBatchWatchedToggle = async (
    episodeIds: number[],
    watched: boolean
  ) => {
    if (!user || !watchedDialogSeries || viewOnlyMode) return;

    const series = watchedDialogSeries;
    
    // Update alle übergebenen Episoden
    const updatedSeasons = series.seasons.map((season: any) => {
      const updatedEpisodes = season.episodes.map((episode: any) => {
        if (episodeIds.includes(episode.id)) {
          if (watched) {
            // Episode wird als gesehen markiert
            return { 
              ...episode, 
              watched: true,
              watchCount: 1,
              firstWatchedAt: episode.firstWatchedAt || new Date().toISOString()
            };
          } else {
            // Episode wird als nicht gesehen markiert
            const { watchCount, firstWatchedAt, ...episodeWithoutFields } = episode;
            return {
              ...episodeWithoutFields,
              watched: false
            };
          }
        }
        return episode;
      });
      
      return { ...season, episodes: updatedEpisodes };
    });

    try {
      await firebase
        .database()
        .ref(`${targetUserId || user?.uid}/serien/${series.nmr}/seasons`)
        .set(updatedSeasons);

      // Badge-System Activity logging für Batch-Operationen
      if (!targetUserId && user?.uid && watched && episodeIds.length > 0) {
        // Nutze Batch-Logging statt einzelne Updates
        const { logBatchEpisodesWatchedClean } = await import(
          '../../../features/badges/minimalActivityLogger'
        );
        
        // Sammle alle Episode-Daten für Batch-Update
        const episodesToLog = [];
        for (const episodeId of episodeIds) {
          for (const season of series.seasons) {
            const episode = season.episodes?.find((e: any) => e.id === episodeId);
            if (episode) {
              episodesToLog.push({
                tmdbId: series.id,
                isRewatch: false,
                airDate: episode.air_date || episode.airDate || ''
              });
              break;
            }
          }
        }
        
        // Ein einziger Batch-Call statt vieler einzelner
        if (episodesToLog.length > 0) {
          await logBatchEpisodesWatchedClean(user.uid, episodesToLog);
        }
      }
    } catch (error) {
      // console.error('Error updating batch episodes:', error);
    }
  };

  // Optimized scroll handler with RAF-based throttling
  const rafId = useRef<number | null>(null);
  const lastScrollTime = useRef<number>(0);
  
  const handleScroll = useCallback(() => {
    const now = Date.now();
    // Skip if less than 100ms since last update
    if (now - lastScrollTime.current < 100) {
      return;
    }
    
    lastScrollTime.current = now;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const fullHeight = document.body.offsetHeight;

    // Berechne Grid-Parameter
    const cardWidth = 230;
    const cardHeight = 444;
    const gap = 75;
    let columns = Math.floor(window.innerWidth / (cardWidth + gap));
    if (columns < 1) columns = 1;

    const rowHeight = cardHeight + gap;
    const viewportStart = Math.max(0, scrollTop - windowHeight);
    const viewportEnd = scrollTop + windowHeight * 2; // Buffer für smooth scrolling

    // Berechne sichtbare Reihen
    const startRow = Math.floor(viewportStart / rowHeight);
    const endRow = Math.ceil(viewportEnd / rowHeight);

    const newStartIndex = Math.max(0, startRow * columns);
    const newEndIndex = Math.min(
      filteredSeries?.length || 0,
      (endRow + 1) * columns
    );
    const newVisibleCount = newEndIndex - newStartIndex;

    // Virtualization: Aktiviere bei mehr als 40 Serien für bessere Performance
    if (filteredSeries?.length > 40) {
      setStartIndex(newStartIndex);
      setVisibleCount(Math.min(newVisibleCount, 60)); // Max 60 Cards gleichzeitig (reduziert von 80)
    } else {
      // Bei wenigen Serien: normales infinite scroll, aber limitiert auf 40 max
      if (
        scrollTop + windowHeight >= fullHeight - 1000 &&
        visibleCount < Math.min(40, filteredSeries?.length || 0)
      ) {
        const itemsToAdd = Math.min(columns, 8); // Reduziert von 12 auf 8
        setVisibleCount((prev) =>
          Math.min(prev + itemsToAdd, 40, filteredSeries?.length || 0)
        );
      }
    }
  }, [filteredSeries?.length, visibleCount]);

  useEffect(() => {
    const scrollListener = () => {
      // Cancel any pending RAF
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
      
      // Schedule new RAF
      rafId.current = requestAnimationFrame(handleScroll);
    };
    
    window.addEventListener('scroll', scrollListener, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', scrollListener);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [handleScroll]);

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
    // Keine weitere Prüfung nötig - Liste ist leer
  }

  // Check if viewing another user's profile
  const isOtherUser = targetUserId && targetUserId !== user?.uid;
  const isLoading = targetUserId ? friendSeriesLoading : false;

  // Empty State für anderen Benutzer mit leerer Serie-Liste
  if (isOtherUser && !isLoading) {
    const filteredEmptySeries = seriesList.filter(series => {
      const matchesSearch = (series.name || '')
        .toLowerCase()
        .includes(debouncedSearchValue.toLowerCase());
      return matchesSearch;
    });

    if (filteredEmptySeries.length === 0 && selectedGenre === 'All') {
      return (
        <Box 
          className='flex justify-center items-center w-full h-full'
          sx={{
            animation: 'fadeIn 0.5s ease-in-out',
            '@keyframes fadeIn': {
              '0%': { opacity: 0 },
              '100%': { opacity: 1 }
            }
          }}
        >
          <Typography variant='h2' className='text-center'>
            Dieser Benutzer hat noch keine Serien hinzugefügt.
          </Typography>
        </Box>
      );
    }
  }
  
  if (hasMounted && filteredSeries?.length === 0 && selectedGenre === 'All') {
    return (
      <Box 
        className='flex justify-center items-center w-full h-full'
        sx={{
          animation: 'fadeIn 0.5s ease-in-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 }
          }
        }}
      >
        <Typography variant='h2' className='text-center'>
          {targetUserId
            ? 'Dieser Benutzer hat noch keine Serien hinzugefügt.'
            : 'Noch keine Serien vorhanden. Füge eine Serie über das Menü hinzu.'}
        </Typography>
      </Box>
    );
  }
  // Berechne welche Serien gerendert werden sollen
  // Aktiviere Virtualisierung bei mehr als 40 Serien (war 60, jetzt niedriger für bessere Performance)
  const shouldVirtualize = filteredSeries?.length > 40;
  const visibleSeries = shouldVirtualize
    ? filteredSeries.slice(startIndex, startIndex + visibleCount)
    : filteredSeries?.slice(0, Math.min(visibleCount, 40)); // Max 40 Cards ohne Virtualizierung

  // Berechne Spacer-Höhen für Virtualization
  const cardHeight = 444;
  const gap = 75;
  const cardWidth = 230;
  const columns = Math.max(
    1,
    Math.floor(window.innerWidth / (cardWidth + gap))
  );
  const rowHeight = cardHeight + gap;

  const topSpacerHeight = shouldVirtualize
    ? Math.floor(startIndex / columns) * rowHeight
    : 0;

  const remainingItems = filteredSeries?.length - startIndex - visibleCount;
  const bottomSpacerHeight =
    shouldVirtualize && remainingItems > 0
      ? Math.ceil(remainingItems / columns) * rowHeight
      : 0;

  return (
    <>
      <Box sx={{ width: '100%', m: 0, p: 0 }}>
        {/* Top Spacer für Virtualization */}
        {topSpacerHeight > 0 && (
          <Box sx={{ height: `${topSpacerHeight}px`, width: '100%' }} />
        )}

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
          {visibleSeries?.map((series, index) => (
            <Box
              key={series.id || series.nmr || startIndex + index}
              sx={{ width: '230px', height: '444px' }}
            >
              <SeriesCard
                series={series}
                genre={selectedSpecialFilter || selectedGenre}
                index={startIndex + index + 1}
                disableRatingDialog={viewOnlyMode}
                forceReadOnlyDialogs={viewOnlyMode}
                disableDeleteDialog={viewOnlyMode}
              />
            </Box>
          ))}
        </Box>

        {/* Bottom Spacer für Virtualization */}
        {bottomSpacerHeight > 0 && (
          <Box sx={{ height: `${bottomSpacerHeight}px`, width: '100%' }} />
        )}
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
