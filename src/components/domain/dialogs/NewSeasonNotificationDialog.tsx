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
  Typography,
} from '@mui/material';
import React, { useState } from 'react';
import { useAuth } from '../../../App';
import { useFirebaseBatch } from '../../../hooks/useFirebaseBatch';
import { Series } from '../../../types/Series';
import { colors } from '../../../theme';

const providerLogos: { [key: number]: { name: string; logo: string } } = {
  337: {
    name: 'Disney Plus',
    logo: `https://image.tmdb.org/t/p/w342/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg`,
  },
  8: {
    name: 'Netflix',
    logo: `https://image.tmdb.org/t/p/w342/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg`,
  },
  9: {
    name: 'Amazon Prime Video',
    logo: `https://image.tmdb.org/t/p/w342/emthp39XA2YScoYL1p0sdbAH2WA.jpg`,
  },
  283: {
    name: 'Crunchyroll',
    logo: `https://image.tmdb.org/t/p/w342/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
  },
  30: {
    name: 'WOW',
    logo: `https://image.tmdb.org/t/p/w342/1WESsDFMs3cJc2TeT3nnzwIffGv.jpg`,
  },
  350: {
    name: 'Apple TV Plus',
    logo: `https://image.tmdb.org/t/p/w342/6uhKBfmtzFqOcLousHwZuzcrScK.jpg`,
  },
  421: {
    name: 'Joyn Plus',
    logo: `https://image.tmdb.org/t/p/w342/2joD3S2goOB6lmepX35A8dmaqgM.jpg`,
  },
  531: {
    name: 'Paramount Plus',
    logo: `https://image.tmdb.org/t/p/w342/xbhHHa1YgtpwhC8lb1NQ3ACVcLd.jpg`,
  },
  178: {
    name: 'MagentaTV',
    logo: `https://image.tmdb.org/t/p/w342/uULoezj2skPc6amfwru72UPjYXV.jpg`,
  },
  298: {
    name: 'RTL+',
    logo: `https://image.tmdb.org/t/p/w342/3hI22hp7YDZXyrmXVqDGnVivNTI.jpg`,
  },
  354: {
    name: 'Crunchyroll',
    logo: `https://image.tmdb.org/t/p/w342/8Gt1iClBlzTeQs8WQm8UrCoIxnQ.jpg`,
  },
  613: {
    name: 'Freevee',
    logo: `https://image.tmdb.org/t/p/w342/uBE4RMH15mrkuz6vXzuJc7ZLXp1.jpg`,
  },
  415: {
    name: 'Animation Digital Network',
    logo: 'https://image.tmdb.org/t/p/w342//w86FOwg0bbgUSHWWnjOTuEjsUvq.jpg',
  },
};

interface NewSeasonNotificationDialogProps {
  open: boolean;
  onClose: () => void;
  seriesWithNewSeasons: Series[];
}

const NewSeasonNotificationDialog = ({
  open,
  onClose,
  seriesWithNewSeasons,
}: NewSeasonNotificationDialogProps) => {
  const { user } = useAuth()!;
  const [currentIndex, setCurrentIndex] = useState(0);

  // 🚀 Batch-Updates für Watchlist-Operationen
  const { addUpdate: addBatchUpdate } = useFirebaseBatch({
    batchSize: 5,
    delayMs: 500,
  });

  // Reset index wenn Dialog öffnet oder neue Serien kommen
  React.useEffect(() => {
    if (open) {
      setCurrentIndex(0);
    }
  }, [open, seriesWithNewSeasons]);

  const addToWatchlist = async (series: Series) => {
    if (!user) return;

    try {
      // 🚀 Batch-Update statt direktem Firebase-Call
      addBatchUpdate(`${user.uid}/serien/${series.nmr}/watchlist`, true);
    } catch (error) {}
  };

  const handleAddToWatchlist = async (series: Series) => {
    await addToWatchlist(series);
    
    // Zeige nächste Serie oder schließe Dialog
    if (currentIndex < seriesWithNewSeasons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    // Zeige nächste Serie oder schließe Dialog
    if (currentIndex < seriesWithNewSeasons.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  if (seriesWithNewSeasons.length === 0) {
    return null;
  }

  const currentSeries = seriesWithNewSeasons[currentIndex] || seriesWithNewSeasons[0];
  const remainingCount = seriesWithNewSeasons.length - currentIndex - 1;

  // Hilfsfunktion für nächste Episode Info
  const getNextEpisodeInfo = (series: Series) => {
    if (
      series.nextEpisode?.nextEpisodes &&
      series.nextEpisode.nextEpisodes.length > 0
    ) {
      const nextEp = series.nextEpisode.nextEpisodes[0];
      // Verwende die korrekten Felder aus der tatsächlichen Datenstruktur
      const dateField = nextEp.aired || nextEp.airdate;
      if (dateField && dateField !== 'null') {
        const airDate = new Date(dateField);
        if (!isNaN(airDate.getTime())) {
          return {
            date: airDate.toLocaleDateString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            }),
            title: nextEp.name || nextEp.title || `Episode ${nextEp.number}`,
            episode: `S${nextEp.seasonNumber || nextEp.season || 1}E${nextEp.number}`,
          };
        }
      }
    }
    return null;
  };

  const nextEpisodeInfo = getNextEpisodeInfo(currentSeries);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='md'
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
            zIndex: 9999,
          },
        },
        backdrop: {
          sx: {
            zIndex: 9998,
          },
        },
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
            flexDirection: 'column',
          }}
        >
          <Typography
            component='div'
            variant='h4'
            sx={{ fontWeight: 'bold', color: '#ffd700' }}
          >
            Neue Staffel verfügbar!
          </Typography>
          {remainingCount > 0 && (
            <Chip
              label={`+${remainingCount} weitere`}
              size='small'
              sx={{
                backgroundColor: colors.primary.main,
                color: '#ffffff',
                fontWeight: 'bold',
              }}
            />
          )}
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
        <Box sx={{ p: 3 }}>
        <Box display='flex' gap={3} flexDirection={{ xs: 'column', md: 'row' }}>
          {currentSeries.poster?.poster && (
            <Box sx={{ flexShrink: 0 }} mt={2}>
              <Box
                component='img'
                src={currentSeries.poster.poster}
                alt={currentSeries.title}
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
            <Box mb={3} mt={2}>
              <Typography variant='h4' gutterBottom sx={{ color: colors.primary.main }}>
                {currentSeries.title}
              </Typography>
              <Typography
                variant='h6'
                sx={{ color: colors.primary.main, fontWeight: 'bold' }}
              >
                Jetzt {currentSeries.seasonCount} Staffeln verfügbar
              </Typography>
            </Box>

            {currentSeries.beschreibung && (
              <Box mb={3}>
                <Typography variant='h4' gutterBottom sx={{ color: colors.primary.main }}>
                  Beschreibung
                </Typography>
                <Typography variant='body1' sx={{ lineHeight: 1.6 }}>
                  {currentSeries.beschreibung}
                </Typography>
              </Box>
            )}

            <Box display='flex' flexDirection='column' gap={2}>
              {currentSeries.genre?.genres &&
                currentSeries.genre.genres.filter((g) => g !== 'All').length >
                  0 && (
                  <Box>
                    <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                      Genres
                    </Typography>
                    <Box display='flex' gap={1} flexWrap='wrap' mt={1}>
                      {currentSeries.genre.genres
                        .filter((g) => g !== 'All')
                        .slice(0, 3)
                        .map((genre, index) => (
                          <Box
                            key={index}
                            component='span'
                            sx={{
                              background: colors.primary.main,
                              color: '#ffffff',
                              borderRadius: '6px',
                              padding: '2px 8px',
                              marginRight: '4px',
                            }}
                          >
                            {genre}
                          </Box>
                        ))}
                    </Box>
                  </Box>
                )}

              {nextEpisodeInfo && (
                <Box>
                  <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                    📅 Nächste Episode
                  </Typography>
                  <Typography variant='body1'>
                    {nextEpisodeInfo.episode}: {nextEpisodeInfo.title}
                  </Typography>
                  <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                    Erscheint am {nextEpisodeInfo.date}
                  </Typography>
                </Box>
              )}

              {currentSeries.provider?.provider &&
                currentSeries.provider.provider.length > 0 && (
                  <Box>
                    <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                      Verfügbar auf
                    </Typography>
                    <Box display='flex' gap={1} flexWrap='wrap' mt={1}>
                      {currentSeries.provider.provider.map((prov, index) => {
                        const providerData = providerLogos[prov.id];
                        const logoUrl = providerData?.logo;

                        return (
                          <Box
                            key={index}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              background: '#333333',
                              borderRadius: 2,
                              padding: '8px 12px',
                              marginRight: '8px',
                              border: `1px solid ${colors.primary.main}`,
                            }}
                          >
                            {logoUrl ? (
                              <Box
                                component='img'
                                src={logoUrl}
                                alt={prov.name}
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 1,
                                  objectFit: 'contain',
                                }}
                              />
                            ) : (
                              <Box sx={{ fontSize: '24px' }}>📺</Box>
                            )}
                            <Typography
                              variant='body2'
                              sx={{ fontWeight: 'bold', color: 'white' }}
                            >
                              {prov.name}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
            </Box>

            <Box
              sx={{
                textAlign: 'center',
                bgcolor: '#333333',
                p: 2,
                borderRadius: 1,
                mt: 3,
                border: `1px solid ${colors.primary.main}`,
              }}
            >
              <Typography variant='body1'>
                Möchtest du diese Serie zu deiner Watchlist hinzufügen, um keine
                neuen Episoden zu verpassen?
              </Typography>
            </Box>
          </Box>
        </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ 
        p: 3, 
        gap: 2, 
        background: 'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
        backdropFilter: 'blur(10px)',
      }}>
        <Button 
          onClick={() => handleSkip()}
          sx={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            borderRadius: '12px',
            padding: '12px 24px',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(255,255,255,0.2)',
            },
          }}
        >
          Überspringen
        </Button>
        <Button
          variant='contained'
          onClick={() => handleAddToWatchlist(currentSeries)}
          sx={{
            background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
            borderRadius: '12px',
            padding: '12px 24px',
            color: '#ffffff',
            fontWeight: 600,
            textTransform: 'none',
            border: '1px solid rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.3s ease',
            '&:hover': {
              background: `linear-gradient(135deg, ${colors.primary.light} 0%, ${colors.primary.main} 100%)`,
              transform: 'translateY(-2px)',
              boxShadow: colors.shadow.buttonHover,
            },
          }}
        >
          Zur Watchlist hinzufügen
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NewSeasonNotificationDialog;
