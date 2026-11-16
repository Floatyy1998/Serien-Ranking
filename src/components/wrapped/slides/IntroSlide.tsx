import React from 'react';
import { t } from '../../../services/i18n';
import { Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

interface IntroSlideProps extends SlideProps {
  year: number;
  username?: string;
}

export const IntroSlide: React.FC<IntroSlideProps> = ({ year, username, posters = [], active }) => {
  const hasWall = posters.filter(Boolean).length >= 4;
  return (
    <Stage
      active={active}
      posters={posters}
      single
      backdrop={
        hasWall ? undefined : (
          <div className="w-echo" aria-hidden>
            <span>{year}</span>
            <span>{year}</span>
            <span>{year}</span>
          </div>
        )
      }
    >
      <div className="w-copy w-stack">
        {username && (
          <p className="w-kicker w-in" style={step(0)}>
            {t('Hey {name}!', { name: username })}
          </p>
        )}
        <h1 className="w-giant w-slam" style={step(1, { '--len': 4.4 } as React.CSSProperties)}>
          {year}
        </h1>
        <p className="w-title w-title--sm w-pop w-slam" style={step(5)}>
          {t('Dein Jahr in Serien & Filmen')}
        </p>
      </div>
    </Stage>
  );
};

export default IntroSlide;
