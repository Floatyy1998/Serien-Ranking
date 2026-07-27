import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import GridView from '@mui/icons-material/GridView';
import ShowChart from '@mui/icons-material/ShowChart';
import { memo, useMemo, useState } from 'react';
import type { useNavigate } from 'react-router-dom';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEpisodeRatings } from '../../hooks/useCommunityRatings';
import {
  buildFeverCurve,
  MIN_EPISODES_FOR_CURVE,
  ratingHeatColor,
  type FeverPoint,
} from '../../lib/episode/episodeCurve';
import { t } from '../../services/i18n';
import type { DynamicTheme } from '../../theme/dynamicTheme';
import type { useSeriesData } from './useSeriesData';

interface FeverCurveSectionProps {
  series: NonNullable<ReturnType<typeof useSeriesData>['series']>;
  currentTheme: DynamicTheme;
  isMobile: boolean;
  navigate: ReturnType<typeof useNavigate>;
}

interface TooltipPayloadEntry {
  payload?: FeverPoint;
}

const CurveTooltip = ({
  active,
  payload,
  theme,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
  theme: DynamicTheme;
}) => {
  const p = active ? payload?.[0]?.payload : undefined;
  if (!p) return null;
  return (
    <div
      style={{
        background: 'var(--glass-heavy, rgba(20, 12, 22, 0.92))',
        border: `1px solid color-mix(in srgb, ${theme.primary} 30%, transparent)`,
        borderRadius: 10,
        padding: '8px 10px',
        fontSize: 12,
        color: theme.text.primary,
        maxWidth: 220,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 2 }}>
        S{p.seasonNumber + 1}E{p.episodeNumber}
        {p.title ? ` · ${p.title}` : ''}
      </div>
      {p.avg !== null && (
        <div style={{ color: theme.text.secondary }}>
          {t('Community: {n}/10 ({c} Bewertungen)', { n: p.avg, c: p.count })}
        </div>
      )}
      {p.own !== null && <div style={{ color: theme.accent }}>{t('Du: {n}/10', { n: p.own })}</div>}
    </div>
  );
};

/**
 * Fieberkurve: Community-Folgenbewertungen als Staffelkurve oder Heatmap,
 * eigene Bewertungen als Overlay. Erscheint erst ab MIN_EPISODES_FOR_CURVE
 * community-bewerteten Folgen.
 */
export const FeverCurveSection = memo(
  ({ series, currentTheme, isMobile, navigate }: FeverCurveSectionProps) => {
    const entries = useEpisodeRatings(series.id);
    const [view, setView] = useState<'curve' | 'heat'>('curve');
    const [open, setOpen] = useState<boolean>(() => {
      try {
        return localStorage.getItem('feverCurveCollapsed') !== '1';
      } catch {
        return true;
      }
    });
    const toggleOpen = () => {
      setOpen((prev) => {
        const next = !prev;
        try {
          localStorage.setItem('feverCurveCollapsed', next ? '0' : '1');
        } catch {
          // ignore
        }
        return next;
      });
    };

    const curve = useMemo(
      () => buildFeverCurve(series.seasons, entries),
      [series.seasons, entries]
    );

    // Community-Modus ab 5 community-bewerteten Folgen; sonst Fallback auf die
    // eigene Kurve ab 5 eigenen Folgenbewertungen (kleine Community-Basis).
    const hasCommunity = curve.communityCount >= MIN_EPISODES_FOR_CURVE;
    if (!hasCommunity && curve.ownCount < MIN_EPISODES_FOR_CURVE) return null;

    const chartWidth = Math.max(360, curve.points.length * (isMobile ? 16 : 22));
    const seasonTicks = curve.segments.map((s) => s.startX);
    const tickLabel = new Map(curve.segments.map((s) => [s.startX, `S${s.seasonNumber + 1}`]));
    const gridColor = `color-mix(in srgb, ${currentTheme.text.secondary} 18%, transparent)`;

    const goToEpisode = (p: FeverPoint) =>
      navigate(`/episode/${series.id}/s/${p.seasonNumber + 1}/e/${p.episodeNumber}`);

    return (
      <div
        style={{
          background: 'var(--glass-light)',
          border: `1px solid color-mix(in srgb, ${currentTheme.primary} 18%, transparent)`,
          borderRadius: 16,
          padding: isMobile ? '12px' : '16px 20px',
          boxShadow: 'var(--glass-specular)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: open ? 10 : 0,
          }}
        >
          <button
            type="button"
            className="fever-toggle-btn"
            onClick={toggleOpen}
            aria-expanded={open}
          >
            <ShowChart style={{ fontSize: isMobile ? 18 : 20, color: currentTheme.primary }} />
            <h3
              style={{
                fontSize: isMobile ? 14 : 16,
                fontWeight: 700,
                margin: 0,
                flex: 1,
                color: currentTheme.text.primary,
              }}
            >
              {t('Fieberkurve')}
            </h3>
            {open ? (
              <ExpandLess
                style={{ fontSize: 18, opacity: 0.55, color: currentTheme.text.secondary }}
              />
            ) : (
              <ExpandMore
                style={{ fontSize: 18, opacity: 0.55, color: currentTheme.text.secondary }}
              />
            )}
          </button>
          <div style={{ display: open ? 'flex' : 'none', gap: 4 }}>
            {(
              [
                { key: 'curve' as const, icon: <ShowChart style={{ fontSize: 16 }} /> },
                { key: 'heat' as const, icon: <GridView style={{ fontSize: 16 }} /> },
              ] as const
            ).map((v) => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                aria-label={v.key === 'curve' ? t('Kurve') : t('Heatmap')}
                style={{
                  width: 30,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  background:
                    view === v.key
                      ? `color-mix(in srgb, ${currentTheme.primary} 22%, transparent)`
                      : 'transparent',
                  color: view === v.key ? currentTheme.primary : currentTheme.text.secondary,
                }}
              >
                {v.icon}
              </button>
            ))}
          </div>
        </div>

        {open && view === 'curve' && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <LineChart
              width={chartWidth}
              height={190}
              data={curve.points}
              margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
              onClick={(state) => {
                const payload = (
                  state as { activePayload?: { payload?: FeverPoint }[] } | undefined
                )?.activePayload?.[0]?.payload;
                if (payload) goToEpisode(payload);
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="x"
                ticks={seasonTicks}
                tickFormatter={(x: number) => tickLabel.get(x) || ''}
                tick={{ fontSize: 10, fill: currentTheme.text.secondary }}
                axisLine={{ stroke: gridColor }}
                tickLine={false}
                interval={0}
              />
              <YAxis
                domain={[(dataMin: number) => Math.max(0, Math.floor(dataMin - 1)), 10]}
                tick={{ fontSize: 10, fill: currentTheme.text.secondary }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip content={<CurveTooltip theme={currentTheme} />} />
              {curve.segments.slice(1).map((s) => (
                <ReferenceLine
                  key={s.seasonNumber}
                  x={s.startX}
                  stroke={gridColor}
                  strokeDasharray="4 4"
                />
              ))}
              {curve.communityCount > 0 && (
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke={currentTheme.primary}
                  strokeWidth={2}
                  connectNulls
                  dot={{ r: 2, fill: currentTheme.primary, strokeWidth: 0 }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
              {curve.hasOwn && (
                <Line
                  type="monotone"
                  dataKey="own"
                  stroke={hasCommunity ? currentTheme.accent : currentTheme.primary}
                  strokeWidth={hasCommunity ? 1.5 : 2}
                  strokeDasharray={hasCommunity ? '5 4' : undefined}
                  connectNulls
                  dot={{
                    r: 2,
                    fill: hasCommunity ? currentTheme.accent : currentTheme.primary,
                    strokeWidth: 0,
                  }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              )}
              {curve.best && (
                <ReferenceDot
                  x={curve.best.x}
                  y={curve.best.avg as number}
                  r={5}
                  fill={currentTheme.accent}
                  stroke={currentTheme.text.primary}
                  strokeWidth={1}
                />
              )}
            </LineChart>
          </div>
        )}
        {open && view === 'heat' && (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 'min-content' }}
            >
              {curve.segments.map((seg) => (
                <div
                  key={seg.seasonNumber}
                  style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <span
                    style={{
                      width: 28,
                      flexShrink: 0,
                      fontSize: 10,
                      fontWeight: 700,
                      color: currentTheme.text.secondary,
                    }}
                  >
                    S{seg.seasonNumber + 1}
                  </span>
                  {curve.points
                    .filter((p) => p.seasonNumber === seg.seasonNumber)
                    .map((p) => (
                      <button
                        key={p.episodeId}
                        onClick={() => goToEpisode(p)}
                        title={`S${p.seasonNumber + 1}E${p.episodeNumber}${p.title ? ` · ${p.title}` : ''}${(p.avg ?? p.own) !== null ? ` · ${p.avg ?? p.own}` : ''}`}
                        aria-label={`S${p.seasonNumber + 1}E${p.episodeNumber}`}
                        style={{
                          // Feste 40px: übersteuert die globale 44px-Button-Regel
                          // bewusst mit einem klaren Touch-Target inkl. Wert.
                          width: 40,
                          height: 40,
                          minWidth: 40,
                          minHeight: 40,
                          flexShrink: 0,
                          borderRadius: 8,
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          fontSize: 11,
                          fontWeight: 700,
                          color:
                            (p.avg ?? p.own) !== null
                              ? 'rgba(0,0,0,0.75)'
                              : currentTheme.text.secondary,
                          background:
                            (p.avg ?? p.own) !== null
                              ? ratingHeatColor((p.avg ?? p.own) as number)
                              : `color-mix(in srgb, ${currentTheme.text.secondary} 10%, transparent)`,
                        }}
                      >
                        {(p.avg ?? p.own) !== null
                          ? ((p.avg ?? p.own) as number).toFixed(1)
                          : p.episodeNumber}
                      </button>
                    ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {open && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: isMobile ? 8 : 14,
              marginTop: 10,
              fontSize: 11,
              color: currentTheme.text.secondary,
            }}
          >
            {curve.best && (
              <button
                onClick={() => goToEpisode(curve.best as FeverPoint)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 11,
                  color: currentTheme.text.secondary,
                }}
              >
                {t('Beste Folge')}:{' '}
                <span style={{ color: currentTheme.accent, fontWeight: 700 }}>
                  S{curve.best.seasonNumber + 1}E{curve.best.episodeNumber} · {curve.best.avg}
                </span>
              </button>
            )}
            {curve.worst && (
              <button
                onClick={() => goToEpisode(curve.worst as FeverPoint)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: 11,
                  color: currentTheme.text.secondary,
                }}
              >
                {t('Schwächste')}:{' '}
                <span style={{ fontWeight: 700 }}>
                  S{curve.worst.seasonNumber + 1}E{curve.worst.episodeNumber} · {curve.worst.avg}
                </span>
              </button>
            )}
            <span style={{ marginLeft: 'auto' }}>
              {!hasCommunity
                ? t('Deine Folgenbewertungen')
                : curve.hasOwn && view === 'curve'
                  ? t('Linie: Community · gestrichelt: du')
                  : t('Ø der TV-Rank-Community')}
            </span>
          </div>
        )}
      </div>
    );
  }
);

FeverCurveSection.displayName = 'FeverCurveSection';
