import { Tune } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { hapticTap } from '../../../lib/interaction/haptics';
import { tapScaleTight } from '../../../lib/motion';
import { t } from '../../../services/i18n';

export const CustomizeHomeLink = () => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 16px 28px' }}>
      <motion.button
        type="button"
        whileTap={tapScaleTight}
        onClick={() => {
          hapticTap();
          navigate('/home-layout');
        }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 18px',
          minHeight: 44,
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--glass-border-light)',
          background: 'var(--glass-light)',
          color: currentTheme.text.secondary,
          fontSize: 13,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <Tune style={{ fontSize: 18, color: currentTheme.primary }} />
        {t('Startseite anpassen')}
      </motion.button>
    </div>
  );
};
