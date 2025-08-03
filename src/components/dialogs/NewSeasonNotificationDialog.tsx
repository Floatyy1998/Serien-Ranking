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
import { useAuth } from '../../App';
import { useFirebaseBatch } from '../../hooks/useFirebaseBatch';
import { Series } from '../../interfaces/Series';

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

  // 🚀 Batch-Updates für Watchlist-Operationen
  const { addUpdate: addBatchUpdate } = useFirebaseBatch({
    batchSize: 5,
    delayMs: 500,
  });

  const addToWatchlist = async (series: Series) => {
    if (!user) return;

    try {
      // 🚀 Batch-Update statt direktem Firebase-Call
      addBatchUpdate(`${user.uid}/serien/${series.nmr}/watchlist`, true);
    } catch (error) {}
  };

  const handleAddToWatchlist = async (series: Series) => {
    await addToWatchlist(series);
    onClose(); // Dialog schließen nach Aktion
  };

  const handleSkip = () => {
    onClose(); // Dialog schließen nach Aktion
  };

  if (seriesWithNewSeasons.length === 0) {
    return null;
  }

  const currentSeries = seriesWithNewSeasons[0];
  const remainingCount = seriesWithNewSeasons.length - 1;

  // Hilfsfunktion für nächste Episode Info
  const getNextEpisodeInfo = (series: Series) => {
    if (
      series.nextEpisode?.nextEpisodes &&
      series.nextEpisode.nextEpisodes.length > 0
    ) {
      const nextEp = series.nextEpisode.nextEpisodes[0];
      if (nextEp.airdate && nextEp.airdate !== 'null') {
        const airDate = new Date(nextEp.airdate);
        return {
          date: airDate.toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          }),
          title: nextEp.name,
          episode: `S${nextEp.season}E${nextEp.number}`,
        };
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
          <Typography variant='h5' component='div' sx={{ fontWeight: 'bold' }}>
            🎉 Neue Staffel verfügbar!
          </Typography>
          {remainingCount > 0 && (
            <Chip
              label={`+${remainingCount} weitere`}
              size='small'
              sx={{
                mt: 1,
                backgroundColor: '#00fed7',
                color: '#000',
                fontWeight: 'bold',
              }}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#1e1e1e' }}>
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
              <Typography variant='h4' gutterBottom sx={{ color: '#00fed7' }}>
                {currentSeries.title}
              </Typography>
              <Typography
                variant='h6'
                sx={{ color: '#00fed7', fontWeight: 'bold' }}
              >
                Jetzt {currentSeries.seasonCount} Staffeln verfügbar
              </Typography>
            </Box>

            {currentSeries.beschreibung && (
              <Box mb={3}>
                <Typography variant='h4' gutterBottom sx={{ color: '#00fed7' }}>
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
                          <span
                            key={index}
                            style={{
                              background: '#00fed7',
                              color: '#000',
                              borderRadius: 6,
                              padding: '2px 8px',
                              marginRight: 4,
                            }}
                          >
                            {genre}
                          </span>
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
                              border: '1px solid #00fed7',
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
                border: '1px solid #00fed7',
              }}
            >
              <Typography variant='body1'>
                Möchtest du diese Serie zu deiner Watchlist hinzufügen, um keine
                neuen Episoden zu verpassen?
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, backgroundColor: '#1e1e1e', gap: 2 }}>
        <Button onClick={() => handleSkip()}>Überspringen</Button>
        <Button
          variant='contained'
          onClick={() => handleAddToWatchlist(currentSeries)}
          sx={{
            backgroundColor: '#00fed7',
            color: '#000',
            fontWeight: 'bold',
            '&:hover': {
              backgroundColor: '#00d4b8',
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
