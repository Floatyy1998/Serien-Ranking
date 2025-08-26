import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
  Tabs,
  Tab,
  LinearProgress,
  Chip,
  useMediaQuery,
  useTheme,
  Badge,
} from '@mui/material';
import {
  Check,
  Calendar,
  Eye,
  Award,
  PlayCircle,
  RotateCcw,
  Clock,
} from 'lucide-react';
import { useState } from 'react';
import Confetti from 'react-confetti';
import { Series } from '../../../types/Series';
import { getUnifiedEpisodeDate } from '../../../lib/date/episodeDate.utils';
import { colors } from '../../../theme';
import RewatchDialog from './RewatchDialog';

// Hilfsfunktion für Rewatch-Farben
const getRewatchColor = (watchCount: number): string => {
  if (watchCount <= 1) return colors.primary;
  if (watchCount === 2) return colors.text.accent;
  if (watchCount === 3) return colors.text.accent;
  return colors.status.warning;
};

interface SeriesWatchedDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  user: any;
  handleWatchedToggleWithConfirmation: (
    seasonNumber: number,
    episodeId: number
  ) => void;
  handleBatchWatchedToggle?: (seasonNumber: number) => void;
  handleEpisodeBatchWatchedToggle?: (episodeIds: number[], watched: boolean) => void;
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [selectedTab, setSelectedTab] = useState<number>(0);
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
    seasonNumber?: number;
    episodeId?: number;
    currentWatchCount: number;
  } | null>(null);

  const uniqueSeasons = series.seasons;

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
  };

  const handleConfirmYes = () => {
    if (confirmSeason !== null) {
      handleBatchWatchedToggle?.(confirmSeason);
      setConfirmOpen(false);
      setConfirmSeason(null);
    }
  };

  const handleConfirmNo = () => {
    if (confirmSeason !== null) {
      const season = series.seasons.find((s) => s.seasonNumber === confirmSeason);
      if (season) {
        const allUnwatchedEpisodeIds = season.episodes
          ?.filter((e) => !e.watched)
          .map((e) => e.id) || [];
        handleEpisodeBatchWatchedToggle?.(allUnwatchedEpisodeIds, true);
      }
      setConfirmOpen(false);
      setConfirmSeason(null);
    }
  };

  const handleEpisodeConfirmYes = () => {
    if (confirmEpisode) {
      const { seasonNumber, episodeId } = confirmEpisode;
      const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
      if (season) {
        const episodeIndex = season.episodes?.findIndex((e) => e.id === episodeId) ?? -1;
        if (episodeIndex !== -1) {
          const previousEpisodeIds = season.episodes
            ?.slice(0, episodeIndex + 1)
            .filter((e) => !e.watched)
            .map((e) => e.id) || [];
          
          const previousSeasonEpisodeIds = series.seasons
            .filter((s) => s.seasonNumber < seasonNumber)
            .flatMap((s) => 
              s.episodes?.filter((e) => !e.watched).map((e) => e.id) || []
            );
          
          const allEpisodeIds = [...previousSeasonEpisodeIds, ...previousEpisodeIds];
          handleEpisodeBatchWatchedToggle?.(allEpisodeIds, true);
        }
      }
      setEpisodeConfirmOpen(false);
      setConfirmEpisode(null);
    }
  };

  const handleEpisodeConfirmNo = () => {
    if (confirmEpisode) {
      handleWatchedToggleWithConfirmation(
        confirmEpisode.seasonNumber,
        confirmEpisode.episodeId
      );
      setEpisodeConfirmOpen(false);
      setConfirmEpisode(null);
    }
  };

  const handleSeasonClick = (seasonNumber: number, allWatched: boolean) => {
    if (isReadOnly) return;

    const season = series.seasons.find((s) => s.seasonNumber === seasonNumber);
    if (!season) return;

    if (!allWatched) {
      const hasPreviousSeasonUnwatched = series.seasons
        .filter((s) => s.seasonNumber < seasonNumber)
        .some((s) => s.episodes?.some((e) => !e.watched));

      if (hasPreviousSeasonUnwatched) {
        setConfirmSeason(seasonNumber);
        setConfirmOpen(true);
      } else {
        const allUnwatchedEpisodeIds = season.episodes
          ?.filter((e) => !e.watched)
          .map((e) => e.id) || [];
        handleEpisodeBatchWatchedToggle?.(allUnwatchedEpisodeIds, true);
      }
    } else {
      const avgWatchCount = Math.round(
        (season.episodes?.reduce((acc, ep) => acc + (ep.watchCount || 1), 0) || 0) /
        (season.episodes?.length || 1)
      );
      
      if (avgWatchCount >= 1) {
        setRewatchItem({
          type: 'season',
          name: `Staffel ${seasonNumber + 1}`,
          seasonNumber,
          currentWatchCount: avgWatchCount,
        });
        setRewatchDialogOpen(true);
      }
    }
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

    const hasPreviousUnwatched = season.episodes
      .slice(0, episodeIndex)
      .some((e) => !e.watched);

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

  // Berechne Fortschritt
  const totalEpisodes = uniqueSeasons?.reduce(
    (acc, season) => acc + (season.episodes?.length || 0),
    0
  ) || 0;
  const watchedEpisodes = uniqueSeasons?.reduce(
    (acc, season) => acc + (season.episodes?.filter((ep) => ep.watched)?.length || 0),
    0
  ) || 0;
  const progressPercentage = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;

  // Berechne Statistiken
  const totalWatchTime = uniqueSeasons?.reduce(
    (acc, season) => acc + season.episodes?.reduce(
      (epAcc, ep) => {
        if (!ep.watched) return epAcc;
        // Verwende immer series.episodeRuntime
        const runtime = series.episodeRuntime || 45;
        return epAcc + (ep.watchCount || 1) * runtime;
      }, 0
    ) || 0,
    0
  ) || 0;
  const hoursWatched = Math.round(totalWatchTime / 60);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth='lg'
        fullWidth
        slotProps={{
          paper: {
            sx: {
              maxHeight: '95vh',
              background: colors.background.dialog,
              borderRadius: isMobile ? '16px 16px 0 0' : '16px',
              border: `1px solid ${colors.border.lighter}`,
              overflow: 'hidden',
              boxShadow: colors.shadow.dialog,
              color: colors.text.secondary,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            position: 'relative',
            background: colors.background.gradient.dark,
            borderBottom: `1px solid ${colors.border.lighter}`,
            padding: isMobile ? '12px' : '20px',
          }}
        >
          <IconButton
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: colors.text.muted,
              zIndex: 1,
              '&:hover': {
                background: colors.overlay.light,
              },
            }}
          >
            <CloseIcon />
          </IconButton>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pr: 4 }}>
            {/* Header mit Titel und Stats */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
              {series.poster?.poster && !isMobile && (
                <Box
                  component='img'
                  src={series.poster.poster}
                  alt={series.title}
                  sx={{
                    width: 50,
                    height: 75,
                    borderRadius: '8px',
                    objectFit: 'cover',
                    boxShadow: colors.shadow.card,
                  }}
                />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant='h5'
                  sx={{
                    fontWeight: 700,
                    color: colors.text.secondary,
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  {series.title}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  <Chip
                    icon={<Eye size={14} />}
                    label={`${watchedEpisodes}/${totalEpisodes}`}
                    size='small'
                    sx={{
                      height: 24,
                      fontSize: '0.75rem',
                      backgroundColor: `${colors.text.accent}20`,
                      color: colors.text.accent,
                      border: `1px solid ${colors.text.accent}`,
                      '& .MuiChip-icon': { color: colors.text.accent },
                    }}
                  />
                  {hoursWatched > 0 && (
                    <Chip
                      icon={<Clock size={14} />}
                      label={`${hoursWatched}h`}
                      size='small'
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        backgroundColor: `${colors.text.accent}20`,
                        color: colors.text.accent,
                        border: `1px solid ${colors.text.accent}`,
                        '& .MuiChip-icon': { color: colors.text.accent },
                      }}
                    />
                  )}
                  {progressPercentage === 100 && (
                    <Chip
                      icon={<Award size={14} />}
                      label='Komplett'
                      size='small'
                      sx={{
                        height: 24,
                        fontSize: '0.75rem',
                        background: `${colors.text.accent}15`,
                        color: colors.text.accent,
                        border: `1px solid ${colors.text.accent}`,
                        '& .MuiChip-icon': { color: colors.text.accent },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
            
            {/* Progress Bar */}
            <Box sx={{ width: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography
                  variant='caption'
                  sx={{
                    color: colors.text.muted,
                    fontSize: '0.7rem',
                  }}
                >
                  Fortschritt
                </Typography>
                <Typography
                  variant='caption'
                  sx={{
                    color: progressPercentage === 100 ? colors.text.accent : progressPercentage >= 80 ? colors.text.accent : colors.primary,
                    fontSize: '0.7rem',
                    fontWeight: 600,
                  }}
                >
                  {Math.round(progressPercentage)}%
                </Typography>
              </Box>
              <LinearProgress
                variant='determinate'
                value={progressPercentage}
                sx={{
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: colors.overlay.light,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 3,
                    background: progressPercentage === 100
                      ? `linear-gradient(90deg, ${colors.text.accent} 0%, ${colors.primary} 100%)`
                      : progressPercentage >= 80
                      ? `linear-gradient(90deg, ${colors.primary} 0%, ${colors.text.accent} 100%)`
                      : colors.primary,
                  },
                }}
              />
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, background: colors.background.gradient.light }}>
          {/* Confetti wenn komplett */}
          {progressPercentage === 100 && (
            <Confetti
              style={{ width: '100%', height: '100%', position: 'fixed', zIndex: 9999 }}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />
          )}

          {/* Tabs für Staffeln */}
          <Box sx={{ borderBottom: 1, borderColor: colors.border.lighter, background: colors.overlay.dark }}>
            <Tabs
              value={selectedTab}
              onChange={handleTabChange}
              variant='scrollable'
              scrollButtons='auto'
              sx={{
                minHeight: 48,
                '& .MuiTab-root': {
                  color: colors.text.muted,
                  minHeight: 48,
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  px: 2,
                  '&.Mui-selected': {
                    color: colors.primary,
                  },
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: colors.primary,
                  height: 3,
                },
              }}
            >
              {uniqueSeasons?.map((season) => {
                const watchedCount = season.episodes?.filter(e => e.watched).length || 0;
                const totalCount = season.episodes?.length || 0;
                const allWatched = watchedCount === totalCount;
                
                return (
                  <Tab
                    key={season.seasonNumber}
                    label={
                      <Box sx={{ position: 'relative' }}>
                        <Typography variant='body2' sx={{ fontWeight: 600 }}>
                          Staffel {season.seasonNumber + 1}
                        </Typography>
                        <Typography variant='caption' sx={{ opacity: 0.7, fontSize: '0.7rem' }}>
                          {watchedCount}/{totalCount}
                        </Typography>
                        {allWatched && (
                          <Badge
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -8,
                              '& .MuiBadge-badge': {
                                background: colors.status.success,
                                width: 8,
                                height: 8,
                                minWidth: 8,
                              },
                            }}
                            variant='dot'
                          />
                        )}
                      </Box>
                    }
                  />
                );
              })}
            </Tabs>
          </Box>

          {/* Tab Panels mit Episoden */}
          <Box sx={{ height: 'calc(100vh - 400px)', maxHeight: '500px', overflow: 'auto' }}>
            {uniqueSeasons?.map((season, index) => {
              const allWatched = season.episodes?.every(ep => ep.watched);
              
              return (
                <Box
                  key={season.seasonNumber}
                  role='tabpanel'
                  hidden={selectedTab !== index}
                  sx={{ p: 0 }}
                >
                  {/* Staffel Header */}
                  <Box
                    sx={{
                      p: 2,
                      background: colors.overlay.light,
                      borderBottom: `1px solid ${colors.border.lighter}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      position: 'sticky',
                      top: 0,
                      zIndex: 1,
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Box>
                      <Typography variant='h6' sx={{ fontWeight: 600, color: colors.text.secondary }}>
                        Staffel {season.seasonNumber + 1}
                      </Typography>
                      <Typography variant='caption' sx={{ color: colors.text.muted }}>
                        {season.episodes?.filter(e => e.watched).length || 0} von {season.episodes?.length || 0} gesehen
                      </Typography>
                    </Box>
                    {!isReadOnly && (
                      <Button
                        onClick={() => handleSeasonClick(season.seasonNumber, allWatched)}
                        variant='outlined'
                        size='small'
                        startIcon={allWatched ? <PlayCircle size={16} /> : <Check size={16} />}
                        sx={{
                          borderColor: allWatched ? colors.primary : colors.primary,
                          color: allWatched ? colors.primary : colors.primary,
                          '&:hover': {
                            borderColor: allWatched ? colors.text.accent : colors.text.accent,
                            background: colors.overlay.light,
                          },
                        }}
                      >
                        {allWatched ? 'Bearbeiten' : 'Alle markieren'}
                      </Button>
                    )}
                  </Box>

                  {/* Episoden Liste */}
                  <Box sx={{ p: 0 }}>
                    {season.episodes?.map((episode, episodeIndex) => (
                      <Box
                        key={episode.id}
                        sx={{
                          p: 2,
                          borderBottom: `1px solid ${colors.border.subtle}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.2s',
                          background: episode.watched 
                            ? `linear-gradient(90deg, ${colors.overlay.light}40, transparent)`
                            : colors.background.card,
                        }}
                      >
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              color: colors.primary,
                              fontWeight: 600,
                              minWidth: '30px',
                            }}
                          >
                            {episodeIndex + 1}
                          </Typography>
                          
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant='body2'
                              sx={{
                                color: episode.watched ? colors.text.secondary : colors.text.muted,
                                fontWeight: episode.watched ? 500 : 400,
                                mb: 0.5,
                              }}
                            >
                              {episode.name}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Calendar size={12} style={{ color: colors.text.muted }} />
                                <Typography variant='caption' sx={{ color: colors.text.muted }}>
                                  {getUnifiedEpisodeDate(episode.air_date)}
                                </Typography>
                              </Box>
                              {episode.firstWatchedAt && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  <Eye size={12} style={{ color: colors.primary }} />
                                  <Typography variant='caption' sx={{ color: colors.primary }}>
                                    Gesehen: {getUnifiedEpisodeDate(episode.firstWatchedAt)}
                                  </Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>

                        <Box 
                          onClick={() => !isReadOnly && handleEpisodeClick(season.seasonNumber, episode.id, episodeIndex)}
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 1,
                            cursor: isReadOnly ? 'default' : 'pointer',
                          }}
                        >
                          {episode.watched ? (
                            <>
                              {episode.watchCount && episode.watchCount > 1 ? (
                                <Chip
                                  icon={<RotateCcw size={14} />}
                                  label={`${episode.watchCount}x`}
                                  size='small'
                                  sx={{
                                    height: 24,
                                    backgroundColor: `${colors.text.accent}20`,
                                    border: `1px solid ${getRewatchColor(episode.watchCount)}`,
                                    color: getRewatchColor(episode.watchCount),
                                    fontWeight: 500,
                                    cursor: isReadOnly ? 'default' : 'pointer',
                                    '& .MuiChip-icon': {
                                      color: getRewatchColor(episode.watchCount),
                                    },
                                    '&:hover': !isReadOnly ? {
                                      transform: 'scale(1.05)',
                                      boxShadow: `0 2px 8px ${getRewatchColor(episode.watchCount)}40`,
                                    } : {},
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: '8px',
                                    background: `linear-gradient(135deg, ${colors.primary}, ${colors.text.accent})`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colors.background.default,
                                    boxShadow: `0 2px 8px ${colors.primary}40`,
                                    transition: 'all 0.2s',
                                    cursor: isReadOnly ? 'default' : 'pointer',
                                    '&:hover': !isReadOnly ? {
                                      background: `linear-gradient(135deg, ${colors.text.accent}, ${colors.primary})`,
                                      transform: 'scale(1.1)',
                                      boxShadow: `0 4px 12px ${colors.text.accent}60`,
                                    } : {},
                                  }}
                                >
                                  <Check size={18} />
                                </Box>
                              )}
                            </>
                          ) : (
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: '8px',
                                border: `2px solid ${colors.border.default}`,
                                background: colors.overlay.light,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s',
                                cursor: isReadOnly ? 'default' : 'pointer',
                                '&:hover': !isReadOnly ? {
                                  borderColor: colors.primary,
                                  background: `${colors.primary}20`,
                                  transform: 'scale(1.1)',
                                } : {},
                              }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))}
                  </Box>
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Confirm Dialogs */}
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
              Möchten Sie diese Staffel und alle vorherigen als gesehen markieren?
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
            if (rewatchItem.type === 'episode' && rewatchItem.seasonNumber !== undefined && rewatchItem.episodeId !== undefined) {
              // Verwende isRewatch flag für korrektes Rewatch-Verhalten
              handleWatchedToggleWithConfirmation(
                rewatchItem.seasonNumber, 
                rewatchItem.episodeId
              );
            } else if (rewatchItem.type === 'season' && rewatchItem.seasonNumber !== undefined) {
              // Für ganze Staffeln: Rewatch mit isRewatch flag
              handleWatchedToggleWithConfirmation(
                rewatchItem.seasonNumber,
                -1  // -1 bedeutet alle Episoden der Staffel
              );
            }
          }
        }}
        onUnwatch={() => {
          if (rewatchItem) {
            if (rewatchItem.type === 'episode' && rewatchItem.seasonNumber !== undefined && rewatchItem.episodeId !== undefined) {
              // Verwende forceUnwatch flag für korrektes Unwatch-Verhalten
              handleWatchedToggleWithConfirmation(
                rewatchItem.seasonNumber, 
                rewatchItem.episodeId
              );
            } else if (rewatchItem.type === 'season' && rewatchItem.seasonNumber !== undefined) {
              // Für ganze Staffeln: Alle Episoden einzeln mit forceUnwatch aufrufen
              const season = series.seasons.find(s => s.seasonNumber === rewatchItem.seasonNumber);
              if (season && season.episodes) {
                // Rufe handleWatchedToggleWithConfirmation für jede Episode auf
                // mit seasonNumber -1 und forceUnwatch = true für Batch-Operation
                handleWatchedToggleWithConfirmation(
                  rewatchItem.seasonNumber,
                  -1  // -1 bedeutet alle Episoden der Staffel
                );
              }
            }
          }
        }}
        itemType={rewatchItem?.type || 'episode'}
        itemName={rewatchItem?.name || ''}
        currentWatchCount={rewatchItem?.currentWatchCount || 1}
      />
    </>
  );
};

export default SeriesWatchedDialog;