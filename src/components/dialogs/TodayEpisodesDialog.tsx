import CloseIcon from '@mui/icons-material/Close';
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
import { TodayEpisode } from '../../interfaces/TodayEpisode';

interface TodayEpisodesDialogProps {
  open: boolean;
  onClose: () => void;
  episodes: TodayEpisode[];
  userStats?: {
    watchtime: string[];
    episodesWatched: number;
    seriesRated: number;
    watchtimeTotal: number; // neu hinzugefügt (in Minuten)
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

      const funFacts = [
        <>
          🐋 Du hast{' '}
          <strong>
            <u>{percentageOfSharkLife}%</u>
          </strong>{' '}
          der Lebenszeit eines Grönlandhais mit Serien verbracht.
        </>,
        <>
          📚 Hättest du stattdessen Bücher gelesen, wären das etwa{' '}
          <strong>
            <u>{booksRead}</u>
          </strong>{' '}
          Romane gewesen.
        </>,
        <>
          🚀 Du hättest in der Zeit schon{' '}
          <strong>
            <u>{marsTrip}</u>
          </strong>{' '}
          mal zum Mars fliegen können.
        </>,
        <>
          🚶‍♂️ Du hättest bei einer Geschwindigkeit von 5Km/h{' '}
          <strong>
            <u>{totalKM.toFixed(2)}</u>
          </strong>{' '}
          Km weit laufen können.
        </>,
        <>
          🌍 Du hättest die Erde{' '}
          <strong>
            <u>{(totalKM / 40075).toFixed(2)}</u>
          </strong>{' '}
          mal umrundet bei 5Km/h.
        </>,
        <>
          🍿 Du hättest in dieser Zeit etwa{' '}
          <strong>
            <u>{Math.floor(totalHours / 2)}</u>
          </strong>{' '}
          Filme schauen können.
        </>,
        <>
          🎮 Du hättest{' '}
          <strong>
            <u>{Math.floor(totalHours / 4)}</u>
          </strong>{' '}
          spannende Gaming-Sessions genießen können.
        </>,
        <>
          📰 Du hättest etwa{' '}
          <strong>
            <u>{Math.floor(totalHours / 0.16)}</u>
          </strong>{' '}
          Nachrichtenartikel lesen können.
        </>,
        <>
          🏋️‍♂️ Du hättest{' '}
          <strong>
            <u>{Math.floor(totalHours)}</u>
          </strong>{' '}
          Fitness-Sessions absolvieren können – und wärst trotzdem fit
          geblieben.
        </>,
        <>
          🍕 Du hättest etwa{' '}
          <strong>
            <u>{Math.floor(totalHours * 2)}</u>
          </strong>{' '}
          Pizzen bestellen können – lecker und episch!
        </>,
        <>
          🚴‍♀️ Du hättest in dieser Zeit{' '}
          <strong>
            <u>{Math.floor(totalKM / 15)}</u>
          </strong>{' '}
          Radtouren machen können.
        </>,
        <>
          🌍 Du hättest{' '}
          <strong>
            <u>{Math.floor(totalHours / 24)}</u>
          </strong>{' '}
          Tagesausflüge rund um den Globus unternehmen können.
        </>,
        <>
          ✈️ Du hättest in dieser Zeit fast{' '}
          <strong>
            <u>{Math.floor(totalKM / 800)}</u>
          </strong>{' '}
          Kurzflüge absolvieren können.
        </>,
        <>
          💡 Mit dieser Watchtime hättest du genügend Ideen für{' '}
          <strong>
            <u>{Math.floor(totalHours * 0.1)}</u>
          </strong>{' '}
          neue Projekte gesammelt.
        </>,
        <>
          🎭 Du hättest in dieser Zeit etwa{' '}
          <strong>
            <u>{Math.floor(totalHours)}</u>
          </strong>{' '}
          Theaterstücke aufführen können.
        </>,
        <>
          🎤 Du hättest in dieser Zeit etwa{' '}
          <strong>
            <u>{Math.floor(totalHours / 2)}</u>
          </strong>{' '}
          Konzerte geben können.
        </>,
        <>
          🎤 Du hättest in dieser Zeit etwa{' '}
          <strong>
            <u>{Math.floor(totalHours / 2.2)}</u>
          </strong>{' '}
          Podcast-Episoden aufnehmen können.
        </>,
      ];

      const randomIndex = Math.floor(Math.random() * funFacts.length);
      setFunFact(funFacts[randomIndex]);
    }
  }, [open, userStats]);

  // Sortiere episodes aufsteigend nach releaseTimestamp (früheste Zeit oben)
  const sortedEpisodes = [...episodes].sort(
    (a, b) => (a.releaseTimestamp || 0) - (b.releaseTimestamp || 0)
  );

  const handleDialogClose = () => {
    // Wenn Checkbox aktiviert, speichere Timestamp für nächsten Tag um 7 Uhr
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
      {/* CSS-Keyframes für den animierten RGB-Schatten */}
      <style>
        {`
          @keyframes rgbShadow {
            0% { box-shadow: 0 0 20px rgba(255,0,0,0.8); }
            33% { box-shadow: 0 0 20px rgba(0,255,0,0.8); }
            66% { box-shadow: 0 0 20px rgba(0,0,255,0.8); }
            100% { box-shadow: 0 0 20px rgba(255,0,0,0.8); }
          }
        `}
      </style>
      <Dialog
        open={open}
        onClose={handleDialogClose}
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 2,
              animation: 'rgbShadow 3s linear infinite',
            },
          },
        }}
      >
        <DialogTitle>
          Neuer Tag, neue Folgen!
          <IconButton
            aria-label='close'
            onClick={handleDialogClose}
            className='closeButton'
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sortedEpisodes.map((ep) => (
              <ListItem
                key={ep.id}
                sx={{
                  // Angepasst an das Design vom WatchlistDialog
                  border: '1px solid rgba(0,254,215,0.125)',
                  backgroundColor: 'rgba(0,0,0,0.4)',
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
                    sx={{ fontSize: '0.8rem', color: 'gray' }}
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
          {/* Anzeige des Funfacts unter einem Divider, anstatt der Statistiken */}
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
                  📊 Heutiger Funfact:
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
