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
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);
  const { user } = useAuth()!;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showFilter, setShowFilter] = useState(!isMobile);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);

  useEffect(() => {
    localStorage.setItem('customOrderActive', customOrderActive.toString());
  }, [customOrderActive]);
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
  useEffect(() => {
    if (!customOrderActive) {
      const [field, order] = sortOption.split('-');
      const orderMultiplier = order === 'asc' ? 1 : -1;
      const sorted = [...sortedWatchlistSeries].sort((a, b) => {
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
      setFilteredSeries(sorted);
    }
  }, [sortedWatchlistSeries, customOrderActive, sortOption]);
  useEffect(() => {
    if (customOrderActive && user) {
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
    }
  }, [customOrderActive, sortedWatchlistSeries, user]);
  const displayedSeries = filteredSeries.filter((series) =>
    filterInput
      ? series.title.toLowerCase().includes(filterInput.toLowerCase())
      : true
  );
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
  const updateSeriesInDialog = (
    seriesId: number,
    seasonNumber: number,
    episodeIndex: number
  ) => {
    setFilteredSeries((prev) =>
      prev.map((series) =>
        series.id === seriesId
          ? {
              ...series,
              seasons: series.seasons.map((season) =>
                season.seasonNumber === seasonNumber
                  ? {
                      ...season,
                      episodes: season.episodes.map((episode, idx) =>
                        idx === episodeIndex
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
  };
  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth container={document.body}>
        <DialogHeader title='Weiterschauen' onClose={onClose} />
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
                  const nextEpisode = getNextUnwatchedEpisode(series);
                  return (
                    <SeriesListItem
                      key={series.id}
                      series={series}
                      index={index}
                      draggable={true}
                      moveItem={moveItem}
                      nextUnwatchedEpisode={nextEpisode}
                      onTitleClick={(s) => setSelectedSeries(s)}
                      onWatchedToggle={() => {
                        handleWatchedToggleWithConfirmation(
                          nextEpisode!.seasonNumber,
                          nextEpisode!.episodeIndex,
                          series.id,
                          series.nmr
                        );
                        updateSeriesInDialog(
                          series.id,
                          nextEpisode!.seasonNumber,
                          nextEpisode!.episodeIndex
                        );
                      }}
                    />
                  );
                })}
              </div>
            </DndProvider>
          ) : (
            <div>
              {displayedSeries.map((series) => {
                const nextEpisode = getNextUnwatchedEpisode(series);
                return (
                  <SeriesListItem
                    key={series.id}
                    series={series}
                    nextUnwatchedEpisode={nextEpisode}
                    onTitleClick={(s) => setSelectedSeries(s)}
                    onWatchedToggle={() => {
                      if (nextEpisode) {
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
                      }
                    }}
                  />
                );
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
      {selectedSeries && user && (
        <SeriesWatchedDialog
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
