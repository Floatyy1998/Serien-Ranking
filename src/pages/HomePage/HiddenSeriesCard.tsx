import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VisibilityOff, ChevronRight } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useSeriesList } from '../../contexts/OptimizedSeriesListProvider';

export const HiddenSeriesCard: React.FC = () => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { hiddenSeriesList } = useSeriesList();

  if (hiddenSeriesList.length === 0) {
    return null;
  }

  const accentColor = '#ff9800';

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/hidden-series')}
      style={{
        margin: '0 20px',
        padding: '12px 14px',
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}05)`,
        border: `1px solid ${accentColor}30`,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '10px',
          background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <VisibilityOff style={{ fontSize: 20, color: 'white' }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <h3
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Nicht weitergeschaut
        </h3>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: currentTheme.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          {hiddenSeriesList.length} {hiddenSeriesList.length === 1 ? 'Serie' : 'Serien'} ausgeblendet
        </p>
      </div>

      <ChevronRight
        style={{
          fontSize: 24,
          color: currentTheme.text.muted,
          flexShrink: 0,
        }}
      />
    </motion.div>
  );
};
