import { Close, NewReleases, Settings as SettingsIcon } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { UnsubscribedNewSeasonEntry } from '../../hooks/useUnsubscribedNewSeasons';
import './CarouselNotification.css';

interface Props {
  entries: UnsubscribedNewSeasonEntry[];
  onDismiss: () => void;
}

export const UnsubscribedNewSeasonNotification: React.FC<Props> = ({ entries, onDismiss }) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const color = currentTheme.status.warning;

  if (entries.length === 0) return null;
  const first = entries[0];
  const series = first.series;

  const message =
    entries.length === 1
      ? `Neue Staffel auf ${first.providers.join(', ')} – du hast den Anbieter gerade nicht.`
      : `${entries.length} neue Staffeln laufen auf Anbietern, die du nicht abonniert hast.`;

  return (
    <AnimatePresence>
      <motion.div
        className="new-season-notification"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280 }}
        style={{
          background: `linear-gradient(135deg, ${color}25, ${currentTheme.background.default})`,
          borderColor: `${color}50`,
          color: currentTheme.text.primary,
        }}
      >
        <Tooltip title="Schließen" arrow>
          <button
            className="close-button"
            onClick={onDismiss}
            style={{ color: currentTheme.text.primary + '80' }}
          >
            <Close />
          </button>
        </Tooltip>

        <div className="notification-content">
          <div className="notification-header">
            <motion.div
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ repeat: Infinity, duration: 2.4 }}
              style={{ display: 'flex' }}
            >
              <NewReleases className="new-icon" style={{ color }} />
            </motion.div>
            <h3>Anbieter fehlt für neue Staffel</h3>
          </div>

          <div className="series-info">
            {series.poster?.poster && (
              <img
                src={series.poster.poster}
                alt={series.title || series.original_name || 'Serie'}
                className="series-poster"
                loading="lazy"
                decoding="async"
              />
            )}
            <div className="series-details">
              <h4>{series.title || series.original_name || 'Serie'}</h4>
              <p className="season-info">
                <span>{message}</span>
              </p>
            </div>
            <div className="action-buttons">
              <Tooltip title="Abos verwalten" arrow>
                <button
                  className="watchlist-button"
                  onClick={() => navigate('/subscriptions')}
                  style={{
                    backgroundColor: currentTheme.background.paper,
                    color,
                    border: `1px solid ${color}40`,
                  }}
                >
                  <SettingsIcon />
                  <span>Abos</span>
                </button>
              </Tooltip>
              <Tooltip title="Zur Serie" arrow>
                <button
                  className="view-button"
                  onClick={() => navigate(`/series/${series.id}`)}
                  style={{
                    backgroundColor: currentTheme.primary,
                    color: currentTheme.background.default,
                  }}
                >
                  Ansehen
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
