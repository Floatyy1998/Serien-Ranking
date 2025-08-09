import {
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tab,
  Tabs,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../App';
import { useMovieList } from '../../../contexts/MovieListProvider';
import { useSeriesList } from '../../../contexts/OptimizedSeriesListProvider';
import { translateJob } from '../../../services/tmdbJobTranslations';

interface TmdbDialogProps {
  open: boolean;
  loading: boolean;
  data: any;
  type: 'movie' | 'tv';
  onClose: () => void;
  onAdd?: () => void;
  adding?: boolean;
  showAddButton?: boolean;
  viewOnlyMode?: boolean;
}

const TmdbDialog: React.FC<TmdbDialogProps> = ({
  open,
  loading,
  data,
  type,
  onClose,
  onAdd,
  adding = false,
}) => {
  // Suchfeld für Cast/Crew
  const [searchTerm, setSearchTerm] = useState('');
  const auth = useAuth();
  const user = auth?.user;
  const { seriesList } = useSeriesList();
  const { movieList } = useMovieList();

  // Tab State
  const [currentTab, setCurrentTab] = useState(0);
  const [castData, setCastData] = useState<any[]>([]);
  const [crewData, setCrewData] = useState<any[]>([]);
  const [castLoading, setCastLoading] = useState(false);
  const [videosData, setVideosData] = useState<any[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [personDialogOpen, setPersonDialogOpen] = useState(false);
  const [personLoading, setPersonLoading] = useState(false);
  const [personCredits, setPersonCredits] = useState<any>({
    cast: [],
    crew: [],
  });
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [addingTitles, setAddingTitles] = useState<Set<number>>(new Set());

  // Cast Data laden
  useEffect(() => {
    if (data?.id && open && currentTab === 1) {
      fetchCastData(data.id);
    }
  }, [data?.id, open, currentTab, type]);

  // Videos Data laden
  useEffect(() => {
    if (data?.id && open && currentTab === 2) {
      fetchVideosData(data.id);
    }
  }, [data?.id, open, currentTab, type]);

  const fetchCastData = async (tmdbId: number) => {
    try {
      setCastLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      let url = '';
      if (type === 'tv') {
        url = `https://api.themoviedb.org/3/tv/${tmdbId}/aggregate_credits?api_key=${TMDB_API_KEY}&language=de-DE`;
      } else {
        url = `https://api.themoviedb.org/3/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}&language=de-DE`;
      }
      const response = await fetch(url);
      const result = await response.json();
      setCastData(result.cast || []);
      setCrewData(result.crew || []);
      console.log('Cast Data:', result.cast);
      console.log('Crew Data:', result.crew);
    } catch (error) {
      console.error('Error fetching cast data:', error);
      setCastData([]);
      setCrewData([]);
    } finally {
      setCastLoading(false);
    }
  };

  const fetchVideosData = async (tmdbId: number) => {
    try {
      setVideosLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;
      const url = `https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${TMDB_API_KEY}&language=de-DE`;
      const response = await fetch(url);
      const result = await response.json();

      // Sortiere Videos: Trailer zuerst, dann nach Veröffentlichungsdatum
      const sortedVideos = (result.results || []).sort((a: any, b: any) => {
        if (a.type === 'Trailer' && b.type !== 'Trailer') return -1;
        if (b.type === 'Trailer' && a.type !== 'Trailer') return 1;
        return (
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
        );
      });

      setVideosData(sortedVideos);
    } catch (error) {
      console.error('Error fetching videos data:', error);
      setVideosData([]);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchPersonData = async (
    personId: number,
    isCrewMember: boolean = false
  ) => {
    try {
      setPersonLoading(true);
      setCreditsLoading(true);
      const TMDB_API_KEY = import.meta.env.VITE_API_TMDB;

      // Person Details und Credits parallel laden
      const [personResponse, creditsResponse] = await Promise.all([
        fetch(
          `https://api.themoviedb.org/3/person/${personId}?api_key=${TMDB_API_KEY}&language=de-DE`
        ),
        fetch(
          `https://api.themoviedb.org/3/person/${personId}/combined_credits?api_key=${TMDB_API_KEY}&language=de-DE`
        ),
      ]);

      const personResult = await personResponse.json();
      const creditsResult = await creditsResponse.json();

      // Sortiere Credits nach Popularität und Datum, aber filtere Talkshows aus
      const sortedCast = (creditsResult.cast || [])
        .filter((credit: any) => {
          // Filtere den aktuellen Film/Serie aus (über den der Dialog geöffnet wurde)
          if (credit.id === data.id) {
            return false;
          }

          // Filtere Talkshows aus basierend auf Genre-IDs
          // Genre ID 10767 = Talk, 10763 = News
          if (credit.genre_ids && Array.isArray(credit.genre_ids)) {
            if (
              credit.genre_ids.includes(10767) ||
              credit.genre_ids.includes(10763)
            ) {
              return false;
            }
          }

          // Filtere auch "Self" und "Guest" Auftritte aus (deutsch und englisch)
          if (credit.character) {
            const character = credit.character.toLowerCase();
            if (
              character === 'self' ||
              character === 'guest' ||
              character === 'herself' ||
              character === 'himself' ||
              character === 'sie selbst' ||
              character === 'er selbst' ||
              character === 'gast' ||
              character === 'moderator' ||
              character.includes('guest') ||
              character.includes('self') ||
              character.includes('gast') ||
              character.includes('moderator')
            ) {
              return false;
            }
          }

          return true;
        })
        .sort((a: any, b: any) => {
          // Erst nach Popularität, dann nach Datum
          if (b.popularity !== a.popularity) {
            return (b.popularity || 0) - (a.popularity || 0);
          }
          const dateA = a.release_date || a.first_air_date || '0000';
          const dateB = b.release_date || b.first_air_date || '0000';
          return dateB.localeCompare(dateA);
        })
        .slice(0, 20); // Begrenzen auf 20 bekannteste

      // Sortiere Crew Credits nach Popularität und filtere
      const sortedCrew = (creditsResult.crew || [])
        .filter((credit: any) => {
          // Filtere den aktuellen Film/Serie aus
          if (credit.id === data.id) {
            return false;
          }
          return true;
        })
        .sort((a: any, b: any) => {
          // Erst nach Popularität, dann nach Datum
          if (b.popularity !== a.popularity) {
            return (b.popularity || 0) - (a.popularity || 0);
          }
          const dateA = a.release_date || a.first_air_date || '0000';
          const dateB = b.release_date || b.first_air_date || '0000';
          return dateB.localeCompare(dateA);
        })
        .slice(0, 20);

      setSelectedPerson(personResult);
      // Zeige nur relevante Credits basierend auf Click-Kontext
      if (isCrewMember) {
        // Bei Crew-Mitgliedern: Nur Crew Credits anzeigen
        setPersonCredits({ crew: sortedCrew, cast: [] });
      } else {
        // Bei Cast-Mitgliedern: Nur Cast Credits anzeigen
        setPersonCredits({ cast: sortedCast, crew: [] });
      }
      setPersonDialogOpen(true);
    } catch (error) {
      console.error('Error fetching person data:', error);
    } finally {
      setPersonLoading(false);
      setCreditsLoading(false);
    }
  };

  const handlePersonClick = (person: any, isCrewMember: boolean = false) => {
    fetchPersonData(person.id, isCrewMember);
  };

  // Prüfe ob Titel bereits in Liste ist
  const isTitleInList = (credit: any) => {
    if (!user) return false;

    if (credit.media_type === 'movie') {
      return movieList.some((movie) => movie.id === credit.id);
    } else {
      return seriesList.some((series) => series.id === credit.id);
    }
  };

  // Füge Titel zur Liste hinzu
  const handleAddTitle = async (credit: any) => {
    if (!user || addingTitles.has(credit.id)) return;

    try {
      setAddingTitles((prev) => new Set(prev.add(credit.id)));

      const titleData = {
        user: import.meta.env.VITE_USER,
        id: credit.id,
        uuid: user.uid,
      };

      const endpoint =
        credit.media_type === 'movie'
          ? 'https://serienapi.konrad-dinges.de/addMovie'
          : 'https://serienapi.konrad-dinges.de/add';

      const res = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(titleData),
      });

      if (res.ok) {
        // Refresh der Listen würde hier stattfinden
        // Das passiert automatisch durch die Context Provider
        console.log(
          `${
            credit.media_type === 'movie' ? 'Film' : 'Serie'
          } erfolgreich hinzugefügt:`,
          credit.title || credit.name
        );
      }
    } catch (error) {
      console.error('Error adding title:', error);
    } finally {
      setAddingTitles((prev) => {
        const newSet = new Set(prev);
        newSet.delete(credit.id);
        return newSet;
      });
    }
  };

  // Prüfe ob bereits in eigener Liste hinzugefügt
  const alreadyAdded = useMemo(() => {
    if (!data || !user) return false;

    if (type === 'tv') {
      return seriesList.some((series) => series.id === data.id);
    } else {
      return movieList.some((movie) => movie.id === data.id);
    }
  }, [data, type, seriesList, movieList, user]);

  // Zeige Add-Button nur wenn User eingeloggt und noch nicht hinzugefügt
  const canAdd = user && !alreadyAdded;
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth='sm'
      fullWidth
      slotProps={{
        paper: {
          sx: {
            maxHeight: '95vh',
            background:
              'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow:
              '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)',
            color: 'white',
          },
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
                flexDirection: 'column',
              }}
            >
              <Typography
                component='div'
                variant='h4'
                sx={{ fontWeight: 'bold', color: '#ffd700' }}
              >
                🎬 {type === 'tv' ? data.name : data.title}
                {data.first_air_date &&
                  ` (${new Date(data.first_air_date).getFullYear()})`}
                {data.release_date &&
                  ` (${new Date(data.release_date).getFullYear()})`}
              </Typography>
              <Chip
                label={type === 'tv' ? '📺 Serie' : '🎬 Film'}
                size='small'
                sx={{
                  backgroundColor: '#00fed7',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              />
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

          <Tabs
            value={currentTab}
            onChange={(_, newValue) => setCurrentTab(newValue)}
            sx={{
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              backgroundColor: 'rgba(26,26,26,0.95)',
              '& .MuiTab-root': {
                color: 'rgba(255,255,255,0.7)',
                '&.Mui-selected': {
                  color: '#00fed7',
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#00fed7',
              },
            }}
          >
            <Tab label='Details' />
            <Tab label='Cast' />
            <Tab label='Videos' />
          </Tabs>
          <DialogContent
            sx={{
              p: 0,
              background:
                'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
              backdropFilter: 'blur(10px)',
              color: '#ffffff',
            }}
          >
            {currentTab === 0 && (
              <Box
                display='flex'
                gap={3}
                flexDirection={{ xs: 'column', md: 'row' }}
              >
                {data.poster_path && (
                  <Box sx={{ flexShrink: 0 }} mt={1.5}>
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
                    <Box mb={2} mt={1.5}>
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
                  <Box display='flex' flexDirection='column' gap={1.5}>
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
            )}
            {currentTab === 1 && (
              <Box px={2} py={3}>
                {/* Suchfeld für Cast/Crew */}
                <Box mb={2} display='flex' justifyContent='center'>
                  <input
                    type='text'
                    placeholder='Suche nach Name oder Rolle...'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      maxWidth: 400,
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #00fed7',
                      outline: 'none',
                      fontSize: 16,
                      background: '#181818',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(0,254,215,0.08)',
                    }}
                  />
                </Box>
                <Typography
                  variant='h4'
                  gutterBottom
                  sx={{ color: '#00fed7', mb: 3 }}
                >
                  Cast & Crew
                </Typography>
                {castLoading ? (
                  <Box textAlign='center' py={3}>
                    <CircularProgress sx={{ color: '#00fed7', mb: 2 }} />
                    <Typography variant='body1'>Lade Cast-Daten...</Typography>
                  </Box>
                ) : (
                  <Box sx={{ maxHeight: '600px', overflowY: 'auto', pr: 1 }}>
                    {/* Cast Sektion */}
                    {castData.filter((actor: any) => actor.profile_path)
                      .length > 0 && (
                      <Box mb={4}>
                        <Typography
                          variant='h5'
                          sx={{ color: '#ffd700', mb: 2, fontWeight: 'bold' }}
                        >
                          🎭 Schauspieler (
                          {
                            castData.filter((actor: any) => actor.profile_path)
                              .length
                          }
                          )
                        </Typography>
                        <Box
                          display='grid'
                          gap={2}
                          gridTemplateColumns='repeat(auto-fill, minmax(180px, 1fr))'
                        >
                          {castData
                            .filter((actor: any) => {
                              if (!actor.profile_path) return false;
                              if (!searchTerm) return true;
                              const name = (actor.name || '').toLowerCase();
                              // Rolle kann je nach API unterschiedlich sein
                              let role = '';
                              if (
                                Array.isArray(actor.roles) &&
                                actor.roles.length > 0 &&
                                typeof actor.roles[0]?.character === 'string'
                              ) {
                                role = actor.roles[0].character.toLowerCase();
                              } else if (typeof actor.character === 'string') {
                                role = actor.character.toLowerCase();
                              }
                              return (
                                name.includes(searchTerm.toLowerCase()) ||
                                role.includes(searchTerm.toLowerCase())
                              );
                            })
                            .slice(0, 40)
                            .map((actor: any) => (
                              <Box
                                key={`cast-${actor.id}-${actor.credit_id}`}
                                onClick={() => handlePersonClick(actor, false)}
                                sx={{
                                  background: 'rgba(255,255,255,0.05)',
                                  borderRadius: 2,
                                  p: 1.5,
                                  textAlign: 'center',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    background: 'rgba(255,255,255,0.1)',
                                    transform: 'translateY(-5px)',
                                    borderColor: '#00fed7',
                                  },
                                }}
                              >
                                <Avatar
                                  src={
                                    actor.profile_path
                                      ? `https://image.tmdb.org/t/p/w200${actor.profile_path}`
                                      : undefined
                                  }
                                  alt={actor.name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    mx: 'auto',
                                    mb: 2,
                                    border: '2px solid #00fed7',
                                  }}
                                />
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                    mb: 1,
                                  }}
                                >
                                  {actor.name}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  sx={{ color: '#00fed7', fontStyle: 'italic' }}
                                >
                                  {Array.isArray(actor.roles) &&
                                  actor.roles.length > 0 &&
                                  typeof actor.roles[0]?.character === 'string'
                                    ? actor.roles[0].character.replace(
                                        /\(voice\)/gi,
                                        '(Stimme)'
                                      )
                                    : typeof actor.character === 'string'
                                    ? actor.character.replace(
                                        /\(voice\)/gi,
                                        '(Stimme)'
                                      )
                                    : ''}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    )}

                    {/* Crew Sektion */}
                    {crewData.filter((person: any) => person.profile_path)
                      .length > 0 && (
                      <Box>
                        <Typography
                          variant='h5'
                          sx={{ color: '#ffd700', mb: 2, fontWeight: 'bold' }}
                        >
                          🎬 Crew (
                          {
                            crewData.filter(
                              (person: any) => person.profile_path
                            ).length
                          }
                          )
                        </Typography>
                        <Box
                          display='grid'
                          gap={2}
                          gridTemplateColumns='repeat(auto-fill, minmax(180px, 1fr))'
                        >
                          {crewData
                            .filter((person: any) => {
                              if (!person.profile_path) return false;
                              if (!searchTerm) return true;
                              const name = (person.name || '').toLowerCase();
                              // Job kann je nach API unterschiedlich sein
                              let job = '';
                              if (
                                person.jobs &&
                                person.jobs[0] &&
                                person.jobs[0].job
                              ) {
                                job = person.jobs[0].job.toLowerCase();
                              } else if (person.job) {
                                job = person.job.toLowerCase();
                              }
                              return (
                                name.includes(searchTerm.toLowerCase()) ||
                                job.includes(searchTerm.toLowerCase())
                              );
                            })
                            .slice(0, 40)
                            .sort((a: any, b: any) => {
                              // Definiere Wichtigkeits-Ranking (niedrigere Zahl = wichtiger)
                              const getJobPriority = (job: string) => {
                                switch (job) {
                                  case 'Director':
                                    return 1;
                                  case 'Producer':
                                    return 2;
                                  case 'Executive Producer':
                                    return 3;
                                  case 'Co-Executive Producer':
                                    return 4;
                                  case 'Writer':
                                    return 5;
                                  case 'Screenplay':
                                    return 6;
                                  case 'Story':
                                    return 7;
                                  case 'Novel':
                                    return 8;
                                  case 'Director of Photography':
                                    return 9;
                                  case 'Editor':
                                    return 10;
                                  case 'Original Music Composer':
                                    return 11;
                                  case 'Music':
                                    return 12;
                                  case 'Production Designer':
                                    return 13;
                                  case 'Production Design':
                                    return 14;
                                  case 'Production Manager':
                                    return 15;
                                  case 'Casting':
                                    return 16;
                                  case 'Camera Operator':
                                    return 17;
                                  case 'Additional Music':
                                    return 18;
                                  case 'Assistant Editor':
                                    return 19;
                                  case 'Costume Design':
                                    return 20;
                                  case 'Makeup Artist':
                                    return 21;
                                  case 'Sound':
                                    return 22;
                                  case 'Visual Effects Supervisor':
                                    return 23;
                                  case 'Stunt Coordinator':
                                    return 24;
                                  case 'Stunt Double':
                                    return 25;
                                  case 'Stand In':
                                    return 26;
                                  case 'Post Production Consulting':
                                    return 27;
                                  default:
                                    return 99; // Unbekannte Jobs am Ende
                                }
                              };

                              const jobA =
                                a.jobs && a.jobs[0] && a.jobs[0].job
                                  ? a.jobs[0].job
                                  : a.job || '';
                              const jobB =
                                b.jobs && b.jobs[0] && b.jobs[0].job
                                  ? b.jobs[0].job
                                  : b.job || '';
                              return (
                                getJobPriority(jobA) - getJobPriority(jobB)
                              );
                            })
                            .map((person: any) => (
                              <Box
                                key={`crew-${person.id}-${person.credit_id}`}
                                onClick={() => handlePersonClick(person, true)}
                                sx={{
                                  background: 'rgba(255,165,0,0.05)',
                                  borderRadius: 2,
                                  p: 1.5,
                                  textAlign: 'center',
                                  backdropFilter: 'blur(10px)',
                                  border: '1px solid rgba(255,165,0,0.2)',
                                  transition: 'all 0.3s ease',
                                  cursor: 'pointer',
                                  '&:hover': {
                                    background: 'rgba(255,165,0,0.1)',
                                    transform: 'translateY(-5px)',
                                    borderColor: '#ffa500',
                                  },
                                }}
                              >
                                <Avatar
                                  src={
                                    person.profile_path
                                      ? `https://image.tmdb.org/t/p/w200${person.profile_path}`
                                      : undefined
                                  }
                                  alt={person.name}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    mx: 'auto',
                                    mb: 2,
                                    border: '2px solid #ffa500',
                                  }}
                                />
                                <Typography
                                  variant='subtitle1'
                                  sx={{
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                    mb: 1,
                                  }}
                                >
                                  {person.name}
                                </Typography>
                                <Typography
                                  variant='body2'
                                  sx={{ color: '#ffa500', fontStyle: 'italic' }}
                                >
                                  {translateJob(
                                    person.jobs &&
                                      person.jobs[0] &&
                                      person.jobs[0].job
                                      ? person.jobs[0].job
                                      : person.job || ''
                                  )}
                                </Typography>
                              </Box>
                            ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            )}
            {currentTab === 2 && (
              <Box px={2} py={3}>
                <Typography
                  variant='h4'
                  gutterBottom
                  sx={{ color: '#00fed7', mb: 3 }}
                >
                  Videos & Trailer
                </Typography>
                {videosLoading ? (
                  <Box textAlign='center' py={3}>
                    <CircularProgress sx={{ color: '#00fed7', mb: 2 }} />
                    <Typography variant='body1'>Lade Videos...</Typography>
                  </Box>
                ) : videosData.length > 0 ? (
                  <Box
                    display='grid'
                    gap={2}
                    sx={{
                      gridTemplateColumns: {
                        xs: '1fr',
                        md: 'repeat(auto-fit, minmax(320px, 1fr))',
                      },
                    }}
                  >
                    {videosData.slice(0, 8).map((video: any) => (
                      <Box
                        key={video.id}
                        sx={{
                          background:
                            video.type === 'Trailer'
                              ? 'linear-gradient(135deg, rgba(0,254,215,0.1) 0%, rgba(255,255,255,0.05) 100%)'
                              : 'rgba(255,255,255,0.05)',
                          borderRadius: 2,
                          overflow: 'hidden',
                          backdropFilter: 'blur(10px)',
                          border:
                            video.type === 'Trailer'
                              ? '2px solid rgba(0,254,215,0.3)'
                              : '1px solid rgba(255,255,255,0.1)',
                          transition: 'all 0.3s ease',
                          gridColumn: 'auto',
                          '&:hover': {
                            background:
                              video.type === 'Trailer'
                                ? 'linear-gradient(135deg, rgba(0,254,215,0.2) 0%, rgba(255,255,255,0.1) 100%)'
                                : 'rgba(255,255,255,0.1)',
                            transform: 'translateY(-5px)',
                            boxShadow:
                              video.type === 'Trailer'
                                ? '0 12px 40px rgba(0,254,215,0.3)'
                                : '0 8px 25px rgba(0,0,0,0.2)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            position: 'relative',
                            paddingBottom: '56.25%',
                            height: 0,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            component='iframe'
                            src={`https://www.youtube.com/embed/${video.key}`}
                            title={video.name}
                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                            allowFullScreen
                            sx={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              border: 'none',
                            }}
                          />
                        </Box>
                        <Box p={1.5}>
                          <Typography
                            variant='subtitle1'
                            sx={{ fontWeight: 'bold', color: '#ffffff', mb: 1 }}
                            noWrap
                          >
                            {video.name}
                          </Typography>
                          <Box
                            display='flex'
                            justifyContent='space-between'
                            alignItems='center'
                          >
                            <Chip
                              label={video.type}
                              size={
                                video.type === 'Trailer' ? 'medium' : 'small'
                              }
                              sx={{
                                background:
                                  video.type === 'Trailer'
                                    ? 'linear-gradient(135deg, #00fed7, #00d4b8)'
                                    : 'rgba(255,255,255,0.2)',
                                color:
                                  video.type === 'Trailer' ? '#000' : '#fff',
                                fontWeight:
                                  video.type === 'Trailer' ? '800' : 'bold',
                                boxShadow:
                                  video.type === 'Trailer'
                                    ? '0 4px 12px rgba(0,254,215,0.4)'
                                    : 'none',
                                textTransform: 'uppercase',
                                letterSpacing:
                                  video.type === 'Trailer' ? '0.5px' : 'normal',
                              }}
                            />
                            <Typography
                              variant='caption'
                              sx={{ color: '#9e9e9e' }}
                            >
                              {video.size}p
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography
                    variant='body1'
                    sx={{ textAlign: 'center', color: '#9e9e9e' }}
                  >
                    Keine Videos verfügbar
                  </Typography>
                )}
              </Box>
            )}
          </DialogContent>
          <DialogActions
            sx={{
              p: 2,
              gap: 1.5,
              background:
                'linear-gradient(135deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 100%)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {!user ? (
              <Typography
                variant='body2'
                sx={{ color: '#9e9e9e', fontStyle: 'italic' }}
              >
                Zum Hinzufügen bitte einloggen
              </Typography>
            ) : alreadyAdded ? (
              <Typography
                variant='body2'
                sx={{ color: '#4caf50', fontWeight: 'bold' }}
              >
                ✅ Bereits in deiner Liste
              </Typography>
            ) : canAdd ? (
              <Button
                variant='contained'
                onClick={
                  onAdd || (() => console.log('onAdd not implemented yet'))
                }
                disabled={adding || !onAdd}
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
                  : !onAdd
                  ? 'Hinzufügen (noch nicht implementiert)'
                  : `${
                      type === 'tv' ? 'Serie' : 'Film'
                    } zu meiner Liste hinzufügen`}
              </Button>
            ) : null}
          </DialogActions>
        </>
      ) : null}

      {/* Person Details Dialog */}
      <Dialog
        open={personDialogOpen}
        onClose={() => setPersonDialogOpen(false)}
        maxWidth='md'
        fullWidth
        slotProps={{
          paper: {
            sx: {
              maxHeight: '80vh',
              background:
                'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              overflow: 'hidden',
              boxShadow:
                '0 16px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(255, 215, 0, 0.3)',
              color: 'white',
            },
          },
        }}
      >
        {personLoading ? (
          <DialogContent sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#00fed7', mb: 2 }} />
            <Typography variant='h6' color='#00fed7'>
              Lade Person-Details...
            </Typography>
          </DialogContent>
        ) : selectedPerson ? (
          <>
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
              <Typography
                component='div'
                variant='h4'
                sx={{ fontWeight: 'bold', color: '#ffd700' }}
              >
                🎭 {selectedPerson.name}
              </Typography>
              <IconButton
                onClick={() => setPersonDialogOpen(false)}
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
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent
              sx={{
                px: 2,
                pt: '24px !important',
                background:
                  'linear-gradient(180deg, rgba(26,26,26,0.95) 0%, rgba(45,45,48,0.95) 50%, rgba(26,26,26,0.95) 100%)',
                backdropFilter: 'blur(10px)',
                color: '#ffffff',
              }}
            >
              <Box
                display='flex'
                gap={3}
                flexDirection={{ xs: 'column', md: 'row' }}
              >
                {selectedPerson.profile_path && (
                  <Box sx={{ flexShrink: 0 }}>
                    <Box
                      component='img'
                      src={`https://image.tmdb.org/t/p/w300${selectedPerson.profile_path}`}
                      alt={selectedPerson.name}
                      sx={{
                        width: { xs: '200px', md: '250px' },
                        height: 'auto',
                        borderRadius: 2,
                        boxShadow:
                          '0 10px 30px rgba(0,0,0,0.5), 0 5px 15px rgba(0,254,215,0.2)',
                        mx: { xs: 'auto', md: 0 },
                        display: 'block',
                        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        transformOrigin: 'center',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow:
                            '0 15px 40px rgba(0,0,0,0.6), 0 10px 25px rgba(0,254,215,0.3)',
                        },
                      }}
                    />
                  </Box>
                )}
                <Box flex={1}>
                  {selectedPerson.biography && (
                    <Box>
                      <Typography
                        variant='h4'
                        gutterBottom
                        sx={{ color: '#00fed7', mb: 3 }}
                      >
                        Biographie
                      </Typography>
                      <Typography variant='body1' sx={{ lineHeight: 1.6 }}>
                        {selectedPerson.biography}
                      </Typography>
                    </Box>
                  )}
                  <Box display='flex' flexDirection='column' gap={2} mb={3}>
                    {selectedPerson.birthday && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          Geboren
                        </Typography>
                        <Typography variant='body1'>
                          {new Date(selectedPerson.birthday).toLocaleDateString(
                            'de-DE'
                          )}
                          {selectedPerson.place_of_birth &&
                            ` in ${selectedPerson.place_of_birth}`}
                        </Typography>
                      </Box>
                    )}
                    {selectedPerson.deathday && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          Verstorben
                        </Typography>
                        <Typography variant='body1'>
                          {new Date(selectedPerson.deathday).toLocaleDateString(
                            'de-DE'
                          )}
                        </Typography>
                      </Box>
                    )}
                    {selectedPerson.known_for_department && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          Bekannt für
                        </Typography>
                        <Typography variant='body1'>
                          {selectedPerson.known_for_department === 'Acting'
                            ? 'Schauspielerei'
                            : selectedPerson.known_for_department ===
                              'Directing'
                            ? 'Regie'
                            : selectedPerson.known_for_department === 'Writing'
                            ? 'Drehbuch'
                            : selectedPerson.known_for_department ===
                              'Production'
                            ? 'Produktion'
                            : selectedPerson.known_for_department === 'Sound'
                            ? 'Ton'
                            : selectedPerson.known_for_department === 'Camera'
                            ? 'Kamera'
                            : selectedPerson.known_for_department === 'Editing'
                            ? 'Schnitt'
                            : selectedPerson.known_for_department === 'Art'
                            ? 'Kunst'
                            : selectedPerson.known_for_department ===
                              'Costume & Make-Up'
                            ? 'Kostüm & Make-Up'
                            : selectedPerson.known_for_department ===
                              'Visual Effects'
                            ? 'Visuelle Effekte'
                            : selectedPerson.known_for_department}
                        </Typography>
                      </Box>
                    )}
                    {selectedPerson.popularity && (
                      <Box>
                        <Typography variant='body2' sx={{ color: '#9e9e9e' }}>
                          TMDB Popularität
                        </Typography>
                        <Typography variant='body1'>
                          ⭐ {selectedPerson.popularity.toFixed(1)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>

              {/* Filmographie Sektion */}
              <Box px={3} py={3} pt={2}>
                <Typography
                  variant='h4'
                  gutterBottom
                  sx={{ color: '#00fed7', mb: 1.5 }}
                >
                  Bekannte Filme & Serien
                </Typography>
                {creditsLoading ? (
                  <Box textAlign='center' py={1.5}>
                    <CircularProgress
                      size={24}
                      sx={{ color: '#00fed7', mb: 1 }}
                    />
                    <Typography variant='body2'>
                      Lade Filmographie...
                    </Typography>
                  </Box>
                ) : personCredits.cast.length > 0 ||
                  personCredits.crew.length > 0 ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.5,
                      maxHeight: '350px',
                      overflowY: 'auto',
                      pr: 1,
                      '&::-webkit-scrollbar': {
                        width: '8px',
                      },
                      '&::-webkit-scrollbar-track': {
                        background: 'rgba(255,255,255,0.1)',
                        borderRadius: '4px',
                      },
                      '&::-webkit-scrollbar-thumb': {
                        background: '#00fed7',
                        borderRadius: '4px',
                        '&:hover': {
                          background: '#00d4b8',
                        },
                      },
                    }}
                  >
                    {/* Crew Credits - zeige zuerst wenn auf Crew geklickt */}
                    {Object.keys(personCredits)[0] === 'crew' &&
                      personCredits.crew.map((credit: any) => (
                        <Box
                          key={`crew-first-${credit.id}-${credit.credit_id}`}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            background:
                              'linear-gradient(135deg, rgba(255,165,0,0.08) 0%, rgba(255,165,0,0.02) 100%)',
                            borderRadius: 2,
                            p: 1.5,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,165,0,0.2)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, rgba(255,165,0,0.15) 0%, rgba(255,165,0,0.05) 100%)',
                              borderColor: 'rgba(255,165,0,0.4)',
                              transform: 'translateX(8px)',
                              boxShadow: '0 8px 32px rgba(255,165,0,0.2)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              flexShrink: 0,
                              width: 60,
                              height: 90,
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              background:
                                'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            }}
                          >
                            {credit.poster_path ? (
                              <Box
                                component='img'
                                src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background:
                                    'linear-gradient(145deg, #333, #1a1a1a)',
                                  color: '#666',
                                  fontSize: '1.5rem',
                                }}
                              >
                                {credit.media_type === 'movie' ? '🎬' : '📺'}
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background:
                                  credit.media_type === 'movie'
                                    ? 'linear-gradient(135deg, #ff6b6b, #ff5252)'
                                    : 'linear-gradient(135deg, #00fed7, #00d4b8)',
                                borderRadius: '12px',
                                px: 0.8,
                                py: 0.3,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                color:
                                  credit.media_type === 'movie'
                                    ? '#fff'
                                    : '#000',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {credit.media_type === 'movie' ? 'Film' : 'Serie'}
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant='subtitle1'
                              sx={{
                                fontWeight: 700,
                                color: '#ffffff',
                                mb: 0.5,
                                lineHeight: 1.2,
                                fontSize: '0.95rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {credit.title || credit.name}
                            </Typography>

                            <Typography
                              variant='body2'
                              sx={{
                                color: '#ffa500',
                                fontStyle: 'italic',
                                mb: 0.8,
                                fontSize: '0.8rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              als {translateJob(credit.job)}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color: '#9e9e9e',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  📅{' '}
                                  {credit.release_date
                                    ? new Date(
                                        credit.release_date
                                      ).getFullYear()
                                    : credit.first_air_date
                                    ? new Date(
                                        credit.first_air_date
                                      ).getFullYear()
                                    : 'Unbekannt'}
                                </Typography>

                                {credit.vote_average &&
                                typeof credit.vote_average === 'number' &&
                                credit.vote_average > 1 &&
                                credit.vote_count &&
                                credit.vote_count > 0 ? (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      color: '#ffd700',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                    }}
                                  >
                                    ⭐ {credit.vote_average.toFixed(1)}
                                  </Typography>
                                ) : null}
                              </Box>

                              {/* Add Button für Crew Credits */}
                              {user && (
                                <Box sx={{ flexShrink: 0 }}>
                                  {isTitleInList(credit) ? (
                                    <Tooltip title='Bereits in deiner Liste'>
                                      <Chip
                                        icon={
                                          <CheckIcon
                                            sx={{ fontSize: '16px !important' }}
                                          />
                                        }
                                        label='In Liste'
                                        size='small'
                                        sx={{
                                          backgroundColor:
                                            'rgba(76, 175, 80, 0.2)',
                                          color: '#4caf50',
                                          border: '1px solid #4caf50',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={`${
                                        credit.media_type === 'movie'
                                          ? 'Film'
                                          : 'Serie'
                                      } zu meiner Liste hinzufügen`}
                                    >
                                      <Chip
                                        icon={
                                          addingTitles.has(credit.id) ? (
                                            <CircularProgress
                                              size={14}
                                              sx={{ color: '#ffa500' }}
                                            />
                                          ) : (
                                            <AddIcon
                                              sx={{
                                                fontSize: '16px !important',
                                              }}
                                            />
                                          )
                                        }
                                        label={
                                          addingTitles.has(credit.id)
                                            ? 'Hinzufügen...'
                                            : 'Hinzufügen'
                                        }
                                        size='small'
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddTitle(credit);
                                        }}
                                        disabled={addingTitles.has(credit.id)}
                                        sx={{
                                          backgroundColor:
                                            'rgba(255,165,0,0.2)',
                                          color: '#ffa500',
                                          border: '1px solid #ffa500',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor:
                                              'rgba(255,165,0,0.3)',
                                            transform: 'scale(1.05)',
                                          },
                                          '&:disabled': {
                                            backgroundColor:
                                              'rgba(255,255,255,0.05)',
                                            color: '#666',
                                            borderColor:
                                              'rgba(255,255,255,0.1)',
                                            cursor: 'not-allowed',
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    {/* Cast Credits als zweites - nur Credits mit Charaktername anzeigen */}
                    {personCredits.cast
                      .filter((credit: any) => credit.character)
                      .map((credit: any) => (
                        <Box
                          key={`cast-second-${credit.id}-${credit.credit_id}`}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            background:
                              'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            borderRadius: 2,
                            p: 1.5,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, rgba(0,254,215,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                              borderColor: 'rgba(0,254,215,0.3)',
                              transform: 'translateX(8px)',
                              boxShadow: '0 8px 32px rgba(0,254,215,0.2)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              flexShrink: 0,
                              width: 60,
                              height: 90,
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              background:
                                'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            }}
                          >
                            {credit.poster_path ? (
                              <Box
                                component='img'
                                src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background:
                                    'linear-gradient(145deg, #333, #1a1a1a)',
                                  color: '#666',
                                  fontSize: '1.5rem',
                                }}
                              >
                                {credit.media_type === 'movie' ? '🎬' : '📺'}
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background:
                                  credit.media_type === 'movie'
                                    ? 'linear-gradient(135deg, #ff6b6b, #ff5252)'
                                    : 'linear-gradient(135deg, #00fed7, #00d4b8)',
                                borderRadius: '12px',
                                px: 0.8,
                                py: 0.3,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                color:
                                  credit.media_type === 'movie'
                                    ? '#fff'
                                    : '#000',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {credit.media_type === 'movie' ? 'Film' : 'Serie'}
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant='subtitle1'
                              sx={{
                                fontWeight: 700,
                                color: '#ffffff',
                                mb: 0.5,
                                lineHeight: 1.2,
                                fontSize: '0.95rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {credit.title || credit.name}
                            </Typography>

                            <Typography
                              variant='body2'
                              sx={{
                                color: '#00fed7',
                                fontStyle: 'italic',
                                mb: 0.8,
                                fontSize: '0.8rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              als{' '}
                              {credit.character?.replace(
                                /\(voice\)/gi,
                                '(Stimme)'
                              )}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color: '#9e9e9e',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  📅{' '}
                                  {credit.release_date
                                    ? new Date(
                                        credit.release_date
                                      ).getFullYear()
                                    : credit.first_air_date
                                    ? new Date(
                                        credit.first_air_date
                                      ).getFullYear()
                                    : 'Unbekannt'}
                                </Typography>

                                {credit.vote_average &&
                                typeof credit.vote_average === 'number' &&
                                credit.vote_average > 1 &&
                                credit.vote_count &&
                                credit.vote_count > 0 ? (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      color: '#ffd700',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                    }}
                                  >
                                    ⭐ {credit.vote_average.toFixed(1)}
                                  </Typography>
                                ) : null}
                              </Box>

                              {user && (
                                <Box sx={{ flexShrink: 0 }}>
                                  {isTitleInList(credit) ? (
                                    <Tooltip title='Bereits in deiner Liste'>
                                      <Chip
                                        icon={
                                          <CheckIcon
                                            sx={{ fontSize: '16px !important' }}
                                          />
                                        }
                                        label='In Liste'
                                        size='small'
                                        sx={{
                                          backgroundColor:
                                            'rgba(76, 175, 80, 0.2)',
                                          color: '#4caf50',
                                          border: '1px solid #4caf50',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={`${
                                        credit.media_type === 'movie'
                                          ? 'Film'
                                          : 'Serie'
                                      } zu meiner Liste hinzufügen`}
                                    >
                                      <Chip
                                        icon={
                                          addingTitles.has(credit.id) ? (
                                            <CircularProgress
                                              size={14}
                                              sx={{ color: '#00fed7' }}
                                            />
                                          ) : (
                                            <AddIcon
                                              sx={{
                                                fontSize: '16px !important',
                                              }}
                                            />
                                          )
                                        }
                                        label={
                                          addingTitles.has(credit.id)
                                            ? 'Hinzufügen...'
                                            : 'Hinzufügen'
                                        }
                                        size='small'
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddTitle(credit);
                                        }}
                                        disabled={addingTitles.has(credit.id)}
                                        sx={{
                                          backgroundColor:
                                            'rgba(0,254,215,0.2)',
                                          color: '#00fed7',
                                          border: '1px solid #00fed7',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor:
                                              'rgba(0,254,215,0.3)',
                                            transform: 'scale(1.05)',
                                          },
                                          '&:disabled': {
                                            backgroundColor:
                                              'rgba(255,255,255,0.05)',
                                            color: '#666',
                                            borderColor:
                                              'rgba(255,255,255,0.1)',
                                            cursor: 'not-allowed',
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}

                    {/* Cast Credits - nur Credits mit Charaktername anzeigen */}
                    {personCredits.cast
                      .filter((credit: any) => credit.character)
                      .map((credit: any) => (
                        <Box
                          key={`cast-${credit.id}-${credit.credit_id}`}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            background:
                              'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            borderRadius: 2,
                            p: 1.5,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, rgba(0,254,215,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                              borderColor: 'rgba(0,254,215,0.3)',
                              transform: 'translateX(8px)',
                              boxShadow: '0 8px 32px rgba(0,254,215,0.2)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              flexShrink: 0,
                              width: 60,
                              height: 90,
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              background:
                                'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            }}
                          >
                            {credit.poster_path ? (
                              <Box
                                component='img'
                                src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background:
                                    'linear-gradient(145deg, #333, #1a1a1a)',
                                  color: '#666',
                                  fontSize: '1.5rem',
                                }}
                              >
                                {credit.media_type === 'movie' ? '🎬' : '📺'}
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background:
                                  credit.media_type === 'movie'
                                    ? 'linear-gradient(135deg, #ff6b6b, #ff5252)'
                                    : 'linear-gradient(135deg, #00fed7, #00d4b8)',
                                borderRadius: '12px',
                                px: 0.8,
                                py: 0.3,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                color:
                                  credit.media_type === 'movie'
                                    ? '#fff'
                                    : '#000',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {credit.media_type === 'movie' ? 'Film' : 'Serie'}
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant='subtitle1'
                              sx={{
                                fontWeight: 700,
                                color: '#ffffff',
                                mb: 0.5,
                                lineHeight: 1.2,
                                fontSize: '0.95rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {credit.title || credit.name}
                            </Typography>

                            <Typography
                              variant='body2'
                              sx={{
                                color: '#00fed7',
                                fontStyle: 'italic',
                                mb: 0.8,
                                fontSize: '0.8rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              als{' '}
                              {credit.character.replace(
                                /\(voice\)/gi,
                                '(Stimme)'
                              )}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color: '#9e9e9e',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  📅{' '}
                                  {credit.release_date
                                    ? new Date(
                                        credit.release_date
                                      ).getFullYear()
                                    : credit.first_air_date
                                    ? new Date(
                                        credit.first_air_date
                                      ).getFullYear()
                                    : 'Unbekannt'}
                                </Typography>

                                {credit.vote_average &&
                                typeof credit.vote_average === 'number' &&
                                credit.vote_average > 1 &&
                                credit.vote_count &&
                                credit.vote_count > 0 ? (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      color: '#ffd700',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                    }}
                                  >
                                    ⭐ {credit.vote_average.toFixed(1)}
                                  </Typography>
                                ) : null}
                              </Box>

                              {/* Status und Add Button */}
                              {user && (
                                <Box sx={{ flexShrink: 0 }}>
                                  {isTitleInList(credit) ? (
                                    <Tooltip title='Bereits in deiner Liste'>
                                      <Chip
                                        icon={
                                          <CheckIcon
                                            sx={{ fontSize: '16px !important' }}
                                          />
                                        }
                                        label='In Liste'
                                        size='small'
                                        sx={{
                                          backgroundColor:
                                            'rgba(76, 175, 80, 0.2)',
                                          color: '#4caf50',
                                          border: '1px solid #4caf50',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={`${
                                        credit.media_type === 'movie'
                                          ? 'Film'
                                          : 'Serie'
                                      } zu meiner Liste hinzufügen`}
                                    >
                                      <Chip
                                        icon={
                                          addingTitles.has(credit.id) ? (
                                            <CircularProgress
                                              size={14}
                                              sx={{ color: '#00fed7' }}
                                            />
                                          ) : (
                                            <AddIcon
                                              sx={{
                                                fontSize: '16px !important',
                                              }}
                                            />
                                          )
                                        }
                                        label={
                                          addingTitles.has(credit.id)
                                            ? 'Hinzufügen...'
                                            : 'Hinzufügen'
                                        }
                                        size='small'
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddTitle(credit);
                                        }}
                                        disabled={addingTitles.has(credit.id)}
                                        sx={{
                                          backgroundColor:
                                            'rgba(0,254,215,0.2)',
                                          color: '#00fed7',
                                          border: '1px solid #00fed7',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor:
                                              'rgba(0,254,215,0.3)',
                                            transform: 'scale(1.05)',
                                          },
                                          '&:disabled': {
                                            backgroundColor:
                                              'rgba(255,255,255,0.05)',
                                            color: '#666',
                                            borderColor:
                                              'rgba(255,255,255,0.1)',
                                            cursor: 'not-allowed',
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}

                    {/* Cast Credits - nur Credits mit Charaktername anzeigen */}
                    {personCredits.cast
                      .filter((credit: any) => credit.character)
                      .map((credit: any) => (
                        <Box
                          key={`cast-${credit.id}-${credit.credit_id}`}
                          sx={{
                            display: 'flex',
                            gap: 2,
                            background:
                              'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            borderRadius: 2,
                            p: 1.5,
                            backdropFilter: 'blur(10px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer',
                            '&:hover': {
                              background:
                                'linear-gradient(135deg, rgba(0,254,215,0.15) 0%, rgba(255,255,255,0.05) 100%)',
                              borderColor: 'rgba(0,254,215,0.3)',
                              transform: 'translateX(8px)',
                              boxShadow: '0 8px 32px rgba(0,254,215,0.2)',
                            },
                          }}
                        >
                          <Box
                            sx={{
                              position: 'relative',
                              flexShrink: 0,
                              width: 60,
                              height: 90,
                              borderRadius: 1.5,
                              overflow: 'hidden',
                              background:
                                'linear-gradient(145deg, #2a2a2a, #1a1a1a)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                            }}
                          >
                            {credit.poster_path ? (
                              <Box
                                component='img'
                                src={`https://image.tmdb.org/t/p/w200${credit.poster_path}`}
                                alt={credit.title || credit.name}
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover',
                                  transition: 'transform 0.3s ease',
                                }}
                              />
                            ) : (
                              <Box
                                sx={{
                                  width: '100%',
                                  height: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background:
                                    'linear-gradient(145deg, #333, #1a1a1a)',
                                  color: '#666',
                                  fontSize: '1.5rem',
                                }}
                              >
                                {credit.media_type === 'movie' ? '🎬' : '📺'}
                              </Box>
                            )}
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 4,
                                right: 4,
                                background:
                                  credit.media_type === 'movie'
                                    ? 'linear-gradient(135deg, #ff6b6b, #ff5252)'
                                    : 'linear-gradient(135deg, #00fed7, #00d4b8)',
                                borderRadius: '12px',
                                px: 0.8,
                                py: 0.3,
                                fontSize: '0.65rem',
                                fontWeight: 'bold',
                                color:
                                  credit.media_type === 'movie'
                                    ? '#fff'
                                    : '#000',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: 0.5,
                              }}
                            >
                              {credit.media_type === 'movie' ? 'Film' : 'Serie'}
                            </Box>
                          </Box>

                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant='subtitle1'
                              sx={{
                                fontWeight: 700,
                                color: '#ffffff',
                                mb: 0.5,
                                lineHeight: 1.2,
                                fontSize: '0.95rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {credit.title || credit.name}
                            </Typography>

                            <Typography
                              variant='body2'
                              sx={{
                                color: '#00fed7',
                                fontStyle: 'italic',
                                mb: 0.8,
                                fontSize: '0.8rem',
                                display: '-webkit-box',
                                WebkitLineClamp: 1,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              als{' '}
                              {credit.character.replace(
                                /\(voice\)/gi,
                                '(Stimme)'
                              )}
                            </Typography>

                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: { xs: 'flex-start', sm: 'center' },
                                justifyContent: 'space-between',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1.5,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <Typography
                                  variant='caption'
                                  sx={{
                                    color: '#9e9e9e',
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                  }}
                                >
                                  📅{' '}
                                  {credit.release_date
                                    ? new Date(
                                        credit.release_date
                                      ).getFullYear()
                                    : credit.first_air_date
                                    ? new Date(
                                        credit.first_air_date
                                      ).getFullYear()
                                    : 'Unbekannt'}
                                </Typography>

                                {credit.vote_average &&
                                typeof credit.vote_average === 'number' &&
                                credit.vote_average > 1 &&
                                credit.vote_count &&
                                credit.vote_count > 0 ? (
                                  <Typography
                                    variant='caption'
                                    sx={{
                                      color: '#ffd700',
                                      fontWeight: 600,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.3,
                                    }}
                                  >
                                    ⭐ {credit.vote_average.toFixed(1)}
                                  </Typography>
                                ) : null}
                              </Box>

                              {/* Status und Add Button für Crew */}
                              {user && (
                                <Box sx={{ flexShrink: 0 }}>
                                  {isTitleInList(credit) ? (
                                    <Tooltip title='Bereits in deiner Liste'>
                                      <Chip
                                        icon={
                                          <CheckIcon
                                            sx={{ fontSize: '16px !important' }}
                                          />
                                        }
                                        label='In Liste'
                                        size='small'
                                        sx={{
                                          backgroundColor:
                                            'rgba(76, 175, 80, 0.2)',
                                          color: '#4caf50',
                                          border: '1px solid #4caf50',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                        }}
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip
                                      title={`${
                                        credit.media_type === 'movie'
                                          ? 'Film'
                                          : 'Serie'
                                      } zu meiner Liste hinzufügen`}
                                    >
                                      <Chip
                                        icon={
                                          addingTitles.has(credit.id) ? (
                                            <CircularProgress
                                              size={14}
                                              sx={{ color: '#00fed7' }}
                                            />
                                          ) : (
                                            <AddIcon
                                              sx={{
                                                fontSize: '16px !important',
                                              }}
                                            />
                                          )
                                        }
                                        label={
                                          addingTitles.has(credit.id)
                                            ? 'Hinzufügen...'
                                            : 'Hinzufügen'
                                        }
                                        size='small'
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAddTitle(credit);
                                        }}
                                        disabled={addingTitles.has(credit.id)}
                                        sx={{
                                          backgroundColor:
                                            'rgba(0,254,215,0.2)',
                                          color: '#00fed7',
                                          border: '1px solid #00fed7',
                                          fontSize: '0.7rem',
                                          height: '24px',
                                          cursor: 'pointer',
                                          transition: 'all 0.2s ease',
                                          '&:hover': {
                                            backgroundColor:
                                              'rgba(0,254,215,0.3)',
                                            transform: 'scale(1.05)',
                                          },
                                          '&:disabled': {
                                            backgroundColor:
                                              'rgba(255,255,255,0.05)',
                                            color: '#666',
                                            borderColor:
                                              'rgba(255,255,255,0.1)',
                                            cursor: 'not-allowed',
                                          },
                                        }}
                                      />
                                    </Tooltip>
                                  )}
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Box>
                      ))}
                  </Box>
                ) : (
                  <Typography
                    variant='body2'
                    sx={{ textAlign: 'center', color: '#9e9e9e' }}
                  >
                    Keine Filmographie verfügbar
                  </Typography>
                )}
              </Box>
            </DialogContent>
          </>
        ) : null}
      </Dialog>
    </Dialog>
  );
};

export default TmdbDialog;
