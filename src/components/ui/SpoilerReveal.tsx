import { Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import { tapScaleSmall } from '../../lib/motion';

interface SpoilerRevealProps {
  onReveal: () => void;
  compact?: boolean;
}

export const SpoilerReveal: React.FC<SpoilerRevealProps> = ({ onReveal, compact = false }) => {
  const { currentTheme } = useTheme();
  const warningColor = currentTheme.status.warning;

  return (
    <motion.button
      whileTap={tapScaleSmall}
      onClick={onReveal}
      style={{
        width: compact ? undefined : '100%',
        padding: compact ? '10px 14px' : '20px',
        background: compact
          ? `${warningColor}15`
          : `linear-gradient(135deg, ${warningColor}15, ${warningColor}08)`,
        border: `${compact ? '1' : '2'}px dashed ${warningColor}40`,
        borderRadius: compact ? 'var(--radius-sm)' : 'var(--radius-md)',
        color: warningColor,
        cursor: 'pointer',
        fontSize: compact ? '13px' : '15px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        justifyContent: compact ? undefined : 'center',
        gap: compact ? '6px' : '8px',
        marginBottom: compact ? '8px' : undefined,
      }}
    >
      <Warning style={{ fontSize: compact ? '16px' : '20px' }} />
      Spoiler anzeigen
    </motion.button>
  );
};
