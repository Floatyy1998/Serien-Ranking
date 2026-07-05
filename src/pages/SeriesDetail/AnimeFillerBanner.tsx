/**
 * AnimeFillerBanner – inline banner on the SeriesDetail page that surfaces
 * filler/recap episodes for anime, sourced from Jikan via MAL ID lookup.
 *
 * Visually subtle by default: the user sees a one-liner summary
 * ("4 Filler · 1 Recap") and can expand to inspect each episode.
 */

import ChevronRight from '@mui/icons-material/ChevronRight';
import FilterListAlt from '@mui/icons-material/FilterAlt';
import Refresh from '@mui/icons-material/Refresh';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { AnimeFillerData } from '../../services/animeFillerService';

interface AnimeFillerBannerProps {
  enabled: boolean;
  loading: boolean;
  data: AnimeFillerData | null;
  isMobile: boolean;
  onReload?: () => void;
}

export const AnimeFillerBanner = memo<AnimeFillerBannerProps>(
  ({ enabled, loading, data, isMobile, onReload }) => {
    const { currentTheme } = useTheme();
    const [expanded, setExpanded] = useState(false);

    if (!enabled) return null;
    if (loading)
      return (
        <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 16px' }}>
          <div
            style={{
              padding: '10px 14px',
              fontSize: 12,
              color: currentTheme.text.muted,
              borderRadius: 12,
              background: `color-mix(in srgb, ${currentTheme.primary} 6%, transparent)`,
              border: `1px dashed color-mix(in srgb, ${currentTheme.primary} 25%, transparent)`,
            }}
          >
            Suche Filler-Infos …
          </div>
        </div>
      );

    // No data at all – MAL match failed or fetch returned empty.
    if (!data) {
      return (
        <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              fontSize: 12.5,
              color: currentTheme.text.muted,
              borderRadius: 12,
              background: `color-mix(in srgb, ${currentTheme.text.muted} 6%, transparent)`,
              border: `1px dashed color-mix(in srgb, ${currentTheme.text.muted} 22%, transparent)`,
            }}
          >
            <FilterListAlt style={{ fontSize: 16, opacity: 0.7 }} />
            <span style={{ flex: 1 }}>
              Filler-Infos konnten nicht geladen werden (kein MAL-Treffer oder Netzwerk-Hänger).
            </span>
            {onReload && (
              <button
                type="button"
                onClick={onReload}
                style={{
                  all: 'unset',
                  cursor: 'pointer',
                  color: currentTheme.primary,
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 12,
                }}
              >
                <Refresh style={{ fontSize: 14 }} />
                Neu laden
              </button>
            )}
          </div>
        </div>
      );
    }

    // Data fetched, but the show has no filler/recap markers at all.
    if (data.fillerCount === 0 && data.recapCount === 0) {
      return (
        <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              fontSize: 12.5,
              color: currentTheme.text.secondary,
              borderRadius: 12,
              background: `color-mix(in srgb, ${currentTheme.status.success} 8%, transparent)`,
              border: `1px solid color-mix(in srgb, ${currentTheme.status.success} 28%, transparent)`,
            }}
          >
            <FilterListAlt style={{ fontSize: 16, color: currentTheme.status.success }} />
            <span style={{ flex: 1 }}>
              Komplett Canon – {data.totalEpisodes ?? '?'} Folgen ohne Filler oder Recap.
            </span>
          </div>
        </div>
      );
    }

    const accent = currentTheme.status.warning;
    const recapColor = currentTheme.primary;

    const showCount = expanded
      ? data.episodes.filter((e) => e.filler || e.recap)
      : data.episodes.filter((e) => e.filler || e.recap).slice(0, 0);

    return (
      <div style={{ padding: isMobile ? '0 12px 12px' : '0 20px 16px' }}>
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: `linear-gradient(135deg, color-mix(in srgb, ${accent} 12%, transparent), color-mix(in srgb, ${recapColor} 6%, transparent))`,
            border: `1px solid color-mix(in srgb, ${accent} 28%, transparent)`,
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          {/* Header row: sibling buttons (no nested interactive elements) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: isMobile ? '10px 14px' : '12px 18px',
            }}
          >
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-expanded={expanded}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'none',
                border: 'none',
                margin: 0,
                padding: 0,
                font: 'inherit',
                textAlign: 'left',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                color: currentTheme.text.primary,
                fontSize: isMobile ? '13px' : '14px',
              }}
            >
              <FilterListAlt style={{ fontSize: 18, color: accent }} />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 600 }}>
                {data.fillerCount > 0 && (
                  <>
                    <span style={{ color: accent }}>{data.fillerCount}</span> Filler
                  </>
                )}
                {data.fillerCount > 0 && data.recapCount > 0 && (
                  <span style={{ color: currentTheme.text.muted }}> · </span>
                )}
                {data.recapCount > 0 && (
                  <>
                    <span style={{ color: recapColor }}>{data.recapCount}</span> Recap
                  </>
                )}
                <span
                  style={{
                    color: currentTheme.text.muted,
                    fontWeight: 400,
                    marginLeft: 6,
                    fontSize: '0.92em',
                  }}
                >
                  · {data.totalEpisodes ?? '?'} Folgen gesamt
                </span>
              </span>
            </button>
            {onReload && (
              <button
                type="button"
                onClick={onReload}
                aria-label="Filler-Infos neu laden"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  flexShrink: 0,
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  borderRadius: 'var(--radius-xs)',
                  color: currentTheme.text.muted,
                  cursor: 'pointer',
                }}
              >
                <Refresh style={{ fontSize: 14 }} />
              </button>
            )}
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              aria-label={expanded ? 'Details einklappen' : 'Details ausklappen'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                background: 'none',
                border: 'none',
                padding: 0,
                margin: 0,
                cursor: 'pointer',
              }}
            >
              <ChevronRight
                style={{
                  fontSize: 20,
                  color: currentTheme.text.muted,
                  transform: expanded ? 'rotate(90deg)' : 'none',
                  transition: 'transform 0.18s',
                }}
              />
            </button>
          </div>

          <AnimatePresence initial={false}>
            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                style={{
                  borderTop: `1px solid color-mix(in srgb, ${accent} 18%, transparent)`,
                  padding: '6px 0',
                }}
              >
                <ul
                  style={{
                    margin: 0,
                    padding: '4px 14px 8px',
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    maxHeight: 280,
                    overflowY: 'auto',
                  }}
                >
                  {showCount.map((ep) => {
                    const tone = ep.filler ? accent : recapColor;
                    const label = ep.filler ? 'F' : 'R';
                    return (
                      <li
                        key={ep.malEpisodeNumber}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          padding: '6px 8px',
                          borderRadius: 8,
                          fontSize: 12.5,
                          color: currentTheme.text.secondary,
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 800,
                            color: tone,
                            background: `color-mix(in srgb, ${tone} 18%, transparent)`,
                            border: `1px solid color-mix(in srgb, ${tone} 38%, transparent)`,
                            flexShrink: 0,
                          }}
                        >
                          {label}
                        </span>
                        <span
                          style={{
                            color: currentTheme.text.muted,
                            fontVariantNumeric: 'tabular-nums',
                            minWidth: 28,
                          }}
                        >
                          #{ep.malEpisodeNumber}
                        </span>
                        <span
                          style={{
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {ep.title || '—'}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p
                  style={{
                    margin: 0,
                    padding: '0 14px 8px',
                    fontSize: 10.5,
                    color: currentTheme.text.muted,
                  }}
                >
                  Quelle: Jikan/MyAnimeList · F = Filler, R = Recap · Folgen sind durchgehend
                  nummeriert
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    );
  }
);

AnimeFillerBanner.displayName = 'AnimeFillerBanner';
