import React, { useState } from 'react';
import { hapticTap } from '../../../lib/interaction/haptics';
import { t } from '../../../services/i18n';
import type { WrappedStats } from '../../../types/Wrapped';
import { Count, Stage, type SlideProps } from '../kit';
import { step } from '../kitHelpers';
import { WrappedShareSheet } from '../WrappedShareCard';
import { pickYearHighlights, yearFacts } from '../../../lib/wrapped/yearHighlights';
import { factLabel, highlightKindLabel } from '../yearLabels';

interface SummarySlideProps extends SlideProps {
  stats: WrappedStats;
}

export const SummarySlide: React.FC<SummarySlideProps> = ({ stats, active, posters }) => {
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const topGenre = stats.topGenres[0];

  // Nur was dieses Konto wirklich hat: Leser sehen Bücher und Seiten statt Nullen.
  const facts = yearFacts(stats).slice(0, 6);
  const topPick = pickYearHighlights(stats, 1, 1)[0];

  return (
    <Stage active={active} posters={posters}>
      <div className="w-copy w-stack">
        <h2 className="w-title w-slam w-pop">{t('Dein {year}', { year: stats.year })}</h2>
        <p className="w-line w-in" style={step(2)}>
          {t('in Zahlen')}
        </p>
        {(topPick || topGenre) && (
          <p className="w-note w-in" style={step(3)}>
            {[
              topPick ? `${highlightKindLabel(topPick.kind)}: ${topPick.title}` : '',
              topGenre ? `${t('Lieblings-Genre')}: ${t(topGenre.genre)}` : '',
            ]
              .filter(Boolean)
              .join('. ')}
          </p>
        )}
        <div className="w-actions w-in" style={step(9)}>
          <button
            type="button"
            className="w-btn"
            onClick={() => {
              hapticTap();
              setShareCardOpen(true);
            }}
            aria-label={t('Jahresrückblick als Bild teilen')}
          >
            {t('Teilen')}
          </button>
        </div>
      </div>

      <ul className="w-facts w-visual">
        {facts.map((fact, i) => (
          <li key={fact.key} className="w-fact w-in" style={step(i + 3)}>
            <span className="w-fact__val">
              <Count value={fact.value} active={active} />
            </span>
            <span className="w-fact__label">{factLabel(fact.key)}</span>
          </li>
        ))}
      </ul>

      {/* Gesten im Sheet dürfen die Folien nicht weiterblättern: Portal-Events
          steigen durch den React-Baum bis zum Folien-Container auf. */}
      <div
        style={{ display: 'contents' }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <WrappedShareSheet
          isOpen={shareCardOpen}
          onClose={() => setShareCardOpen(false)}
          stats={stats}
        />
      </div>
    </Stage>
  );
};

export default SummarySlide;
