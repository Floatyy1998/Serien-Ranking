import { Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GradientText, HeaderActions } from '../../../components/ui';
import { useDeviceType } from '../../../hooks/platform/useDeviceType';
import { useTheme } from '../../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { getGreeting } from '../../../lib/text/greetings';
import { greetingWithName } from '../../../lib/text/greetingName';
import { pickGreetingMatch, type GreetingSearchHit } from '../../../lib/text/greetingMatch';
import { t } from '../../../services/i18n';
import {
  OPEN_HOME_SEARCH_EVENT,
  consumeHomeSearchRequest,
  rearmHomeSearch,
} from '../../../services/app/nativeShell';
import { captureError } from '../../../services/errorReporting/errorReporter';
import { tmdbFetch } from '../../../services/api/tmdbClient';
import { LiveClock } from '../cards/LiveClock';
import { tapScaleSmall } from '../../../lib/motion';
import { HomeSearchOverlay } from './HomeSearchOverlay';

export interface GreetingPod {
  key: string;
  value: number | string;
  label: string;
  to: string;
  highlight: boolean;
}

interface GreetingSectionProps {
  displayName: string | undefined;
  photoURL: string | undefined;
  totalUnreadBadge: number;
  onNotificationsOpen: () => void;
  watchedEpisodes?: number;
  totalMovies?: number;
  progress?: number;
  todayEpisodes?: number;
  /** Ersetzt die Serien-/Film-Pods (Lese-Startseite). */
  pods?: GreetingPod[];
  showStatPods?: boolean;
  searchHint?: string;
  /** Steht im Kopf über dem Deck — wie der Lesen-Umschalter auf Manga/Bücher. */
  above?: React.ReactNode;
  /** Ersetzt den Serien-Gruß (Lese-Startseite). */
  title?: React.ReactNode;
  /** Eigene Suche statt des Serien-Overlays (Lese-Startseite). */
  onSearch?: () => void;
}

export const GreetingSection = React.memo(function GreetingSection({
  displayName,
  photoURL,
  totalUnreadBadge,
  onNotificationsOpen,
  watchedEpisodes = 0,
  totalMovies = 0,
  progress = 0,
  todayEpisodes = 0,
  pods,
  showStatPods = true,
  searchHint,
  above,
  title,
  onSearch,
}: GreetingSectionProps) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const [currentHour, setCurrentHour] = useState(() => new Date().getHours());
  const [greetingInfo, setGreetingInfo] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const shellOpenedAt = useRef(0);
  const closeSearch = useCallback((reason?: string) => {
    setSearchOpen(false);
    const sinceOpen = Date.now() - shellOpenedAt.current;
    if (sinceOpen > 1500) return;
    // Vom Schnellzugriff geoeffnet und sofort wieder zu (Start-Redirect dazwischen): einmal neu oeffnen.
    shellOpenedAt.current = 0;
    captureError({
      kind: 'error',
      name: 'HomeSearchAutoClosed',
      message: `${reason ?? 'ohne Grund'} nach ${sinceOpen} ms, pathname=${window.location.pathname}, sichtbar=${document.visibilityState}`,
    });
    setTimeout(() => {
      if (window.location.pathname === '/') setSearchOpen(true);
    }, 400);
  }, []);

  // Icon-Schnellzugriff "Suche" der App-Huelle: beim Kaltstart liegt die Anforderung als Flag vor.
  // Erst nach Splash und Start-Redirects oeffnen, sonst schliesst der Routenwechsel das Overlay wieder.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const open = () => {
      shellOpenedAt.current = Date.now();
      if (onSearch) onSearch();
      else setSearchOpen(true);
    };
    const settle = (since: number) => {
      clearTimeout(timer);
      const splashPending = window.splashScreenComplete === false && Date.now() - since < 6000;
      timer = setTimeout(() => (splashPending ? settle(since) : open()), splashPending ? 150 : 250);
    };
    const openFromShell = () => {
      consumeHomeSearchRequest();
      settle(Date.now());
    };
    const rearm = () => {
      if (Date.now() - shellOpenedAt.current < 5000) rearmHomeSearch();
    };
    if (consumeHomeSearchRequest()) settle(Date.now());
    window.addEventListener(OPEN_HOME_SEARCH_EVENT, openFromShell);
    window.addEventListener('pagehide', rearm);
    return () => {
      clearTimeout(timer);
      window.removeEventListener(OPEN_HOME_SEARCH_EVENT, openFromShell);
      window.removeEventListener('pagehide', rearm);
      rearm();
    };
  }, [onSearch]);

  const greeting = useMemo(() => getGreeting(currentHour), [currentHour]);
  const shown = greetingWithName(
    greeting.text,
    displayName?.split(' ')[0] || 'User',
    greeting.noName
  );

  // Daten-Pods im Deck: einheitliches Glas statt vierfarbiger Chips.
  const statPods = useMemo<GreetingPod[]>(
    () =>
      pods ?? [
        {
          key: 'eps',
          value: watchedEpisodes,
          label: t('Episoden'),
          to: '/stats',
          highlight: false,
        },
        {
          key: 'movies',
          value: totalMovies,
          label: t('Filme'),
          to: '/ratings?tab=movies',
          highlight: false,
        },
        { key: 'active', value: `${progress}%`, label: t('Aktiv'), to: '/stats', highlight: false },
        ...(todayEpisodes > 0
          ? [
              {
                key: 'today',
                value: todayEpisodes,
                label: t('Heute'),
                to: '/calendar',
                highlight: true,
              },
            ]
          : []),
      ],
    [pods, watchedEpisodes, totalMovies, progress, todayEpisodes]
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
      const hideTimer = setTimeout(() => setGreetingInfo(null), 4000);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        clearTimeout(hideTimer);
      };
    }
  }, [greetingInfo]);

  const headerActions = (only?: 'bell' | 'avatar') => (
    <HeaderActions
      totalUnreadBadge={totalUnreadBadge}
      onNotificationsOpen={onNotificationsOpen}
      photoURL={photoURL}
      displayName={displayName}
      only={only}
    />
  );

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
                const data = await tmdbFetch<{ results?: GreetingSearchHit[] }>(
                  `search/${greeting.type}`,
                  { query: greeting.title }
                );

                const result = pickGreetingMatch(data.results ?? [], greeting.title);
                if (result) {
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
            // Breit sitzt der Gruß ganz oben — der Hinweis steht dort auf seiner Höhe, nicht über dem Suchfeld.
            top: isMobile ? '80px' : '26px',
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
          padding: `calc(${isMobile ? '12px' : '16px'} + env(safe-area-inset-top)) ${isMobile ? '16px' : '20px'} 0`,
          marginBottom: isMobile ? '20px' : '24px',
        }}
      >
        {above}
        <div style={{ position: 'relative', padding: isMobile ? 0 : '8px 0 0' }}>
          <div
            className="home-greet"
            style={{
              position: 'relative',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            {/* Schmal: Avatar links, Datum + Gruß daneben, Glocke rechts. */}
            {isMobile && headerActions('avatar')}
            <div className="home-greet__text" style={{ minWidth: 0, flex: 1 }}>
              {title ?? (
                <GradientText
                  as="h1"
                  from={currentTheme.primary}
                  to={currentTheme.accent}
                  style={{
                    // Aus der nutzbaren Breite gerechnet: unter Anzeige-Zoom
                    // stehen bei 412px nur 330px zur Verfuegung, dort brach der
                    // Gruss sonst auf drei Zeilen um.
                    fontSize: isMobile
                      ? 'clamp(18px, calc(var(--effective-width, 412px) * 0.054), 23px)'
                      : 'clamp(28px, 1vw + 20px, 38px)',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    lineHeight: 1.18,
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
                    aria-label={t('Sprache des Grußes anzeigen')}
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
                      // Nur Einzel-Properties: textDecoration wechselt mit dem Gruß, und
                      // React warnt bei Kurz- und Einzelschreibweise auf demselben Element.
                      textDecorationLine: greeting.title ? 'underline' : 'none',
                      textDecorationStyle: 'dotted',
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
                    {shown.text}
                  </span>
                  <span style={{ flexShrink: 0 }}>{shown.tail}</span>
                </GradientText>
              )}
              <p
                className="home-greet__clock"
                style={{
                  color: currentTheme.text.secondary,
                  fontSize: isMobile ? '13px' : '15px',
                  margin: 0,
                }}
              >
                <LiveClock />
              </p>
            </div>

            {headerActions(isMobile ? 'bell' : undefined)}
          </div>

          {/* Suche + Daten-Pods — eine Zeile auf Desktop, gestapelt auf Mobile. */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              gap: isMobile ? '18px 0' : '10px',
              marginTop: isMobile ? '16px' : '16px',
              alignItems: 'stretch',
            }}
          >
            <motion.button
              type="button"
              whileTap={tapScaleSmall}
              onClick={() => (onSearch ? onSearch() : setSearchOpen(true))}
              aria-label={t('Suche öffnen')}
              style={{
                flex: isMobile ? '1 1 100%' : '1 1 auto',
                minWidth: 0,
                font: 'inherit',
                textAlign: 'left',
                background: 'var(--glass-medium)',
                border: 'none',
                borderRadius: '16px',
                padding: isMobile ? '13px 16px' : '15px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                cursor: 'pointer',
              }}
            >
              <Search style={{ fontSize: '20px', color: currentTheme.primary, flexShrink: 0 }} />
              <span
                style={{
                  color: currentTheme.text.muted,
                  fontSize: '15px',
                  // Einzeilig halten: der Hinweis brach sonst um und machte aus
                  // dem Suchfeld einen doppelt hohen Kasten.
                  minWidth: 0,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {searchHint ?? t('Titel oder Schauspieler')}
              </span>
            </motion.button>

            {(showStatPods ? statPods : []).map((pod, index) => (
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
                  gap: '3px',
                  padding: isMobile ? '2px 4px' : '2px 18px',
                  borderRadius: 0,
                  background: 'none',
                  border: 'none',
                  boxShadow: index > 0 ? 'inset 1px 0 0 var(--hairline)' : 'none',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    fontSize: isMobile ? '22px' : '26px',
                    fontWeight: 800,
                    letterSpacing: '-0.03em',
                    fontFamily: 'var(--font-display)',
                    fontVariantNumeric: 'tabular-nums',
                    color: pod.highlight ? currentTheme.accent : currentTheme.text.secondary,
                    lineHeight: 1.1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pod.value}
                </span>
                <span
                  style={{
                    fontSize: isMobile ? '11.5px' : '12.5px',
                    fontWeight: 600,
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

      {!onSearch && <HomeSearchOverlay open={searchOpen} onClose={closeSearch} />}
    </>
  );
});
