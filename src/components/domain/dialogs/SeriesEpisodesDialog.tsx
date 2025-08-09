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
            background: 'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow: '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)',
            color: 'white',
          },
        }
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          position: 'relative',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
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
      <DialogContent sx={{ 
        p: 0, 
        background: 'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
        backdropFilter: 'blur(10px)',
        color: '#ffffff' 
      }}>
        <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {Array.isArray(series.nextEpisode?.nextEpisodes) &&
          series.nextEpisode.nextEpisodes.length > 0 ? (
            series.nextEpisode.nextEpisodes.map((episode) => (
              <ListItem
                key={`${series.id}-${episode.season}-${episode.number}-${episode.airstamp}`}
                sx={{
                  border: '1px solid rgba(0,254,215,0.125)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
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
                    sx={{ fontSize: '0.8rem', color: 'gray' }}
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
