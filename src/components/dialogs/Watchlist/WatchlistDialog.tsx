import {
  Box,
  Button,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import { useEffect, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../../../App';
// import { useOptimizedFriends } from '../../../contexts/OptimizedFriendsProvider'; // Nicht mehr benötigt
import { useSeriesList } from '../../../contexts/OptimizedSeriesListProvider';
import { useDataProtection } from '../../../hooks/useDataProtection';
import { useEnhancedFirebaseCache } from '../../../hooks/useEnhancedFirebaseCache';
import { useFirebaseBatch } from '../../../hooks/useFirebaseBatch';
import { Series } from '../../../interfaces/Series';
import {
  updateEpisodeCounters,
} from '../../../utils/minimalActivityLogger';
import {
  getNextRewatchEpisode,
  hasActiveRewatch,
} from '../../../utils/rewatch.utils';
import SeriesWatchedDialog from '../SeriesWatchedDialog';
import { DialogHeader } from '../shared/SharedDialogComponents';
import SeriesListItem from './SeriesListItem';
import WatchlistFilter from './WatchlistFilter';

interface WatchlistDialogProps {
  open: boolean;
  onClose: () => void;
  onSeriesUpdate?: () => void; // Callback für SearchFilters um Re-render zu triggern
}
const WatchlistDialog = ({
  open,
  onClose,
  onSeriesUpdate,
}: WatchlistDialogProps) => {
  const [filterInput, setFilterInput] = useState('');
  const [customOrderActive, setCustomOrderActive] = useState(
    localStorage.getItem('customOrderActive') === 'true'
  );
  const [sortOption, setSortOption] = useState('name-asc');
  const [hideRewatches, setHideRewatches] = useState(
    localStorage.getItem('hideRewatches') !== 'false'
  );
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const { user } = useAuth()!;
  const { seriesList, refetchSeries } = useSeriesList(); // Hole aktuelle Serien direkt aus Context + Cache-Invalidierung
  // const { updateUserActivity } = useOptimizedFriends(); // Nicht mehr benötigt - unified logger verwendet
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFilter, setShowFilter] = useState(!isMobile);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [dialogContentVisible, setDialogContentVisible] = useState(false);
  const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);

  // 🛡️ Datenschutz bei Seitenwechsel/Schließung
  const { addProtectedUpdate } = useDataProtection();

  // 🚀 Enhanced Watchlist-Order mit Cache & Offline-Support
  const { data: watchlistOrder } = useEnhancedFirebaseCache<number[]>(
    user ? `${user.uid}/watchlistOrder` : '',
    {
      ttl: 2 * 60 * 1000, // 2 Minuten Cache für Order
      useRealtimeListener: false, // Polling für Order ist OK
      enableOfflineSupport: true, // Offline-Unterstützung für Watchlist
    }
  );

  // 🚀 Batch-Updates für bessere Performance
  const { addUpdate: addBatchUpdate } = useFirebaseBatch({
    batchSize: 5,
    delayMs: 500,
  });

  // Erweiterte onClose Funktion mit Datenschutz
  const handleDialogClose = () => {
    onClose();
  };

  useEffect(() => {
    if (open) {
      setWatchlistDialogOpen(true);
      // Kleiner Delay um sicherzustellen, dass Dialog vollständig geöffnet ist
      const timer = setTimeout(() => setDialogContentVisible(true), 50);
      return () => clearTimeout(timer);
    } else {
      setDialogContentVisible(false);
      setWatchlistDialogOpen(false);
    }
  }, [open]);

  useEffect(() => {
    // Wenn SeriesWatchedDialog geöffnet wird, schließe WatchlistDialog temporär
    if (selectedSeries) {
      setWatchlistDialogOpen(false);
    } else if (open) {
      setWatchlistDialogOpen(true);
    }
  }, [selectedSeries, open]);

  useEffect(() => {
    localStorage.setItem('customOrderActive', customOrderActive.toString());
  }, [customOrderActive]);

  useEffect(() => {
    localStorage.setItem('hideRewatches', hideRewatches.toString());
  }, [hideRewatches]);

  // Definiere getNextUnwatchedEpisode ZUERST, bevor es verwendet wird
  const getNextUnwatchedEpisode = (series: Series) => {
    // Prüfe zuerst auf echte ungesehene Episoden (haben immer Vorrang!)
    for (const season of series.seasons) {
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
    if (!hideRewatches && hasActiveRewatch(series)) {
      const nextRewatch = getNextRewatchEpisode(series);
      if (nextRewatch) {
        return {
          ...nextRewatch,
          // Markiere als Rewatch-Episode für spätere Verwendung
          isRewatch: true,
          currentWatchCount: nextRewatch.currentWatchCount,
          targetWatchCount: nextRewatch.targetWatchCount,
        };
      }
    }

    return null;
  };

  const toggleSort = (field: string) => {
    if (customOrderActive) {
      setCustomOrderActive(false);
    }
    if (sortOption.startsWith(field)) {
      const order = sortOption.endsWith('asc') ? 'desc' : 'asc';
      setSortOption(`${field}-${order}`);
    } else {
      setSortOption(`${field}-asc`);
    }
  };
  // Hilfsfunktion für Sortierung
  const getSortedSeries = (seriesToSort: Series[]) => {
    if (customOrderActive) return seriesToSort;

    const [field, order] = sortOption.split('-');
    const orderMultiplier = order === 'asc' ? 1 : -1;
    return [...seriesToSort].sort((a, b) => {
      if (field === 'name') {
        return a.title.localeCompare(b.title) * orderMultiplier;
      } else if (field === 'date') {
        const aNext = getNextUnwatchedEpisode(a);
        const bNext = getNextUnwatchedEpisode(b);
        if (aNext && bNext) {
          return (
            (new Date(aNext.air_date).getTime() -
              new Date(bNext.air_date).getTime()) *
            orderMultiplier
          );
        }
        return 0;
      }
      return 0;
    });
  };

  // Hole aktuelle Watchlist-Serien direkt aus dem Context statt Props zu verwenden
  const currentWatchlistSeries = useMemo(() => {
    return (seriesList || [])
      .filter((series) => series.watchlist)
      .filter((series) => {
        const nextEpisode = getNextUnwatchedEpisode(series);
        const hasAvailableEpisode = nextEpisode && new Date(nextEpisode.air_date) <= new Date();
        
        // Wenn Rewatches aktiv sind, prüfe auch auf verfügbare Rewatch-Episoden
        if (!hideRewatches && !hasAvailableEpisode && hasActiveRewatch(series)) {
          const rewatchEpisode = getNextRewatchEpisode(series);
          return rewatchEpisode && new Date(rewatchEpisode.air_date) <= new Date();
        }
        
        return hasAvailableEpisode;
      });
  }, [seriesList, hideRewatches]); // hideRewatches beeinflusst getNextUnwatchedEpisode

  // Hauptlogik für Sortierung und benutzerdefinierte Reihenfolge
  useEffect(() => {
    // NICHT aktualisieren wenn lokale Updates pending sind (verhindert Flackern)
    if (pendingUpdates.size > 0) {
      return;
    }

    if (!customOrderActive) {
      // Normale Sortierung - immer mit aktuellen Daten aus Context
      setFilteredSeries(getSortedSeries(currentWatchlistSeries));
    } else if (user && currentWatchlistSeries.length > 0) {
      // 🚀 Optimiert: Cache die Watchlist-Reihenfolge lokal
      const cachedOrderKey = `watchlistOrder_${user.uid}`;
      let savedOrder: number[] | null = null;

      try {
        const cached = localStorage.getItem(cachedOrderKey);
        savedOrder = cached ? JSON.parse(cached) : null;
      } catch (error) {
        console.warn('Failed to load cached watchlist order:', error);
      }

      if (savedOrder && Array.isArray(savedOrder)) {
        // Verwende Cache
        const ordered = savedOrder
          .map((id: number) =>
            currentWatchlistSeries.find((series) => series.id === id)
          )
          .filter(Boolean) as Series[];
        const missing = currentWatchlistSeries.filter(
          (series) => !ordered.some((s) => s.id === series.id)
        );
        setFilteredSeries([...ordered, ...missing]);

        // Prüfe Firebase nur alle 30 Sekunden
        const lastCheck = localStorage.getItem(`${cachedOrderKey}_lastCheck`);
        const shouldCheck =
          !lastCheck || Date.now() - parseInt(lastCheck) > 30000;

        if (shouldCheck) {
          // 🚀 Nutze optimierten Cache statt direkter Firebase-Calls
          if (watchlistOrder && Array.isArray(watchlistOrder)) {
            const firebaseOrder = watchlistOrder;
            if (
              firebaseOrder &&
              JSON.stringify(firebaseOrder) !== JSON.stringify(savedOrder)
            ) {
              localStorage.setItem(
                cachedOrderKey,
                JSON.stringify(firebaseOrder)
              );
              localStorage.setItem(
                `${cachedOrderKey}_lastCheck`,
                Date.now().toString()
              );
              // Re-render mit neuen Daten
              const newOrdered = firebaseOrder
                .map((id: number) =>
                  currentWatchlistSeries.find((series) => series.id === id)
                )
                .filter(Boolean) as Series[];
              const newMissing = currentWatchlistSeries.filter(
                (series) => !newOrdered.some((s) => s.id === series.id)
              );
              setFilteredSeries([...newOrdered, ...newMissing]);
            }
          }
          localStorage.setItem(
            `${cachedOrderKey}_lastCheck`,
            Date.now().toString()
          );
        }
      } else {
        // Kein Cache, nutze optimierten Hook statt direkter Firebase-Calls
        if (watchlistOrder && Array.isArray(watchlistOrder)) {
          localStorage.setItem(cachedOrderKey, JSON.stringify(watchlistOrder));
          localStorage.setItem(
            `${cachedOrderKey}_lastCheck`,
            Date.now().toString()
          );

          const ordered = watchlistOrder
            .map((id: number) =>
              currentWatchlistSeries.find((series) => series.id === id)
            )
            .filter(Boolean) as Series[];
          const missing = currentWatchlistSeries.filter(
            (series) => !ordered.some((s) => s.id === series.id)
          );
          setFilteredSeries([...ordered, ...missing]);
        } else {
          setFilteredSeries(currentWatchlistSeries);
        }
      }
    } else if (currentWatchlistSeries.length > 0) {
      // Fallback wenn kein User vorhanden
      setFilteredSeries(currentWatchlistSeries);
    }
  }, [
    currentWatchlistSeries,
    customOrderActive,
    sortOption,
    user,
    pendingUpdates.size,
  ]);

  // Zusätzlicher useEffect nur für Episode-Updates bei benutzerdefinierter Reihenfolge
  useEffect(() => {
    // Nur bei benutzerdefinierter Reihenfolge und wenn bereits Daten vorhanden sind
    // NICHT bei pending Updates (verhindert Überschreibung lokaler Updates)
    if (
      customOrderActive &&
      user &&
      filteredSeries.length > 0 &&
      pendingUpdates.size === 0
    ) {
      // Aktualisiere nur Episode-Daten, behalte Reihenfolge bei
      setFilteredSeries((prevFiltered) => {
        return prevFiltered.map((filteredSeries) => {
          const updatedSeries = currentWatchlistSeries.find(
            (s) => s.id === filteredSeries.id
          );
          return updatedSeries || filteredSeries;
        });
      });
    }
  }, [currentWatchlistSeries, customOrderActive, user, pendingUpdates.size]);

  // Neue Funktion um sowohl nächste Episode als auch Rewatch-Info zu bekommen
  const getEpisodeInfo = (series: Series) => {
    let nextEpisode = null;
    let rewatchInfo = null;

    // Finde nächste ungesehene Episode
    for (const season of series.seasons) {
      for (let i = 0; i < season.episodes.length; i++) {
        const episode = season.episodes[i];
        if (!episode.watched) {
          nextEpisode = {
            ...episode,
            seasonNumber: season.seasonNumber,
            episodeIndex: i,
            isRewatch: false,
          };
          break;
        }
      }
      if (nextEpisode) break;
    }

    // Finde Rewatch-Info (unabhängig von neuen Episoden)
    if (hasActiveRewatch(series)) {
      const nextRewatch = getNextRewatchEpisode(series);
      if (nextRewatch) {
        rewatchInfo = {
          ...nextRewatch,
          isRewatch: true,
          currentWatchCount: nextRewatch.currentWatchCount,
          targetWatchCount: nextRewatch.targetWatchCount,
        };
      }
    }

    return { nextEpisode, rewatchInfo };
  };

  const displayedSeries = filteredSeries.filter((series) => {
    // Titel-Filter
    const matchesTitle = filterInput
      ? series.title.toLowerCase().includes(filterInput.toLowerCase())
      : true;

    // Rewatch-Filter: Blende Serien aus, die nur Rewatch-Episoden haben
    if (hideRewatches) {
      const nextEpisode = getNextUnwatchedEpisode(series);
      const hasUnwatchedEpisodes = nextEpisode && !nextEpisode.isRewatch;
      return matchesTitle && hasUnwatchedEpisodes;
    }

    return matchesTitle;
  });

  const moveItem = (from: number, to: number) => {
    if (!customOrderActive) {
      setCustomOrderActive(true);
    }
    const updated = Array.from(filteredSeries);
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setFilteredSeries(updated);
    if (user) {
      const order = updated.map((s) => s.id);
      // 🚀 Nutze Batch-Update statt direkter Firebase-Call
      addBatchUpdate(`${user.uid}/watchlistOrder`, order);
    }
    // setWatchlistSeries wird nicht mehr verwendet - Dialog arbeitet eigenständig
  };

  const handleWatchedToggleWithDebounce = async (
    series: Series,
    nextEpisode: any
  ) => {
    const updateKey = `${series.id}-${nextEpisode.seasonNumber}-${nextEpisode.episodeIndex}`;

    if (pendingUpdates.has(updateKey)) {
      return; // Verhindere doppelte Klicks
    }

    if (!user) return;

    // 🚫 Temporäres lokales UI-Update für sofortige Responsiveness
    // Wird nach Cache-Update wieder bereinigt
    setFilteredSeries((prevSeries) => {
      return prevSeries.map((s) => {
        if (s.id === series.id) {
          return {
            ...s,
            seasons: s.seasons.map((season) => {
              if (season.seasonNumber === nextEpisode.seasonNumber) {
                return {
                  ...season,
                  episodes: season.episodes.map((ep, idx) => {
                    if (idx === nextEpisode.episodeIndex) {
                      return {
                        ...ep,
                        watched: true,
                        watchCount: ep.watched ? (ep.watchCount || 1) + 1 : 1,
                      };
                    }
                    return ep;
                  }),
                };
              }
              return season;
            }),
          };
        }
        return s;
      });
    });

    setPendingUpdates((prev) => new Set(prev).add(updateKey));

    // 🛡️ Firebase-Update mit Schutz vor Datenverlust
    const episodeRef = firebase
      .database()
      .ref(
        `${user.uid}/serien/${series.nmr}/seasons/${nextEpisode.seasonNumber}/episodes/${nextEpisode.episodeIndex}`
      );

    // Definiere die Update-Funktion einmal
    const performUpdate = async () => {
      const snapshot = await episodeRef.once('value');
      const episode = snapshot.val();
      const wasWatched = episode.watched;

      let updateData: any;
      if (wasWatched) {
        const currentWatchCount = episode.watchCount || 1;
        updateData = {
          watched: true,
          watchCount: currentWatchCount + 1,
        };
      } else {
        updateData = {
          watched: true,
          watchCount: 1,
        };
      }

      await episodeRef.update(updateData);

      // 🏆 BADGE-SYSTEM: Activity-Logging für Badge-Berechnung (keine Friend-Activities)
      const episodeData = series.seasons?.find(
        (s) => s.seasonNumber === nextEpisode.seasonNumber
      )?.episodes?.[nextEpisode.episodeIndex];

      if (episodeData) {
        // Variablen entfernt da nicht verwendet

        // Counter-Updates für beide Fälle: neue Episode und Rewatch
        await updateEpisodeCounters(
          user.uid,
          series.id,
          wasWatched, // isRewatch = true wenn Episode bereits gesehen war
          episodeData.air_date
        );
      }

      // 🚀 WICHTIG: Cache invalidieren nach Episode-Update um sofortige UI-Updates zu gewährleisten
      await refetchSeries();

      // Cleanup des Pending-Status und Sync mit Cache-Daten
      setTimeout(() => {
        setPendingUpdates((prev) => {
          const newSet = new Set(prev);
          newSet.delete(updateKey);
          return newSet;
        });

        // Force Update der UI mit aktuellen Cache-Daten nach dem Refetch
        // Dies überschreibt das temporäre lokale Update mit den echten Firebase-Daten
      }, 500); // Länger warten damit Cache-Update definitiv durch ist

      // Informiere SearchFilters über das Update für Re-render
      onSeriesUpdate?.();
    };

    try {
      // Registriere Update für Überwachung und führe es aus
      addProtectedUpdate(updateKey, performUpdate, 3);

      // Das Update wird automatisch durch useDataProtection ausgeführt
      // Kein manueller Aufruf nötig - verhindert doppelte Ausführung
      console.log(`📝 Episode ${updateKey} update queued`);
    } catch (error) {
      console.error(`❌ Episode update failed for ${updateKey}:`, error);
    }
  };

  return (
    <>
      <Dialog
        open={watchlistDialogOpen}
        onClose={handleDialogClose}
        fullWidth
        container={document.body}
      >
        <DialogHeader title='Weiterschauen' onClose={handleDialogClose} />
        {dialogContentVisible && (
          <DialogContent
            sx={{
              minHeight: '80vh',
              overflowY: 'auto',
              p: isMobile ? '0px 12px' : '20px 24px',
            }}
          >
            {(!isMobile || showFilter) && (
              <WatchlistFilter
                filterInput={filterInput}
                setFilterInput={setFilterInput}
                customOrderActive={customOrderActive}
                setCustomOrderActive={setCustomOrderActive}
                sortOption={sortOption}
                toggleSort={toggleSort}
                hideRewatches={hideRewatches}
                setHideRewatches={setHideRewatches}
              />
            )}
            {isMobile && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <Button
                  variant='outlined'
                  onClick={() => setShowFilter((prev) => !prev)}
                  sx={{ fontSize: '0.75rem' }}
                >
                  {showFilter ? 'Filter ausblenden' : 'Filter anzeigen'}
                </Button>
              </Box>
            )}
            {customOrderActive ? (
              <DndProvider backend={HTML5Backend}>
                <div style={{ minHeight: '350px' }}>
                  {displayedSeries.map((series, index) => {
                    const { nextEpisode, rewatchInfo } = getEpisodeInfo(series);
                    // Wenn hideRewatches false ist (Rewatches aktiv), prioritisiere Rewatch über neue Episoden
                    const priorityEpisode =
                      !hideRewatches && rewatchInfo
                        ? rewatchInfo
                        : nextEpisode || rewatchInfo;
                    return (
                      <SeriesListItem
                        key={series.id}
                        series={series}
                        index={index}
                        draggable={true}
                        moveItem={moveItem}
                        nextUnwatchedEpisode={priorityEpisode}
                        rewatchInfo={null} // Keine separate Rewatch-Info mehr, da priorityEpisode das schon abdeckt
                        onTitleClick={(s) => setSelectedSeries(s)}
                        onWatchedToggle={() => {
                          if (priorityEpisode) {
                            handleWatchedToggleWithDebounce(
                              series,
                              priorityEpisode
                            );
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </DndProvider>
            ) : (
              <div>
                {displayedSeries.map((series) => {
                  const { nextEpisode, rewatchInfo } = getEpisodeInfo(series);
                  // Wenn hideRewatches false ist (Rewatches aktiv), prioritisiere Rewatch über neue Episoden
                  const priorityEpisode =
                    !hideRewatches && rewatchInfo
                      ? rewatchInfo
                      : nextEpisode || rewatchInfo;
                  return (
                    <SeriesListItem
                      key={series.id}
                      series={series}
                      nextUnwatchedEpisode={priorityEpisode}
                      rewatchInfo={null} // Keine separate Rewatch-Info mehr, da priorityEpisode das schon abdeckt
                      onTitleClick={(s) => setSelectedSeries(s)}
                      onWatchedToggle={() => {
                        if (priorityEpisode) {
                          handleWatchedToggleWithDebounce(
                            series,
                            priorityEpisode
                          );
                        }
                      }}
                    />
                  );
                })}
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
      {selectedSeries && user && (
        <SeriesWatchedDialog
          isReadOnly={true}
          open={true}
          onClose={() => setSelectedSeries(null)}
          series={selectedSeries}
          user={user}
          handleWatchedToggleWithConfirmation={(seasonNumber, episodeId) => {
            // Verwende den lokalen Handler statt den externen von SearchFilters
            const nextEpisode = {
              seasonNumber,
              episodeIndex: episodeId,
            };
            handleWatchedToggleWithDebounce(selectedSeries, nextEpisode);
          }}
        />
      )}
    </>
  );
};
export default WatchlistDialog;
