/**
 * Crossover-Kasten der Detailseite: alle Mehrteiler/Backdoor-Piloten, an denen
 * diese Serie hängt, mit Sehstatus je Teil — plus Einstieg zum Ergänzen.
 */
import Add from '@mui/icons-material/Add';
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded';
import { memo } from 'react';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { kindLabel, partTitle } from '../../../components/crossover/crossoverLabels';
import { partCode, partWatchState, type CrossoverRef } from '../../../lib/crossover/crossoverIndex';
import { t } from '../../../services/i18n';
import type { DynamicTheme } from '../../../theme/dynamicTheme';

interface CrossoverSectionProps {
  refs: CrossoverRef[];
  currentTheme: DynamicTheme;
  isMobile: boolean;
  onOpen: (id: string) => void;
  onAdd: () => void;
}

export const CrossoverSection = memo(
  ({ refs, currentTheme, isMobile, onOpen, onAdd }: CrossoverSectionProps) => {
    const { allSeriesList } = useSeriesList();
    const muted = currentTheme.text.muted;
    const secondary = currentTheme.text.secondary;
    const accent = currentTheme.accent || currentTheme.primary;
    const border = currentTheme.border?.default || 'rgba(255,255,255,0.12)';

    const addButton = (compact: boolean) => (
      <button
        type="button"
        onClick={onAdd}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          minHeight: compact ? 32 : 40,
          padding: compact ? '6px 10px' : '8px 14px',
          borderRadius: 999,
          border: compact ? 'none' : `1px dashed ${border}`,
          background: 'transparent',
          color: compact ? muted : secondary,
          fontSize: compact ? 12.5 : 13.5,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        <Add style={{ fontSize: compact ? 15 : 17 }} />
        {t('Crossover ergänzen')}
      </button>
    );

    if (refs.length === 0) {
      return (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: -6 }}>
          {addButton(true)}
        </div>
      );
    }

    return (
      <section
        style={{
          background: currentTheme.background.surface,
          border: `1px solid ${border}`,
          borderRadius: 16,
          padding: isMobile ? 14 : 18,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: 10,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 15,
              fontWeight: 800,
              color: currentTheme.text.primary,
            }}
          >
            <SwapHorizRounded style={{ fontSize: 20, color: accent }} />
            {t('Crossover')}
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 999,
                color: accent,
                background: `color-mix(in srgb, ${accent} 14%, transparent)`,
              }}
            >
              {refs.length}
            </span>
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {refs.map(({ id, entry }) => (
            <button
              key={id}
              type="button"
              onClick={() => onOpen(id)}
              style={{
                width: '100%',
                minHeight: 52,
                padding: '10px 12px',
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: 'rgba(255,255,255,0.03)',
                color: currentTheme.text.primary,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'center',
                gap: 5,
                textAlign: 'left',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    flexShrink: 0,
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                    color: accent,
                    padding: '2px 7px',
                    borderRadius: 999,
                    border: `1px solid color-mix(in srgb, ${accent} 45%, transparent)`,
                  }}
                >
                  {kindLabel(entry.kind)}
                </span>
                <span
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: 14,
                    fontWeight: 700,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.title}
                </span>
                {entry.year && (
                  <span style={{ flexShrink: 0, fontSize: 12, color: muted }}>{entry.year}</span>
                )}
              </span>
              <span
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '2px 6px',
                  fontSize: 12.5,
                  lineHeight: 1.35,
                }}
              >
                {entry.parts.map((part, i) => {
                  const state = partWatchState(part, allSeriesList);
                  const color =
                    state === 'watched'
                      ? currentTheme.primary
                      : state === 'not-in-list'
                        ? muted
                        : secondary;
                  const code = partCode(part);
                  return (
                    <span key={`${part.id}-${i}`} style={{ display: 'inline-flex', gap: 6 }}>
                      {i > 0 && <span style={{ color: muted }}>→</span>}
                      <span
                        style={{
                          color,
                          fontWeight: state === 'watched' ? 600 : 500,
                          textDecoration: state === 'not-in-list' ? 'underline dotted' : 'none',
                          textUnderlineOffset: 3,
                        }}
                      >
                        {partTitle(part, allSeriesList)}
                        {code ? ` ${code}` : ''}
                      </span>
                    </span>
                  );
                })}
              </span>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
          {addButton(false)}
        </div>
      </section>
    );
  }
);

CrossoverSection.displayName = 'CrossoverSection';
