import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Repeat from '@mui/icons-material/Repeat';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScaleSmall } from '../../../lib/motion';

interface RewatchToggleProps {
  activeRewatchCount: number;
  showRewatches: boolean;
  onToggle: () => void;
}

/** Aufklapp-Leiste über der Liste: blendet aktive Rewatches ein/aus. */
export const RewatchToggle = ({
  activeRewatchCount,
  showRewatches,
  onToggle,
}: RewatchToggleProps) => {
  const { currentTheme } = useTheme();

  return (
    <motion.button
      type="button"
      whileTap={tapScaleSmall}
      onClick={onToggle}
      aria-expanded={showRewatches}
      aria-label={`${activeRewatchCount} aktive ${
        activeRewatchCount === 1 ? 'Rewatch' : 'Rewatches'
      } ${showRewatches ? 'ausblenden' : 'anzeigen'}`}
      className="watch-next-rewatch-toggle"
      style={{
        background: showRewatches
          ? `${currentTheme.accent || '#f59e0b'}20`
          : `${currentTheme.accent || '#f59e0b'}10`,
        border: `1px solid ${currentTheme.accent || '#f59e0b'}${showRewatches ? '50' : '30'}`,
      }}
    >
      <span className="watch-next-rewatch-toggle__content">
        <span className="watch-next-rewatch-toggle__label">
          <Repeat style={{ fontSize: '15px', color: currentTheme.accent || '#f59e0b' }} />
          {activeRewatchCount} aktive {activeRewatchCount === 1 ? 'Rewatch' : 'Rewatches'}
        </span>
        {showRewatches ? (
          <ExpandLess style={{ fontSize: '18px', color: currentTheme.text.muted }} />
        ) : (
          <ExpandMore style={{ fontSize: '18px', color: currentTheme.text.muted }} />
        )}
      </span>
    </motion.button>
  );
};
