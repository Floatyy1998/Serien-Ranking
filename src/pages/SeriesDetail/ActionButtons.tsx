import {
  BookmarkAdd,
  BookmarkRemove,
  Delete,
  PlayCircle,
  Star,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import type { Series } from '../../types/Series';

interface ActionButtonsProps {
  series: Series;
  overallRating: string;
  isDeleting: boolean;
  isMobile: boolean;
  onNavigateEpisodes: () => void;
  onNavigateRating: () => void;
  onWatchlistToggle: () => void;
  onHideToggle: () => void;
  onDelete: () => void;
}

export const ActionButtons = memo<ActionButtonsProps>(
  ({
    series,
    overallRating,
    isDeleting,
    isMobile,
    onNavigateEpisodes,
    onNavigateRating,
    onWatchlistToggle,
    onHideToggle,
    onDelete,
  }) => {
    const { currentTheme } = useTheme();
    const iconSize = isMobile ? '18px' : '20px';
    const hasRating = parseFloat(overallRating) > 0;
    const pad = isMobile ? '10px' : '12px';
    const radius = isMobile ? '10px' : '12px';
    const fontSize = isMobile ? '13px' : '15px';
    const gap = isMobile ? '8px' : '10px';

    return (
      <div
        style={{
          padding: isMobile ? '8px 12px' : '12px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap,
        }}
      >
        {/* Row 1: Primary actions with labels */}
        <div style={{ display: 'flex', gap }}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateEpisodes}
            className="action-btn"
            style={{
              flex: 1,
              padding: pad,
              background: `linear-gradient(135deg, ${currentTheme.primary}CC 0%, ${currentTheme.accent}CC 100%)`,
              border: `1px solid ${currentTheme.primary}80`,
              borderRadius: radius,
              fontSize,
            }}
          >
            <PlayCircle style={{ fontSize: iconSize }} />
            <span>Episoden</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateRating}
            className="action-btn"
            style={{
              flex: 1,
              padding: pad,
              background: hasRating
                ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)'
                : 'rgba(255, 255, 255, 0.05)',
              border: hasRating
                ? '1px solid rgba(255, 215, 0, 0.3)'
                : '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: radius,
              fontSize,
            }}
          >
            <Star
              style={{
                fontSize: iconSize,
                color: hasRating ? currentTheme.accent : currentTheme.text.secondary,
              }}
            />
            <span>Bewerten</span>
          </motion.button>
        </div>

        {/* Row 2: Icon-only secondary actions */}
        <div style={{ display: 'flex', gap }}>
          <Tooltip title={series.watchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist'} arrow>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onWatchlistToggle}
              className="action-btn"
              style={{
                flex: 1,
                padding: pad,
                background: series.watchlist
                  ? `linear-gradient(135deg, ${currentTheme.primary}33 0%, ${currentTheme.primary}33 100%)`
                  : 'rgba(255, 255, 255, 0.05)',
                border: series.watchlist
                  ? `1px solid ${currentTheme.primary}66`
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: radius,
                fontSize,
              }}
            >
              {series.watchlist ? (
                <BookmarkRemove style={{ fontSize: iconSize }} />
              ) : (
                <BookmarkAdd style={{ fontSize: iconSize }} />
              )}
            </motion.button>
          </Tooltip>

          <Tooltip title={series.hidden ? 'Serie einblenden' : 'Serie ausblenden'} arrow>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onHideToggle}
              className="action-btn"
              style={{
                flex: 1,
                padding: pad,
                background: series.hidden
                  ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 183, 77, 0.2) 100%)'
                  : 'rgba(255, 255, 255, 0.05)',
                border: series.hidden
                  ? '1px solid rgba(255, 152, 0, 0.4)'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: radius,
                fontSize,
              }}
            >
              {series.hidden ? (
                <Visibility style={{ fontSize: iconSize }} />
              ) : (
                <VisibilityOff style={{ fontSize: iconSize }} />
              )}
            </motion.button>
          </Tooltip>

          <Tooltip title={isDeleting ? 'Wird gelöscht...' : 'Serie löschen'} arrow>
            <motion.button
              whileTap={{ scale: isDeleting ? 1 : 0.95 }}
              onClick={onDelete}
              disabled={isDeleting}
              className="action-btn"
              style={{
                flex: 1,
                padding: pad,
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.3)',
                borderRadius: radius,
                opacity: isDeleting ? 0.6 : 1,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                fontSize,
              }}
            >
              <Delete
                style={{ fontSize: iconSize, color: currentTheme.status?.error || '#ef4444' }}
              />
            </motion.button>
          </Tooltip>
        </div>
      </div>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';
