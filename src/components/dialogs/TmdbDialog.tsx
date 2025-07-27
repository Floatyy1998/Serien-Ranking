import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import React from 'react';

interface TmdbDialogProps {
  open: boolean;
  loading: boolean;
  data: any;
  type: 'movie' | 'tv';
  onClose: () => void;
  onAdd?: () => void;
  adding?: boolean;
  showAddButton?: boolean;
}

const TmdbDialog: React.FC<TmdbDialogProps> = ({
  open,
  loading,
  data,
  type,
  onClose,
  onAdd,
  adding = false,
  showAddButton = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d30 100%)',
          color: 'white',
          maxHeight: '90vh',
          overflow: 'hidden',
        },
      }}
    >
      {loading ? (
        <DialogContent sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#00fed7', mb: 2 }} />
          <Typography variant='h6' color='#00fed7'>
            Lade Daten...
          </Typography>
        </DialogContent>
      ) : data ? (
        <>
          <DialogTitle
            sx={{
              background: 'linear-gradient(135deg, #333333 0%, #1a1a1a 100%)',
              color: 'white',
              position: 'relative',
            }}
          >
            <IconButton
              aria-label='close'
              onClick={onClose}
              sx={{ position: 'absolute', right: 8, top: 8, color: 'red' }}
            >
              <CloseIcon />
            </IconButton>
            <Box>
              <Typography
                variant='h5'
                component='div'
                sx={{ fontWeight: 'bold' }}
              >
                {type === 'tv' ? data.name : data.title}
                {data.first_air_date &&
                  ` (${new Date(data.first_air_date).getFullYear()})`}
                {data.release_date &&
                  ` (${new Date(data.release_date).getFullYear()})`}
              </Typography>
              <Chip
                label={type === 'tv' ? '📺 Serie' : '🎬 Film'}
                size='small'
                sx={{
                  mt: 1,
                  backgroundColor: '#00fed7',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              />
            </Box>
          </DialogTitle>
          <DialogContent sx={{ p: 3, backgroundColor: '#1e1e1e' }}>
            <Box
              display='flex'
              gap={3}
              flexDirection={{ xs: 'column', md: 'row' }}
            >
              {data.poster_path && (
                <Box sx={{ flexShrink: 0 }} mt={2}>
                  <Box
                    component='img'
                    src={`https://image.tmdb.org/t/p/w300${data.poster_path}`}
                    alt={type === 'tv' ? data.name : data.title}
                    sx={{
                      width: { xs: '200px', md: '250px' },
                      height: 'auto',
                      borderRadius: 2,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                      mx: { xs: 'auto', md: 0 },
                      display: 'block',
                    }}
                  />
                </Box>
              )}
              <Box flex={1}>
                {data.overview && (
                  <Box mb={3} mt={2}>
                    <Typography
                      variant='h4'
                      gutterBottom
                      sx={{ color: '#00fed7' }}
                    >
                      Beschreibung
                    </Typography>
                    <Typography variant='body1' sx={{ lineHeight: 1.6 }}>
                      {data.overview}
                    </Typography>
                  </Box>
                )}
                <Box display='flex' flexDirection='column' gap={2}>
                  {data.vote_average !== undefined &&
                    data.vote_average !== null && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          TMDB Bewertung
                        </Typography>
                        <Typography variant='body1'>
                          ⭐ {data.vote_average.toFixed(1)}/10
                        </Typography>
                      </Box>
                    )}
                  {data.genres && data.genres.length > 0 && (
                    <Box>
                      <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                        Genres
                      </Typography>
                      <Box display='flex' gap={1} flexWrap='wrap' mt={1}>
                        {data.genres.map((genre: any) => (
                          <span
                            key={genre.id}
                            style={{
                              background: '#00fed7',
                              color: '#000',
                              borderRadius: 6,
                              padding: '2px 8px',
                              marginRight: 4,
                            }}
                          >
                            {genre.name}
                          </span>
                        ))}
                      </Box>
                    </Box>
                  )}
                  {type === 'tv' &&
                    data.number_of_seasons !== undefined &&
                    data.number_of_seasons !== null &&
                    data.number_of_seasons > 0 && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          Staffeln
                        </Typography>
                        <Typography variant='body1'>
                          {data.number_of_seasons} Staffel(n)
                          {data.number_of_episodes !== undefined &&
                            data.number_of_episodes !== null &&
                            data.number_of_episodes > 0 && (
                              <> • {data.number_of_episodes} Episoden</>
                            )}
                        </Typography>
                      </Box>
                    )}
                  {type === 'movie' &&
                    data.runtime !== undefined &&
                    data.runtime !== null &&
                    data.runtime > 0 && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          Laufzeit
                        </Typography>
                        <Typography variant='body1'>
                          {data.runtime} Minuten
                        </Typography>
                      </Box>
                    )}
                </Box>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3, backgroundColor: '#1e1e1e', gap: 2 }}>
            {showAddButton && onAdd && (
              <Button
                variant='contained'
                onClick={onAdd}
                disabled={adding}
                sx={{
                  backgroundColor: '#00fed7',
                  color: '#000',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#00d4b8',
                  },
                  '&:disabled': {
                    backgroundColor: '#666',
                    color: '#999',
                  },
                }}
              >
                {adding
                  ? 'Wird hinzugefügt...'
                  : `${
                      type === 'tv' ? 'Serie' : 'Film'
                    } zu meiner Liste hinzufügen`}
              </Button>
            )}
          </DialogActions>
        </>
      ) : null}
    </Dialog>
  );
};

export default TmdbDialog;
