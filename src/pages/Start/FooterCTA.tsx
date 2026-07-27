import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { t } from '../../services/i18n';

/**
 * Marketing-Markenpalette der Start-Seite (Pre-Auth Landing).
 * BEWUSSTE AUSNAHME vom Theme-System: fixe Bernstein/Gold-Marke statt
 * currentTheme/var(--theme-primary). Die Landing wird ausgeloggt gerendert, wo nur
 * das Default-Theme (Charcoal/Bernstein) greifen würde. Warm gehalten, passend zum
 * Default. Werte daher bewusst hart & hier dokumentiert.
 */
const BRAND = {
  gold: '#ef6f8a',
  goldDark: '#c8901f',
  warm: '#e07a3a',
  warmDark: '#c8631f',
  goldRGB: '224, 168, 58',
} as const;

export const FooterCTA = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6, duration: 0.4 }}
  >
    <div className="start-footer-cta">
      <h2 className="start-footer-cta-heading" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        {t('Bereit loszulegen?')}
      </h2>
      <p className="start-footer-cta-text" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
        {t('Starte noch heute und entdecke deine neue Lieblingsserie')}
      </p>
      <Button
        component={Link}
        to="/join"
        variant="contained"
        size="large"
        sx={{
          px: 5,
          py: 1.75,
          background: `linear-gradient(135deg, ${BRAND.gold} 0%, ${BRAND.warm} 100%)`,
          color: 'white',
          fontWeight: 600,
          fontSize: '1.1rem',
          borderRadius: 3,
          textTransform: 'none',
          boxShadow: `0 4px 16px rgba(${BRAND.goldRGB}, 0.3)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${BRAND.goldDark} 0%, ${BRAND.warmDark} 100%)`,
            boxShadow: `0 6px 20px rgba(${BRAND.goldRGB}, 0.4)`,
          },
        }}
      >
        {t('Jetzt kostenlos registrieren')}
      </Button>
    </div>
  </motion.div>
);
