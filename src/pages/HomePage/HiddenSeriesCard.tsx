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
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate('/hidden-series')}
      aria-label={`Nicht weitergeschaut: ${hiddenSeriesList.length} ${hiddenSeriesList.length === 1 ? 'Serie' : 'Serien'} ausgeblendet`}
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
        width: 'calc(100% - 40px)',
        textAlign: 'left',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: '12px',
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
        <h2
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 700,
            fontFamily: 'var(--font-display)',
            color: currentTheme.text.primary,
            whiteSpace: 'nowrap',
          }}
        >
          Nicht weitergeschaut
        </h2>
        <p
          style={{
            margin: '1px 0 0',
            fontSize: 12,
            color: currentTheme.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          {hiddenSeriesList.length} {hiddenSeriesList.length === 1 ? 'Serie' : 'Serien'}{' '}
          ausgeblendet
        </p>
      </div>

      <ChevronRight
        style={{
          fontSize: 24,
          color: currentTheme.text.muted,
          flexShrink: 0,
        }}
      />
    </motion.button>
  );
};
