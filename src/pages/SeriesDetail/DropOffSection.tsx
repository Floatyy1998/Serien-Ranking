/**
 * Aussteiger-Radar: wo das Publikum einer Serie aussteigt und ab wann sie hält.
 * Datenquelle ist das anonyme Backend-Aggregat; ohne Datei bleibt alles still.
 */

import ExitToApp from '@mui/icons-material/ExitToApp';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { memo, useState } from 'react';
import { useDropOff } from '../../hooks/useDropOff';
import { dateLocale, t } from '../../services/i18n';
import type { DropOffInsight } from '../../lib/dropOff';
import type { DynamicTheme } from '../../theme/dynamicTheme';

const formatPercent = (share: number): string =>
  new Intl.NumberFormat(dateLocale(), { style: 'percent', maximumFractionDigits: 0 }).format(share);

interface DropOffViewProps {
  insight: DropOffInsight | null;
  currentTheme: DynamicTheme;
  isMobile: boolean;
}

/** Reine Darstellung — bekommt das ausgewertete Bild von aussen. */
export const DropOffView = memo(({ insight, currentTheme, isMobile }: DropOffViewProps) => {
  const [open, setOpen] = useState(false);

  if (!insight) return null;

  const muted = currentTheme.text.muted;
  const surface = currentTheme.background.surface;
  const success = currentTheme.status.success;
  const warning = currentTheme.status.warning;
  const accent = currentTheme.accent || currentTheme.primary;

  const maxQuitters = insight.seasons.reduce((max, s) => Math.max(max, s.quitters), 0);

  return (
    <section
      style={{
        background: surface,
        border: `1px solid ${currentTheme.border.default}`,
        borderRadius: 16,
        padding: isMobile ? 14 : 18,
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          textAlign: 'left',
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
          <ExitToApp style={{ fontSize: 18, color: accent }} />
          {t('Aussteiger')}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: muted, fontSize: 12 }}>
          {t('{n} Bewertungen ausgewertet', { n: insight.decided })}
          {open ? <ExpandLess style={{ fontSize: 20 }} /> : <ExpandMore style={{ fontSize: 20 }} />}
        </span>
      </button>

      <p
        style={{
          margin: '12px 0 0 0',
          fontSize: 13.5,
          lineHeight: 1.45,
          color: currentTheme.text.secondary,
        }}
      >
        <strong style={{ color: insight.completionRate >= 0.6 ? success : warning }}>
          {formatPercent(insight.completionRate)}
        </strong>{' '}
        {t('schauen die Serie zu Ende.')}
      </p>

      {insight.worstSeason && (
        <p
          style={{
            margin: '6px 0 0 0',
            fontSize: 13,
            lineHeight: 1.45,
            color: currentTheme.text.secondary,
          }}
        >
          {t('Die meisten steigen in Staffel {n} aus.', {
            n: insight.worstSeason.seasonNumber,
          })}
        </p>
      )}

      {insight.holdPoint && (
        <p
          style={{
            margin: '8px 0 0 0',
            fontSize: 13,
            lineHeight: 1.45,
            color: success,
          }}
        >
          {t('Wer Folge {n} erreicht, schaut zu {p} zu Ende.', {
            n: insight.holdPoint.episodeNumber,
            p: formatPercent(insight.holdPoint.completionAfter),
          })}
        </p>
      )}

      {open && insight.seasons.length > 0 && (
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {insight.seasons.map((season) => (
            <div
              key={season.seasonNumber}
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ fontSize: 12, color: muted, minWidth: 62 }}>
                {t('Staffel {n}', { n: season.seasonNumber })}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: `${currentTheme.border.default}`,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: maxQuitters > 0 ? `${(season.quitters / maxQuitters) * 100}%` : '0%',
                    height: '100%',
                    borderRadius: 4,
                    background: `linear-gradient(90deg, ${accent}, ${warning})`,
                  }}
                />
              </div>
              <span style={{ fontSize: 12, color: muted, minWidth: 38, textAlign: 'right' }}>
                {formatPercent(season.share)}
              </span>
            </div>
          ))}
          <p style={{ margin: '4px 0 0 0', fontSize: 11.5, color: muted, lineHeight: 1.4 }}>
            {t('Anonym aus dem Sehverhalten aller Nutzer, die diese Serie begonnen haben.')}
          </p>
        </div>
      )}
    </section>
  );
});

DropOffView.displayName = 'DropOffView';

interface DropOffSectionProps {
  seriesId: number;
  currentTheme: DynamicTheme;
  isMobile: boolean;
}

export const DropOffSection = ({ seriesId, currentTheme, isMobile }: DropOffSectionProps) => (
  <DropOffView insight={useDropOff(seriesId)} currentTheme={currentTheme} isMobile={isMobile} />
);
