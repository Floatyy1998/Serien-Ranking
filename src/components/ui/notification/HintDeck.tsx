/**
 * Gemeinsame Bausteine aller Startseiten-Hinweise: Deck (Kopfzeile mit
 * Gruppen-Aktionen + wischbare Reihe) und Karte (Backdrop, Poster, Text,
 * Aktionen, eigenes X). Die Hinweis-Typen liefern nur Inhalt und Logik.
 */
import {
  CalendarMonth,
  ChevronLeft,
  ChevronRight,
  Close,
  DateRange,
  ExpandLess,
  SnoozeOutlined,
  Today,
  Tv,
} from '@mui/icons-material';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import type { SnoozeOption } from '../../../lib/settings/notificationSettings';
import { t } from '../../../services/i18n';
import './HintDeck.css';

type IconType = typeof Tv;

interface HintDeckProps {
  color: string;
  Icon: IconType;
  /** Uhr-Wackeln für „lange nicht gesehen", sonst sanftes Pulsieren. */
  iconMotion?: 'wobble' | 'pulse';
  title: string;
  count: number;
  onSnooze?: (days: SnoozeOption) => void;
  onDismissAll?: () => void;
  onCollapse?: () => void;
  children: ReactNode;
}

export const HintDeck: React.FC<HintDeckProps> = ({
  color,
  Icon,
  iconMotion = 'pulse',
  title,
  count,
  onSnooze,
  onDismissAll,
  onCollapse,
  children,
}) => {
  const { currentTheme } = useTheme();
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [scrollState, setScrollState] = useState({ prev: false, next: false });
  const railRef = useRef<HTMLDivElement>(null);
  const snoozeMenuRef = useRef<HTMLDivElement>(null);
  const multiple = count > 1;

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

  const updateScrollState = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const prev = rail.scrollLeft > 4;
    const next = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4;
    setScrollState((s) => (s.prev === prev && s.next === next ? s : { prev, next }));
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    updateScrollState();
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [updateScrollState, count]);

  const scrollByCard = (dir: 1 | -1) => {
    const rail = railRef.current;
    const card = rail?.querySelector<HTMLElement>('.hint-card');
    if (!rail || !card) return;
    rail.scrollBy({ left: dir * (card.offsetWidth + 12), behavior: 'smooth' });
  };

  const snooze = (days: SnoozeOption) => {
    setSnoozeOpen(false);
    onSnooze?.(days);
  };

  return (
    <motion.section
      className={`hint-deck${multiple ? ' hint-deck--multi' : ''}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={
        {
          '--hint-color': color,
          '--hint-on-color': currentTheme.background.default,
          '--hint-bg': currentTheme.background.default,
          color: currentTheme.text.primary,
        } as React.CSSProperties
      }
    >
      <header className="hint-deck-head">
        <span className="hint-deck-icon">
          <motion.span
            animate={
              iconMotion === 'wobble' ? { rotate: [0, -8, 8, -4, 4, 0] } : { scale: [1, 1.08, 1] }
            }
            transition={
              iconMotion === 'wobble'
                ? { duration: 1.8, repeat: Infinity, repeatDelay: 3 }
                : { duration: 2, repeat: Infinity }
            }
            style={{ display: 'flex' }}
          >
            <Icon />
          </motion.span>
        </span>
        <h3 className="hint-deck-title">{title}</h3>

        <div className="hint-deck-tools">
          {multiple && (
            <div className="hint-deck-arrows">
              <button
                type="button"
                className="hint-icon-btn"
                onClick={() => scrollByCard(-1)}
                disabled={!scrollState.prev}
                aria-label={t('Vorherige')}
              >
                <ChevronLeft />
              </button>
              <button
                type="button"
                className="hint-icon-btn"
                onClick={() => scrollByCard(1)}
                disabled={!scrollState.next}
                aria-label={t('Nächste')}
              >
                <ChevronRight />
              </button>
            </div>
          )}
          {onSnooze && (
            <div className="hint-snooze" ref={snoozeMenuRef}>
              <Tooltip title={t('Später erinnern')} arrow>
                <button
                  type="button"
                  className="hint-icon-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnoozeOpen((p) => !p);
                  }}
                  aria-label={t('Später erinnern')}
                  aria-expanded={snoozeOpen}
                >
                  <SnoozeOutlined />
                </button>
              </Tooltip>
              <AnimatePresence>
                {snoozeOpen && (
                  <motion.div
                    className="hint-snooze-menu"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <div className="hint-snooze-head">{t('Erinnere mich in')}</div>
                    <button type="button" onClick={() => snooze(1)}>
                      <Today />
                      {t('1 Tag')}
                    </button>
                    <button type="button" onClick={() => snooze(7)}>
                      <DateRange />
                      {t('1 Woche')}
                    </button>
                    <button type="button" onClick={() => snooze(30)}>
                      <CalendarMonth />
                      {t('1 Monat')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          {onCollapse && (
            <Tooltip title={t('Minimieren')} arrow>
              <button
                type="button"
                className="hint-icon-btn"
                onClick={onCollapse}
                aria-label={t('Minimieren')}
              >
                <ExpandLess />
              </button>
            </Tooltip>
          )}
          {multiple && onDismissAll && (
            <Tooltip title={t('Alle schließen')} arrow>
              <button
                type="button"
                className="hint-icon-btn"
                onClick={onDismissAll}
                aria-label={t('Alle schließen')}
              >
                <Close />
              </button>
            </Tooltip>
          )}
        </div>
      </header>

      <div className="hint-rail" ref={railRef} onScroll={updateScrollState}>
        <AnimatePresence mode="popLayout" initial={false}>
          {children}
        </AnimatePresence>
      </div>
    </motion.section>
  );
};

interface HintCardProps {
  title: string;
  poster?: string;
  backdrop?: string;
  DetailIcon?: IconType;
  detail: ReactNode;
  /** Zusatzzeile unter dem Detail (Fortschritt, Sterne …). */
  extra?: ReactNode;
  posterOverlay?: ReactNode;
  actions?: ReactNode;
  /** Aufklappbarer Bereich unter den Aktionen (z. B. Recap-Text). */
  footer?: ReactNode;
  onOpen?: () => void;
  onDismiss?: () => void;
}

export const HintCard: React.FC<HintCardProps> = ({
  title,
  poster,
  backdrop,
  DetailIcon,
  detail,
  extra,
  posterOverlay,
  actions,
  footer,
  onOpen,
  onDismiss,
}) => {
  const bg = backdrop || poster;
  return (
    <motion.article
      layout
      className="hint-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 30, stiffness: 320 }}
      aria-label={title}
    >
      {bg && (
        <div
          className={`hint-card-bg${backdrop ? '' : ' hint-card-bg--poster'}`}
          style={{ backgroundImage: `url(${bg})` }}
          aria-hidden
        />
      )}
      <div className="hint-card-scrim" aria-hidden />

      <div className="hint-card-body">
        <div className="hint-card-content">
          <button type="button" className="hint-card-poster" onClick={onOpen} tabIndex={-1}>
            {poster ? (
              <img src={poster} alt="" loading="lazy" decoding="async" />
            ) : (
              <Tv style={{ fontSize: 26, opacity: 0.4 }} />
            )}
            {posterOverlay}
          </button>

          <div className="hint-card-main">
            <h4 className="hint-card-title" onClick={onOpen}>
              {title}
            </h4>
            <div className="hint-card-detail">
              {DetailIcon && <DetailIcon />}
              <span>{detail}</span>
            </div>
            {extra}
          </div>
        </div>

        {actions && <div className="hint-card-actions">{actions}</div>}
      </div>

      {footer}

      {onDismiss && (
        <button
          type="button"
          className="hint-card-close"
          onClick={onDismiss}
          aria-label={t('Schließen')}
        >
          <Close />
        </button>
      )}
    </motion.article>
  );
};

/** Fortschrittsbalken in Hinweis-Farbe mit Beschriftung rechts. */
export const HintProgress: React.FC<{ percent: number; label: string }> = ({ percent, label }) => (
  <div className="hint-card-progress">
    <div className="hint-card-progress-track">
      <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
    <span className="hint-card-progress-label">{label}</span>
  </div>
);
