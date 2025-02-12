import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { Series } from '../../interfaces/Series';
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
        <DialogContentText>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {Array.isArray(series.nextEpisode.nextEpisodes) &&
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
                    src={series.poster.poster}
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
                      Uhrzeit:{' '}
                      {new Date(episode.airstamp).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Box>
                  </Box>
                </ListItem>
              ))}
          </List>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default SeriesEpisodesDialog;
