import { 
  Close as CloseIcon,
  Movie as MovieIcon,
  Tv as TvIcon,
  MenuBook,
  Rocket,
  DirectionsWalk,
  Hotel,
  Work,
  Timer,
  Favorite,
  SportsEsports,
  AccountBalance,
  Casino,
  SelfImprovement,
  MusicNote,
  RecordVoiceOver,
  Star,
  Air,
  DirectionsRun,
  Book,
  Brush,
  Restaurant,
  BarChart,
  Public,
  Waves,
  School,
  Grass,
  RemoveRedEye,
  Kitchen,
  NaturePeople,
  Coffee,
  Pets,
  DarkMode,
} from '@mui/icons-material';
import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Typography,
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import '../../../styles/animations.css';
import { TodayEpisode } from '../../../types/TodayEpisode';
import { colors } from '../../../theme';
interface TodayEpisodesDialogProps {
  open: boolean;
  onClose: () => void;
  episodes: TodayEpisode[];
  userStats?: {
    watchtime: string[];
    episodesWatched: number;
    seriesRated: number;
    watchtimeTotal: number;
  };
}
const TodayEpisodesDialog: React.FC<TodayEpisodesDialogProps> = ({
  open,
  onClose,
  episodes,
  userStats,
}) => {
  const [dontShowToday, setDontShowToday] = useState(false);
  const [funFact, setFunFact] = useState<React.ReactNode>(null);
  useEffect(() => {
    if (open && userStats && userStats.watchtimeTotal) {
      const totalHours = userStats.watchtimeTotal / 60;
      const percentageOfSharkLife = (
        (totalHours / (400 * 365 * 24)) *
        100
      ).toFixed(2);
      const booksRead = Math.floor(totalHours / 6);
      const marsTrip = (totalHours / 6570).toFixed(2);
      const totalKM = totalHours * 5;
      // Zusätzliche Berechnungen für mehr Variety - KORRIGIERT
      const totalDays = Math.floor(totalHours / 24);
      const episodesPerDay = totalDays > 0 ? (userStats.episodesWatched / totalDays).toFixed(1) : userStats.episodesWatched;
      const averageEpisodeLength = totalHours / Math.max(1, userStats.episodesWatched);
      const sleepTimeEquivalent = Math.floor(totalHours / 8); // 8h Schlaf pro Nacht
      const workYearsEquivalent = (totalHours / (40 * 52 * 8)).toFixed(2); // 40h/Woche, 52 Wochen, 8h/Tag
      const universityDegreesEquivalent = Math.floor(totalHours / (4 * 365 * 2)); // 4 Jahre, 2h täglich studieren
      const olympicMarathonsEquivalent = Math.floor(totalKM / 42.195); // Exakte Marathon-Distanz
      const moonTripsEquivalent = (totalKM / 384400).toFixed(4); // Distanz zur Mond
      const netflixSeriesEquivalent = Math.floor(totalHours / 20); // Durchschnittsserie ~20h
      const languageLearningEquivalent = Math.floor(totalHours / 600); // 600h für Grundkenntnisse
      const cookingMealsEquivalent = Math.floor(totalHours / 0.5); // 30min pro Mahlzeit
      const musicListeningEquivalent = Math.floor(totalHours * 20); // 3min pro Song
      const videoGameBeatingEquivalent = Math.floor(totalHours / 50); // 50h pro AAA-Game
      const hairGrowthMM = (totalDays * 0.3).toFixed(1); // 0.3mm pro Tag
      const breathsEquivalent = Math.floor(totalHours * 60 * 15); // 15 Atemzüge/Min
      const heartbeatsEquivalent = Math.floor(totalHours * 60 * 70); // 70 Schläge/Min
      const blinkingEquivalent = Math.floor(totalHours * 60 * 15); // 15 Blinzeln/Min
      const powerNapsEquivalent = Math.floor(totalHours / 0.25); // 15min Power-Nap
      const daysInSpaceEquivalent = totalDays;
      const treesPlantedEquivalent = Math.floor(totalHours / 0.1); // 6min pro Baum
      const coffeeBrewingEquivalent = Math.floor(totalHours / 0.083); // 5min pro Tasse
      const dogWalksEquivalent = Math.floor(totalHours); // 1h pro Spaziergang
      const museumsVisitedEquivalent = Math.floor(totalHours / 3); // 3h pro Museum
      const boardGamesEquivalent = Math.floor(totalHours / 2); // 2h pro Spiel
      const funFacts = [
        // Originale Facts erweitert
        <>
          <Waves sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hast{' '}
          <strong>
            <u>{percentageOfSharkLife}%</u>
          </strong>{' '}
          der Lebenszeit eines Grönlandhais mit Serien verbracht. Das sind über{' '}
          <strong>{Math.floor(totalHours / 24)}</strong> Tage durchgehend!
        </>,
        <>
          <MenuBook sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Hättest du stattdessen Bücher gelesen, wären das etwa{' '}
          <strong>
            <u>{booksRead}</u>
          </strong>{' '}
          Romane gewesen – das entspricht einer ganzen Bibliothek!
        </>,
        <>
          <Rocket sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest in der Zeit schon{' '}
          <strong>
            <u>{marsTrip}</u>
          </strong>{' '}
          mal zum Mars fliegen können – oder{' '}
          <strong>{moonTripsEquivalent}</strong> mal zum Mond!
        </>,
        <>
          <DirectionsWalk sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest bei 5 km/h{' '}
          <strong>
            <u>{totalKM.toFixed(2)}</u>
          </strong>{' '}
          km laufen können – das sind{' '}
          <strong>{olympicMarathonsEquivalent}</strong> olympische Marathons!
        </>,
        <>
          <Public sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest die Erde{' '}
          <strong>
            <u>{(totalKM / 40075).toFixed(2)}</u>
          </strong>{' '}
          mal umrundet oder könntest von Berlin nach Tokyo{' '}
          <strong>{Math.floor(totalKM / 8918)}</strong> mal hin und zurück!
        </>,
        // Neue kreative Facts
        <>
          <Hotel sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{sleepTimeEquivalent}</u>
          </strong>{' '}
          Nächte schlafen können – das sind über{' '}
          <strong>{Math.floor(sleepTimeEquivalent / 365)}</strong> Jahre!
        </>,
        <>
          <Work sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{workYearsEquivalent}</u>
          </strong>{' '}
          Jahre Vollzeit arbeiten können und dabei{' '}
          <strong>{Math.floor(parseFloat(workYearsEquivalent) * 50000)}€</strong>{' '}
          verdient!
        </>,
        <>
          <School sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{universityDegreesEquivalent || "mindestens einen"}</u>
          </strong>{' '}
          Universitätsabschluss machen können und wärst jetzt Dr. der Serienwissenschaften!
        </>,
        <>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <MovieIcon sx={{ fontSize: '1rem' }} />
          </Box>
          {' '}Du hast durchschnittlich{' '}
          <strong>
            <u>{episodesPerDay}</u>
          </strong>{' '}
          Episoden pro Tag geschaut – ein echter Binge-Watching Champion!
        </>,
        <>
          <Timer sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Deine durchschnittliche Episode dauert{' '}
          <strong>
            <u>{(averageEpisodeLength * 60).toFixed(0)}</u>
          </strong>{' '}
          Minuten – du liebst {averageEpisodeLength > 1 ? "längere" : "kürzere"} Formate!
        </>,
        <>
          <Grass sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          In der Zeit sind deine Haare um{' '}
          <strong>
            <u>{hairGrowthMM} mm</u>
          </strong>{' '}
          gewachsen – genug für {Math.floor(parseFloat(hairGrowthMM) / 150)} Friseurbesuche!
        </>,
        <>
          <Favorite sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Dein Herz hat in dieser Zeit{' '}
          <strong>
            <u>{(heartbeatsEquivalent / 1000000).toFixed(1)} Millionen</u>
          </strong>{' '}
          mal geschlagen – alle für Serien!
        </>,
        <>
          <RemoveRedEye sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hast dabei etwa{' '}
          <strong>
            <u>{(blinkingEquivalent / 1000).toFixed(0)}k</u>
          </strong>{' '}
          mal geblinzelt – und trotzdem keine Szene verpasst!
        </>,
        <>
          <Kitchen sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{cookingMealsEquivalent}</u>
          </strong>{' '}
          Mahlzeiten kochen können – das sind {Math.floor(cookingMealsEquivalent / 365)} Jahre Essen!
        </>,
        <>
          <SportsEsports sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{videoGameBeatingEquivalent}</u>
          </strong>{' '}
          AAA-Videospiele durchspielen können – aber Serien sind cooler!
        </>,
        <>
          <NaturePeople sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{treesPlantedEquivalent}</u>
          </strong>{' '}
          Bäume pflanzen können und damit {Math.floor(treesPlantedEquivalent * 22)} kg CO2 pro Jahr binden!
        </>,
        <>
          <Coffee sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{coffeeBrewingEquivalent}</u>
          </strong>{' '}
          Tassen Kaffee zubereiten können – genug Koffein für 10 Lifetime!
        </>,
        <>
          <Pets sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{dogWalksEquivalent}</u>
          </strong>{' '}
          Spaziergänge mit einem Hund machen können – der wäre super glücklich!
        </>,
        <>
          <AccountBalance sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{museumsVisitedEquivalent}</u>
          </strong>{' '}
          Museen besuchen können und wärst kulturell hypergebildet!
        </>,
        <>
          <Casino sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{boardGamesEquivalent}</u>
          </strong>{' '}
          Brettspiele spielen können – genug für eine eigene Spielesammlung!
        </>,
        <>
          <SelfImprovement sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{powerNapsEquivalent}</u>
          </strong>{' '}
          Power-Naps (15min) machen können und wärst der entspannteste Mensch der Welt!
        </>,
        <>
          <MusicNote sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{musicListeningEquivalent}</u>
          </strong>{' '}
          Songs hören können – das sind ganze{' '}
          <strong>{Math.floor(musicListeningEquivalent / 12)} Alben</strong>!
        </>,
        <>
          <Coffee sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{coffeeBrewingEquivalent}</u>
          </strong>{' '}
          Tassen Kaffee zubereiten können – genug Koffein für mehrere Leben!
        </>,
        <>
          <DarkMode sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{daysInSpaceEquivalent}</u>
          </strong>{' '}
          Tage im Weltall verbringen können – länger als die meisten Astronauten!
        </>,
        <>
          <RecordVoiceOver sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{languageLearningEquivalent}</u>
          </strong>{' '}
          neue Sprachen lernen können und wärst polyglott geworden!
        </>,
        <>
          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            <TvIcon sx={{ fontSize: '1rem' }} />
          </Box>
          {' '}Du hast{' '}
          <strong>
            <u>{userStats.episodesWatched}</u>
          </strong>{' '}
          Episoden geschaut – das sind mehr als{' '}
          <strong>{netflixSeriesEquivalent}</strong> komplette Netflix-Serien!
        </>,
        <>
          <Star sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hast{' '}
          <strong>
            <u>{userStats.seriesRated}</u>
          </strong>{' '}
          Serien bewertet – du bist ein echter Kritiker mit Geschmack!
        </>,
        <>
          <Air sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hast dabei{' '}
          <strong>
            <u>{(breathsEquivalent / 1000000).toFixed(1)} Millionen</u>
          </strong>{' '}
          mal geatmet – reine Sauerstoffverschwendung für Entertainment!
        </>,
        <>
          <DirectionsRun sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Mit der gesparten Zeit hättest du{' '}
          <strong>
            <u>{Math.floor(totalHours / 3)}</u>
          </strong>{' '}
          Halbmarathons laufen können – aber wer braucht schon Fitness?
        </>,
        <>
          <Book sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{Math.floor(totalHours / 100)}</u>
          </strong>{' '}
          Sachbücher lesen und ein Experte in {Math.floor(totalHours / 100)} Bereichen werden können!
        </>,
        <>
          <Brush sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{Math.floor(totalHours / 5)}</u>
          </strong>{' '}
          Kunstwerke malen können und wärst der nächste Picasso geworden!
        </>,
        <>
          <Restaurant sx={{ fontSize: '1rem', verticalAlign: 'middle', mr: 0.5 }} />
          Du hättest{' '}
          <strong>
            <u>{Math.floor(totalHours / 40)}</u>
          </strong>{' '}
          Kochkurse machen können und alle Küchen der Welt beherrscht!
        </>,
      ];
      const randomIndex = Math.floor(Math.random() * funFacts.length);
      setFunFact(funFacts[randomIndex]);
    }
  }, [open, userStats]);
  const sortedEpisodes = [...episodes].sort(
    (a, b) => (a.releaseTimestamp || 0) - (b.releaseTimestamp || 0)
  );
  const handleDialogClose = () => {
    if (dontShowToday) {
      const now = new Date();
      const nextDaySeven = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        7,
        0,
        0
      );
      localStorage.setItem('todayDontShow', nextDaySeven.getTime().toString());
    }
    onClose();
  };
  return (
    <>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        maxWidth='lg'
        fullWidth
        slotProps={{
          paper: {
            sx: {
              maxHeight: '80vh',
              background: colors.background.gradient.dark,
              borderRadius: '20px',
              border: `1px solid ${colors.border.light}`,
              overflow: 'hidden',
              boxShadow: colors.shadow.card,
              color: colors.text.primary,
              animation: 'rgbShadow 3s linear infinite',
            },
          },
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
              sx={{ fontWeight: 'bold', color: colors.text.secondary }}
            >
              Neuer Tag, neue Folgen!
            </Typography>
          </Box>

          <IconButton
            onClick={handleDialogClose}
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
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedEpisodes.map((ep) => (
              <ListItem
                key={ep.id}
                sx={{
                  border: `1px solid var(--theme-primary)20`,
                  backgroundColor: colors.background.card,
                  borderRadius: 2,
                  p: 3,
                  backdropFilter: 'blur(10px)',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Box
                  component='img'
                  src={ep.poster}
                  alt={ep.seriesTitle}
                  sx={{
                    width: 60,
                    height: 90,
                    borderRadius: 1,
                    marginRight: 2,
                  }}
                />
                <Box>
                  <ListItemText
                    primary={ep.seriesTitle}
                    secondary={`Staffel ${ep.seasonNumber}, Ep. ${ep.episodeNumber}: ${ep.episodeTitle}`}
                  />
                  <Box
                    component='span'
                    sx={{ fontSize: '0.8rem', color: colors.text.secondary }}
                  >
                    Uhrzeit: {ep.releaseTime}
                  </Box>
                </Box>
              </ListItem>
            ))}
          </List>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={dontShowToday}
                  onChange={(e) => setDontShowToday(e.target.checked)}
                />
              }
              label='Auf diesem Gerät heute nicht mehr anzeigen'
            />
          </Box>
          {}
          {userStats && (
            <>
              <Divider />
              <Paper
                variant='outlined'
                sx={{
                  mt: 4,
                  p: 2,
                  borderRadius: 2,
                  boxShadow: 3,
                }}
              >
                <Typography
                  sx={{ fontSize: '1rem' }}
                  color='primary'
                  gutterBottom
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <BarChart sx={{ fontSize: '1rem' }} />
                    Heutiger Funfact:
                  </Box>
                </Typography>
                <Typography sx={{ fontStyle: 'italic', fontSize: '0.9rem' }}>
                  {funFact}
                </Typography>
                <Typography
                  variant='caption'
                  display='block'
                  sx={{ mt: 1, fontSize: '0.8rem', color: 'gray' }}
                >
                  Watchtime: {userStats.watchtime.join(' ')}
                </Typography>
              </Paper>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
export default TodayEpisodesDialog;
