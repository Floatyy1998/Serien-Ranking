import { memo, useEffect, useState } from 'react';
import { PlayArrow, Search, Whatshot } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getTmdbApiKey, tmdbFetch } from '../../services/tmdbClient';

/**
 * HeroAppMock — das Produkt-Schaufenster der Landing: eine stilisierte
 * Mini-App (Weiterschauen-Banner + Trending-Poster) aus ECHTEN
 * TMDB-Trending-Daten, perspektivisch gekippt wie ein Hero-Product-Shot.
 */

interface MockItem {
  title: string;
  poster: string | null;
  backdrop: string | null;
}

type TmdbTrendingResponse = {
  results?: Array<{
    name?: string;
    title?: string;
    poster_path?: string | null;
    backdrop_path?: string | null;
  }>;
};

// Modul-Cache: die Landing soll beim Navigieren Login→Start nicht neu laden.
let cachedItems: MockItem[] | null = null;

async function loadTrending(): Promise<MockItem[]> {
  if (cachedItems) return cachedItems;
  if (!getTmdbApiKey()) return [];
  try {
    const data = await tmdbFetch<TmdbTrendingResponse>('trending/tv/week');
    const items = (data.results || [])
      .map((r) => ({
        title: r.name || r.title || '',
        poster: r.poster_path || null,
        backdrop: r.backdrop_path || null,
      }))
      .filter((r) => r.title && (r.poster || r.backdrop));
    cachedItems = items;
    return items;
  } catch {
    return [];
  }
}

const PROGRESS = [72, 38, 55];
const FAKE_META = ['Staffel 2 · Folge 5', 'Staffel 1 · Folge 8', 'Staffel 4 · Folge 12'];

export const HeroAppMock = memo(() => {
  const [items, setItems] = useState<MockItem[]>(cachedItems ?? []);

  useEffect(() => {
    if (cachedItems) return;
    let cancelled = false;
    loadTrending().then((list) => {
      if (!cancelled) setItems(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const banners = items.filter((i) => i.backdrop && i.poster).slice(0, 3);
  const posters = items.filter((i) => i.poster).slice(3, 9);

  return (
    <motion.div
      className="sm-float"
      initial={{ opacity: 0, y: 32 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, ease: 'easeOut' }}
    >
      <div className="sm-window" aria-hidden>
        {/* Kopfzeile der Mini-App */}
        <div className="sm-topbar">
          <span className="sm-brand-dot" />
          <span className="sm-search">
            <Search sx={{ fontSize: 15 }} />
            Suche nach Serien oder Filmen
          </span>
          <span className="sm-avatar" />
        </div>

        {/* Weiterschauen: Kino-Banner-Zeilen */}
        <div className="sm-label">
          <PlayArrow sx={{ fontSize: 15 }} /> Weiterschauen
        </div>
        <div className="sm-banners">
          {(banners.length ? banners : Array.from({ length: 3 })).map((item, i) => {
            const b = item as MockItem | undefined;
            return (
              <div key={i} className={`sm-banner ${b ? '' : 'sm-skeleton'}`}>
                {/* Backdrop-Art läuft rechts mit Maske ein (App-Kino-Zeile) */}
                {b?.backdrop && (
                  <div
                    className="sm-banner-art"
                    style={{
                      backgroundImage: `url(https://image.tmdb.org/t/p/w780${b.backdrop})`,
                    }}
                  />
                )}
                {b && (
                  <div className="sm-banner-left">
                    {b.poster && (
                      <div
                        className="sm-banner-poster"
                        style={{
                          backgroundImage: `url(https://image.tmdb.org/t/p/w185${b.poster})`,
                        }}
                      />
                    )}
                    <div className="sm-banner-info">
                      <span className="sm-banner-title">{b.title}</span>
                      <span className="sm-banner-meta">{FAKE_META[i % FAKE_META.length]}</span>
                      <span className="sm-progress">
                        <i style={{ width: `${PROGRESS[i % PROGRESS.length]}%` }} />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Trending: Poster-Reihe */}
        <div className="sm-label">
          <Whatshot sx={{ fontSize: 15 }} /> Trending
        </div>
        <div className="sm-posters">
          {(posters.length ? posters : Array.from({ length: 6 })).map((item, i) => {
            const p = item as MockItem | undefined;
            return (
              <div
                key={i}
                className={`sm-poster ${p?.poster ? '' : 'sm-skeleton'}`}
                style={
                  p?.poster
                    ? {
                        backgroundImage: `url(https://image.tmdb.org/t/p/w342${p.poster})`,
                      }
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </motion.div>
  );
});
HeroAppMock.displayName = 'HeroAppMock';
