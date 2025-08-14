import { Close as CloseIcon } from '@mui/icons-material';
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
  Typography,
} from '@mui/material';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import Confetti from 'react-confetti';
import { Series } from '../../../types/Series';
import { getUnifiedEpisodeDate } from '../../../lib/date/episodeDate.utils';
import RewatchDialog from './RewatchDialog';
import { NextEpisodeDisplay } from './shared/SharedDialogComponents';

// Hilfsfunktion für Rewatch-Farben
const getRewatchColor = (watchCount: number): string => {
  switch (watchCount) {
    case 2:
      return '#ff9800'; // Orange
    case 3:
      return '#f44336'; // Rot
    case 4:
      return '#9c27b0'; // Lila
    case 5:
      return '#3f51b5'; // Indigo
    case 6:
      return '#2196f3'; // Blau
    case 7:
      return '#00bcd4'; // Cyan
    case 8:
      return '#4caf50'; // Grün
    case 9:
      return '#8bc34a'; // Hellgrün
    case 10:
      return '#cddc39'; // Lime
    default:
      return watchCount > 10 ? '#ffc107' : '#00fed7'; // Gold für >10, sonst Standard
  }
};
interface SeriesWatchedDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  user: any;
  handleWatchedToggleWithConfirmation: (
    seasonNumber: number,
    episodeId: number,
    forceWatched?: boolean,
    isRewatch?: boolean,
    forceUnwatch?: boolean
  ) => void;
  handleBatchWatchedToggle?: (confirmSeason: number) => void;
  handleEpisodeBatchWatchedToggle?: (
    seasonNumber: number,
    episodeId: number
  ) => void;
  isReadOnly?: boolean;
}
const SeriesWatchedDialog = ({
  open,
  onClose,
  series,
  handleWatchedToggleWithConfirmation,
  handleBatchWatchedToggle,
  handleEpisodeBatchWatchedToggle,
  isReadOnly = false,
}: SeriesWatchedDialogProps) => {
  const [expanded, setExpanded] = useState<number | false>(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmSeason, setConfirmSeason] = useState<number | null>(null);
  const [episodeConfirmOpen, setEpisodeConfirmOpen] = useState(false);
  const [confirmEpisode, setConfirmEpisode] = useState<{
    seasonNumber: number;
    episodeId: number;
  } | null>(null);
  const [rewatchDialogOpen, setRewatchDialogOpen] = useState(false);
  const [rewatchItem, setRewatchItem] = useState<{
    type: 'episode' | 'season';
    name: string;
    seasonNumber: number;
    episodeId?: number;
    currentWatchCount: number;
  } | null>(null);
  // React 19: Automatische Memoization - kein useMemo nötig
  const uniqueSeasons = (() =>
    series?.seasons?.filter(
      (season, index, self) =>
        index === self.findIndex((s) => s.seasonNumber === season.seasonNumber)
    ))();

  // React 19: Automatische Memoization - kein useMemo nötig
  const nextUnwatchedEpisode = (() => {
    if (!series.seasons || series.seasons.length === 0) {
      return null;
    }
    for (const season of series.seasons) {
      for (let i = 0; i < season?.episodes?.length; i++) {
        const episode = season.episodes[i];
        if (!episode.watched) {
          return {
            ...episode, // Spreade erst das originale Episode-Objekt
            seasonNumber: season.seasonNumber,
            episodeNumber: i + 1,
          };
        }
      }
    }
    return null;
  })();

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
  const handleEpisodeConfirmYes = () => {
    if (confirmEpisode && handleEpisodeBatchWatchedToggle) {
      handleEpisodeBatchWatchedToggle(
        confirmEpisode.seasonNumber,
        confirmEpisode.episodeId
      );
    }
    setEpisodeConfirmOpen(false);
    setConfirmEpisode(null);
  };

  const handleEpisodeConfirmNo = () => {
    if (confirmEpisode) {
      handleWatchedToggleWithConfirmation(
        confirmEpisode.seasonNumber,
        confirmEpisode.episodeId
      );
    }
    setEpisodeConfirmOpen(false);
    setConfirmEpisode(null);
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
        // Wenn alle Episoden der Staffel gesehen wurden, zeige Rewatch-Dialog
        const season = uniqueSeasons?.find(
          (s) => s.seasonNumber === seasonNumber
        );
        if (season) {
          const totalWatchCount = season.episodes.reduce(
            (sum, ep) => sum + (ep.watchCount || 1),
            0
          );
          const avgWatchCount = Math.round(
            totalWatchCount / season.episodes.length
          );
          setRewatchItem({
            type: 'season',
            name: `Staffel ${seasonNumber + 1}`,
            seasonNumber,
            currentWatchCount: avgWatchCount,
          });
          setRewatchDialogOpen(true);
        }
      }
    }
  };
  const handleAccordionChange =
    (panel: number) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpanded(isExpanded ? panel : false);
    };
  const handleEpisodeClick = (
    seasonNumber: number,
    episodeId: number,
    episodeIndex: number
  ) => {
    if (isReadOnly) return;

    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) return;

    const episode = season.episodes[episodeIndex];
    if (!episode) return;

    // Wenn Episode bereits gesehen wurde, zeige Rewatch-Dialog
    if (episode.watched) {
      const watchCount = episode.watchCount || 1;
      setRewatchItem({
        type: 'episode',
        name: episode.name,
        seasonNumber,
        episodeId,
        currentWatchCount: watchCount,
      });
      setRewatchDialogOpen(true);
      return;
    }

    // Prüfe ob vorherige Episoden in dieser Staffel ungesehen sind
    const hasPreviousUnwatched = season.episodes
      .slice(0, episodeIndex)
      .some((e) => !e.watched);

    // Prüfe ob vorherige Staffeln komplett ungesehen sind
    const hasPreviousSeasonUnwatched = series.seasons
      .filter((s) => s.seasonNumber < seasonNumber)
      .some((s) => s.episodes.some((e) => !e.watched));

    if (hasPreviousUnwatched || hasPreviousSeasonUnwatched) {
      setConfirmEpisode({ seasonNumber, episodeId });
      setEpisodeConfirmOpen(true);
    } else {
      handleWatchedToggleWithConfirmation(seasonNumber, episodeId);
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='lg'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            minHeight: '80vh',
            background:
              'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow:
              '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)',
            color: 'white',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background:
            'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
          backdropFilter: 'blur(15px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: '1.25rem',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
          }}
        >
          <Typography
            component='div'
            variant='h4'
            sx={{ fontWeight: 'bold', color: '#ffd700' }}
          >
            Gesehene Episoden von {series.title}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'rgba(255,255,255,0.7)',
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '&:hover': {
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              transform: 'translateY(-50%) scale(1.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: 0,
          background:
            'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
          backdropFilter: 'blur(10px)',
          color: '#ffffff',
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
                      {`${
                        season.episodes && Array.isArray(season.episodes)
                          ? season.episodes.filter((e) => e.watched).length
                          : 0
                      }/${
                        season.episodes && Array.isArray(season.episodes)
                          ? season.episodes.length
                          : 0
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
                          ? (() => {
                              const minWatchCount = Math.min(
                                ...season.episodes.map(
                                  (ep) => ep.watchCount || 1
                                )
                              );
                              return minWatchCount > 1
                                ? getRewatchColor(minWatchCount)
                                : '#00fed7';
                            })()
                          : 'rgba(255, 255, 255, 0.8)',
                        transition: 'all 0.2s ease-in-out',
                        cursor: isReadOnly ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold',
                      }}
                    >
                      {allWatched ? (
                        (() => {
                          const minWatchCount = Math.min(
                            ...season.episodes.map((ep) => ep.watchCount || 1)
                          );
                          return minWatchCount > 1 ? (
                            `${minWatchCount}x`
                          ) : (
                            <Check size={18} />
                          );
                        })()
                      ) : (
                        <Check size={18} />
                      )}
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
                          {getUnifiedEpisodeDate(episode.air_date)}
                        </span>
                      </div>
                      <div
                        onClick={() =>
                          handleEpisodeClick(
                            season.seasonNumber,
                            episode.id,
                            index
                          )
                        }
                        style={{
                          color: episode.watched
                            ? episode.watchCount && episode.watchCount > 1
                              ? getRewatchColor(episode.watchCount)
                              : '#00fed7'
                            : 'rgba(255, 255, 255, 0.8)',
                          transition: 'all 0.2s ease-in-out',
                          cursor: isReadOnly ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '14px',
                          fontWeight: 'bold',
                        }}
                      >
                        {episode.watched &&
                        episode.watchCount &&
                        episode.watchCount > 1 ? (
                          `${episode.watchCount}x`
                        ) : (
                          <Check size={18} />
                        )}
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
        {episodeConfirmOpen && (
          <Dialog
            open={episodeConfirmOpen}
            onClose={() => {
              setEpisodeConfirmOpen(false);
              setConfirmEpisode(null);
            }}
          >
            <DialogTitle>Bestätigung</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Es gibt vorherige Episoden, die noch nicht als gesehen markiert
                sind. Möchten Sie alle vorherigen Episoden auch als gesehen
                markieren?
              </DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button color='primary' onClick={handleEpisodeConfirmNo}>
                Nur diese Episode
              </Button>
              <Button autoFocus onClick={handleEpisodeConfirmYes}>
                Ja, alle vorherigen auch
              </Button>
            </DialogActions>
          </Dialog>
        )}
        <RewatchDialog
          open={rewatchDialogOpen}
          onClose={() => {
            setRewatchDialogOpen(false);
            setRewatchItem(null);
          }}
          onRewatch={() => {
            if (rewatchItem) {
              if (
                rewatchItem.type === 'episode' &&
                rewatchItem.episodeId !== undefined
              ) {
                handleWatchedToggleWithConfirmation(
                  rewatchItem.seasonNumber,
                  rewatchItem.episodeId,
                  false,
                  true
                );
              } else if (rewatchItem.type === 'season') {
                handleWatchedToggleWithConfirmation(
                  rewatchItem.seasonNumber,
                  -1,
                  false,
                  true
                );
              }
            }
          }}
          onUnwatch={() => {
            if (rewatchItem) {
              if (
                rewatchItem.type === 'episode' &&
                rewatchItem.episodeId !== undefined
              ) {
                handleWatchedToggleWithConfirmation(
                  rewatchItem.seasonNumber,
                  rewatchItem.episodeId,
                  false,
                  false,
                  true
                );
              } else if (rewatchItem.type === 'season') {
                handleWatchedToggleWithConfirmation(
                  rewatchItem.seasonNumber,
                  -1,
                  false,
                  false,
                  true
                );
              }
            }
          }}
          itemType={rewatchItem?.type || 'episode'}
          itemName={rewatchItem?.name || ''}
          currentWatchCount={rewatchItem?.currentWatchCount || 1}
        />
      </DialogContent>
    </Dialog>
  );
};
export default SeriesWatchedDialog;
