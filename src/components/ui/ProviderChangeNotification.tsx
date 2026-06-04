import {
  Add,
  ChevronRight,
  Close,
  ExpandLess,
  SnoozeOutlined,
  SwapHoriz,
  Tv,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { showUndoToast } from '../../lib/toast';
import { snoozeNotifications, type SnoozeOption } from '../../lib/settings/notificationSettings';
import {
  markProviderChangesDismissed,
  markProviderChangesShown,
} from '../../lib/validation/providerChangeDetection';
import './CarouselNotification.css';

interface ProviderChangeInfo {
  series: {
    id: number;
    title: string;
    original_name?: string;
    poster?: { poster: string };
  };
  addedProviders: string[];
  removedProviders: string[];
  currentProviders: string[];
}

interface ProviderChangeNotificationProps {
  changes: ProviderChangeInfo[];
  onDismiss: () => void;
  onCollapse?: () => void;
}

export const ProviderChangeNotification: React.FC<ProviderChangeNotificationProps> = ({
  changes,
  onDismiss,
  onCollapse,
}) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const [currentIndex, setCurrentIndex] = useState(0);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const dotsContainerRef = useRef<HTMLDivElement>(null);
  const snoozeMenuRef = useRef<HTMLDivElement>(null);

  const color = currentTheme.accent || currentTheme.primary;
  const safeIndex = changes.length > 0 ? Math.min(currentIndex, changes.length - 1) : 0;

  // Beim Mount: shown-Marker setzen
  const shownRef = useRef(false);
  useEffect(() => {
    if (!user || changes.length === 0 || shownRef.current) return;
    shownRef.current = true;
    markProviderChangesShown(
      changes.map((c) => c.series.id),
      user.uid
    );
  }, [user, changes]);

  useEffect(() => {
    if (!snoozeOpen) return;
    const onClick = (e: MouseEvent) => {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setSnoozeOpen(false);
      }
    };
    setTimeout(() => window.addEventListener('click', onClick), 0);
    return () => window.removeEventListener('click', onClick);
  }, [snoozeOpen]);

  useEffect(() => {
    if (dotsContainerRef.current && changes.length > 1) {
      const activeDot = dotsContainerRef.current.children[safeIndex] as HTMLElement;
      activeDot?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [safeIndex, changes.length]);

  const dismiss = async (selected: ProviderChangeInfo[]) => {
    if (!user) return;
    await markProviderChangesDismissed(
      selected.map((c) => ({
        seriesId: c.series.id,
        currentProviders: c.currentProviders,
      })),
      user.uid
    );
  };

  const handleNavigate = (change: ProviderChangeInfo) => {
    dismiss([change]);
    navigate(`/series/${change.series.id}`);
    onDismiss();
  };

  const handleDismissAll = async () => {
    await dismiss(changes);
    onDismiss();
  };

  const handleSnooze = async (days: SnoozeOption) => {
    if (!user) return;
    setSnoozeOpen(false);
    await snoozeNotifications(
      'provider',
      changes.map((c) => c.series.id),
      user.uid,
      days
    );
    showUndoToast(
      `Erinnerung in ${days === 1 ? '1 Tag' : days === 7 ? '1 Woche' : '1 Monat'}`,
      async () => {
        // Undo: snoozeUntil entfernen, indem wir auf 0 setzen (= sofort wieder)
        await snoozeNotifications(
          'provider',
          changes.map((c) => c.series.id),
          user.uid,
          1 // minimum value, ist OK weil cleanup eh läuft
        );
      }
    );
    onDismiss();
  };

  const handleSwipe = (_: unknown, info: PanInfo) => {
    if (changes.length <= 1) return;
    const threshold = 60;
    if (info.offset.x > threshold && safeIndex > 0) {
      setCurrentIndex(safeIndex - 1);
    } else if (info.offset.x < -threshold && safeIndex < changes.length - 1) {
      setCurrentIndex(safeIndex + 1);
    }
  };

  const getDetailText = (change: ProviderChangeInfo) => {
    const hasAdded = change.addedProviders.length > 0;
    const hasRemoved = change.removedProviders.length > 0;
    if (hasAdded && hasRemoved) {
      return `+${change.addedProviders.join(', ')} · −${change.removedProviders.join(', ')}`;
    } else if (hasAdded) {
      return `Jetzt auf ${change.addedProviders.join(', ')}`;
    } else if (hasRemoved) {
      return `Nicht mehr auf ${change.removedProviders.join(', ')}`;
    }
    return '';
  };

  if (changes.length === 0) return null;
  const current = changes[safeIndex];
  if (!current) return null;

  const hasAdded = current.addedProviders.length > 0;
  const HeaderIcon = hasAdded ? Add : SwapHoriz;
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

        {/* Header */}
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
              animate={{ rotate: [0, -8, 8, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3 }}
              style={{ display: 'flex' }}
            >
              <HeaderIcon />
            </motion.div>
          </div>
          <h3 className="series-notification-title">
            Provider-{changes.length > 1 ? 'Änderungen' : 'Änderung'}
          </h3>
          {changes.length > 1 && (
            <span
              className="series-notification-count-pill"
              style={{
                background: `${color}25`,
                color,
                border: `1px solid ${color}40`,
              }}
            >
              {changes.length}
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
          <Tooltip title={changes.length > 1 ? 'Alle schließen' : 'Schließen'} arrow>
            <button
              className="series-notification-collapse-btn"
              onClick={handleDismissAll}
              aria-label="Schließen"
            >
              <Close />
            </button>
          </Tooltip>
        </div>

        {/* Body */}
        <div className="series-notification-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={safeIndex}
              drag={changes.length > 1 ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.3}
              onDragEnd={handleSwipe}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="series-notification-series">
                <div className="series-notification-poster-wrapper">
                  {current.series.poster?.poster ? (
                    <img
                      src={current.series.poster.poster}
                      alt={current.series.title || current.series.original_name}
                      loading="lazy"
                      decoding="async"
                      className="series-notification-poster"
                    />
                  ) : (
                    <div className="series-notification-poster-placeholder">
                      <Tv style={{ fontSize: 22, opacity: 0.4 }} />
                    </div>
                  )}
                </div>
                <div className="series-notification-details">
                  <h4 className="series-notification-name">
                    {current.series.title || current.series.original_name || 'Serie'}
                  </h4>
                  <p className="series-notification-detail">
                    <SwapHoriz />
                    <span>{getDetailText(current)}</span>
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Action-Bar */}
          <div className="series-notification-actions">
            <button
              className="series-notification-btn series-notification-btn--primary"
              onClick={() => handleNavigate(current)}
              style={{
                background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                color: currentTheme.background.default,
                flex: 1,
              }}
            >
              <span>Ansehen</span>
              <ChevronRight />
            </button>

            <div style={{ position: 'relative' }} ref={snoozeMenuRef}>
              <Tooltip title="Später erinnern" arrow>
                <button
                  className="series-notification-btn series-notification-btn--icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnoozeOpen((p) => !p);
                  }}
                  aria-label="Später erinnern"
                >
                  <SnoozeOutlined />
                </button>
              </Tooltip>
              <AnimatePresence>
                {snoozeOpen && (
                  <motion.div
                    className="snooze-menu"
                    initial={{ opacity: 0, y: 6, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="snooze-menu-header">Erinnere mich in</div>
                    <button className="snooze-menu-item" onClick={() => handleSnooze(1)}>
                      <span>
                        <span className="snooze-menu-item-emoji">☕</span>1 Tag
                      </span>
                    </button>
                    <button className="snooze-menu-item" onClick={() => handleSnooze(7)}>
                      <span>
                        <span className="snooze-menu-item-emoji">📅</span>1 Woche
                      </span>
                    </button>
                    <button className="snooze-menu-item" onClick={() => handleSnooze(30)}>
                      <span>
                        <span className="snooze-menu-item-emoji">🌙</span>1 Monat
                      </span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {changes.length > 1 && (
            <>
              <div className="series-notification-nav">
                <button
                  className="series-notification-nav-btn"
                  onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
                  disabled={safeIndex === 0}
                  aria-label="Vorherige"
                >
                  ‹
                </button>
                <div
                  className="series-notification-dots"
                  ref={dotsContainerRef}
                  role="tablist"
                  aria-label="Provider-Änderung auswählen"
                >
                  {changes.map((c, index) => (
                    <button
                      key={c.series.id}
                      role="tab"
                      aria-selected={index === safeIndex}
                      aria-label={`${c.series.title || 'Serie'} (${index + 1}/${changes.length})`}
                      className={`series-notification-dot ${index === safeIndex ? 'active' : ''}`}
                      onClick={() => setCurrentIndex(index)}
                    >
                      <style>
                        {`.series-notification-dot.active::after { background: ${color}; }`}
                      </style>
                    </button>
                  ))}
                </div>
                <button
                  className="series-notification-nav-btn"
                  onClick={() => setCurrentIndex(Math.min(changes.length - 1, safeIndex + 1))}
                  disabled={safeIndex === changes.length - 1}
                  aria-label="Nächste"
                >
                  ›
                </button>
              </div>
              <p className="series-notification-counter">
                {safeIndex + 1} von {changes.length} Provider-Änderungen
              </p>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};
