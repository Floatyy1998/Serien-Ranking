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
import { memo, useMemo } from 'react';
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

interface ButtonConfig {
  key: string;
  icon: React.ReactNode;
  label?: string;
  tooltip?: string;
  onClick: () => void;
  background: string;
  border: string;
  flex?: number;
  disabled?: boolean;
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
    const iconSize = isMobile ? '18px' : '24px';
    const hasRating = parseFloat(overallRating) > 0;

    const buttons: ButtonConfig[] = useMemo(
      () => [
        {
          key: 'episodes',
          icon: <PlayCircle style={{ fontSize: iconSize }} />,
          label: 'Episoden',
          onClick: onNavigateEpisodes,
          background:
            'linear-gradient(135deg, rgba(0, 212, 170, 0.8) 0%, rgba(0, 180, 216, 0.8) 100%)',
          border: '1px solid rgba(0, 212, 170, 0.5)',
          flex: 1,
        },
        {
          key: 'rate',
          icon: (
            <Star
              style={{
                fontSize: isMobile ? '16px' : '18px',
                color: hasRating ? '#ffd700' : 'white',
              }}
            />
          ),
          label: 'Bewerten',
          onClick: onNavigateRating,
          background: hasRating
            ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.15) 100%)'
            : 'rgba(255, 255, 255, 0.05)',
          border: hasRating
            ? '1px solid rgba(255, 215, 0, 0.3)'
            : '1px solid rgba(255, 255, 255, 0.1)',
          flex: 1,
        },
        {
          key: 'watchlist',
          icon: series.watchlist ? (
            <BookmarkRemove style={{ fontSize: iconSize }} />
          ) : (
            <BookmarkAdd style={{ fontSize: iconSize }} />
          ),
          tooltip: series.watchlist ? 'Von Watchlist entfernen' : 'Zur Watchlist',
          onClick: onWatchlistToggle,
          background: series.watchlist
            ? 'linear-gradient(135deg, rgba(0, 212, 170, 0.2) 0%, rgba(0, 180, 216, 0.2) 100%)'
            : 'rgba(255, 255, 255, 0.05)',
          border: series.watchlist
            ? '1px solid rgba(0, 212, 170, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        },
        {
          key: 'hide',
          icon: series.hidden ? (
            <Visibility style={{ fontSize: iconSize }} />
          ) : (
            <VisibilityOff style={{ fontSize: iconSize }} />
          ),
          tooltip: series.hidden ? 'Serie einblenden' : 'Serie ausblenden',
          onClick: onHideToggle,
          background: series.hidden
            ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.2) 0%, rgba(255, 183, 77, 0.2) 100%)'
            : 'rgba(255, 255, 255, 0.05)',
          border: series.hidden
            ? '1px solid rgba(255, 152, 0, 0.4)'
            : '1px solid rgba(255, 255, 255, 0.1)',
        },
      ],
      [
        series.watchlist,
        series.hidden,
        hasRating,
        isMobile,
        iconSize,
        onNavigateEpisodes,
        onNavigateRating,
        onWatchlistToggle,
        onHideToggle,
      ]
    );

    const renderButton = (btn: ButtonConfig) => {
      const buttonEl = (
        <motion.button
          key={btn.key}
          whileTap={{ scale: 0.95 }}
          onClick={btn.onClick}
          disabled={btn.disabled}
          className="action-btn"
          style={{
            flex: btn.flex || 'none',
            padding: isMobile ? '10px' : '12px',
            background: btn.background,
            border: btn.border,
            borderRadius: isMobile ? '10px' : '12px',
            fontSize: isMobile ? '13px' : '16px',
          }}
        >
          {btn.icon}
          {btn.label && <span>{btn.label}</span>}
        </motion.button>
      );

      if (btn.tooltip) {
        return (
          <Tooltip key={btn.key} title={btn.tooltip} arrow>
            {buttonEl}
          </Tooltip>
        );
      }
      return buttonEl;
    };

    return (
      <>
        <div
          className="action-buttons"
          style={{
            gap: isMobile ? '8px' : '12px',
            padding: isMobile ? '10px 12px' : '20px',
          }}
        >
          {buttons.map(renderButton)}
        </div>

        {/* Delete Button at bottom */}
        <div style={{ padding: '20px' }}>
          <motion.button
            onClick={onDelete}
            disabled={isDeleting}
            whileHover={{ scale: isDeleting ? 1 : 1.02 }}
            whileTap={{ scale: isDeleting ? 1 : 0.98 }}
            className="action-btn action-btn--delete"
            style={{
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              opacity: isDeleting ? 0.6 : 1,
            }}
          >
            <Delete />
            {isDeleting ? 'Wird geloscht...' : 'Serie loschen'}
          </motion.button>
        </div>
      </>
    );
  }
);

ActionButtons.displayName = 'ActionButtons';
