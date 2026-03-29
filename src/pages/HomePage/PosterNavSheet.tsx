import PlayCircle from '@mui/icons-material/PlayCircle';
import Tv from '@mui/icons-material/Tv';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BottomSheet } from '../../components/ui';
import { useTheme } from '../../contexts/ThemeContextDef';

interface PosterNavState {
  open: boolean;
  seriesId: number;
  title: string;
  episodePath: string;
}

interface PosterNavSheetProps {
  posterNav: PosterNavState;
  onClose: () => void;
}

export const PosterNavSheet: React.FC<PosterNavSheetProps> = ({ posterNav, onClose }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  return (
    <BottomSheet
      isOpen={posterNav.open}
      onClose={onClose}
      bottomOffset="calc(90px + env(safe-area-inset-bottom))"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '0 16px 16px',
        }}
      >
        <p
          style={{
            fontSize: '17px',
            fontWeight: '700',
            fontFamily: 'var(--font-display)',
            margin: 0,
            color: currentTheme.primary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {posterNav.title}
        </p>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            onClose();
            navigate(posterNav.episodePath);
          }}
          style={{
            padding: '14px 16px',
            background: `${currentTheme.primary}26`,
            border: `1px solid ${currentTheme.primary}4D`,
            borderRadius: '12px',
            color: currentTheme.primary,
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <PlayCircle style={{ fontSize: '20px' }} />
          Zur Episode
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => {
            onClose();
            navigate(`/series/${posterNav.seriesId}`);
          }}
          style={{
            padding: '14px 16px',
            background: currentTheme.background.surface,
            border: `1px solid ${currentTheme.border.default}`,
            borderRadius: '12px',
            color: currentTheme.text.secondary,
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Tv style={{ fontSize: '20px' }} />
          Zur Serie
        </motion.button>
      </div>
    </BottomSheet>
  );
};
