import { ArrowForward, AutoAwesome, CheckCircleOutline } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { GradientText } from '../../components/ui';

export const EmptyState = memo(() => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const handleDiscover = useCallback(() => {
    navigate('/discover');
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="cu-empty"
    >
      <motion.div
        animate={{
          boxShadow: [
            `0 0 0 0 ${currentTheme.status.success}40`,
            `0 0 0 20px ${currentTheme.status.success}00`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        className="cu-empty-icon"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.status.success}20, ${currentTheme.primary}20)`,
        }}
      >
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
        >
          <CheckCircleOutline style={{ fontSize: '60px', color: currentTheme.status.success }} />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <GradientText
          as="h2"
          from={currentTheme.text.primary}
          to={currentTheme.primary}
          style={{ margin: '0 0 12px 0', fontSize: '28px', fontWeight: 800 }}
        >
          Alles aufgeholt!
        </GradientText>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="cu-empty-text"
        style={{ color: currentTheme.text.muted }}
      >
        Du bist bei allen Serien up-to-date. Zeit für etwas Neues!
      </motion.p>

      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleDiscover}
        className="cu-empty-btn"
        style={{
          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          boxShadow: `0 8px 24px ${currentTheme.primary}40`,
        }}
      >
        <AutoAwesome style={{ fontSize: 20 }} />
        Neue Serie entdecken
        <ArrowForward style={{ fontSize: 20 }} />
      </motion.button>
    </motion.div>
  );
});

EmptyState.displayName = 'EmptyState';
