import React from 'react';
import { t } from '../../../services/i18n';
import { Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

const DAY_KEYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
/** Woche beginnt mit Montag, die Daten mit Sonntag. */
const ORDER = [1, 2, 3, 4, 5, 6, 0];

export const HeatmapSlide: React.FC<{ heatmapData: number[][] } & SlideProps> = ({
  heatmapData,
  active,
  posters,
}) => {
  const days = DAY_KEYS.map((d) => t(d));
  const max = Math.max(...heatmapData.flat(), 1);
  let peakDay = 0;
  let peakHour = 0;
  let peakValue = 0;
  heatmapData.forEach((row, d) =>
    row.forEach((value, h) => {
      if (value > peakValue) {
        peakValue = value;
        peakDay = d;
        peakHour = h;
      }
    })
  );
  const peakLabel = t('{time} Uhr', { time: `${days[peakDay]} ${peakHour}:00` });

  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Deine Peak-Zeit')}
        </p>
        <h2 className="w-title w-slam w-pop">{peakLabel}</h2>
        <p className="w-line w-in" style={step(3)}>
          {t('{n} Views zu dieser Zeit', { n: peakValue })}
        </p>
      </div>
      <div
        className="w-visual w-in"
        style={step(4)}
        role="img"
        aria-label={t('Deine Watch-Zeiten')}
      >
        <div className="w-heat">
          {ORDER.map((d, row) => (
            <React.Fragment key={d}>
              <span>{days[d]}</span>
              {Array.from({ length: 24 }, (_, h) => {
                const value = heatmapData[d]?.[h] ?? 0;
                const peak = peakValue > 0 && d === peakDay && h === peakHour;
                return (
                  <span
                    key={h}
                    className={peak ? 'w-heat__cell is-peak' : 'w-heat__cell'}
                    style={
                      {
                        '--v': value === 0 ? 0 : 0.18 + 0.82 * (value / max),
                        '--col': h,
                        '--row': row,
                      } as React.CSSProperties
                    }
                  />
                );
              })}
            </React.Fragment>
          ))}
        </div>
        <div className="w-heat__hours" aria-hidden>
          <span />
          <span>0</span>
          <span>6</span>
          <span>12</span>
          <span>18</span>
        </div>
      </div>
    </Stage>
  );
};

export default HeatmapSlide;
