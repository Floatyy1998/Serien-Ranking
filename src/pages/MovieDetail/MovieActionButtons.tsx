import Delete from '@mui/icons-material/Delete';
import Star from '@mui/icons-material/Star';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';

interface MovieActionButtonsProps {
  isMobile: boolean;
  isWatched: boolean;
  isReadOnlyTmdbMovie: boolean;
  isAdding: boolean;
  loading: boolean;
  movieId: number;
  onNavigateRate: () => void;
  onAddMovie: () => void;
  onDeleteClick: () => void;
}

export const MovieActionButtons = memo(
  ({
    isMobile,
    isWatched,
    isReadOnlyTmdbMovie,
    isAdding,
    loading,
    onNavigateRate,
    onAddMovie,
    onDeleteClick,
  }: MovieActionButtonsProps) => {
    const { currentTheme } = useTheme();

    if (isReadOnlyTmdbMovie) {
      return (
        <div className={`md-add-btn-wrap ${isMobile ? 'md-add-btn-wrap--mobile' : ''}`}>
          <button
            onClick={onAddMovie}
            disabled={isAdding}
            className={`md-add-btn ${isMobile ? 'md-add-btn--mobile' : ''}`}
            style={{
              background: isAdding
                ? `${currentTheme.primary}80`
                : `linear-gradient(135deg, ${currentTheme.primary}CC 0%, ${currentTheme.primary}CC 100%)`,
              border: `1px solid ${currentTheme.primary}80`,
              color: currentTheme.text.secondary,
            }}
          >
            {isAdding ? 'Wird hinzugefugt...' : 'Film hinzufugen'}
          </button>
        </div>
      );
    }

    return (
      <div className={`md-actions ${isMobile ? 'md-actions--mobile' : ''}`}>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNavigateRate}
          disabled={loading}
          className={`md-rate-btn ${isMobile ? 'md-rate-btn--mobile' : ''}`}
          style={{
            background: isWatched
              ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)'
              : 'rgba(255, 255, 255, 0.05)',
            border: isWatched
              ? '1px solid rgba(255, 215, 0, 0.3)'
              : '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Star
            style={{
              fontSize: isMobile ? '16px' : '18px',
              color: isWatched ? currentTheme.accent : currentTheme.text.secondary,
            }}
          />
          Bewerten
        </motion.button>

        <Tooltip title="Film löschen" arrow>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onDeleteClick}
            className="action-btn"
            style={{
              padding: isMobile ? '10px' : '12px',
              background: 'rgba(220, 53, 69, 0.1)',
              border: '1px solid rgba(220, 53, 69, 0.3)',
              borderRadius: isMobile ? '10px' : '12px',
              fontSize: isMobile ? '13px' : '16px',
            }}
          >
            <Delete
              style={{
                fontSize: isMobile ? '18px' : '20px',
                color: currentTheme.status?.error || '#ef4444',
              }}
            />
          </motion.button>
        </Tooltip>
      </div>
    );
  }
);

MovieActionButtons.displayName = 'MovieActionButtons';
