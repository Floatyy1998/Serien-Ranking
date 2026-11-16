import React from 'react';
import { dateLocale, t } from '../../../services/i18n';
import type { FirstLastWatch } from '../../../types/Wrapped';
import { EmptyStage, Poster, Stage, type SlideProps } from '../kit';
import { step, tmdbImage } from '../kitHelpers';

interface FirstLastSlideProps extends SlideProps {
  firstWatch: FirstLastWatch | null;
  lastWatch: FirstLastWatch | null;
  year: number;
}

const day = (iso: string): string => {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(dateLocale(), { day: 'numeric', month: 'long' });
};

const Entry: React.FC<{ watch: FirstLastWatch; label: string; tilt: number; i: number }> = ({
  watch,
  label,
  tilt,
  i,
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'calc(var(--u) * 34) minmax(0, 1fr)',
      gap: 'calc(var(--u) * 5)',
      alignItems: 'center',
    }}
  >
    <Poster
      className="w-throw"
      src={tmdbImage(watch.poster)}
      title={watch.title}
      tilt={tilt}
      style={step(i, { '--from-x': tilt < 0 ? '-60%' : '60%' } as React.CSSProperties)}
    />
    <div className="w-stack w-in" style={step(i + 2)}>
      <p className="w-kicker">{label}</p>
      <p className="w-title w-title--sm w-pop">{day(watch.date)}</p>
      <p className="w-line">{watch.title}</p>
      {watch.subtitle && <p className="w-note">{watch.subtitle}</p>}
    </div>
  </div>
);

export const FirstLastSlide: React.FC<FirstLastSlideProps> = ({
  firstWatch,
  lastWatch,
  year,
  active,
  posters,
}) => {
  if (!firstWatch && !lastWatch) {
    return (
      <EmptyStage
        active={active}
        posters={posters}
        title={t('Dein {year} - Start bis Ende', { year })}
        hint={t('Keine Daten verfügbar')}
      />
    );
  }
  return (
    <Stage
      active={active}
      posters={posters}
      art={tmdbImage((lastWatch ?? firstWatch)?.poster, 'w342')}
    >
      {firstWatch && <Entry watch={firstWatch} label={t('So fing dein Jahr an')} tilt={-4} i={0} />}
      {lastWatch && <Entry watch={lastWatch} label={t('Und das lief zuletzt')} tilt={4} i={3} />}
    </Stage>
  );
};

export default FirstLastSlide;
