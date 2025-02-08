import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import React, { useState } from 'react';
import { TodayEpisode } from '../../interfaces/TodayEpisode';

interface TodayEpisodesDialogProps {
  open: boolean;
  onClose: () => void;
  episodes: TodayEpisode[];
}

const TodayEpisodesDialog: React.FC<TodayEpisodesDialogProps> = ({
  open,
  onClose,
  episodes,
}) => {
  const [dontShowToday, setDontShowToday] = useState(false);

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
              position: 'relative',
              borderRadius: 2,
              animation: 'rgbShadow 3s linear infinite',
            },
          },
        }}
      >
        <DialogTitle
          sx={{ textAlign: 'center', position: 'relative', fontSize: '1.5rem' }}
        >
          Hurra! Heute gibt es neue Folgen!
          <IconButton
            aria-label='close'
            onClick={handleDialogClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'red',
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <List sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {episodes.map((ep) => (
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
              label='Heute nicht mehr anzeigen'
            />
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TodayEpisodesDialog;
