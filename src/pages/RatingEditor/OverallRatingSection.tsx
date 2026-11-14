import { motion } from 'framer-motion';
import { tapScale } from '../../lib/motion';
import { t } from '../../services/i18n';
import { getImageUrl } from '../../utils/imageUrl';
import { bucketOf, type RankingView, type RatedPeer } from './ratingRanking';
import { verdictIndex, verdicts } from './verdicts';

interface OverallRatingSectionProps {
  overallRating: number;
  onRatingChange: (value: number) => void;
  ranking?: RankingView;
  poster?: string;
  title?: string;
  mediaType?: 'series' | 'movie';
}

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const clampRating = (value: number) => Math.round(Math.min(10, Math.max(0, value)) * 10) / 10;

const Neighbour = ({ peer, far }: { peer: RatedPeer; far?: boolean }) => (
  <li className={`re-rank__item${far ? ' is-far' : ''}`}>
    <img src={getImageUrl(peer.poster, 'w185')} alt="" loading="lazy" />
    <span className="re-rank__score">{peer.rating.toFixed(1)}</span>
    <span className="re-rank__name">{peer.title}</span>
  </li>
);

export const OverallRatingSection = ({
  overallRating,
  onRatingChange,
  ranking,
  poster,
  title,
  mediaType,
}: OverallRatingSectionProps) => {
  const activeVerdict = verdictIndex(overallRating);
  const peak = ranking ? Math.max(1, ...ranking.buckets) : 1;
  const currentBucket = overallRating > 0 ? bucketOf(overallRating) : -1;
  const rated = ranking ? ranking.total - 1 : 0;

  return (
    <motion.div
      key="overall"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="re-overall"
    >
      <section className="re-panel">
        <h2 className="re-h">{t('Wie gut war es?')}</h2>

        {ranking && rated > 0 && (
          <div className="re-histo" aria-hidden>
            {ranking.buckets.map((count, i) => (
              <span
                key={i}
                className={`re-histo__bar${i === currentBucket ? ' is-current' : ''}`}
                style={{ height: `${count === 0 ? 0 : Math.max(8, (count / peak) * 100)}%` }}
              />
            ))}
          </div>
        )}

        <div className="re-scale">
          <div className="re-scale__track" aria-hidden>
            {STEPS.map((step) => (
              <span key={step} className="re-scale__seg">
                <span
                  className="re-scale__fill"
                  style={{
                    width: `${Math.min(1, Math.max(0, overallRating - (step - 1))) * 100}%`,
                  }}
                />
              </span>
            ))}
            {overallRating > 0 && (
              <span className="re-scale__marker" style={{ left: `${overallRating * 10}%` }} />
            )}
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={overallRating}
            onChange={(e) => onRatingChange(parseFloat(e.target.value))}
            className="re-scale__input"
            aria-label={t('Gesamtbewertung')}
            aria-valuetext={t('{value} von 10', { value: overallRating.toFixed(1) })}
          />
        </div>

        <div className="re-nums">
          {STEPS.map((value) => (
            <motion.button
              key={value}
              type="button"
              className={`re-num${Math.round(overallRating) === value ? ' is-active' : ''}`}
              onClick={() => onRatingChange(value)}
              whileTap={tapScale}
            >
              {value}
            </motion.button>
          ))}
        </div>

        {ranking && rated > 0 && (
          <p className="re-note">
            {t('Die Balken zeigen, wie du deine {n} anderen Wertungen verteilt hast.', {
              n: rated,
            })}
          </p>
        )}

        <div className="re-fine">
          <div className="re-verdicts">
            {verdicts.map((verdict, i) => (
              <motion.button
                key={verdict.value}
                type="button"
                aria-pressed={activeVerdict === i}
                className={`re-verdict${activeVerdict === i ? ' is-active' : ''}`}
                onClick={() => onRatingChange(verdict.value)}
                whileTap={tapScale}
              >
                {t(verdict.label)}
              </motion.button>
            ))}
          </div>
          <div className="re-stepper">
            <motion.button
              type="button"
              className="re-step"
              aria-label={t('Ein Zehntel weniger')}
              disabled={overallRating <= 0}
              onClick={() => onRatingChange(clampRating(overallRating - 0.1))}
              whileTap={tapScale}
            >
              − 0.1
            </motion.button>
            <motion.button
              type="button"
              className="re-step"
              aria-label={t('Ein Zehntel mehr')}
              disabled={overallRating >= 10}
              onClick={() => onRatingChange(clampRating(overallRating + 0.1))}
              whileTap={tapScale}
            >
              + 0.1
            </motion.button>
          </div>
        </div>
      </section>

      {ranking && rated > 0 && (
        <section className="re-panel">
          <h2 className="re-h">
            {mediaType === 'movie'
              ? t('In deiner Film-Rangliste')
              : t('In deiner Serien-Rangliste')}
          </h2>
          {overallRating > 0 ? (
            <>
              <p className="re-place">
                <span className="re-place__of">{t('Platz')}</span>
                <span className="re-place__num">{ranking.place}</span>
                <span className="re-place__of">{t('von {total}', { total: ranking.total })}</span>
              </p>
              <ol className="re-rank">
                {ranking.above.map((peer, i) => (
                  <Neighbour key={peer.id} peer={peer} far={ranking.above.length > 2 && i === 0} />
                ))}
                <li className="re-rank__item is-self">
                  <img src={getImageUrl(poster, 'w185')} alt="" />
                  <span className="re-rank__score">{overallRating.toFixed(1)}</span>
                  <span className="re-rank__name">{title}</span>
                </li>
                {ranking.below.map((peer, i) => (
                  <Neighbour key={peer.id} peer={peer} far={i === 2} />
                ))}
              </ol>
            </>
          ) : (
            <p className="re-empty">
              {t('Wähl eine Wertung — dann siehst du hier, zwischen welchen Titeln er landet.')}
            </p>
          )}
        </section>
      )}
    </motion.div>
  );
};
