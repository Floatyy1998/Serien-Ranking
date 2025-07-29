import {
  Box,
  Button,
  Dialog,
  DialogContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import React, { useEffect, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../../../App';
import { Series } from '../../../interfaces/Series';
import { getNextRewatchEpisode, hasActiveRewatch } from '../../../utils/rewatch.utils';
import SeriesWatchedDialog from '../SeriesWatchedDialog';
import { DialogHeader } from '../shared/SharedDialogComponents';
import SeriesListItem from './SeriesListItem';
import WatchlistFilter from './WatchlistFilter';

interface WatchlistDialogProps {
  open: boolean;
  onClose: () => void;
  sortedWatchlistSeries: Series[];
  handleWatchedToggleWithConfirmation: (
    seasonNumber: number,
    episodeIndex: number,
    seriesId: number,
    seriesNmr: number
  ) => void;
  setWatchlistSeries: React.Dispatch<React.SetStateAction<Series[]>>;
}
const WatchlistDialog = ({
  open,
  onClose,
  sortedWatchlistSeries,
  handleWatchedToggleWithConfirmation,
  setWatchlistSeries,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFilter, setShowFilter] = useState(!isMobile);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [dialogContentVisible, setDialogContentVisible] = useState(false);
  const [watchlistDialogOpen, setWatchlistDialogOpen] = useState(false);

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

  // Hauptlogik für Sortierung und benutzerdefinierte Reihenfolge
  useEffect(() => {
    // NICHT aktualisieren wenn lokale Updates pending sind (verhindert Flackern)
    if (pendingUpdates.size > 0) {
      return;
    }

    if (!customOrderActive) {
      // Normale Sortierung - immer mit aktuellen Daten
      setFilteredSeries(getSortedSeries(sortedWatchlistSeries));
    } else if (user && sortedWatchlistSeries.length > 0) {
      // Benutzerdefinierte Reihenfolge - lade Firebase-Reihenfolge
      const orderRef = firebase.database().ref(`${user.uid}/watchlistOrder`);
      orderRef.once('value').then((snapshot) => {
        const savedOrder = snapshot.val();
        if (savedOrder && Array.isArray(savedOrder)) {
          const ordered = savedOrder
            .map((id: number) =>
              sortedWatchlistSeries.find((series) => series.id === id)
            )
            .filter(Boolean) as Series[];
          const missing = sortedWatchlistSeries.filter(
            (series) => !ordered.some((s) => s.id === series.id)
          );
          setFilteredSeries([...ordered, ...missing]);
        } else {
          setFilteredSeries(sortedWatchlistSeries);
        }
      });
    } else if (sortedWatchlistSeries.length > 0) {
      // Fallback wenn kein User vorhanden
      setFilteredSeries(sortedWatchlistSeries);
    }
  }, [
    sortedWatchlistSeries,
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
          const updatedSeries = sortedWatchlistSeries.find(
            (s) => s.id === filteredSeries.id
          );
          return updatedSeries || filteredSeries;
        });
      });
    }
  }, [sortedWatchlistSeries, customOrderActive, user, pendingUpdates.size]);

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
      firebase.database().ref(`${user.uid}/watchlistOrder`).set(order);
    }
    setWatchlistSeries(updated);
  };

  const updateSeriesInDialog = (
    seriesId: number,
    seasonNumber: number,
    episodeIndex: number
  ) => {
    const updateKey = `${seriesId}-${seasonNumber}-${episodeIndex}`;

    // Verhindere doppelte Updates
    if (pendingUpdates.has(updateKey)) {
      return;
    }

    setPendingUpdates((prev) => new Set(prev).add(updateKey));

    // Sofortige lokale Aktualisierung
    setFilteredSeries((prev) => {
      const updated = prev.map((series) =>
        series.id === seriesId
          ? {
              ...series,
              seasons: series.seasons.map((season) =>
                season.seasonNumber === seasonNumber
                  ? {
                      ...season,
                      episodes: season.episodes.map((episode, idx) => {
                        if (idx === episodeIndex) {
                          if (episode.watched) {
                            // Erhöhe watchCount für Rewatch
                            const currentWatchCount = episode.watchCount || 1;
                            return { ...episode, watched: true, watchCount: currentWatchCount + 1 };
                          } else {
                            // Normale erste Ansicht
                            return { ...episode, watched: true, watchCount: 1 };
                          }
                        }
                        return episode;
                      }),
                    }
                  : season
              ),
            }
          : series
      );

      // Nur re-sortieren wenn nicht benutzerdefinierte Reihenfolge aktiv ist
      if (customOrderActive) {
        return updated; // Behalte die Reihenfolge bei
      } else {
        // Sortiere nur wenn normale Sortierung aktiv ist
        return getSortedSeries(updated);
      }
    });

    // Cleanup nach kurzem Timeout
    setTimeout(() => {
      setPendingUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(updateKey);
        return newSet;
      });
    }, 150); // Kurzes aber ausreichendes Timeout
  };

  const handleWatchedToggleWithDebounce = (
    series: Series,
    nextEpisode: any
  ) => {
    const updateKey = `${series.id}-${nextEpisode.seasonNumber}-${nextEpisode.episodeIndex}`;

    if (pendingUpdates.has(updateKey)) {
      return; // Verhindere doppelte Klicks
    }

    handleWatchedToggleWithConfirmation(
      nextEpisode.seasonNumber,
      nextEpisode.episodeIndex,
      series.id,
      series.nmr
    );

    updateSeriesInDialog(
      series.id,
      nextEpisode.seasonNumber,
      nextEpisode.episodeIndex
    );
  };

  return (
    <>
      <Dialog
        open={watchlistDialogOpen}
        onClose={onClose}
        fullWidth
        container={document.body}
      >
        <DialogHeader title='Weiterschauen' onClose={onClose} />
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
                    const priorityEpisode = !hideRewatches && rewatchInfo ? rewatchInfo : (nextEpisode || rewatchInfo);
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
                            handleWatchedToggleWithDebounce(series, priorityEpisode);
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
                  const priorityEpisode = !hideRewatches && rewatchInfo ? rewatchInfo : (nextEpisode || rewatchInfo);
                  return (
                    <SeriesListItem
                      key={series.id}
                      series={series}
                      nextUnwatchedEpisode={priorityEpisode}
                      rewatchInfo={null} // Keine separate Rewatch-Info mehr, da priorityEpisode das schon abdeckt
                      onTitleClick={(s) => setSelectedSeries(s)}
                      onWatchedToggle={() => {
                        if (priorityEpisode) {
                          handleWatchedToggleWithDebounce(series, priorityEpisode);
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
            handleWatchedToggleWithConfirmation(
              seasonNumber,
              episodeId,
              selectedSeries.id,
              selectedSeries.nmr
            );
          }}
        />
      )}
    </>
  );
};
export default WatchlistDialog;
