import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { DesktopWindows, Login, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GradientText } from '../../components/ui';

export const HeroSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div className="start-hero">
      <div className="start-hero-subtitle" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
        Serien, Film & Manga Tracker
      </div>

      <GradientText as="h1" style={{ marginBottom: '24px' }}>
        <span className="start-hero-title">TV-RANK</span>
      </GradientText>

      <div className="start-hero-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
        <span style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', fontWeight: 300 }}>
          Dein ultimativer Serien, Film & Manga Tracker
        </span>
      </div>
      <div className="start-hero-body" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
        <span style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)' }}>
          Entdecke neue Serien, Filme und Manga, verwalte deine Watchlist, tracke deinen Fortschritt
          und teile deine Favoriten mit Freunden.
        </span>
      </div>

      <div className="start-cta-group">
        <Button
          component={Link}
          to="/register"
          variant="contained"
          size="large"
          startIcon={<PersonAdd />}
          sx={{
            px: 4,
            py: 1.5,
            background: '#a855f7',
            color: 'white',
            fontWeight: 600,
            fontSize: '1rem',
            borderRadius: 3,
            textTransform: 'none',
            boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
            '&:hover': {
              background: '#9333ea',
              boxShadow: '0 6px 20px rgba(168, 85, 247, 0.4)',
            },
          }}
        >
          Kostenlos starten
        </Button>
        <Button
          component={Link}
          to="/login"
          variant="outlined"
          size="large"
          startIcon={<Login />}
          sx={{
            px: 4,
            py: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.2)',
            color: 'rgba(255, 255, 255, 0.8)',
            fontWeight: 500,
            fontSize: '1rem',
            borderRadius: 3,
            textTransform: 'none',
            '&:hover': {
              borderColor: 'rgba(168, 85, 247, 0.5)',
              background: 'rgba(168, 85, 247, 0.08)',
            },
          }}
        >
          Anmelden
        </Button>
      </div>

      {!window.electronAPI?.isElectron && (
        <Button
          component="a"
          href="https://github.com/Floatyy1998/Serien-Ranking/releases/latest/download/TV-Rank-Setup.exe"
          download
          startIcon={<DesktopWindows />}
          size="small"
          sx={{
            mt: 3,
            px: 3,
            py: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            color: 'rgba(255, 255, 255, 0.45)',
            fontWeight: 400,
            fontSize: '0.85rem',
            borderRadius: 2,
            textTransform: 'none',
            background: 'rgba(255, 255, 255, 0.03)',
            '&:hover': {
              borderColor: 'rgba(168, 85, 247, 0.4)',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(168, 85, 247, 0.08)',
            },
          }}
        >
          Desktop App herunterladen
        </Button>
      )}
    </div>
  </motion.div>
);
