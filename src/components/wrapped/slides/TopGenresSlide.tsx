import React from 'react';
import { t } from '../../../services/i18n';
import type { TopGenreEntry } from '../../../types/Wrapped';
import { EmptyStage, Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

interface TopGenresSlideProps extends SlideProps {
  topGenres: TopGenreEntry[];
  maxDisplay?: number;
}

export const TopGenresSlide: React.FC<TopGenresSlideProps> = ({
  topGenres,
  maxDisplay = 5,
  active,
  posters,
}) => {
  const genres = topGenres.slice(0, maxDisplay);
  if (genres.length === 0) {
    return (
      <EmptyStage
        active={active}
        posters={posters}
        title={t('Keine Genre-Daten')}
        hint={t('Schau mehr Serien und Filme!')}
      />
    );
  }
  const top = genres[0];
  const topName = t(top.genre);
  const max = top.percentage || 1;
  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Dein Lieblings-Genre')}
        </p>
        {/* Lange Namen bekommen eine kleinere Schrift, damit sie höchstens zwei Zeilen brauchen. */}
        <h2
          className="w-title w-slam w-pop"
          style={{
            fontSize: `calc(var(--u) * ${Math.min(17, 190 / Math.max(8, topName.length))})`,
          }}
        >
          {topName}
        </h2>
        <p className="w-line w-in" style={step(3)}>
          {Math.round(top.percentage)}% {t('deiner Watchtime')}
        </p>
      </div>
      <ol className="w-bars w-visual">
        {genres.map((genre, i) => (
          <li key={genre.genre} className="w-side" style={step(i + 3)}>
            <div className="w-bar__head">
              <span>{t(genre.genre)}</span>
              <span>{Math.round(genre.percentage)}%</span>
            </div>
            <div className="w-bar__track">
              <div
                className="w-bar__fill"
                style={step(i + 3, {
                  '--w': `${(genre.percentage / max) * 100}%`,
                } as React.CSSProperties)}
              />
            </div>
          </li>
        ))}
      </ol>
    </Stage>
  );
};

export default TopGenresSlide;
