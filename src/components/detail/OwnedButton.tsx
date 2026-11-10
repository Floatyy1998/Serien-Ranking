import Album from '@mui/icons-material/Album';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import type React from 'react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { hapticTap } from '../../lib/interaction/haptics';
import { showToast } from '../../lib/interaction/toast';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';
import { setMediaOwned, type MediaRef } from '../../services/series/mediaBulk';

/** „Im Besitz" (DVD, Blu-ray) einer Serie oder eines Films umschalten. */
export const OwnedButton = ({
  target,
  owned,
  className,
  iconSize,
  style,
}: {
  target: MediaRef;
  owned: boolean;
  className: string;
  iconSize: number;
  style?: React.CSSProperties;
}) => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  // Sofort umschalten, die Liste zieht über den Delta-Sync nach.
  const [optimistic, setOptimistic] = useState<{ base: boolean; value: boolean } | null>(null);
  const shown = optimistic && optimistic.base === owned ? optimistic.value : owned;
  const label = shown ? t('Im Besitz') : t('Als Besitz markieren');
  const color = currentTheme.status.success;

  const toggle = async () => {
    if (!user) return;
    const next = !shown;
    hapticTap();
    setOptimistic({ base: owned, value: next });
    try {
      await setMediaOwned(user.uid, [target], next);
      showToast(next ? t('Als Besitz markiert') : t('Nicht mehr im Besitz'), 1800);
    } catch {
      setOptimistic(null);
      showToast(t('Speichern fehlgeschlagen'), 2200, 'error');
    }
  };

  return (
    <Tooltip title={label} arrow>
      <motion.button
        type="button"
        whileTap={tapScale}
        onClick={() => void toggle()}
        className={className}
        aria-label={label}
        aria-pressed={shown}
        style={
          shown ? { ...style, color, borderColor: `${color}40`, background: `${color}14` } : style
        }
      >
        <Album style={{ fontSize: iconSize }} />
      </motion.button>
    </Tooltip>
  );
};
