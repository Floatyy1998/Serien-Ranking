import React from 'react';
import { t } from '../../../services/i18n';
import { Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';
import type { YearMedia } from '../../../lib/wrapped/yearHighlights';
import { yearTagline } from '../yearLabels';

interface IntroSlideProps extends SlideProps {
  year: number;
  username?: string;
  media?: YearMedia;
}

const WATCH_ONLY: YearMedia = { watch: true, manga: false, books: false };

export const IntroSlide: React.FC<IntroSlideProps> = ({
  year,
  username,
  media = WATCH_ONLY,
  posters = [],
  active,
}) => {
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
          {yearTagline(media)}
        </p>
      </div>
    </Stage>
  );
};

export default IntroSlide;
