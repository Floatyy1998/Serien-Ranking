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
import { useTheme } from '../../contexts/ThemeContextDef';
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
    const hasRating = parseFloat(overallRating) > 0;
    const iconSize = isMobile ? 18 : 20;

    return (
      <div className="series-actions" style={{ padding: isMobile ? '10px 12px' : '14px 20px' }}>
        <div className="series-actions__bar">
          {/* Episoden - Primary */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onNavigateEpisodes}
            className="series-actions__item series-actions__item--primary"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          >
            <PlayCircle style={{ fontSize: iconSize }} />
            <span>Episoden</span>
          </motion.button>

          {/* Bewerten */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={onNavigateRating}
            className="series-actions__item"
            style={{
              color: hasRating ? currentTheme.accent : undefined,
              borderColor: hasRating ? `${currentTheme.accent}44` : undefined,
              background: hasRating ? `${currentTheme.accent}11` : undefined,
            }}
          >
            <Star style={{ fontSize: iconSize }} />
            <span>{isMobile ? '' : 'Bewerten'}</span>
          </motion.button>

          {/* Divider */}
          <div className="series-actions__divider" />

          {/* Watchlist */}
          <Tooltip title={series.watchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist'} arrow>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onWatchlistToggle}
              className="series-actions__item series-actions__item--icon"
              style={{
                color: series.watchlist ? currentTheme.primary : undefined,
                borderColor: series.watchlist ? `${currentTheme.primary}44` : undefined,
                background: series.watchlist ? `${currentTheme.primary}11` : undefined,
              }}
            >
              {series.watchlist ? (
                <BookmarkRemove style={{ fontSize: iconSize }} />
              ) : (
                <BookmarkAdd style={{ fontSize: iconSize }} />
              )}
            </motion.button>
          </Tooltip>

          {/* Verstecken */}
          <Tooltip title={series.hidden ? 'Einblenden' : 'Ausblenden'} arrow>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onHideToggle}
              className="series-actions__item series-actions__item--icon"
              style={{
                color: series.hidden ? currentTheme.status?.warning || '#f59e0b' : undefined,
                borderColor: series.hidden ? 'rgba(255,152,0,0.35)' : undefined,
                background: series.hidden ? 'rgba(255,152,0,0.1)' : undefined,
              }}
            >
              {series.hidden ? (
                <Visibility style={{ fontSize: iconSize }} />
              ) : (
                <VisibilityOff style={{ fontSize: iconSize }} />
              )}
            </motion.button>
          </Tooltip>

          {/* Löschen */}
          <Tooltip title="Löschen" arrow>
            <motion.button
              whileTap={{ scale: isDeleting ? 1 : 0.96 }}
              onClick={onDelete}
              disabled={isDeleting}
              className="series-actions__item series-actions__item--icon"
              style={{
                color: currentTheme.status?.error || '#ef4444',
                borderColor: 'rgba(220,53,69,0.2)',
                background: 'rgba(220,53,69,0.06)',
                opacity: isDeleting ? 0.4 : 1,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
              }}
            >
              <Delete style={{ fontSize: iconSize }} />
            </motion.button>
          </Tooltip>
        </div>
      </div>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';
