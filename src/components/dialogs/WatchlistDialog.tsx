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
  Tooltip,
} from '@mui/material';
import { Check } from 'lucide-react';
import { useEffect, useState } from 'react';
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

const WatchlistDialog = ({
  open,
  onClose,
  sortedWatchlistSeries,
  handleWatchedToggleWithConfirmation,
  setWatchlistSeries,
}: WatchlistDialogProps) => {
  const [sortOption, setSortOption] = useState('date-desc');
  const [filteredSeries, setFilteredSeries] = useState<Series[]>([]);

  useEffect(() => {
    const sortedSeries = [...sortedWatchlistSeries].sort((a, b) => {
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
    setFilteredSeries(sortedSeries);
  }, [sortOption, sortedWatchlistSeries]);

  const toggleSortOption = (field: string) => {
    setSortOption((prevOption) => {
      const [prevField, prevOrder] = prevOption.split('-');
      if (prevField === field) {
        return `${field}-${prevOrder === 'asc' ? 'desc' : 'asc'}`;
      }
      return `${field}-asc`;
    });
  };

  const formatDateWithLeadingZeros = (date: Date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
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

  return (
    <Dialog open={open} onClose={onClose} fullWidth container={document.body}>
      <DialogTitle
        sx={{ textAlign: 'center', position: 'relative', fontSize: '1.5rem' }}
      >
        Weiterschauen
        <IconButton
          aria-label='close'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'red',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box className='flex flex-col mb-4'>
          <Divider />
          <Box className='flex justify-between items-center mb-2 mt-2'>
            <span className='text-gray-400'>Filter:</span>
            <Box className='flex items-center'>
              <Tooltip title='Nach Name sortieren'>
                <Button
                  onClick={() => toggleSortOption('name')}
                  sx={{
                    color: '#00fed7',
                    minWidth: '80px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'normal !important',
                    justifyContent: 'center',
                  }}
                  endIcon={
                    sortOption.startsWith('name') ? (
                      sortOption === 'name-asc' ? (
                        <ArrowUpwardIcon
                          fontSize='small'
                          style={{ width: '16px' }}
                        />
                      ) : (
                        <ArrowDownwardIcon
                          fontSize='small'
                          style={{ width: '16px' }}
                        />
                      )
                    ) : (
                      <ArrowDownwardIcon
                        style={{ visibility: 'hidden', width: '16px' }}
                        fontSize='small'
                      />
                    )
                  }
                >
                  Name
                </Button>
              </Tooltip>
              <Tooltip title='Nach Datum sortieren'>
                <Button
                  onClick={() => toggleSortOption('date')}
                  sx={{
                    color: '#00fed7',
                    minWidth: '80px',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'normal !important',
                    justifyContent: 'center',
                  }}
                  endIcon={
                    sortOption.startsWith('date') ? (
                      sortOption === 'date-asc' ? (
                        <ArrowUpwardIcon
                          fontSize='small'
                          style={{ width: '16px' }}
                        />
                      ) : (
                        <ArrowDownwardIcon
                          fontSize='small'
                          style={{ width: '16px' }}
                        />
                      )
                    ) : (
                      <ArrowDownwardIcon
                        style={{ visibility: 'hidden', width: '16px' }}
                        fontSize='small'
                      />
                    )
                  }
                >
                  Datum
                </Button>
              </Tooltip>
            </Box>
          </Box>
          <Divider />
        </Box>
        {filteredSeries.map((series) => {
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
                <div className='font-medium text-[#00fed7]'>{series.title}</div>
                {nextUnwatchedEpisode ? (
                  <>
                    <div className='mt-1 text-xs text-gray-400'>
                      Nächste Folge: S{nextUnwatchedEpisode.seasonNumber + 1} E
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
      </DialogContent>
    </Dialog>
  );
};

export default WatchlistDialog;
