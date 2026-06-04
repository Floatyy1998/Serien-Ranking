import {
  ChevronRight,
  Close,
  ExpandLess,
  NewReleases,
  Settings as SettingsIcon,
  Tv,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { UnsubscribedNewSeasonEntry } from '../../hooks/useUnsubscribedNewSeasons';
import './CarouselNotification.css';

interface Props {
  entries: UnsubscribedNewSeasonEntry[];
  onDismiss: () => void;
  onCollapse?: () => void;
}

export const UnsubscribedNewSeasonNotification: React.FC<Props> = ({
  entries,
  onDismiss,
  onCollapse,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const color = currentTheme.status.warning;

  if (entries.length === 0) return null;
  const first = entries[0];
  const series = first.series;

  const message =
    entries.length === 1
      ? `Neue Staffel auf ${first.providers.join(', ')}`
      : `${entries.length} neue Staffeln auf nicht abonnierten Anbietern`;

  const cardBackground = `linear-gradient(135deg, ${color}1a 0%, rgba(15, 17, 21, 0.92) 60%)`;
  const glowGradient = `linear-gradient(135deg, ${color}80, ${color}10)`;

  return (
    <motion.div
      className="series-notification"
      initial={{ opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: 'spring', damping: 22, stiffness: 280 }}
      style={
        {
          background: cardBackground,
          color: currentTheme.text.primary,
          '--notif-glow': glowGradient,
        } as React.CSSProperties
      }
    >
      <div className="series-notification-inner">
        <div
          className="series-notification-aura"
          style={{ background: `radial-gradient(ellipse, ${color}30, transparent 70%)` }}
        />

        <div className="series-notification-header">
          <div
            className="series-notification-header-icon"
            style={{
              background: `linear-gradient(135deg, ${color}30, ${color}10)`,
              color,
              boxShadow: `0 4px 14px -2px ${color}40, inset 0 0 0 1px ${color}25`,
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              style={{ display: 'flex' }}
            >
              <NewReleases />
            </motion.div>
          </div>
          <h3 className="series-notification-title">Anbieter fehlt</h3>
          {entries.length > 1 && (
            <span
              className="series-notification-count-pill"
              style={{
                background: `${color}25`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {entries.length}
            </span>
          )}
          {onCollapse && (
            <Tooltip title="Minimieren" arrow>
              <button
                className="series-notification-collapse-btn"
                onClick={onCollapse}
                aria-label="Minimieren"
              >
                <ExpandLess />
              </button>
            </Tooltip>
          )}
          <Tooltip title="Schließen" arrow>
            <button
              className="series-notification-collapse-btn"
              onClick={onDismiss}
              aria-label="Schließen"
            >
              <Close />
            </button>
          </Tooltip>
        </div>

        <div className="series-notification-body">
          <div className="series-notification-series">
            <div className="series-notification-poster-wrapper">
              {series.poster?.poster ? (
                <img
                  src={series.poster.poster}
                  alt={series.title || series.original_name || 'Serie'}
                  className="series-notification-poster"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div className="series-notification-poster-placeholder">
                  <Tv style={{ fontSize: 22, opacity: 0.4 }} />
                </div>
              )}
            </div>
            <div className="series-notification-details">
              <h4 className="series-notification-name">
                {series.title || series.original_name || 'Serie'}
              </h4>
              <p className="series-notification-detail">
                <NewReleases />
                <span>{message}</span>
              </p>
            </div>
          </div>

          <div className="series-notification-actions">
            <button
              className="series-notification-btn series-notification-btn--secondary"
              onClick={() => navigate('/subscriptions')}
            >
              <SettingsIcon />
              <span>Abos</span>
            </button>
            <button
              className="series-notification-btn series-notification-btn--primary"
              onClick={() => navigate(`/series/${series.id}`)}
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: currentTheme.background.default,
              }}
            >
              <span>Ansehen</span>
              <ChevronRight />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
