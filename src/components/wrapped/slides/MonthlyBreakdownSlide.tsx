import React from 'react';
import { dateLocale, t } from '../../../services/i18n';
import type { MonthStats } from '../../../types/Wrapped';
import { Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

interface MonthlyBreakdownSlideProps extends SlideProps {
  monthlyBreakdown: MonthStats[];
  mostActiveMonth: MonthStats;
}

const shortMonth = (month: number): string =>
  new Date(2000, month - 1, 1).toLocaleDateString(dateLocale(), { month: 'narrow' });

export const MonthlyBreakdownSlide: React.FC<MonthlyBreakdownSlideProps> = ({
  monthlyBreakdown,
  mostActiveMonth,
  active,
  posters,
}) => {
  const max = Math.max(...monthlyBreakdown.map((m) => m.minutesWatched), 1);
  const hours = Math.round(mostActiveMonth.minutesWatched / 60);
  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Dein aktivster Monat')}
        </p>
        <h2 className="w-title w-slam w-pop">{t(mostActiveMonth.monthName)}</h2>
        <p className="w-line w-in" style={step(3)}>
          {t('{n} Stunden', { n: hours })},{' '}
          {t('{n} Episoden', { n: mostActiveMonth.episodesWatched })},{' '}
          {t('{n} Filme', { n: mostActiveMonth.moviesWatched })}
        </p>
      </div>
      <div className="w-visual" role="img" aria-label={t('Watchtime pro Monat')}>
        <div className="w-months">
          {monthlyBreakdown.map((month, i) => (
            <div
              key={month.month}
              className={month.month === mostActiveMonth.month ? 'w-month is-top' : 'w-month'}
            >
              <div
                className="w-month__col"
                style={step(i, {
                  '--h': `${(month.minutesWatched / max) * 100}%`,
                } as React.CSSProperties)}
              />
              <span>{shortMonth(month.month)}</span>
            </div>
          ))}
        </div>
      </div>
    </Stage>
  );
};

export default MonthlyBreakdownSlide;
