import ChevronRight from '@mui/icons-material/ChevronRight';
import { memo, type CSSProperties } from 'react';
import { t } from '../../services/i18n';
import { AnimatedRing } from './StatsComponents';
import type { FormattedTime, StatsData } from './useStatsData';
import { formatTimeDetailed } from './useStatsData';
import './StatsBoard.css';

const num = (value: number) => value.toLocaleString('de-DE');

/** Kopf der Seite: die Schauzeit als eine große Zahl, darunter der Anteil von Serien und Filmen. */
export const StatsHero = memo(
  ({ stats, timeData }: { stats: StatsData; timeData: FormattedTime }) => {
    const total = Math.max(stats.seriesMinutes + stats.movieMinutes, 1);
    const seriesShare = Math.round((stats.seriesMinutes / total) * 100);
    const parts =
      timeData.breakdown.length > 0
        ? timeData.breakdown
        : [{ value: Number(timeData.value) || 0, unit: timeData.unit }];

    return (
      <section className="sb-hero">
        <h2 className="sb-label">{t('Gesamte Watchtime')}</h2>
        <p className="sb-hero__time">
          {parts.map((part) => (
            <span key={part.unit} className="sb-hero__part">
              <span className="sb-hero__num">{part.value}</span>
              <span className="sb-hero__unit">{part.unit}</span>
            </span>
          ))}
        </p>
        <div
          className="sb-split"
          role="img"
          aria-label={t('Serien {n} Prozent der Watchtime', { n: seriesShare })}
        >
          <span className="sb-split__series" style={{ width: `${seriesShare}%` }} />
        </div>
        <div className="sb-split__legend">
          <span>
            <i className="sb-dot sb-dot--series" />
            {t('Serien')} <strong>{formatTimeDetailed(stats.seriesMinutes)}</strong>
            <em>{seriesShare} %</em>
          </span>
          <span>
            <i className="sb-dot sb-dot--movies" />
            {t('Filme')} <strong>{formatTimeDetailed(stats.movieMinutes)}</strong>
            <em>{100 - seriesShare} %</em>
          </span>
        </div>
      </section>
    );
  }
);
StatsHero.displayName = 'StatsHero';

/** Fortschritt der begonnenen Serien: Ring, gesehene von erschienenen Folgen, fertige Serien. */
export const StatsProgress = memo(({ stats, color }: { stats: StatsData; color: string }) => (
  <section className="sb-progress">
    <h2 className="sb-label">{t('Fortschritt')}</h2>
    <div className="sb-progress__body">
      <div className="sb-ring">
        <AnimatedRing progress={stats.progress} size={148} strokeWidth={12} color={color} />
        <span className="sb-ring__value">{Math.min(100, Math.round(stats.progress))}%</span>
      </div>
      <div className="sb-progress__text">
        <p className="sb-progress__count">
          <strong>{num(stats.watchedEpisodes)}</strong>
          <span>{t('von {total}', { total: num(stats.totalEpisodes) })}</span>
        </p>
        <p className="sb-progress__note">{t('Folgen deiner begonnenen Serien gesehen')}</p>
        <p className="sb-progress__done">
          {t('{done} von {total} Serien fertig', {
            done: num(stats.completedSeries),
            total: num(stats.totalSeries),
          })}
        </p>
      </div>
    </div>
  </section>
));
StatsProgress.displayName = 'StatsProgress';

/** Die Kennzahlen als eine Reihe großer Zahlen — ohne Kästen, mit Haarlinien getrennt. */
export const StatsFigures = memo(({ stats }: { stats: StatsData }) => {
  const figures = [
    { key: 'episodes', value: num(stats.watchedEpisodesAll), label: t('Folgen gesehen') },
    { key: 'series', value: num(stats.totalSeries), label: t('Serien') },
    {
      key: 'movies',
      value: num(stats.totalMovies),
      label: t('Filme'),
      sub: t('{n} gesehen', { n: num(stats.watchedMovies) }),
    },
    { key: 'week', value: num(stats.lastWeekWatched), label: t('Folgen diese Woche'), hot: true },
    ...(stats.avgSeriesRating > 0
      ? [{ key: 'rs', value: stats.avgSeriesRating.toFixed(1), label: t('Ø Serien-Wertung') }]
      : []),
    ...(stats.avgMovieRating > 0
      ? [{ key: 'rm', value: stats.avgMovieRating.toFixed(1), label: t('Ø Film-Wertung') }]
      : []),
  ];

  return (
    <section className="sb-figures" aria-label={t('Kennzahlen')}>
      {figures.map((figure) => (
        <div key={figure.key} className={`sb-figure${figure.hot ? ' is-hot' : ''}`}>
          <span className="sb-figure__value">{figure.value}</span>
          <span className="sb-figure__label">{figure.label}</span>
          {figure.sub && <span className="sb-figure__sub">{figure.sub}</span>}
        </div>
      ))}
    </section>
  );
});
StatsFigures.displayName = 'StatsFigures';

/** Rangliste mit Balken: Genres oder Streaming-Dienste. */
export const StatsRanking = memo(
  ({
    title,
    items,
    translate,
  }: {
    title: string;
    items: { name: string; count: number }[];
    translate?: boolean;
  }) => {
    if (items.length === 0) return null;
    const peak = Math.max(1, ...items.map((item) => item.count));
    return (
      <section className="sb-rank">
        <h2 className="sb-label">{title}</h2>
        <ol className="sb-rank__list">
          {items.map((item, index) => (
            <li
              key={item.name}
              className="sb-rank__row"
              style={{ '--sb-fill': `${(item.count / peak) * 100}%` } as CSSProperties}
            >
              <span className="sb-rank__pos">{index + 1}</span>
              <span className="sb-rank__name">{translate ? t(item.name) : item.name}</span>
              <span className="sb-rank__count">{num(item.count)}</span>
              <span className="sb-rank__bar" aria-hidden />
            </li>
          ))}
        </ol>
      </section>
    );
  }
);
StatsRanking.displayName = 'StatsRanking';

/** Legt offen, was ausgeblendete Serien zu den Zahlen beitragen und was nicht. */
export const StatsCounting = memo(
  ({ stats, onOpenHidden }: { stats: StatsData; onOpenHidden: () => void }) => {
    if (stats.hiddenSeries === 0) return null;
    return (
      <section className="sb-counting">
        <h2 className="sb-label">{t('So wird gezählt')}</h2>
        <p className="sb-counting__lead">
          {t(
            'Du hast {n} Serien ausgeblendet. Was du davon gesehen hast, bleibt gesehen — deine Sammlung beschreiben sie aber nicht mehr.',
            { n: stats.hiddenSeries }
          )}
        </p>
        <dl className="sb-counting__rows">
          <div>
            <dt>{t('Mit ausgeblendeten')}</dt>
            <dd>
              {t('Schauzeit, gesehene Folgen ({n} davon aus ausgeblendeten Serien), letzte Woche', {
                n: num(stats.hiddenWatchedEpisodes),
              })}
            </dd>
          </div>
          <div>
            <dt>{t('Nur sichtbare')}</dt>
            <dd>{t('Anzahl Serien, Fortschritt, abgeschlossen, Bewertungen, Genres, Anbieter')}</dd>
          </div>
        </dl>
        <button type="button" className="sb-counting__link" onClick={onOpenHidden}>
          {t('Ausgeblendete Serien ansehen')}
          <ChevronRight style={{ fontSize: 18 }} />
        </button>
      </section>
    );
  }
);
StatsCounting.displayName = 'StatsCounting';
