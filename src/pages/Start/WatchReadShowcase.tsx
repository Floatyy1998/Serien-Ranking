import { AutoStories, Check, LiveTv } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { t } from '../../services/i18n';
import { getLandingCovers, loadLandingCovers, type LandingCovers } from './landingCovers';

// Marketing-Akzente der Pre-Auth-Landing (siehe FeaturesGrid) — bewusst fix.
const SIDES = [
  {
    key: 'watch',
    icon: LiveTv,
    color: '#ef6f8a',
    title: 'Schauen',
    claim: 'Serien, Filme und Anime',
    points: [
      'Folgen abhaken – einzeln, staffelweise oder per Wisch',
      'Kalender mit allem, was diese Woche läuft',
      'Wo es läuft: Streaming-Anbieter für dein Land',
      'Anime mit Filler- und Recap-Markierung',
    ],
    covers: (data: LandingCovers | null) => data?.series.slice(6, 9) ?? [],
  },
  {
    key: 'read',
    icon: AutoStories,
    color: '#f2a648',
    title: 'Lesen',
    claim: 'Manga, Manhwa und Bücher',
    points: [
      'Neue Kapitel im Blick – nach Kapiteln oder Bänden',
      'Bücher mit Seiten, Lesedatum und Jahresziel',
      'ISBN-Scanner für Bücher und Manga-Bände',
      'Bücher zu deinen Lieblingsserien',
    ],
    covers: (data: LandingCovers | null) =>
      [data?.manga[4], data?.books[3], data?.manga[5]].filter(
        (item): item is LandingCovers['manga'][number] => !!item
      ),
  },
] as const;

/** Die zwei Hälften der App nebeneinander — damit Leser sofort sehen, dass sie gemeint sind. */
export const WatchReadShowcase = () => {
  const [data, setData] = useState(getLandingCovers);

  useEffect(() => {
    if (data) return;
    let cancelled = false;
    loadLandingCovers().then((loaded) => {
      if (!cancelled) setData(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [data]);

  return (
    <section className="start-features-section">
      <h2 className="start-features-heading" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
        {t('Schauen und Lesen an einem Ort')}
      </h2>
      <p className="start-features-subheading" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
        {t('Ob Staffelfinale oder neues Kapitel – TV-Rank merkt sich, wo du stehst.')}
      </p>
      <div className="start-showcase-grid">
        {SIDES.map((side, i) => {
          const Icon = side.icon;
          return (
            <motion.div
              key={side.key}
              className="start-showcase-card"
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{
                background: `linear-gradient(150deg, ${side.color}1f 0%, rgba(255,255,255,0.03) 55%)`,
                borderColor: `${side.color}40`,
              }}
            >
              <div className="start-showcase-fan" aria-hidden>
                {side.covers(data).map((item, idx) => (
                  <span
                    key={item.poster}
                    className="start-showcase-cover"
                    style={{
                      backgroundImage: `url(${item.poster})`,
                      transform: `rotate(${(idx - 1) * 9}deg) translateY(${idx === 1 ? -8 : 0}px)`,
                      zIndex: idx === 1 ? 2 : 1,
                    }}
                  />
                ))}
              </div>
              <div className="start-showcase-icon" style={{ background: `${side.color}22` }}>
                <Icon style={{ color: side.color, fontSize: 26 }} />
              </div>
              <h3 className="start-showcase-title">{t(side.title)}</h3>
              <p className="start-showcase-claim" style={{ color: side.color }}>
                {t(side.claim)}
              </p>
              <ul className="start-showcase-list">
                {side.points.map((point) => (
                  <li key={point}>
                    <Check style={{ color: side.color, fontSize: 18, flexShrink: 0 }} />
                    <span>{t(point)}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
