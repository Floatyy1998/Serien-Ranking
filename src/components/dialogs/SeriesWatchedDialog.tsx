import CloseIcon from '@mui/icons-material/Close';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
} from '@mui/material';
import { Check, ChevronDown } from 'lucide-react';
import { memo, useState } from 'react';
import Confetti from 'react-confetti';
import { Series } from '../../interfaces/Series';
import { getFormattedDate } from '../../utils/date.utils';
import { NextEpisodeDisplay } from './shared/SharedDialogComponents';
interface SeriesWatchedDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  user: any;
  handleWatchedToggleWithConfirmation: (
    seasonNumber: number,
    episodeId: number,
    forceWatched?: boolean
  ) => void;
  handleBatchWatchedToggle?: (confirmSeason: number) => void;
  isReadOnly?: boolean;
}
const SeriesWatchedDialog = memo(
  ({
    open,
    onClose,
    series,
    handleWatchedToggleWithConfirmation,
    handleBatchWatchedToggle,
    isReadOnly = false,
  }: SeriesWatchedDialogProps) => {
    const [expanded, setExpanded] = useState<number | false>(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [confirmSeason, setConfirmSeason] = useState<number | null>(null);
    const handleAccordionChange =
      (seasonNumber: number) =>
      (_event: React.SyntheticEvent, isExpanded: boolean) => {
        setExpanded(isExpanded ? seasonNumber : false);
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
    const handleConfirmYes = () => {
      if (confirmSeason !== null && handleBatchWatchedToggle) {
        handleBatchWatchedToggle(confirmSeason);
      }
      setConfirmOpen(false);
      setConfirmSeason(null);
    };
    const handleConfirmNo = () => {
      if (confirmSeason !== null) {
        handleWatchedToggleWithConfirmation(confirmSeason, -1, true);
      }
      setConfirmOpen(false);
      setConfirmSeason(null);
    };
    const handleSeasonClick = (seasonNumber: number, allWatched: boolean) => {
      if (!isReadOnly) {
        if (!allWatched) {
          const allPreviousWatched = uniqueSeasons
            ?.filter((s) => s.seasonNumber < seasonNumber)
            .every((s) => s.episodes.every((e) => e.watched));
          if (allPreviousWatched) {
            handleWatchedToggleWithConfirmation(seasonNumber, -1, true);
          } else {
            setConfirmSeason(seasonNumber);
            setConfirmOpen(true);
          }
        } else {
          handleWatchedToggleWithConfirmation(seasonNumber, -1);
        }
      }
    };
    return (
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        slotProps={{ paper: { sx: { m: 2 } } }}
      >
        <DialogTitle
          sx={{
            textAlign: 'center',
            position: 'relative',
            fontSize: '1.5rem',
            paddingLeft: 6,
            paddingRight: 6,
          }}
        >
          Gesehene Episoden von {series.title}
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
            <NextEpisodeDisplay episode={nextUnwatchedEpisode} />
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
                      <span
                        className='text-sm text-gray-400'
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {`${season.episodes.filter((e) => e.watched).length}/${
                          season.episodes.length
                        }  Episoden`}
                        <span className='hidden sm:inline'> gesehen</span>
                      </span>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSeasonClick(season.seasonNumber, allWatched);
                        }}
                        style={{
                          color: allWatched
                            ? '#00fed7'
                            : 'rgba(255, 255, 255, 0.3)',
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
                            {getFormattedDate(episode.air_date)}
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
                              : 'rgba(255, 255, 255, 0.3)',
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
          {confirmOpen && (
            <Dialog
              open={confirmOpen}
              onClose={() => {
                setConfirmOpen(false);
                setConfirmSeason(null);
              }}
            >
              <DialogTitle>Bestätigung</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Möchten Sie diese Staffel und alle vorherigen als gesehen
                  markieren?
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button color='primary' onClick={handleConfirmNo}>
                  Nur diese Staffel
                </Button>
                <Button autoFocus onClick={handleConfirmYes}>
                  Ja, alle
                </Button>
              </DialogActions>
            </Dialog>
          )}
        </DialogContent>
      </Dialog>
    );
  }
);
export default SeriesWatchedDialog;
