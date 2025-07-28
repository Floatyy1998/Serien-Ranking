import CloseIcon from '@mui/icons-material/Close';
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
import { Series } from '../../interfaces/Series';
import { getFormattedDate, getFormattedTime } from '../../utils/date.utils';
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
      sx={{ textAlign: 'center !important' }}
      open={open}
      onClose={onClose}
      fullWidth
      disableAutoFocus={true}
      disableEnforceFocus={false}
      disableRestoreFocus={false}
      keepMounted={false}
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
        Kommende Episoden von {series.title}
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
