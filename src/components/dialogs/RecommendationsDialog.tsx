import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Alert,
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
  Pagination,
  Snackbar,
  Typography,
} from '@mui/material';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../../App';
import { Movie } from '../../interfaces/Movie';
import { Series } from '../../interfaces/Series';
import DiscoverMovieCard from '../movies/DiscoverMovieCard';
import DiscoverSeriesCard from '../series/DiscoverSeriesCard';
import SimpleCard from '../shared/SimpleCard';
import { DialogHeader } from './shared/SharedDialogComponents';

interface RecommendationsDialogProps {
  open: boolean;
  onClose: () => void;
  recommendations: Series[] | Movie[];
  loading: boolean;
  basedOnItems: Series[] | Movie[];
}

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

const RecommendationsDialog = ({
  open,
  onClose,
  recommendations,
  loading,
  basedOnItems,
}: RecommendationsDialogProps) => {
  const [page, setPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const auth = useAuth();
  const { user } = auth || {};
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<
    'success' | 'error' | 'warning'
  >('success');
  const itemsPerPage = 16;
  const [providers, setProviders] = useState<{ [key: number]: any }>({});

  const handlePageChange = (
    _event: React.ChangeEvent<unknown>,
    value: number
  ) => {
    setPage(value);
    const dialogContent = document.querySelector('.MuiDialogContent-root');
    if (dialogContent) {
      dialogContent.scrollTop = 0;
    }

    // Preload provider für neue Seite
    const newPageItems = recommendations.slice(
      (value - 1) * itemsPerPage,
      value * itemsPerPage
    );
    loadProvidersForItems(newPageItems);
  };
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const handleAddMovie = useCallback(
    async (movie: Movie) => {
      if (!user) {
        setSnackbarMessage(
          'Bitte loggen Sie sich ein, um einen Film hinzuzufügen.'
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      setSnackbarMessage('Film wird hinzugefügt');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      const movieData = {
        id: movie.id.toString(),
        data: {
          user: import.meta.env.VITE_USER,
          id: movie.id,
          uuid: user.uid,
        },
      };
      try {
        const res = await fetch(`https://serienapi.konrad-dinges.de/addMovie`, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(movieData.data),
        });
        if (res.ok) {
          setSnackbarMessage('Film hinzugefügt!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          const msgJson = await res.json();
          if (msgJson.error !== 'Film bereits vorhanden') {
            throw new Error('Fehler beim Hinzufügen des Films.');
          }
          setSnackbarMessage('Film bereits vorhanden');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage('Fehler beim Hinzufügen des Films.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    },
    [user]
  );

  const handleAddSeries = useCallback(
    async (series: Series) => {
      if (!user) {
        setSnackbarMessage(
          'Bitte loggen Sie sich ein, um eine Serie hinzuzufügen.'
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      setSnackbarMessage('Serie wird hinzugefügt');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      const seriesData = {
        id: series.id.toString(),
        data: {
          user: import.meta.env.VITE_USER,
          id: series.id,
          uuid: user.uid,
        },
      };
      try {
        const res = await fetch(`https://serienapi.konrad-dinges.de/add`, {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          redirect: 'follow',
          referrerPolicy: 'no-referrer',
          body: JSON.stringify(seriesData.data),
        });
        if (res.ok) {
          setSnackbarMessage('Serie hinzugefügt!');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
        } else {
          const msgJson = await res.json();
          if (msgJson.error !== 'Serie bereits vorhanden') {
            throw new Error('Fehler beim Hinzufügen der Serie.');
          }
          setSnackbarMessage('Serie bereits vorhanden');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      } catch (error) {
        setSnackbarMessage('Fehler beim Hinzufügen der Serie.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    },
    [user]
  );

  useEffect(() => {
    // Provider werden jetzt progressiv geladen - zeige sofort Inhalte an
    if (recommendations.length > 0 && open) {
      // Lade Provider für die ersten sichtbaren Items sofort
      const currentPageItems = recommendations.slice(
        (page - 1) * itemsPerPage,
        page * itemsPerPage
      );

      loadProvidersForItems(currentPageItems);
    }
  }, [recommendations, page, open]);

  const loadProvidersForItems = async (items: any[]) => {
    const itemsToLoad = items.filter((item) => !providers[item.id]);

    if (itemsToLoad.length === 0) return;

    // Lade Provider in kleinen Batches für bessere Performance
    const batchSize = 4;
    for (let i = 0; i < itemsToLoad.length; i += batchSize) {
      const batch = itemsToLoad.slice(i, i + batchSize);

      const providerPromises = batch.map(async (item) => {
        try {
          const response = await fetch(
            `https://api.themoviedb.org/3/${item.media_type}/${item.id}/watch/providers?api_key=d812a3cdd27ca10d95979a2d45d100cd`
          );
          const data = await response.json();
          const providerIds =
            data.results?.DE?.flatrate?.map(
              (provider: any) => provider.provider_id
            ) || [];

          return {
            id: item.id,
            providers: providerIds
              .map((id: number) => providerLogos[id])
              .filter(Boolean),
          };
        } catch (error) {
          console.error(
            `Fehler beim Laden der Provider für ${item.id}:`,
            error
          );
          return { id: item.id, providers: [] };
        }
      });

      const batchResults = await Promise.all(providerPromises);

      // Update providers state mit den neuen Ergebnissen
      setProviders((prev) => {
        const updated = { ...prev };
        batchResults.forEach((result) => {
          updated[result.id] = result.providers;
        });
        return updated;
      });

      // Kleine Pause zwischen Batches für bessere UX
      if (i + batchSize < itemsToLoad.length) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
  };

  const paginatedRecommendations = recommendations.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const isSeries = basedOnItems.length > 0 && 'seasons' in basedOnItems[0];

  const handleExpandClick = () => {
    setExpanded(!expanded);
  };

  const handleClose = () => {
    setPage(1);
    setExpanded(false);
    setProviders({}); // Reset providers beim Schließen
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth='lg'
      fullWidth
      disableAutoFocus={true}
      disableEnforceFocus={false}
      disableRestoreFocus={false}
      keepMounted={false}
    >
      <DialogHeader title='Empfehlungen' onClose={handleClose} />
      <DialogContent>
        {loading ? (
          <Box display='flex' justifyContent='center' mt={2}>
            <div className='w-12 h-12 border-2 border-[#00fed7] border-t-transparent rounded-full animate-spin' />
          </Box>
        ) : recommendations.length === 0 ? (
          <Box display='flex' justifyContent='center' mt={2}>
            Wir haben leider keine Empfehlungen für dich.
          </Box>
        ) : (
          <>
            <Box
              display='flex'
              justifyContent='center'
              flexDirection='column'
              textAlign={'center'}
              mt={2}
              sx={{
                position: 'sticky',
                top: 0,
                backgroundColor: '#0C0C0C',
                zIndex: 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                paddingBottom: '10px',
              }}
            >
              <Box display='flex' alignItems='center' justifyContent='center'>
                <Typography
                  variant='h6'
                  sx={{
                    fontSize: 'calc(1rem + 0.2vw)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Basierend auf diesen {isSeries ? 'Serien' : 'Filmen'}:
                </Typography>
                <IconButton onClick={handleExpandClick}>
                  {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Box>
              {expanded && (
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '10px',
                    justifyContent: 'center',
                    p: 2,
                    boxSizing: 'border-box',
                  }}
                >
                  {basedOnItems.map((item) => (
                    <SimpleCard key={item.id} item={item} />
                  ))}
                </Box>
              )}
            </Box>
            <Box display='flex' justifyContent='center' mt={2}>
              <Box
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '50px',
                  justifyContent: 'center',
                  p: 2,
                  boxSizing: 'border-box',
                }}
              >
                {paginatedRecommendations.map((item) => (
                  <Box key={item.id} sx={{ width: '230px', height: '444px' }}>
                    {item.media_type === 'tv' ? (
                      <DiscoverSeriesCard
                        series={item as Series}
                        onAdd={handleAddSeries}
                        providers={providers[item.id] || []}
                      />
                    ) : (
                      <DiscoverMovieCard
                        movie={item as Movie}
                        onAdd={handleAddMovie}
                        providers={providers[item.id] || []}
                      />
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Box display='flex' justifyContent='center' width='100%'>
          <Pagination
            count={Math.ceil(recommendations.length / itemsPerPage)}
            page={page}
            onChange={handlePageChange}
            siblingCount={0}
            boundaryCount={1}
          />
        </Box>
      </DialogActions>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default RecommendationsDialog;
