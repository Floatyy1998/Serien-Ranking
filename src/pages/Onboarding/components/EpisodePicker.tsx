import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import type { CatalogSeason } from '../../../types/CatalogTypes';
import { t } from '../../../services/i18n';

interface Props {
  seasons: CatalogSeason[];
  seasonIdx: number;
  episodeIdx: number;
  onPick: (seasonIdx: number, episodeIdx: number) => void;
}

function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') return Object.values(value as Record<string, T>);
  return [];
}

export const EpisodePicker: React.FC<Props> = ({ seasons, seasonIdx, episodeIdx, onPick }) => {
  const [activeSeason, setActiveSeason] = useState(seasonIdx);
  const tabsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveSeason(seasonIdx);
  }, [seasonIdx]);

  useEffect(() => {
    const tabs = tabsRef.current;
    if (!tabs) return;
    const btn = tabs.querySelector<HTMLElement>(`[data-season-idx='${activeSeason}']`);
    btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeSeason]);

  const currentSeason = seasons[activeSeason];
  // Katalog liefert episodes je nach Serie als Array ODER als (sparse) Objekt —
  // defensiv zu einem Array normalisieren, sonst wirft `.map`.
  const episodes = toArray<CatalogSeason['episodes'][number]>(currentSeason?.episodes);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <p
        className="ob-mono"
        style={{
          color: 'rgba(244,237,224,0.55)',
          fontSize: 10,
          letterSpacing: '0.06em',
          textTransform: 'none',
        }}
      >
        {t('Tippe die letzte gesehene Episode an — alles davor wird abgehakt.')}
      </p>

      <div ref={tabsRef} className="ob-season-tabs">
        {seasons.map((s, i) => {
          const active = i === activeSeason;
          return (
            <button
              key={i}
              data-season-idx={i}
              onClick={() => setActiveSeason(i)}
              className={`ob-season-tab ${active ? 'ob-season-tab--active' : ''}`}
            >
              S{String(i + 1).padStart(2, '0')}
              <span style={{ opacity: 0.55, marginLeft: 6 }}>{toArray(s.episodes).length}</span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '48vh',
          overflow: 'auto',
        }}
      >
        {episodes.map((ep, i) => {
          const isPicked = activeSeason === seasonIdx && i === episodeIdx;
          const isCovered =
            activeSeason < seasonIdx || (activeSeason === seasonIdx && i <= episodeIdx);
          return (
            <motion.button
              key={ep.id ?? i}
              whileTap={{ scale: 0.99 }}
              onClick={() => onPick(activeSeason, i)}
              className={`ob-episode ${isCovered ? 'ob-episode--covered' : ''} ${isPicked ? 'ob-episode--picked' : ''}`}
            >
              <span className="ob-episode__num">e{String(i + 1).padStart(2, '0')}</span>
              <h4 className="ob-episode__title">{ep.name || t('Episode {n}', { n: i + 1 })}</h4>
              {ep.airDate && !isPicked && (
                <span className="ob-episode__date">
                  {new Date(ep.airDate)
                    .toLocaleDateString('de-DE', {
                      day: '2-digit',
                      month: '2-digit',
                      year: '2-digit',
                    })
                    .split('.')
                    .join('·')}
                </span>
              )}
              {isPicked && <span className="ob-episode__here">{t('hier')}</span>}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
