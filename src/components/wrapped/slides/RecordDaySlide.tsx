import React from 'react';
import { dateLocale, t } from '../../../services/i18n';
import type { DayStats } from '../../../types/Wrapped';
import { Count, Giant, Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

export const RecordDaySlide: React.FC<{ mostActiveDay: DayStats } & SlideProps> = ({
  mostActiveDay,
  active,
  posters,
}) => {
  const total = mostActiveDay.episodesWatched + mostActiveDay.moviesWatched;
  const date = new Date(mostActiveDay.date);
  const valid = Number.isFinite(date.getTime());
  const dayMonth = valid
    ? date.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long' })
    : mostActiveDay.date;
  const hours = Math.floor(mostActiveDay.minutesWatched / 60);
  const minutes = mostActiveDay.minutesWatched % 60;
  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Dein Rekord-Tag')}
        </p>
        <h2 className="w-title w-slam w-pop">{dayMonth}</h2>
        <p className="w-line w-in" style={step(3)}>
          {mostActiveDay.dayName}
        </p>
      </div>
      <div className="w-visual w-stack">
        <Giant value={total} />
        <ul className="w-facts">
          <li className="w-fact w-in" style={step(5)}>
            <span className="w-fact__val">
              <Count value={mostActiveDay.episodesWatched} active={active} />
            </span>
            <span className="w-fact__label">{t('Episoden')}</span>
          </li>
          <li className="w-fact w-in" style={step(6)}>
            <span className="w-fact__val">
              <Count value={mostActiveDay.moviesWatched} active={active} />
            </span>
            <span className="w-fact__label">{t('Filme')}</span>
          </li>
          <li className="w-fact w-in" style={step(7)}>
            <span className="w-fact__val w-fact__val--text">
              {t('{h} Std {m} Min', { h: hours, m: minutes })}
            </span>
            <span className="w-fact__label">{t('Watchtime')}</span>
          </li>
        </ul>
      </div>
    </Stage>
  );
};

export default RecordDaySlide;
