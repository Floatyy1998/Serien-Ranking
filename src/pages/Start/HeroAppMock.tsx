import { memo, useEffect, useState } from 'react';
import { PlayArrow, Search, Whatshot } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { t } from '../../services/i18n';
import { getLandingCovers, loadLandingCovers, type Kind, type MockItem } from './landingCovers';

/**
 * HeroAppMock — das Produkt-Schaufenster der Landing: eine stilisierte
 * Mini-App mit ECHTEN Daten (TMDB-Trends, beliebte Manga, Buch-Bestseller),
 * perspektivisch gekippt wie ein Hero-Product-Shot. Zeigt bewusst Schauen
 * und Lesen nebeneinander.
 */

const META: Record<Kind, () => string> = {
  series: () => t('Staffel 2 · Folge 5'),
  manga: () => t('Kapitel {n}', { n: 112 }),
  book: () => t('S. {page} / {total}', { page: 214, total: 528 }),
};
const PROGRESS: Record<Kind, number> = { series: 72, manga: 58, book: 41 };

export const HeroAppMock = memo(() => {
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

  const series = data?.series ?? [];
  const manga = data?.manga ?? [];
  const books = data?.books ?? [];
  const banners = [
    series.find((s) => s.art),
    manga.find((m) => m.art) ?? manga[0],
    books[0],
  ].filter((item): item is MockItem => !!item);
  const used = new Set(banners.map((b) => b.poster));
  const fresh = (list: MockItem[]) => list.filter((item) => !used.has(item.poster));
  const posters = [
    ...fresh(series).slice(0, 2),
    ...fresh(manga).slice(0, 2),
    ...fresh(books).slice(0, 2),
  ];
  const trending = [0, 2, 4, 1, 3, 5].map((i) => posters[i]).filter(Boolean);

  return (
    <motion.div
      className="sm-float"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
    >
      <div className="sm-window" aria-hidden>
        <div className="sm-topbar">
          <span className="sm-brand-dot" />
          <span className="sm-search">
            <Search sx={{ fontSize: 15 }} />
            {t('Serien, Filme, Manga, Bücher …')}
          </span>
          <span className="sm-avatar" />
        </div>

        <div className="sm-label">
          <PlayArrow sx={{ fontSize: 15 }} /> {t('Gerade dabei')}
        </div>
        <div className="sm-banners">
          {(banners.length === 3 ? banners : Array.from({ length: 3 })).map((item, i) => {
            const b = item as MockItem | undefined;
            return (
              <div key={i} className={`sm-banner ${b ? '' : 'sm-skeleton'}`}>
                {b && (
                  <div
                    className={`sm-banner-art ${b.art ? '' : 'sm-banner-art--cover'}`}
                    style={{ backgroundImage: `url(${b.art ?? b.poster})` }}
                  />
                )}
                {b && (
                  <div className="sm-banner-left">
                    <div
                      className="sm-banner-poster"
                      style={{ backgroundImage: `url(${b.poster})` }}
                    />
                    <div className="sm-banner-info">
                      <span className="sm-banner-title">{b.title}</span>
                      <span className="sm-banner-meta">{META[b.kind]()}</span>
                      <span className="sm-progress">
                        <i style={{ width: `${PROGRESS[b.kind]}%` }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="sm-label">
          <Whatshot sx={{ fontSize: 15 }} /> Trending
        </div>
        <div className="sm-posters">
          {(trending.length === 6 ? trending : Array.from({ length: 6 })).map((item, i) => {
            const p = item as MockItem | undefined;
            return (
              <div
                key={i}
                className={`sm-poster ${p ? '' : 'sm-skeleton'}`}
                style={p ? { backgroundImage: `url(${p.poster})` } : undefined}
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});

HeroAppMock.displayName = 'HeroAppMock';
