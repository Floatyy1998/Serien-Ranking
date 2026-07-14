import { Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, HeaderActions } from '../../../components/ui';
import { useDeviceType } from '../../../hooks/useDeviceType';
import { useTheme } from '../../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { getGreeting } from '../../../lib/text/greetings';
import { tmdbFetch } from '../../../services/tmdbClient';
import { LiveClock } from '../LiveClock';
import { tapScaleSmall } from '../../../lib/motion';
import { HomeSearchOverlay } from './HomeSearchOverlay';

interface GreetingSectionProps {
  displayName: string | undefined;
  photoURL: string | undefined;
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  watchedEpisodes: number;
  totalMovies: number;
  progress: number;
  todayEpisodes: number;
}

export const GreetingSection = React.memo(function GreetingSection({
  displayName,
  photoURL,
  totalUnreadBadge,
  onNotificationsOpen,
  watchedEpisodes,
  totalMovies,
  progress,
  todayEpisodes,
}: GreetingSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [greetingInfo, setGreetingInfo] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const greeting = useMemo(() => getGreeting(currentHour), [currentHour]);

  // Daten-Pods im Deck: einheitliches Glas statt vierfarbiger Chips.
  const statPods = useMemo(
    () => [
      { key: 'eps', value: watchedEpisodes, label: 'Episoden', to: '/stats', highlight: false },
      {
        key: 'movies',
        value: totalMovies,
        label: 'Filme',
        to: '/ratings?tab=movies',
        highlight: false,
      },
      { key: 'active', value: `${progress}%`, label: 'Aktiv', to: '/stats', highlight: false },
      ...(todayEpisodes > 0
        ? [{ key: 'today', value: todayEpisodes, label: 'Heute', to: '/calendar', highlight: true }]
        : []),
    ],
    [watchedEpisodes, totalMovies, progress, todayEpisodes]
  );

  // Update greeting only when hour changes — paused while tab is hidden
  // (a midnight transition will be picked up by the visibility-change check).
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const check = () => {
      const hour = new Date().getHours();
      setCurrentHour((prev) => (prev !== hour ? hour : prev));
    };
    const start = () => {
      if (timer) return;
      timer = setInterval(check, 60000);
    };
    const stop = () => {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        check();
        start();
      } else {
        stop();
      }
    };
    if (document.visibilityState === 'visible') start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      stop();
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.greeting-text') && !target.closest('.greeting-tooltip')) {
        setGreetingInfo(null);
      }
    };

    if (greetingInfo) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [greetingInfo]);

  return (
    <>
      {/* Tooltip - shows language info and is clickable */}
      {greetingInfo && (
        <div
          className="greeting-tooltip"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
          }}
          onClick={async (e) => {
            e.stopPropagation();
            if (greeting.title && greeting.type) {
              try {
                const data = await tmdbFetch<{ results?: Array<{ id: number }> }>(
                  `search/${greeting.type}`,
                  { query: greeting.title }
                );

                if (data.results && data.results.length > 0) {
                  const result = data.results[0];
                  const routeType = greeting.type === 'tv' ? 'series' : 'movie';
                  navigate(`/${routeType}/${result.id}`);
                  setGreetingInfo(null);
                }
              } catch (error) {
                console.error('Error searching TMDB:', error);
              }
            }
          }}
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: currentTheme.primary,
            borderRadius: '6px',
            padding: '8px 16px',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            zIndex: 99999,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            color: getOptimalTextColor(currentTheme.primary),
            pointerEvents: 'auto',
            cursor: greeting.title ? 'pointer' : 'default',
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ color: getOptimalTextColor(currentTheme.primary) }}>
            {greetingInfo}
            {greeting.title && ' \u2192'}
          </span>
        </div>
      )}

      {/* Kommando-Deck: EIN zusammenhängendes Glas-Panel statt gestapelter
          Einzelteile — Begrüßung/Uhr/Actions oben, Suche + Daten-Pods darunter. */}
      <header
        style={{
          padding: `calc(${isMobile ? '10px' : '16px'} + env(safe-area-inset-top)) ${isMobile ? '14px' : '20px'} 0`,
          marginBottom: isMobile ? '16px' : '24px',
        }}
      >
        <div
          className="liquid-glass"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: isMobile ? '20px' : '24px',
            padding: isMobile ? '12px 14px 14px' : '20px 24px',
          }}
        >
          {/* Ambient-Glow im Deck */}
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: '-160px',
              left: '-100px',
              width: '480px',
              height: '340px',
              background: `radial-gradient(ellipse, ${currentTheme.primary}30, transparent 70%)`,
              filter: 'blur(40px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div style={{ minWidth: 0, flex: 1 }}>
              <GradientText
                as="h1"
                from={currentTheme.primary}
                to={currentTheme.accent}
                style={{
                  fontSize: isMobile ? '19px' : 'clamp(21px, 0.7vw + 17px, 26px)',
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                  margin: '0 0 2px 0',
                  // Desktop einzeilig (Gruß schrumpft per Ellipsis, Name bleibt
                  // sichtbar); Mobile darf umbrechen — abgeschnittene Grüße
                  // sind dort nicht lesbar.
                  display: isMobile ? 'block' : 'flex',
                  alignItems: 'baseline',
                  whiteSpace: isMobile ? 'normal' : 'nowrap',
                  overflow: 'hidden',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  className="greeting-text"
                  role="button"
                  tabIndex={0}
                  aria-label="Sprache des Grußes anzeigen"
                  onClick={(e) => {
                    e.stopPropagation();
                    setGreetingInfo(greetingInfo ? null : greeting.lang);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      setGreetingInfo(greetingInfo ? null : greeting.lang);
                    }
                  }}
                  style={{
                    cursor: 'pointer',
                    textDecoration: greeting.title ? 'underline dotted' : 'none',
                    textDecorationColor: currentTheme.primary,
                    textUnderlineOffset: '3px',
                    overflow: isMobile ? 'visible' : 'hidden',
                    textOverflow: isMobile ? 'clip' : 'ellipsis',
                    flexShrink: 1,
                    minWidth: 0,
                    // Tap-Highlight/Selektion übermalen den geclippten Gradient
                    // (text-fill transparent) — Text wäre beim Tippen unsichtbar
                    WebkitTapHighlightColor: 'transparent',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                  }}
                >
                  {greeting.text}
                </span>
                <span style={{ flexShrink: 0 }}>, {displayName?.split(' ')[0] || 'User'}!</span>
              </GradientText>
              <p
                style={{
                  color: currentTheme.text.secondary,
                  fontSize: isMobile ? '12.5px' : '15px',
                  margin: 0,
                }}
              >
                <LiveClock />
              </p>
            </div>

            <HeaderActions
              totalUnreadBadge={totalUnreadBadge}
              onNotificationsOpen={onNotificationsOpen}
              photoURL={photoURL}
            />
          </div>

          {/* Suche + Daten-Pods — eine Zeile auf Desktop, gestapelt auf Mobile. */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              gap: isMobile ? '8px' : '10px',
              marginTop: isMobile ? '10px' : '16px',
              alignItems: 'stretch',
            }}
          >
            <motion.button
              type="button"
              whileTap={tapScaleSmall}
              onClick={() => setSearchOpen(true)}
              aria-label="Suche öffnen"
              style={{
                flex: isMobile ? '1 1 100%' : '1 1 auto',
                minWidth: 0,
                font: 'inherit',
                textAlign: 'left',
                background: `linear-gradient(135deg, ${currentTheme.primary}14, transparent 45%), var(--glass-light)`,
                border: `1px solid ${currentTheme.primary}33`,
                borderRadius: '16px',
                padding: isMobile ? '11px 14px' : '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
                boxShadow: 'var(--glass-specular)',
              }}
            >
              <Search style={{ fontSize: '20px', color: currentTheme.primary }} />
              <span style={{ color: currentTheme.text.muted, fontSize: '15px' }}>
                Suche nach Serien oder Filmen
              </span>
            </motion.button>

            {statPods.map((pod) => (
              <motion.button
                key={pod.key}
                type="button"
                whileTap={tapScaleSmall}
                onClick={() => navigate(pod.to)}
                aria-label={`${pod.value} ${pod.label}`}
                style={{
                  flex: isMobile ? '1 1 0' : '0 0 auto',
                  minWidth: isMobile ? 0 : '86px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '2px',
                  padding: isMobile ? '7px 8px' : '9px 14px',
                  borderRadius: '14px',
                  background: 'var(--glass-light)',
                  border: pod.highlight
                    ? `1px solid ${currentTheme.primary}59`
                    : '1px solid var(--glass-border-light)',
                  boxShadow: pod.highlight
                    ? `var(--glass-specular), 0 0 18px -6px ${currentTheme.primary}66`
                    : 'var(--glass-specular)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? '15px' : '17px',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    fontFamily: 'var(--font-display)',
                    color: pod.highlight ? currentTheme.primary : currentTheme.text.primary,
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pod.value}
                </span>
                <span
                  style={{
                    fontSize: isMobile ? '9px' : '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: currentTheme.text.muted,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pod.label}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      <HomeSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
});
