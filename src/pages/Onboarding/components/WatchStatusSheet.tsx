import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { fetchStaticCatalogSeasons } from '../../../services/staticCatalog';
import type { CatalogSeason } from '../../../types/CatalogTypes';
import type { WatchTarget } from '../hooks/useApplyWatchProgress';
import { EpisodePicker } from './EpisodePicker';
import { t } from '../../../services/i18n';

interface Props {
  open: boolean;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  initial: WatchTarget;
  onClose: () => void;
  onConfirm: (target: WatchTarget) => void;
}

type SheetView = 'choose' | 'picker';

export const WatchStatusSheet: React.FC<Props> = ({
  open,
  tmdbId,
  title,
  posterPath,
  initial,
  onClose,
  onConfirm,
}) => {
  const [view, setView] = useState<SheetView>(initial.kind === 'upToEpisode' ? 'picker' : 'choose');
  const [target, setTarget] = useState<WatchTarget>(initial);
  const [seasons, setSeasons] = useState<CatalogSeason[] | null>(null);
  const fetchStartedRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    if (fetchStartedRef.current) return;
    fetchStartedRef.current = true;
    fetchStaticCatalogSeasons(tmdbId).then((data) => {
      if (!data) {
        setSeasons([]);
        return;
      }
      const sorted = Object.entries(data)
        .map(([k, v]) => ({ key: Number(k), season: v }))
        .filter((e) => !Number.isNaN(e.key))
        .sort((a, b) => a.key - b.key)
        .map((e) => e.season);
      setSeasons(sorted);
    });
  }, [open, tmdbId]);

  const choose = (next: WatchTarget) => {
    setTarget(next);
    if (next.kind === 'upToEpisode') setView('picker');
  };

  const confirm = () => {
    onConfirm(target);
    onClose();
  };

  const backdropUrl = posterPath ? `https://image.tmdb.org/t/p/w780${posterPath}` : undefined;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="ob-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="ob-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.3 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 600) onClose();
            }}
          >
            <div className="ob-sheet__handle" />

            <div className="ob-sheet__hero">
              {backdropUrl && (
                <div
                  className="ob-sheet__hero-img"
                  style={{ backgroundImage: `url(${backdropUrl})` }}
                />
              )}
              <div className="ob-sheet__hero-overlay" />

              <div className="ob-sheet__title">
                <span className="ob-mono" style={{ color: 'rgba(244,237,224,0.55)' }}>
                  {t('Wo bist du bei')}
                </span>
                <h2
                  className="ob-display"
                  style={{
                    margin: '4px 0 0',
                    fontSize: 'clamp(28px, 6.5vw, 44px)',
                    color: 'var(--ob-paper)',
                  }}
                >
                  {title}
                </h2>
              </div>
            </div>

            <div className="ob-sheet__body">
              <AnimatePresence mode="wait">
                {view === 'choose' && (
                  <motion.div
                    key="choose"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                  >
                    <ChoiceRow
                      index="01"
                      title={t('Noch nicht gesehen')}
                      sub={t('Steht auf der Watchlist')}
                      selected={target.kind === 'none'}
                      onClick={() => choose({ kind: 'none' })}
                    />
                    <ChoiceRow
                      index="02"
                      title={t('Bin mittendrin')}
                      sub={t('Episode auswählen')}
                      selected={target.kind === 'upToEpisode'}
                      onClick={() =>
                        choose(
                          target.kind === 'upToEpisode'
                            ? target
                            : { kind: 'upToEpisode', seasonIdx: 0, episodeIdx: 0 }
                        )
                      }
                    />
                    <ChoiceRow
                      index="03"
                      title={t('Komplett gesehen')}
                      sub={t('Alle Episoden abhaken')}
                      selected={target.kind === 'total'}
                      onClick={() => choose({ kind: 'total' })}
                    />
                  </motion.div>
                )}

                {view === 'picker' && (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <button
                      onClick={() => setView('choose')}
                      className="ob-link"
                      style={{ padding: 0, marginBottom: 14, fontSize: 11 }}
                    >
                      {t('← andere option')}
                    </button>
                    {seasons === null ? (
                      <div style={{ textAlign: 'center', padding: 40 }}>
                        <div
                          className="ob-card__spinner"
                          style={{ margin: '0 auto', width: 24, height: 24 }}
                        />
                        <p className="ob-mono" style={{ marginTop: 14, fontSize: 10 }}>
                          {t('lade episoden …')}
                        </p>
                      </div>
                    ) : seasons.length === 0 ? (
                      <p
                        className="ob-mono"
                        style={{
                          fontSize: 11,
                          color: 'rgba(244,237,224,0.55)',
                          textAlign: 'center',
                          padding: 30,
                          lineHeight: 1.6,
                          textTransform: 'none',
                          letterSpacing: 0,
                        }}
                      >
                        {t(
                          'Diese Serie ist noch nicht im Katalog. Wir notieren sie als watchlist — Episoden-Status kannst du später setzen.'
                        )}
                      </p>
                    ) : (
                      <EpisodePicker
                        seasons={seasons}
                        seasonIdx={target.kind === 'upToEpisode' ? target.seasonIdx : 0}
                        episodeIdx={target.kind === 'upToEpisode' ? target.episodeIdx : 0}
                        onPick={(seasonIdx, episodeIdx) =>
                          setTarget({ kind: 'upToEpisode', seasonIdx, episodeIdx })
                        }
                      />
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="ob-sheet__footer">
              <button onClick={confirm} className="ob-cta">
                <span className="ob-cta__inner">
                  <span>{t('übernehmen')}</span>
                </span>
                <span className="ob-cta__arrow">✓</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const ChoiceRow: React.FC<{
  index: string;
  title: string;
  sub: string;
  selected: boolean;
  onClick: () => void;
}> = ({ index, title, sub, selected, onClick }) => (
  <button onClick={onClick} className={`ob-choice ${selected ? 'ob-choice--active' : ''}`}>
    <span className="ob-choice__index">{index}</span>
    <div className="ob-choice__body">
      <h3 className="ob-choice__title">{title}</h3>
      <p className="ob-choice__sub">{sub}</p>
    </div>
    <span className="ob-choice__arrow">{selected ? '✓' : '→'}</span>
  </button>
);
