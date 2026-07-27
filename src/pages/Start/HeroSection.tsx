import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { DesktopWindows, Login, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { GradientText } from '../../components/ui';
import { CoverWall } from '../../components/ui/CoverWall';
import { HeroAppMock } from './HeroAppMock';
import { t } from '../../services/i18n';

/**
 * Marketing-Markenpalette der Start-Seite (Pre-Auth Landing).
 * BEWUSSTE AUSNAHME vom Theme-System: fixe Bernstein/Gold-Marke statt
 * currentTheme/var(--theme-primary). Die Landing wird ausgeloggt gerendert, wo nur
 * das Default-Theme (Charcoal/Bernstein) greift. Warm gehalten, passend zum
 * Default; daher bewusst hart & hier zentral dokumentiert.
 */
const BRAND = { gold: '#ef6f8a', goldDark: '#c8901f', goldRGB: '224, 168, 58' } as const;

export const HeroSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, ease: 'easeOut' }}
  >
    <div className="start-hero">
      {/* Atmosphäre: gedimmte Poster-Marquee hinter dem gesamten Hero */}
      <div className="start-hero-atmo" aria-hidden>
        <CoverWall />
      </div>

      {/* Links: Marke + Claim + CTAs */}
      <div className="start-hero-copy">
        <div className="start-hero-subtitle" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          {t('Serien, Film & Manga Tracker')}
        </div>

        <GradientText as="h1" style={{ marginBottom: '24px' }}>
          <span className="start-hero-title">TV-RANK</span>
        </GradientText>

        <div className="start-hero-description" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <span style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', fontWeight: 300 }}>
            {t('Dein ultimativer Serien, Film & Manga Tracker')}
          </span>
        </div>
        <div className="start-hero-body" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
          <span style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.05rem)' }}>
            {t(
              'Entdecke neue Serien, Filme und Manga, verwalte deine Watchlist, tracke deinen Fortschritt und teile deine Favoriten mit Freunden.'
            )}
          </span>
        </div>

        <div className="start-cta-group">
          <Button
            component={Link}
            to="/join"
            variant="contained"
            size="large"
            startIcon={<PersonAdd />}
            sx={{
              px: 4,
              py: 1.5,
              background: BRAND.gold,
              color: 'white',
              fontWeight: 600,
              fontSize: '1rem',
              borderRadius: 3,
              textTransform: 'none',
              boxShadow: `0 4px 16px rgba(${BRAND.goldRGB}, 0.3)`,
              '&:hover': {
                background: BRAND.goldDark,
                boxShadow: `0 6px 20px rgba(${BRAND.goldRGB}, 0.4)`,
              },
            }}
          >
            {t('Kostenlos starten')}
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
                borderColor: `rgba(${BRAND.goldRGB}, 0.5)`,
                background: `rgba(${BRAND.goldRGB}, 0.08)`,
              },
            }}
          >
            {t('Anmelden')}
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
                borderColor: `rgba(${BRAND.goldRGB}, 0.4)`,
                color: 'rgba(255, 255, 255, 0.7)',
                background: `rgba(${BRAND.goldRGB}, 0.08)`,
              },
            }}
          >
            {t('Desktop App herunterladen')}
          </Button>
        )}
      </div>

      {/* Rechts: Produkt-Schaufenster — Mini-App mit echten Trending-Daten */}
      <div className="start-hero-visual">
        <HeroAppMock />
      </div>
    </div>
  </motion.div>
);
