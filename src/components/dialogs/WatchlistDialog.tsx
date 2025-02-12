import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  TextField,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import firebase from 'firebase/compat/app';
import { Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useAuth } from '../../App';
import { Series } from '../../interfaces/Series';

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

// Typ für Drag-Item
interface DragItem {
  index: number;
  id: number;
  type: string;
}

const DraggableSeriesItem = ({
  series,
  index,
  moveItem,
  children,
}: {
  series: any;
  index: number;
  moveItem: (from: number, to: number) => void;
  children: React.ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [{ isDragging }, drag] = useDrag({
    type: 'series',
    item: { index, id: series.id } as DragItem,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: 'series',
    collect: (monitor) => ({ isOver: monitor.isOver() }),
    hover(item, monitor) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;
      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;
      const tolerance = 5; // Neuer Toleranzwert
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY + tolerance)
        return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY - tolerance)
        return;
      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  // Beide Hooks am gleichen Ref binden
  drag(drop(ref));
  return (
    <div
      ref={ref}
      style={{
        boxSizing: 'border-box',
        // Element sichtbar lassen, auch während dem Drag
        opacity: 1,
        cursor: 'grab',
        transform: isDragging ? 'scale(1.05)' : 'none',
        transition: 'transform 0.2s ease',
        // Entferne den störenden Rahmen, alternativ kann ein dezent angepasster Box-Shadow verwendet werden.
        border: 'none',
      }}
    >
      {children}
    </div>
  );
};

const WatchlistDialog = ({
  open,
  onClose,
  sortedWatchlistSeries,
  handleWatchedToggleWithConfirmation,
  setWatchlistSeries,
}: WatchlistDialogProps) => {
  // Neuer Zustand für internen Namenfilter und benutzerdefinierten Modus
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

  useEffect(() => {
    localStorage.setItem('customOrderActive', customOrderActive.toString());
  }, [customOrderActive]);

  // Neue Hilfsfunktion zum Umschalten der Sortierung
  const toggleSort = (field: string) => {
    // Aktivierung eines anderen Filters deaktiviert den benutzerdefinierten Modus.
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

  // Standard: Sortierung nach Name, falls nicht im benutzerdefinierten Modus
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

  // Wenn benutzerdefiniert aktiv: Reihenfolge aus Firebase laden
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
          // Füge neue Serien hinzu, die noch nicht in der benutzerdefinierten Reihenfolge enthalten sind
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

  // Filter: Anwenden des Namensfilters
  const displayedSeries = filteredSeries.filter((series) =>
    filterInput
      ? series.title.toLowerCase().includes(filterInput.toLowerCase())
      : true
  );

  const moveItem = (from: number, to: number) => {
    // Sicherstellen, dass im benutzerdefinierten Modus gearbeitet wird
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

  const formatDateWithLeadingZeros = (date: Date) => {
    // ...existing code...
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const getNextUnwatchedEpisode = (series: Series) => {
    // ...existing code...
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth container={document.body}>
      <DialogTitle>
        Weiterschauen
        <IconButton
          aria-label='close'
          onClick={onClose}
          className='closeButton'
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          // Feste Höhe des Dialogs
          minHeight: '80vh',
          // Optionale Anpassung der Scrollbar
          overflowY: 'auto',
        }}
      >
        {isMobile && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant='outlined'
              onClick={() => setShowFilter((prev) => !prev)}
              sx={{ fontSize: '0.75rem', mb: 2 }}
            >
              {showFilter ? 'Filter ausblenden' : 'Filter anzeigen'}
            </Button>
          </Box>
        )}
        {(!isMobile || showFilter) && (
          <Box className='flex flex-col mb-4'>
            <Divider />
            <Box className='flex flex-col sm:flex-row justify-between items-center my-2'>
              <span className='text-gray-400 mb-2 sm:mb-0'>Filter:</span>
              <Box className='flex flex-col sm:flex-row items-center gap-2'>
                <TextField
                  size='small'
                  placeholder='Nach Namen filtern'
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                />
                <Button
                  variant={customOrderActive ? 'contained' : 'outlined'}
                  onClick={() => setCustomOrderActive((prev) => !prev)}
                  sx={{
                    width: isMobile ? '100%' : 'auto', // Desktop: automatische Breite
                    fontSize: '0.75rem',
                    backgroundColor: customOrderActive
                      ? '#00fed7'
                      : 'transparent',
                    color: customOrderActive ? '#000' : '#00fed7',
                  }}
                >
                  Benutzerdefiniert
                </Button>
                <Tooltip title='Nach Name sortieren'>
                  <Button
                    onClick={() => toggleSort('name')}
                    sx={{
                      color: '#00fed7',
                      minWidth: '80px',
                      fontSize: '0.75rem',
                    }}
                  >
                    Name
                    {/* Pfeile nur anzeigen, wenn nicht benutzerdefiniert */}
                    {!customOrderActive &&
                      sortOption.startsWith('name') &&
                      (sortOption.endsWith('asc') ? (
                        <ArrowUpwardIcon
                          fontSize='small'
                          style={{ width: '16px', marginLeft: 4 }}
                        />
                      ) : (
                        <ArrowDownwardIcon
                          fontSize='small'
                          style={{ width: '16px', marginLeft: 4 }}
                        />
                      ))}
                  </Button>
                </Tooltip>
                <Tooltip title='Nach Datum sortieren'>
                  <Button
                    onClick={() => toggleSort('date')}
                    sx={{
                      color: '#00fed7',
                      minWidth: '80px',
                      fontSize: '0.75rem',
                    }}
                  >
                    Datum
                    {/* Pfeile nur anzeigen, wenn nicht benutzerdefiniert */}
                    {!customOrderActive &&
                      sortOption.startsWith('date') &&
                      (sortOption.endsWith('asc') ? (
                        <ArrowUpwardIcon
                          fontSize='small'
                          style={{ width: '16px', marginLeft: 4 }}
                        />
                      ) : (
                        <ArrowDownwardIcon
                          fontSize='small'
                          style={{ width: '16px', marginLeft: 4 }}
                        />
                      ))}
                  </Button>
                </Tooltip>
              </Box>
            </Box>
            <Divider />
          </Box>
        )}
        {customOrderActive ? (
          <DndProvider backend={HTML5Backend}>
            <div
              style={{
                minHeight: '350px' /* Erhöhter Spielraum, kein padding */,
              }}
            >
              {displayedSeries.map((series, index) => {
                const nextUnwatchedEpisode = getNextUnwatchedEpisode(series);
                return (
                  <DraggableSeriesItem
                    key={series.id}
                    series={series}
                    index={index}
                    moveItem={moveItem}
                  >
                    <div
                      className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm flex items-center'
                      style={{ width: '100%' }}
                    >
                      <img
                        className='w-[92px] mr-4'
                        src={series.poster.poster}
                        alt={series.title}
                      />
                      <div className='flex-1'>
                        <div className='font-medium text-[#00fed7]'>
                          {series.title}
                        </div>
                        {nextUnwatchedEpisode ? (
                          <>
                            <div className='mt-1 text-xs text-gray-400'>
                              Nächste Folge: S
                              {nextUnwatchedEpisode.seasonNumber + 1} E
                              {nextUnwatchedEpisode.episodeIndex + 1} -{' '}
                              {nextUnwatchedEpisode.name}
                            </div>
                            <div className='mt-1 text-xs text-gray-400'>
                              Erscheinungsdatum:{' '}
                              {formatDateWithLeadingZeros(
                                new Date(nextUnwatchedEpisode.air_date)
                              )}
                            </div>
                          </>
                        ) : (
                          <div className='mt-1 text-xs text-gray-400'>
                            Alle Episoden gesehen.
                          </div>
                        )}
                      </div>
                      {nextUnwatchedEpisode && (
                        <IconButton
                          onClick={() => {
                            handleWatchedToggleWithConfirmation(
                              nextUnwatchedEpisode.seasonNumber,
                              nextUnwatchedEpisode.episodeIndex,
                              series.id,
                              series.nmr
                            );
                            setWatchlistSeries((prevSeries) =>
                              prevSeries.map((s) =>
                                s.id === series.id
                                  ? {
                                      ...s,
                                      seasons: s.seasons.map((season) =>
                                        season.seasonNumber ===
                                        nextUnwatchedEpisode.seasonNumber
                                          ? {
                                              ...season,
                                              episodes: season.episodes.map(
                                                (episode, index) =>
                                                  index ===
                                                  nextUnwatchedEpisode.episodeIndex
                                                    ? {
                                                        ...episode,
                                                        watched:
                                                          !episode.watched,
                                                      }
                                                    : episode
                                              ),
                                            }
                                          : season
                                      ),
                                    }
                                  : s
                              )
                            );
                          }}
                          sx={{ color: '#00fed7' }}
                        >
                          <Check />
                        </IconButton>
                      )}
                    </div>
                  </DraggableSeriesItem>
                );
              })}
            </div>
          </DndProvider>
        ) : (
          // Statische Darstellung
          <div>
            {displayedSeries.map((series) => {
              const nextUnwatchedEpisode = getNextUnwatchedEpisode(series);
              return (
                <Box
                  key={series.id}
                  className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm flex items-center'
                >
                  <img
                    className='w-[92px] mr-4'
                    src={series.poster.poster}
                    alt={series.title}
                  />
                  <div className='flex-1'>
                    <div className='font-medium text-[#00fed7]'>
                      {series.title}
                    </div>
                    {nextUnwatchedEpisode ? (
                      <>
                        <div className='mt-1 text-xs text-gray-400'>
                          Nächste Folge: S
                          {nextUnwatchedEpisode.seasonNumber + 1} E
                          {nextUnwatchedEpisode.episodeIndex + 1} -{' '}
                          {nextUnwatchedEpisode.name}
                        </div>
                        <div className='mt-1 text-xs text-gray-400'>
                          Erscheinungsdatum:{' '}
                          {formatDateWithLeadingZeros(
                            new Date(nextUnwatchedEpisode.air_date)
                          )}
                        </div>
                      </>
                    ) : (
                      <div className='mt-1 text-xs text-gray-400'>
                        Alle Episoden gesehen.
                      </div>
                    )}
                  </div>
                  {nextUnwatchedEpisode && (
                    <IconButton
                      onClick={() => {
                        handleWatchedToggleWithConfirmation(
                          nextUnwatchedEpisode.seasonNumber,
                          nextUnwatchedEpisode.episodeIndex,
                          series.id,
                          series.nmr
                        );
                        setWatchlistSeries((prevSeries) =>
                          prevSeries.map((s) =>
                            s.id === series.id
                              ? {
                                  ...s,
                                  seasons: s.seasons.map((season) =>
                                    season.seasonNumber ===
                                    nextUnwatchedEpisode.seasonNumber
                                      ? {
                                          ...season,
                                          episodes: season.episodes.map(
                                            (episode, index) =>
                                              index ===
                                              nextUnwatchedEpisode.episodeIndex
                                                ? {
                                                    ...episode,
                                                    watched: !episode.watched,
                                                  }
                                                : episode
                                          ),
                                        }
                                      : season
                                  ),
                                }
                              : s
                          )
                        );
                      }}
                      sx={{ color: '#00fed7' }}
                    >
                      <Check />
                    </IconButton>
                  )}
                </Box>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WatchlistDialog;
