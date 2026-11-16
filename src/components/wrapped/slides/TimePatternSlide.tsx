import React from 'react';
import { t } from '../../../services/i18n';
import type { DayOfWeekStats, TimeOfDayStats } from '../../../types/Wrapped';
import { Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';

interface TimePatternSlideProps extends SlideProps {
  favoriteTimeOfDay: TimeOfDayStats;
  favoriteDayOfWeek: DayOfWeekStats;
}

const timeLabel = (key: string, fallback: string): string => {
  switch (key) {
    case 'morning':
      return t('Morgens');
    case 'afternoon':
      return t('Nachmittags');
    case 'evening':
      return t('Abends');
    case 'night':
      return t('Nachts');
    default:
      return fallback;
  }
};

/** Start des hervorgehobenen Viertels auf dem 24-Stunden-Zifferblatt (0 Uhr oben). */
const QUARTER_START: Record<string, number> = {
  night: 0,
  morning: 90,
  afternoon: 180,
  evening: 270,
};
const QUARTER_HOURS: Record<string, string> = {
  night: '0–6',
  morning: '6–12',
  afternoon: '12–18',
  evening: '18–24',
};

export const TimePatternSlide: React.FC<TimePatternSlideProps> = ({
  favoriteTimeOfDay,
  favoriteDayOfWeek,
  active,
  posters,
}) => {
  const key = favoriteTimeOfDay.timeOfDay;
  return (
    <Stage active={active} posters={posters}>
      <div className="w-visual">
        <div
          className="w-clock"
          style={{ '--from': `${QUARTER_START[key] ?? 0}deg` } as React.CSSProperties}
        >
          <span>{QUARTER_HOURS[key] ?? ''}</span>
        </div>
      </div>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Deine Peak-Zeit')}
        </p>
        <h2 className="w-title w-slam w-pop">{timeLabel(key, favoriteTimeOfDay.label)}</h2>
        <p className="w-line w-in" style={step(3)}>
          {Math.round(favoriteTimeOfDay.percentage)}% {t('deiner Views')}
        </p>
        <ul className="w-facts">
          <li className="w-fact w-in" style={step(5)}>
            <span className="w-fact__val w-fact__val--text">{favoriteDayOfWeek.dayName}</span>
            <span className="w-fact__label">{t('Dein liebster Serien-Tag')}</span>
          </li>
        </ul>
      </div>
    </Stage>
  );
};

export default TimePatternSlide;
