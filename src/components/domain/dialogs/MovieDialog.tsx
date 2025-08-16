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
import { colors } from '../../../theme';

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
            background: colors.background.gradient.dark,
            borderRadius: '20px',
            border: `1px solid ${colors.border.light}`,
            overflow: 'hidden',
            boxShadow: colors.shadow.card,
            color: colors.text.primary,
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
      <DialogContent
        sx={{
          p: 0,
          background: colors.background.gradient.light,
          backdropFilter: 'blur(10px)',
          color: colors.text.primary,
        }}
      >
        <Box sx={{ p: 3 }}>
          <Typography
            sx={{
              fontSize: '1.2rem',
              fontWeight: 600,
              mb: 2,
              color: colors.text.primary,
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
                  background: colors.button.secondary.gradient,
                  border: `1px solid var(--theme-primary)30`,
                  color: colors.text.primary,
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    background: colors.button.secondary.gradientHover,
                    border: `1px solid var(--theme-primary)40`,
                    transform: 'translateY(-2px)',
                    boxShadow: colors.shadow.hover,
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
              color: colors.text.primary,
            }}
          >
            Bewertungen:
          </Typography>
          <Box
            sx={{
              p: 2,
              mb: 2,
              backgroundColor: `var(--theme-primary)05`,
              border: `1px solid var(--theme-primary)20`,
              borderRadius: '8px',
            }}
          >
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: colors.text.secondary,
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
                  backgroundColor: colors.background.card,
                  backdropFilter: 'blur(10px)',
                  color: colors.text.primary,
                  borderRadius: '12px !important',
                  transition: 'all 0.3s ease',
                  '& fieldset': {
                    borderColor: colors.border.default,
                    borderRadius: '12px !important',
                  },
                  '&:hover': {
                    backgroundColor: colors.background.cardHover,
                    '& fieldset': {
                      borderColor: colors.border.light,
                    },
                  },
                  '&.Mui-focused': {
                    backgroundColor: colors.background.cardFocused,
                    '& fieldset': {
                      borderColor: 'var(--theme-primary)',
                      boxShadow: colors.shadow.focus,
                    },
                  },
                },
                '& .MuiInputLabel-root': {
                  color: colors.text.secondary,
                  '&.Mui-focused': {
                    color: 'var(--theme-primary)',
                  },
                },
                '& .MuiOutlinedInput-input': {
                  color: colors.text.primary,
                  '&::placeholder': {
                    color: colors.text.placeholder,
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
            borderTop: `1px solid ${colors.border.light}`,
            background: colors.background.gradient.dark,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Button
            onClick={handleUpdateRatings}
            variant='contained'
            fullWidth
            sx={{
              maxWidth: 280,
              background: colors.button.primary.gradient,
              borderRadius: '12px',
              padding: '12px 24px',
              color: colors.text.primary,
              fontWeight: 600,
              textTransform: 'none',
              border: `1px solid ${colors.border.light}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              '&:hover': {
                background: colors.button.primary.gradientHover,
                transform: 'translateY(-2px)',
                boxShadow: colors.shadow.buttonHover,
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
