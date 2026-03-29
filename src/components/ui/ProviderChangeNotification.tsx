import { ChevronRight, SwapHoriz, Add } from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { CarouselShell } from './CarouselShell';

interface ProviderChangeInfo {
  series: {
    id: number;
    title: string;
    original_name?: string;
    poster?: { poster: string };
  };
  addedProviders: string[];
  removedProviders: string[];
}

interface ProviderChangeNotificationProps {
  changes: ProviderChangeInfo[];
  onDismiss: () => void;
}

export const ProviderChangeNotification: React.FC<ProviderChangeNotificationProps> = ({
  changes,
  onDismiss,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};

  const color = currentTheme.accent || currentTheme.primary;

  const markAsDismissed = async (seriesIds: number[]) => {
    if (!user) return;
    const updates: Record<string, { dismissed: boolean; timestamp: number }> = {};
    seriesIds.forEach((id) => {
      updates[`users/${user.uid}/providerChangeNotifications/${id}`] = {
        dismissed: true,
        timestamp: Date.now(),
      };
    });
    await firebase.database().ref().update(updates);
  };

  const handleNavigate = (change: ProviderChangeInfo) => {
    markAsDismissed([change.series.id]);
    navigate(`/series/${change.series.id}`);
    onDismiss();
  };

  const getDetailText = (change: ProviderChangeInfo) => {
    const hasAdded = change.addedProviders.length > 0;
    const hasRemoved = change.removedProviders.length > 0;
    if (hasAdded && hasRemoved) {
      return `Jetzt auf ${change.addedProviders.join(', ')} · Nicht mehr auf ${change.removedProviders.join(', ')}`;
    } else if (hasAdded) {
      return `Jetzt auch auf ${change.addedProviders.join(', ')} verfügbar`;
    } else if (hasRemoved) {
      return `Nicht mehr auf ${change.removedProviders.join(', ')} verfügbar`;
    }
    return '';
  };

  if (changes.length === 0) return null;

  return (
    <CarouselShell
      itemCount={changes.length}
      color={color}
      onDismissAll={async () => {
        await markAsDismissed(changes.map((c) => c.series.id));
        onDismiss();
      }}
      counterSuffix="Provider-Änderungen"
      headerContent={
        <div className="notification-header">
          {changes[0]?.addedProviders.length > 0 ? (
            <Add className="new-icon" style={{ color }} />
          ) : (
            <SwapHoriz className="new-icon" style={{ color }} />
          )}
          <h3>
            Provider-{changes.length > 1 ? 'Änderungen' : 'Änderung'}
            {changes.length > 1 ? ` (${changes.length})` : ''}
          </h3>
        </div>
      }
    >
      {(currentIndex) => {
        const current = changes[currentIndex];
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              className="series-info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              {current.series.poster?.poster && (
                <img
                  src={current.series.poster.poster}
                  alt={current.series.title || current.series.original_name}
                  loading="lazy"
                  decoding="async"
                  className="series-poster"
                />
              )}

              <div className="series-details">
                <h4>{current.series.title || current.series.original_name || 'Serie'}</h4>
                <p className="season-info">
                  <SwapHoriz fontSize="small" />
                  <span>{getDetailText(current)}</span>
                </p>
              </div>

              <div className="action-buttons">
                <Tooltip title="Serie ansehen" arrow>
                  <button
                    className="view-button"
                    onClick={() => handleNavigate(current)}
                    style={{
                      backgroundColor: currentTheme.primary,
                      color: currentTheme.background.default,
                    }}
                  >
                    Ansehen
                    <ChevronRight />
                  </button>
                </Tooltip>
              </div>
            </motion.div>
          </AnimatePresence>
        );
      }}
    </CarouselShell>
  );
};
