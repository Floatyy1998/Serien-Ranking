import React from 'react';
import { t } from '../../../services/i18n';
import type { LateNightStats } from '../../../types/Wrapped';
import { Count, Giant, Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

export const LateNightSlide: React.FC<{ lateNightStats: LateNightStats } & SlideProps> = ({
  lateNightStats,
  active,
  posters,
}) => {
  const moon = <div className="w-moon" aria-hidden />;
  if (lateNightStats.totalLateNightWatches === 0) {
    return (
      <Stage active={active} posters={posters} single backdrop={moon}>
        <div className="w-copy w-stack">
          <h2 className="w-title w-slam">{t('Früh ins Bett?')}</h2>
          <p className="w-line w-in">{t('Du hast dieses Jahr nicht nach 22 Uhr geschaut!')}</p>
        </div>
      </Stage>
    );
  }
  const latest = lateNightStats.latestWatch;
  return (
    <Stage active={active} posters={posters} backdrop={moon}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Nachtschwärmer')}
        </p>
        <Giant value={Math.round(lateNightStats.percentage)} suffix="%" />
        <p className="w-line w-in" style={step(3)}>
          {t('deiner Views')} {t('nach 22 Uhr')}
        </p>
      </div>
      <ul className="w-facts w-visual">
        <li className="w-fact w-in" style={step(5)}>
          <span className="w-fact__val">
            <Count value={lateNightStats.midnightWatches} active={active} />
          </span>
          <span className="w-fact__label">{t('Nach Mitternacht')}</span>
        </li>
        {latest && (
          <li className="w-fact w-in" style={step(6)}>
            <span className="w-fact__val w-pop-b">{latest.time}</span>
            <span className="w-fact__label">
              {t('Späteste Uhrzeit')}
              <br />
              {latest.title}
            </span>
          </li>
        )}
      </ul>
    </Stage>
  );
};

export default LateNightSlide;
