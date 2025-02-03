import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
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
}

const SeriesWatchedDialog = ({
  open,
  onClose,
  series,
  handleWatchedToggleWithConfirmation,
}: SeriesWatchedDialogProps) => {
  const theme = useTheme();

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
    for (const season of series.seasons) {
      for (let i = 0; i < season.episodes.length; i++) {
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
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle variant='h2'>
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
      <DialogContent>
        {nextUnwatchedEpisode ? (
          <Box
            border={'1px solid #00fed7'}
            borderRadius={'8px'}
            marginBottom='20px'
          >
            <Typography variant='h4'>
              Nächste Folge: S{nextUnwatchedEpisode.seasonNumber + 1} E
              {nextUnwatchedEpisode.episodeNumber} - {nextUnwatchedEpisode.name}
            </Typography>
            <Typography variant='h5' color='textSecondary'>
              Erscheinungsdatum:{' '}
              {formatDateWithLeadingZeros(
                new Date(nextUnwatchedEpisode.air_date)
              )}
            </Typography>
          </Box>
        ) : (
          <>
            <Confetti
              style={{ width: '100%', height: '100%', position: 'absolute' }}
              recycle={false}
              numberOfPieces={1000}
              gravity={0.2}
            />
            <Box
              border={'1px solid #00fed7'}
              borderRadius={'8px'}
              marginBottom='20px'
              padding='16px'
              textAlign='center'
            >
              <Typography variant='h4'>
                Hurra! Alle Episoden gesehen!
              </Typography>
            </Box>
          </>
        )}
        {uniqueSeasons?.map((season) => (
          <Accordion
            key={season.seasonNumber}
            sx={{
              marginBottom: '20px',
              borderRadius: '8px',
              fontSize: '1rem',
              boxShadow:
                '#00fed7 3px 3px 4px 0px, rgba(255, 255, 255, 0.2) -5px -5px 20px 0px',
              backgroundColor: '#1a1a1a',
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{
                backgroundColor: '#1f1f1f',
                textAlign: 'center',
              }}
            >
              <Typography variant='h4' textAlign={'center'} margin={'auto'}>
                Staffel {season.seasonNumber + 1}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                borderRadius: '8px',
                backgroundColor: '#1a1a1a',
              }}
            >
              {season.episodes &&
                season.episodes.map((episode, episodeIndex) => (
                  <Box
                    key={episode.id}
                    display='flex'
                    alignItems='center'
                    justifyContent='space-between'
                    sx={{
                      backgroundColor:
                        episodeIndex % 2 === 0
                          ? theme.palette.action.hover
                          : 'inherit',
                      padding: '8px',
                      borderRadius: '4px',
                      marginBottom: '4px',
                    }}
                  >
                    <Box>
                      <Typography variant='h5'>
                        {episodeIndex + 1}. {episode.name}
                      </Typography>
                      <Typography
                        textAlign={'left'}
                        marginLeft={'16px'}
                        variant='body2'
                        color='textSecondary'
                      >
                        {formatDateWithLeadingZeros(new Date(episode.air_date))}
                      </Typography>
                    </Box>
                    <CheckCircleIcon
                      onClick={() =>
                        handleWatchedToggleWithConfirmation(
                          season.seasonNumber,
                          episode.id
                        )
                      }
                      sx={{
                        cursor: 'pointer',
                        width: '30px',
                        height: '30px',
                        color: episode.watched
                          ? theme.palette.success.main
                          : theme.palette.action.disabled,
                      }}
                    />
                  </Box>
                ))}
            </AccordionDetails>
          </Accordion>
        ))}
      </DialogContent>
    </Dialog>
  );
};

export default SeriesWatchedDialog;
