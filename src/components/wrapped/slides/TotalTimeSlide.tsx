import React from 'react';
import { t } from '../../../services/i18n';
import { Count, Giant, Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

interface TotalTimeSlideProps extends SlideProps {
  totalMinutes: number;
  totalHours: number;
  totalDays: number;
  totalEpisodes: number;
  totalMovies: number;
}

export const TotalTimeSlide: React.FC<TotalTimeSlideProps> = ({
  totalMinutes,
  totalHours,
  totalDays,
  totalEpisodes,
  totalMovies,
  active,
  posters,
}) => {
  const hours = Math.round(totalHours);
  const underAnHour = hours < 1;
  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Du hast dieses Jahr')}
        </p>
        <Giant value={underAnHour ? totalMinutes : hours} />
        <p className="w-title w-title--sm w-in" style={step(3)}>
          {underAnHour ? t('Minuten') : t('Stunden')} {t('geschaut')}
        </p>
        {totalDays >= 1 && (
          <p className="w-line w-in" style={step(4)}>
            {t('Das sind {n} Tage am Stück.', { n: totalDays })}
          </p>
        )}
      </div>
      <ul className="w-facts w-visual">
        <li className="w-fact w-in" style={step(5)}>
          <span className="w-fact__val">
            <Count value={totalEpisodes} active={active} />
          </span>
          <span className="w-fact__label">{t('Episoden')}</span>
        </li>
        <li className="w-fact w-in" style={step(6)}>
          <span className="w-fact__val">
            <Count value={totalMovies} active={active} />
          </span>
          <span className="w-fact__label">{t('Filme')}</span>
        </li>
        <li className="w-fact w-in" style={step(7)}>
          <span className="w-fact__val">
            <Count value={totalMinutes} active={active} />
          </span>
          <span className="w-fact__label">{t('Minuten')}</span>
        </li>
      </ul>
    </Stage>
  );
};

export default TotalTimeSlide;
