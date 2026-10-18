import React from 'react';
import { useTheme } from '../../../../contexts/ThemeContext';
import { MONTH_INITIALS } from '../../../Books/helpers';

export interface BarSeries {
  label: string;
  color: string;
  values: number[];
}

/** Monatsbalken mit mehreren übereinanderliegenden Reihen, z. B. beendete Bücher und Manga. */
export const StackedMonthBars: React.FC<{ series: BarSeries[]; currentMonth?: number }> = ({
  series,
  currentMonth,
}) => {
  const { currentTheme } = useTheme();
  const labels = MONTH_INITIALS();
  const totals = labels.map((_, i) => series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0));
  const max = Math.max(1, ...totals);
  return (
    <>
      <div className="bk-bars">
        {labels.map((label, i) => (
          <div
            key={i}
            className="bk-bar"
            title={series.map((s) => `${s.label}: ${s.values[i] ?? 0}`).join(' · ')}
          >
            <div
              className="rs-stack"
              style={{
                height: `${Math.max(3, (totals[i] / max) * 100)}%`,
                opacity: currentMonth !== undefined && i > currentMonth ? 0.35 : 1,
                background: totals[i] > 0 ? undefined : 'rgba(255,255,255,0.08)',
              }}
            >
              {series.map((s) =>
                s.values[i] > 0 ? (
                  <span
                    key={s.label}
                    style={{ flexGrow: s.values[i], background: s.color, minHeight: 2 }}
                  />
                ) : null
              )}
            </div>
            <span
              className="bk-bar-label"
              style={{
                color: i === currentMonth ? currentTheme.text.secondary : currentTheme.text.muted,
              }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
      {series.length > 1 && (
        <div className="rs-legend" style={{ color: currentTheme.text.muted }}>
          {series.map((s) => (
            <span key={s.label} className="rs-legend-item">
              <span className="rs-legend-dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}
    </>
  );
};
