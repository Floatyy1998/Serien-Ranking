import ArrowBack from '@mui/icons-material/ArrowBack';
import ArrowForward from '@mui/icons-material/ArrowForward';
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded';
import { memo } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { partCode, type CrossoverRef } from '../../lib/crossover/crossoverIndex';
import { t } from '../../services/i18n';
import type { CrossoverPart } from '../../types/Crossover';
import { kindLabel, partTitle } from './crossoverLabels';

interface CrossoverStripProps {
  refs: CrossoverRef[];
  navigate: NavigateFunction;
  onOpen: (id: string) => void;
}

/** Einzeiler auf der Episodenseite: „Teil 3 von 5“ mit Sprung zum vorigen/nächsten Teil. */
export const CrossoverStrip = memo(({ refs, navigate, onOpen }: CrossoverStripProps) => {
  const { currentTheme } = useTheme();
  const { allSeriesList } = useSeriesList();
  if (refs.length === 0) return null;

  const tone = currentTheme.accent || currentTheme.primary;
  const muted = currentTheme.text?.muted || 'rgba(255,255,255,0.5)';
  const border = currentTheme.border?.default || 'rgba(255,255,255,0.12)';

  const goTo = (part: CrossoverPart) => {
    const inList = allSeriesList.some((s) => s.id === part.id);
    if (inList && part.s !== undefined && part.e !== undefined) {
      navigate(`/episode/${part.id}/s/${part.s}/e/${part.e}`);
    } else {
      navigate(`/series/${part.id}`);
    }
  };

  const stepStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    padding: '6px 10px',
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: 'rgba(255,255,255,0.04)',
    color: currentTheme.text?.secondary,
    fontSize: 12.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    textAlign: 'left',
  };

  const partText = (part: CrossoverPart) => {
    const code = partCode(part);
    const title = partTitle(part, allSeriesList);
    return code ? `${title} ${code}` : title;
  };

  return (
    <div style={{ margin: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      {refs.map(({ id, entry, partIndex }) => {
        const prev = partIndex > 0 ? entry.parts[partIndex - 1] : null;
        const next = partIndex < entry.parts.length - 1 ? entry.parts[partIndex + 1] : null;
        return (
          <div
            key={id}
            style={{
              padding: '10px 12px',
              borderRadius: 14,
              background: `color-mix(in srgb, ${tone} 8%, transparent)`,
              border: `1px solid color-mix(in srgb, ${tone} 35%, transparent)`,
            }}
          >
            <button
              type="button"
              onClick={() => onOpen(id)}
              style={{
                width: '100%',
                minHeight: 36,
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: currentTheme.text?.primary,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: 8,
                textAlign: 'left',
              }}
            >
              <SwapHorizRounded style={{ fontSize: 20, color: tone, flexShrink: 0 }} />
              <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.title}
                </span>
                <span style={{ fontSize: 12, color: muted }}>
                  {kindLabel(entry.kind)} ·{' '}
                  {t('Teil {i} von {n}', { i: partIndex + 1, n: entry.parts.length })}
                </span>
              </span>
            </button>
            {(prev || next) && (
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                {prev && (
                  <button type="button" onClick={() => goTo(prev)} style={stepStyle}>
                    <ArrowBack style={{ fontSize: 16, flexShrink: 0 }} />
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {partText(prev)}
                    </span>
                  </button>
                )}
                {next && (
                  <button
                    type="button"
                    onClick={() => goTo(next)}
                    style={{ ...stepStyle, justifyContent: 'flex-end', color: tone }}
                  >
                    <span
                      style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {partText(next)}
                    </span>
                    <ArrowForward style={{ fontSize: 16, flexShrink: 0 }} />
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

CrossoverStrip.displayName = 'CrossoverStrip';
