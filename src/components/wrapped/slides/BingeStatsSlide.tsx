import React from 'react';
import { t } from '../../../services/i18n';
import type { BingeSessionStats } from '../../../types/Wrapped';
import { Count, EmptyStage, Giant, Poster, Stage, type SlideProps } from '../kit';
import { step, tmdbImage } from '../kitHelpers';

interface BingeStatsSlideProps extends SlideProps {
  totalBingeSessions: number;
  longestBinge: BingeSessionStats | null;
  averageBingeLength: number;
}

export const BingeStatsSlide: React.FC<BingeStatsSlideProps> = ({
  totalBingeSessions,
  longestBinge,
  averageBingeLength,
  active,
  posters,
}) => {
  if (totalBingeSessions === 0 || !longestBinge) {
    return (
      <EmptyStage
        active={active}
        posters={posters}
        title={t('Kein Binge-Watching')}
        hint={t('Du hast dieses Jahr gemäßigt geschaut!')}
      />
    );
  }
  return (
    <Stage active={active} posters={posters} art={tmdbImage(longestBinge.poster, 'w342')}>
      <div className="w-copy w-stack">
        <p className="w-kicker w-in" style={step(0)}>
          {t('Längste Session')}
        </p>
        <Giant value={longestBinge.episodeCount} />
        <p className="w-title w-title--sm w-in" style={step(3)}>
          {t('Folgen am Stück')}
        </p>
        <div
          className="w-in"
          style={step(4, {
            display: 'flex',
            alignItems: 'center',
            gap: 'calc(var(--u) * 4)',
          })}
        >
          {longestBinge.poster && (
            <Poster
              src={tmdbImage(longestBinge.poster, 'w185')}
              title={longestBinge.seriesTitle}
              tilt={-4}
              style={{ width: 'calc(var(--u) * 16)', flexShrink: 0 }}
            />
          )}
          <p className="w-line w-pop-b">{longestBinge.seriesTitle}</p>
        </div>
      </div>
      <ul className="w-facts w-visual">
        <li className="w-fact w-in" style={step(5)}>
          <span className="w-fact__val">
            <Count value={totalBingeSessions} active={active} />
          </span>
          <span className="w-fact__label">{t('Binge-Sessions')}</span>
        </li>
        <li className="w-fact w-in" style={step(6)}>
          <span className="w-fact__val">
            <Count value={Math.round(averageBingeLength)} active={active} />
          </span>
          <span className="w-fact__label">
            {t('Episoden')} {t('pro Session')}
          </span>
        </li>
        <li className="w-fact w-in" style={step(7)}>
          <span className="w-fact__val w-fact__val--text">
            {t('{h} Std {m} Min', {
              h: Math.floor(longestBinge.totalMinutes / 60),
              m: longestBinge.totalMinutes % 60,
            })}
          </span>
          <span className="w-fact__label">{t('am Stück')}</span>
        </li>
      </ul>
    </Stage>
  );
};

export default BingeStatsSlide;
