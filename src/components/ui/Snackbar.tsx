import { Check } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';

interface SnackbarProps {
  open: boolean;
  message: string;
  icon?: React.ReactNode;
  variant?: 'success' | 'error' | 'info';
}

export const Snackbar: React.FC<SnackbarProps> = ({ open, message, icon, variant = 'success' }) => {
  const { currentTheme } = useTheme();

  const colorMap = {
    success: currentTheme.status.success,
    error: currentTheme.status.error,
    info: currentTheme.primary,
  };
  const color = colorMap[variant];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          style={{
            position: 'fixed',
            bottom: '100px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: `linear-gradient(135deg, ${color}, ${color}dd)`,
            color: 'white',
            padding: '14px 24px',
            borderRadius: 'var(--radius-lg)',
            boxShadow: `0 12px 40px -8px ${color}50, var(--shadow-md)`,
            zIndex: 'var(--z-toast)' as string,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            maxWidth: 'calc(100% - 40px)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {icon || <Check style={{ fontSize: '18px' }} />}
          </div>
          <span style={{ fontSize: '15px', fontWeight: 600 }}>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
