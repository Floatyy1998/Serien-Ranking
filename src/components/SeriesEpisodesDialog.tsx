import CloseIcon from '@mui/icons-material/Close';
import {
  Chip,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import { Series } from '../interfaces/Series';

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
      <DialogTitle variant='h2' className='bg-[#090909]'>
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
          <ul
            id='serienRecs'
            key={`${series.id * Math.random() + Date.now()}`}
            className='p-0'
          >
            {Array.isArray(series.nextEpisode.nextEpisodes) &&
              series.nextEpisode.nextEpisodes.map((episode) => (
                <>
                  <li
                    key={`${series.id * Math.random() + Date.now()}`} // Hinzugefügter key-Prop
                    className='episodes flex gap-3 items-center p-3'
                  >
                    <img
                      className='episodeBild w-[92px]'
                      src={series.poster.poster}
                      alt={episode.name}
                    />
                    <div className='episodeBox flex flex-col gap-5'>
                      <Chip
                        className='text-white'
                        sx={{
                          height: 'fit-content !important',
                          width: 'fit-content !important',
                          borderRadius: '50px !important',
                          fontSize: '.8rem !important',
                          minWidth: 'fit-content !important',
                          minHeight: 'fit-content !important',
                        }}
                        label={series.title}
                      ></Chip>
                      <Typography variant='body2' className='text-white'>
                        S{episode.season} | E{episode.number}
                      </Typography>
                      <Typography variant='body2' className='text-white'>
                        {episode.name}
                      </Typography>
                    </div>
                    <div className='flex flex-col items-end ml-auto'>
                      <Typography variant='body2' className='text-white'>
                        {new Date(episode.airstamp).toLocaleDateString(
                          'de-DE',
                          {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          }
                        )}{' '}
                        |{' '}
                        {new Date(episode.airstamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                    </div>
                  </li>
                  <Divider></Divider>
                </>
              ))}
          </ul>
        </DialogContentText>
      </DialogContent>
    </Dialog>
  );
};

export default SeriesEpisodesDialog;
