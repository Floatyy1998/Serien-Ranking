/**
 * HomeSearchOverlay — die Suche klappt als edles Frosted-Glass-Overlay ÜBER dem
 * Homescreen auf (kein Seitenwechsel). Home bleibt durchscheinend dahinter
 * sichtbar. Ambient-Gradient-Glows, prominentes Suchfeld mit Fokus-Glow,
 * Segment-Filter und ein gestaffeltes Poster-Grid.
 *
 * Nutzt den schlanken useHomeQuickSearch (kein ?q= in der Home-URL). Per Portal
 * an document.body, damit kein transformierter Vorfahre das fixe Overlay schiebt.
 */
import { Add, Check, Close, Search, Star } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useSeriesList } from '../../../contexts/SeriesListContext';
import { useMovieList } from '../../../contexts/MovieListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { getImageUrl } from '../../../utils/imageUrl';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { tapScale } from '../../../lib/motion';
import { backendFetch } from '../../../services/backendApi';
import { trackMovieAdded, trackSeriesAdded } from '../../../services/firebase/analytics';
import { logMovieAdded, logSeriesAdded } from '../../../features/badges/minimalActivityLogger';
import { Snackbar } from '../../../components/ui';
import { useHomeQuickSearch, type QuickResult } from './useHomeQuickSearch';
import './HomeSearchOverlay.css';

type Filter = 'all' | 'series' | 'movies';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'series', label: 'Serien' },
  { key: 'movies', label: 'Filme' },
];

interface HomeSearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const HomeSearchOverlay = memo(({ open, onClose }: HomeSearchOverlayProps) => {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();
  const { query, setQuery, results, loading, recent, popular, saveRecent, removeRecent } =
    useHomeQuickSearch();
  const [filter, setFilter] = useState<Filter>('all');
  const onPrimary = getOptimalTextColor(currentTheme.primary);
  const { user } = useAuth() || {};
  const { allSeriesList: seriesList } = useSeriesList();
  const { movieList } = useMovieList();
  const [addedKeys, setAddedKeys] = useState<Set<string>>(new Set());
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  });

  const keyOf = (item: QuickResult) => `${item.type}-${item.id}`;

  const isInList = useCallback(
    (item: QuickResult) => {
      if (addedKeys.has(keyOf(item))) return true;
      const list = item.type === 'series' ? seriesList : movieList;
      return list.some((x: { id?: number }) => x.id === item.id);
    },
    [addedKeys, seriesList, movieList]
  );

  const addToList = useCallback(
    async (item: QuickResult, e: React.MouseEvent) => {
      e.stopPropagation(); // nicht zur Detailseite navigieren
      if (!user) return;
      const key = keyOf(item);
      setPendingKey(key);
      try {
        const res = await backendFetch(item.type === 'series' ? '/add' : '/addMovie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: import.meta.env.VITE_USER, id: item.id, uuid: user.uid }),
        });
        if (res.ok) {
          setAddedKeys((prev) => new Set(prev).add(key));
          setSnack({ open: true, message: `„${item.title}" hinzugefügt` });
          if (item.type === 'series') {
            trackSeriesAdded(String(item.id), item.title, 'search');
            await logSeriesAdded(user.uid, item.title, item.id, item.poster_path);
          } else {
            trackMovieAdded(String(item.id), item.title, 'search');
            await logMovieAdded(user.uid, item.title, item.id, item.poster_path);
          }
          setTimeout(() => setSnack({ open: false, message: '' }), 2500);
        }
      } catch (err) {
        console.error('Add from search failed:', err);
      } finally {
        setPendingKey(null);
      }
    },
    [user]
  );

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Beim Schließen zurücksetzen, damit das nächste Öffnen frisch startet.
  useEffect(() => {
    if (!open) {
      if (query) setQuery('');
      setFilter('all');
    }
  }, [open, query, setQuery]);

  const shown = useMemo(
    () =>
      filter === 'all'
        ? results
        : results.filter((r) => (filter === 'series' ? r.type === 'series' : r.type === 'movie')),
    [results, filter]
  );

  const hasQuery = query.trim().length >= 2;

  // Klick auf freie Fläche schließt. Interaktive Elemente (Suchfeld, Karten,
  // Chips, Buttons) sind ausgenommen — deren Klicks bubbeln zwar hierher,
  // treffen aber per closest() auf ein interaktives Ziel.
  const onBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, input, [role="button"], .hso__field')) return;
      onClose();
    },
    [onClose]
  );

  const goTo = (item: QuickResult) => {
    if (query.trim()) saveRecent(query);
    // KEIN onClose() vor navigate: das würde die Exit-Animation abspielen und
    // sich anfühlen wie „erst schließen, dann öffnen". Das Navigieren unmountet
    // Home (und damit dieses Overlay) ohnehin sofort → direkter Sprung.
    navigate(`/${item.type === 'series' ? 'series' : 'movie'}/${item.id}`);
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          key="home-search-overlay"
          className="hso"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          onClick={onBackdropClick}
          style={{ background: `${currentTheme.background.default}d9` }}
        >
          {/* Ambient-Glows */}
          <motion.div
            className="hso__glow hso__glow--1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              background: `radial-gradient(circle, ${currentTheme.primary}55, transparent 70%)`,
            }}
          />
          <motion.div
            className="hso__glow hso__glow--2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            style={{
              background: `radial-gradient(circle, ${currentTheme.accent}44, transparent 70%)`,
            }}
          />

          {/* Kopf */}
          <motion.div
            className="hso__head"
            initial={{ y: -26, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -18, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 440, damping: 34 }}
          >
            <div className="hso__bar-row">
              <div
                className="hso__field"
                style={{
                  background: currentTheme.background.surface,
                  borderColor: `${currentTheme.primary}66`,
                  boxShadow: `0 10px 40px -10px ${currentTheme.primary}55, inset 0 0 0 1px ${currentTheme.primary}22`,
                }}
              >
                <Search style={{ fontSize: '22px', color: currentTheme.primary, flexShrink: 0 }} />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && shown.length > 0) goTo(shown[0]);
                  }}
                  placeholder="Serien & Filme suchen…"
                  aria-label="Serien und Filme suchen"
                  autoFocus
                  className="hso__input"
                  style={{ color: currentTheme.text.primary, outline: 'none' }}
                />
                {query && (
                  <button
                    type="button"
                    className="hso__clear"
                    aria-label="Suche leeren"
                    onClick={() => setQuery('')}
                    style={{
                      color: currentTheme.text.muted,
                      background: `${currentTheme.text.muted}22`,
                    }}
                  >
                    <Close style={{ fontSize: '15px' }} />
                  </button>
                )}
              </div>
              <button
                type="button"
                className="hso__done"
                onClick={onClose}
                aria-label="Suche schließen"
                style={{ color: currentTheme.text.secondary }}
              >
                Fertig
              </button>
            </div>

            {/* Segment-Filter */}
            <div className="hso__filters">
              {FILTERS.map((f) => {
                const active = filter === f.key;
                return (
                  <button
                    key={f.key}
                    type="button"
                    className="hso__filter"
                    onClick={() => setFilter(f.key)}
                    aria-pressed={active}
                    style={{
                      background: active
                        ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                        : `${currentTheme.background.surface}cc`,
                      border: active ? 'none' : `1px solid ${currentTheme.border.default}`,
                      color: active ? onPrimary : currentTheme.text.muted,
                      boxShadow: active ? `0 6px 18px -4px ${currentTheme.primary}66` : 'none',
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Inhalt */}
          <div className="hso__content">
            {/* Bewusst KEIN AnimatePresence mode="wait" hier: die Keys wechseln bei
                jedem Tastendruck (loading/empty/results), und mode="wait" kann bei
                schnellem Tippen im Exit hängen bleiben — dann klebt eine veraltete
                „Keine Treffer"-Meldung fest. Einblenden reicht. */}
            {hasQuery ? (
              loading && shown.length === 0 ? (
                <motion.div
                  key="loading"
                  className="hso__grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="hso__skeleton"
                      style={{ background: `${currentTheme.text.muted}18` }}
                    />
                  ))}
                </motion.div>
              ) : shown.length === 0 ? (
                <motion.div
                  key="empty"
                  className="hso__msg"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ color: currentTheme.text.muted }}
                >
                  <Search style={{ fontSize: '40px', opacity: 0.5 }} />
                  <p>Keine Treffer für &bdquo;{query}&ldquo;</p>
                </motion.div>
              ) : (
                <motion.div
                  key="results"
                  className="hso__grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {shown.map((item, idx) => {
                    const added = isInList(item);
                    const pending = pendingKey === keyOf(item);
                    return (
                      <motion.div
                        key={`${item.type}-${item.id}`}
                        className="hso__card"
                        role="button"
                        tabIndex={0}
                        whileTap={tapScale}
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.35), duration: 0.28 }}
                        onClick={() => goTo(item)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            goTo(item);
                          }
                        }}
                      >
                        <div className="hso__poster-wrap">
                          {item.poster_path ? (
                            <img
                              className="hso__poster"
                              src={getImageUrl(item.poster_path, 'w342')}
                              alt=""
                              loading="lazy"
                            />
                          ) : (
                            <div
                              className="hso__poster hso__poster--empty"
                              style={{ background: `${currentTheme.text.muted}22` }}
                            >
                              <Search style={{ fontSize: '28px', opacity: 0.4 }} />
                            </div>
                          )}
                          {item.vote_average ? (
                            <span
                              className="hso__rating"
                              style={{ background: `${currentTheme.background.default}d9` }}
                            >
                              <Star style={{ fontSize: '12px', color: currentTheme.accent }} />
                              {item.vote_average.toFixed(1)}
                            </span>
                          ) : null}
                          <span
                            className="hso__type"
                            style={{ background: `${currentTheme.primary}e6`, color: onPrimary }}
                          >
                            {item.type === 'series' ? 'Serie' : 'Film'}
                          </span>

                          {added ? (
                            <span
                              className="hso__added"
                              aria-label="In deiner Liste"
                              style={{ background: currentTheme.status.success, color: '#fff' }}
                            >
                              <Check style={{ fontSize: '18px' }} />
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="hso__add"
                              aria-label={`„${item.title}" zur Liste hinzufügen`}
                              disabled={pending}
                              onClick={(e) => addToList(item, e)}
                              style={{
                                background: pending
                                  ? 'var(--glass-heavy)'
                                  : `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                                color: onPrimary,
                                cursor: pending ? 'wait' : 'pointer',
                                opacity: pending ? 0.7 : 1,
                              }}
                            >
                              <Add style={{ fontSize: '20px' }} />
                            </button>
                          )}
                        </div>
                        <span
                          className="hso__card-title"
                          style={{ color: currentTheme.text.primary }}
                        >
                          {item.title}
                        </span>
                        {item.year && (
                          <span
                            className="hso__card-year"
                            style={{ color: currentTheme.text.muted }}
                          >
                            {item.year}
                          </span>
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            ) : (
              <motion.div
                key="suggest"
                className="hso__suggest"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {recent.length > 0 && (
                  <div className="hso__group">
                    <div className="hso__group-title" style={{ color: currentTheme.text.muted }}>
                      Zuletzt gesucht
                    </div>
                    {recent.map((term) => (
                      <div key={term} className="hso__recent-row">
                        <button
                          type="button"
                          className="hso__recent"
                          onClick={() => setQuery(term)}
                          style={{ color: currentTheme.text.secondary }}
                        >
                          <Search style={{ fontSize: '18px', color: currentTheme.text.muted }} />
                          {term}
                        </button>
                        <button
                          type="button"
                          className="hso__recent-remove"
                          aria-label={`„${term}" entfernen`}
                          onClick={() => removeRecent(term)}
                          style={{ color: currentTheme.text.muted }}
                        >
                          <Close style={{ fontSize: '15px' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="hso__group">
                  <div className="hso__group-title" style={{ color: currentTheme.text.muted }}>
                    Beliebt
                  </div>
                  <div className="hso__chips">
                    {popular.map((term, i) => (
                      <motion.button
                        key={term}
                        type="button"
                        className="hso__chip"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.05 + i * 0.04 }}
                        whileTap={tapScale}
                        onClick={() => setQuery(term)}
                        style={{
                          color: currentTheme.text.secondary,
                          background: `linear-gradient(135deg, ${currentTheme.primary}18, ${currentTheme.accent}14)`,
                          border: `1px solid ${currentTheme.primary}33`,
                        }}
                      >
                        {term}
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div onClick={(e) => e.stopPropagation()}>
            <Snackbar open={snack.open} message={snack.message} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
});

HomeSearchOverlay.displayName = 'HomeSearchOverlay';
