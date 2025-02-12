import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import React from 'react';
import { Series } from '../../interfaces/Series';
interface SeriesDialogProps {
  open: boolean;
  onClose: () => void;
  series: Series;
  allGenres: string[];
  ratings: { [key: string]: number | string };
  setRatings: (ratings: { [key: string]: number | string }) => void;
  handleDeleteSeries: () => void;
  handleUpdateRatings: () => void;
  isReadOnly?: boolean;
}

const SeriesDialog = ({
  open,
  onClose,
  series,
  allGenres,
  ratings,
  setRatings,
  handleDeleteSeries,
  handleUpdateRatings,
  isReadOnly = false,
}: SeriesDialogProps) => {
  const theme = useTheme();

  const handleChipClick = (genre: string) => {
    const input = document.getElementById(`rating-input-${genre}`);
    if (input) {
      input.focus();
    }
  };

  const handleRatingChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    genre: string
  ) => {
    const value = event.target.value;
    setRatings({ ...ratings, [genre]: value === '' ? '' : parseFloat(value) });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      sx={{ textAlign: 'center !important' }}
    >
      <DialogTitle>
        {series.title} bearbeiten/löschen
        <IconButton
          aria-label='close'
          onClick={onClose}
          className='closeButton'
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography className='m-3' sx={{ fontSize: '1.4rem' }}>
          Genre:
        </Typography>
        <Box className='flex flex-wrap gap-2 mb-4 justify-center'>
          {series.genre.genres.map((g) => (
            <Chip
              key={g}
              label={g}
              onClick={() => handleChipClick(g)}
              sx={{
                fontSize: '1rem',
                borderRadius: theme.shape.borderRadius,
              }}
            />
          ))}
        </Box>
        <Typography sx={{ fontSize: '1.4rem' }}>Rating:</Typography>
        {allGenres.map((g) => (
          <TextField
            key={g}
            id={`rating-input-${g}`}
            label={g}
            type='number'
            value={ratings[g] === 0 ? '' : ratings[g]}
            onChange={(e) => handleRatingChange(e, g)}
            fullWidth
            margin='normal'
            inputMode='decimal'
            disabled={isReadOnly}
          />
        ))}
      </DialogContent>
      {!isReadOnly && (
        <DialogActions
          sx={{ display: 'flex', justifyContent: 'space-around' }}
          className='flex justify-between'
        >
          <Button onClick={handleDeleteSeries} variant='outlined' color='error'>
            Serie löschen
          </Button>
          <Button
            onClick={handleUpdateRatings}
            variant='outlined'
            color='primary'
          >
            Rating ändern
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default SeriesDialog;
