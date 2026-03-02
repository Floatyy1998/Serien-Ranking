import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export const FooterCTA = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.6, duration: 0.4 }}
  >
    <div className="start-footer-cta">
      <h2 className="start-footer-cta-heading" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        Bereit loszulegen?
      </h2>
      <p className="start-footer-cta-text" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
        Starte noch heute und entdecke deine neue Lieblingsserie
      </p>
      <Button
        component={Link}
        to="/register"
        variant="contained"
        size="large"
        sx={{
          px: 5,
          py: 1.75,
          background: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
          color: 'white',
          fontWeight: 600,
          fontSize: '1.1rem',
          borderRadius: 3,
          textTransform: 'none',
          boxShadow: '0 4px 16px rgba(168, 85, 247, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #9333ea 0%, #db2777 100%)',
            boxShadow: '0 6px 20px rgba(168, 85, 247, 0.4)',
          },
        }}
      >
        Jetzt kostenlos registrieren
      </Button>
    </div>
  </motion.div>
);
