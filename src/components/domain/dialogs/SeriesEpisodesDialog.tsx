import { Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material';
import { Series } from '../../../types/Series';
import { getFormattedDate, getFormattedTime } from '../../../lib/date/date.utils';
import { colors } from '../../../theme';
interface SeriesEpisodesDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
}
const SeriesEpisodesDialog = ({
  open,
  onClose,
  series,
}: SeriesEpisodesDialogProps) => {
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
            background: colors.background.gradient.dark,
            borderRadius: '20px',
            border: `1px solid ${colors.border.light}`,
            overflow: 'hidden',
            boxShadow: colors.shadow.card,
            color: colors.text.primary,
          },
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background: colors.overlay.dark,
          backdropFilter: 'blur(15px)',
          borderBottom: `1px solid ${colors.border.subtle}`,
          color: colors.text.primary,
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
            sx={{ fontWeight: 'bold', color: colors.text.accent }}
          >
            Kommende Episoden von {series.title}
          </Typography>
        </Box>

        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            color: colors.text.secondary,
            background: colors.overlay.light,
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            '&:hover': {
              background: colors.overlay.medium,
              color: colors.text.primary,
              transform: 'translateY(-50%) scale(1.05)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ 
        p: 0, 
        background: colors.background.gradient.light,
        backdropFilter: 'blur(10px)',
        color: colors.text.primary 
      }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.isArray(series.nextEpisode?.nextEpisodes) &&
          series.nextEpisode.nextEpisodes.length > 0 ? (
            series.nextEpisode.nextEpisodes.map((episode) => (
              <ListItem
                key={`${series.id}-${episode.season}-${episode.number}-${episode.airstamp}`}
                sx={{
                  border: `1px solid var(--theme-primary)20`,
                  backgroundColor: colors.background.card,
                  borderRadius: 2,
                  p: 3,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box
                  component='img'
                  src={series.poster?.poster || '/placeholder.jpg'}
                  alt={episode.name}
                  sx={{
                    width: 60,
                    height: 90,
                    borderRadius: 1,
                    marginRight: 2,
                  }}
                />
                <Box>
                  <ListItemText
                    primary={series.title}
                    secondary={`Staffel ${episode.season}, Ep. ${episode.number}: ${episode.name}`}
                  />
                  <Box
                    component='span'
                    sx={{ fontSize: '0.8rem', color: colors.text.secondary }}
                  >
                    {getFormattedDate(episode.airstamp)} |{' '}
                    {getFormattedTime(episode.airstamp)}
                  </Box>
                </Box>
              </ListItem>
            ))
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant='body1' color='text.secondary'>
                Keine kommenden Episoden verfügbar
              </Typography>
            </Box>
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
};
export default SeriesEpisodesDialog;
