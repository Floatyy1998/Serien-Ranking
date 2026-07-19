import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { t } from '../../services/i18n';

/**
 * Marketing-Markenpalette der Start-Seite (Pre-Auth Landing).
 * BEWUSSTE AUSNAHME vom Theme-System: fixe Violett/Pink-Marke statt
 * currentTheme/var(--theme-primary). Die Landing wird ausgeloggt gerendert –
 * ein Angleichen an das Default-Theme (Grün/Schwarz) würde das Marketing-Design
 * verändern. Werte daher bewusst hart & hier dokumentiert.
 */
const BRAND = {
  purple: '#a855f7',
  purpleDark: '#9333ea',
  pink: '#ec4899',
  pinkDark: '#db2777',
  purpleRGB: '168, 85, 247',
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
        to="/register"
        variant="contained"
        size="large"
        sx={{
          px: 5,
          py: 1.75,
          background: `linear-gradient(135deg, ${BRAND.purple} 0%, ${BRAND.pink} 100%)`,
          color: 'white',
          fontWeight: 600,
          fontSize: '1.1rem',
          borderRadius: 3,
          textTransform: 'none',
          boxShadow: `0 4px 16px rgba(${BRAND.purpleRGB}, 0.3)`,
          '&:hover': {
            background: `linear-gradient(135deg, ${BRAND.purpleDark} 0%, ${BRAND.pinkDark} 100%)`,
            boxShadow: `0 6px 20px rgba(${BRAND.purpleRGB}, 0.4)`,
          },
        }}
      >
        {t('Jetzt kostenlos registrieren')}
      </Button>
    </div>
  </motion.div>
);
