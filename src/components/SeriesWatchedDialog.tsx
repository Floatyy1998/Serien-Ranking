import CloseIcon from '@mui/icons-material/Close';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { Check, ChevronDown } from 'lucide-react';
import { memo, useState } from 'react';
import Confetti from 'react-confetti';
import { Series } from '../interfaces/Series';

interface SeriesWatchedDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  user: any;
  handleWatchedToggleWithConfirmation: (
    seasonNumber: number,
    episodeId: number
  ) => void;
  isReadOnly?: boolean;
}

const SeriesWatchedDialog = memo(
  ({
    open,
    onClose,
    series,
    handleWatchedToggleWithConfirmation,
    isReadOnly = false,
  }: SeriesWatchedDialogProps) => {
    const [expanded, setExpanded] = useState<number | false>(false);

    const handleAccordionChange =
      (seasonNumber: number) =>
      (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? seasonNumber : false);
      };

    const formatDateWithLeadingZeros = (date: Date) => {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    const uniqueSeasons = series?.seasons?.filter(
      (season, index, self) =>
        index === self.findIndex((s) => s.seasonNumber === season.seasonNumber)
    );

    const getNextUnwatchedEpisode = () => {
      if (!series.seasons || series.seasons.length === 0) {
        return null;
      }
      for (const season of series.seasons) {
        for (let i = 0; i < season?.episodes?.length; i++) {
          const episode = season.episodes[i];
          if (!episode.watched) {
            return {
              seasonNumber: season.seasonNumber,
              episodeNumber: i + 1,
              ...episode,
            };
          }
        }
      }
      return null;
    };

    const nextUnwatchedEpisode = getNextUnwatchedEpisode();

    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        slotProps={{ paper: { sx: { m: 2 } } }}
      >
        <DialogTitle
          sx={{
            alignItems: 'center',
            p: 3,
            pb: 2,
            textAlign: 'center',
          }}
        >
          <span
            style={{
              color: '#00fed7',
              fontSize: '1.25rem',
              fontWeight: 500,
              marginRight: '20px',
            }}
          >
            Gesehene Episoden von {series.title}
          </span>
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
        <DialogContent
          sx={{
            p: 3,
          }}
        >
          {nextUnwatchedEpisode ? (
            <Box className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm'>
              <div className='font-medium text-[#00fed7]'>
                Nächste Folge: S{nextUnwatchedEpisode.seasonNumber + 1} E
                {nextUnwatchedEpisode.episodeNumber} -{' '}
                {nextUnwatchedEpisode.name}
              </div>
              <div className='mt-1 text-xs text-gray-400'>
                Erscheinungsdatum:{' '}
                {formatDateWithLeadingZeros(
                  new Date(nextUnwatchedEpisode.air_date)
                )}
              </div>
            </Box>
          ) : (
            <>
              <Confetti
                style={{ width: '100%', height: '100%', position: 'absolute' }}
                recycle={false}
                numberOfPieces={1000}
                gravity={2}
              />
              <Box className='mb-6 rounded-xl border border-[#00fed7]/8 bg-black/40 p-3 text-sm backdrop-blur-sm'>
                <div
                  style={{ textDecoration: 'underline' }}
                  className='font-medium text-[#00fed7]'
                >
                  Glückwunsch! Du hast alle Episoden gesehen.
                </div>
              </Box>
            </>
          )}
          <div className='space-y-2'>
            {uniqueSeasons?.map((season) => {
              const allWatched = season.episodes?.every(
                (episode) => episode.watched
              );
              return (
                <Accordion
                  key={season.seasonNumber}
                  expanded={expanded === season.seasonNumber}
                  onChange={handleAccordionChange(season.seasonNumber)}
                >
                  <AccordionSummary
                    expandIcon={
                      <ChevronDown
                        size={20}
                        style={{
                          color: '#00fed7',
                          transition: 'transform 0.2s ease-in-out',
                        }}
                      />
                    }
                    sx={{
                      backgroundColor: '#1f1f1f',
                      textAlign: 'center',
                    }}
                  >
                    <div className='flex items-center gap-3'>
                      <span className='text-lg font-medium'>
                        Staffel {season.seasonNumber + 1}
                      </span>
                      <div
                        onClick={(e) => {
                          if (!isReadOnly) {
                            e.stopPropagation();
                            handleWatchedToggleWithConfirmation(
                              season.seasonNumber,
                              -1
                            );
                          }
                        }}
                        style={{
                          color: allWatched
                            ? '#00fed7'
                            : 'rgba(0, 254, 215, 0.3)',
                          transition: 'all 0.2s ease-in-out',
                          cursor: isReadOnly ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Check size={18} />
                      </div>
                    </div>
                  </AccordionSummary>
                  <AccordionDetails>
                    {season.episodes?.map((episode, index) => (
                      <div
                        key={episode.id}
                        className='group flex items-center justify-between border-b border-[#00fed7]/5 p-4 last:border-0 hover:bg-[#00fed7]/[0.02]'
                      >
                        <div className='flex items-center space-x-4'>
                          <span className='text-sm font-medium text-[#00fed7]'>
                            {index + 1}.
                          </span>
                          <span className='font-medium text-gray-300 group-hover:text-[#00fed7]/90'>
                            {episode.name}
                          </span>
                          <span className='text-sm text-gray-500'>
                            {formatDateWithLeadingZeros(
                              new Date(episode.air_date)
                            )}
                          </span>
                        </div>
                        <div
                          onClick={() => {
                            if (!isReadOnly) {
                              handleWatchedToggleWithConfirmation(
                                season.seasonNumber,
                                episode.id
                              );
                            }
                          }}
                          style={{
                            color: episode.watched
                              ? '#00fed7'
                              : 'rgba(255, 255, 255, 0.3)', // Grau, wenn nicht watched
                            transition: 'all 0.2s ease-in-out',
                            cursor: isReadOnly ? 'default' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <Check size={18} />
                        </div>
                      </div>
                    ))}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

export default SeriesWatchedDialog;
