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
} from '@mui/material';
import React from 'react';
import { genreDisplayNames } from '../../../../constants/seriesCard.constants';
import { Movie } from '../../../types/Movie';

interface MovieDialogProps {
  open: boolean;
  onClose: () => void;
  movie: Movie;
  allGenres: string[];
  ratings: { [key: string]: number | string };
  setRatings: (ratings: { [key: string]: number | string }) => void;
  handleDeleteMovie: () => void;
  handleUpdateRatings: () => void;
  isReadOnly?: boolean;
}

const MovieDialog = ({
  open,
  onClose,
  movie,
  allGenres,
  ratings,
  setRatings,
  handleUpdateRatings,
  isReadOnly = false,
}: MovieDialogProps) => {
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
    let numericValue = value === '' ? 0 : parseFloat(value);

    if (numericValue < 0) numericValue = 0;
    if (numericValue > 10) numericValue = 10;

    setRatings({ ...ratings, [genre]: numericValue });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      slotProps={{
        paper: {
          sx: {
            background:
              'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow:
              '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(168, 85, 247, 0.2), 0 0 60px rgba(168, 85, 247, 0.1)',
            color: '#ffffff',
          },
        },
      }}
      sx={{
        textAlign: 'center !important',
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
            {movie.title}
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
        <Box sx={{ p: 3 }}>
          <Typography
            sx={{
              fontSize: '1.2rem',
              fontWeight: 600,
              mb: 2,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Genres:
          </Typography>
          <Box className='flex flex-wrap gap-2 mb-4 justify-center'>
            {movie.genre.genres.map((g) => (
              <Chip
                key={g}
                label={genreDisplayNames[g] ?? g}
                onClick={() => handleChipClick(g)}
                sx={{
                  fontSize: '1rem',
                  borderRadius: '12px',
                  background:
                    'linear-gradient(135deg, rgba(0, 254, 215, 0.2) 0%, rgba(0, 212, 170, 0.15) 100%)',
                  border: '1px solid rgba(0, 254, 215, 0.3)',
                  color: '#ffffff',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background:
                      'linear-gradient(135deg, rgba(0, 254, 215, 0.3) 0%, rgba(0, 212, 170, 0.25) 100%)',
                    border: '1px solid rgba(0, 254, 215, 0.4)',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(0, 254, 215, 0.3)',
                  },
                }}
              />
            ))}
          </Box>
          <Typography
            sx={{
              fontSize: '1.2rem',
              fontWeight: 600,
              mt: 3,
              mb: 2,
              color: 'rgba(255,255,255,0.9)',
            }}
          >
            Bewertungen:
          </Typography>
          <Box
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: 'rgba(0, 254, 215, 0.05)',
              border: '1px solid rgba(0, 254, 215, 0.2)',
              borderRadius: '8px',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.4,
              }}
            >
              💡 <strong>Neues Rating-System:</strong> Bewerte beliebige Genres
              von 0.00-10.00. Nur bewertete Genres ({'>'} 0) fließen in die
              Gesamtbewertung ein. Unbewertete Genres werden ignoriert.
            </Typography>
          </Box>
          {allGenres.map((g) => (
            <TextField
              key={g}
              id={`rating-input-${g}`}
              label={genreDisplayNames[g] ?? g}
              type='number'
              value={ratings[g] === 0 ? '' : ratings[g]}
              onChange={(e) => handleRatingChange(e, g)}
              fullWidth
              margin='normal'
              inputMode='decimal'
              disabled={isReadOnly}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: 0,
                max: 10,
                step: 0.01,
              }}
              placeholder='0.00 - 10.00'
              sx={{
                backgroundColor: 'transparent',
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(45,45,48,0.3)',
                  backdropFilter: 'blur(10px)',
                  color: '#ffffff',
                  borderRadius: '12px !important',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px !important',
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(55,55,58,0.4)',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.4)',
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'rgba(65,65,68,0.5)',
                    '& fieldset': {
                      borderColor: '#00fed7',
                      boxShadow: '0 0 15px rgba(0, 254, 215, 0.3)',
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(255,255,255,0.7)',
                  '&.Mui-focused': {
                    color: '#00fed7',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: '#ffffff',
                  '&::placeholder': {
                    color: 'rgba(255,255,255,0.4)',
                    opacity: 1,
                  },
                },
              }}
            />
          ))}
        </Box>
      </DialogContent>
      {!isReadOnly && (
        <DialogActions
          sx={{
            display: 'flex',
            justifyContent: 'center',
            padding: '24px',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            background:
              'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Button
            onClick={handleUpdateRatings}
            variant='contained'
            fullWidth
            sx={{
              maxWidth: 280,
              background: 'linear-gradient(135deg, #00fed7 0%, #00d4aa 100%)',
              borderRadius: '12px',
              padding: '12px 24px',
              color: '#000',
              fontWeight: 600,
              textTransform: 'none',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: 'linear-gradient(135deg, #00d4aa 0%, #00b894 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 25px rgba(0, 254, 215, 0.4)',
              },
            }}
          >
            Rating speichern
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
};

export default MovieDialog;
