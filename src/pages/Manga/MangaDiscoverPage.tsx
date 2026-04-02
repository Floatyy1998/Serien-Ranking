import { Add, Check, NewReleases, Search, Star, TrendingUp, Whatshot } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { BackButton, GradientText } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { discoverManga, type DiscoverCategory } from '../../services/anilistService';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { addMangaToList } from './addMangaToList';
import { FORMAT_COLORS, getDisplayFormat, getDisplayFormatKey } from './mangaUtils';

const CATEGORIES: {
  id: DiscoverCategory;
  label: string;
  icon: React.ReactNode;
  colorKey: string;
}[] = [
  {
    id: 'trending',
    label: 'Trend',
    icon: <TrendingUp style={{ fontSize: 18 }} />,
    colorKey: 'primary',
  },
  {
    id: 'popular',
    label: 'Beliebt',
    icon: <Whatshot style={{ fontSize: 18 }} />,
    colorKey: 'error',
  },
  { id: 'top_rated', label: 'Top', icon: <Star style={{ fontSize: 18 }} />, colorKey: 'accent' },
  {
    id: 'upcoming',
    label: 'Neu',
    icon: <NewReleases style={{ fontSize: 18 }} />,
    colorKey: 'success',
  },
];

const COUNTRY_FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'JP', label: 'Manga' },
  { key: 'KR', label: 'Manhwa' },
  { key: 'CN', label: 'Manhua' },
];

export const MangaDiscoverPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const navigate = useNavigate();

  const [category, setCategory] = useState<DiscoverCategory>('trending');
  const [countryFilter, setCountryFilter] = useState('all');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Initial load + reset on filter change
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSelectedId(null);
    setPage(1);
    discoverManga(category, 1, 20, countryFilter)
      .then(({ results: r, hasNextPage: hn }) => {
        if (!cancelled) {
          setResults(r);
          setHasNextPage(hn);
        }
      })
      .catch(() => {
        if (!cancelled) setResults([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, countryFilter]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load more on scroll
  const loadMore = useCallback(() => {
    if (loadingMore || !hasNextPage) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    discoverManga(category, nextPage, 20, countryFilter)
      .then(({ results: r, hasNextPage: hn }) => {
        setResults((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newItems = r.filter((m) => !existingIds.has(m.id));
          return [...prev, ...newItems];
        });
        setHasNextPage(hn);
        setPage(nextPage);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasNextPage, page, category, countryFilter]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: '400px' }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [loadMore]);

  const isTracked = useCallback(
    (id: number) => mangaList.some((m) => m.anilistId === id),
    [mangaList]
  );

  const addManga = useCallback(
    async (result: AniListMangaSearchResult) => {
      if (!user || isTracked(result.id)) return;
      setAddingId(result.id);

      const nextNmr = mangaList.length > 0 ? Math.max(...mangaList.map((m) => m.nmr)) + 1 : 1;
      await addMangaToList(user.uid, result, nextNmr);
      setAddingId(null);
    },
    [user, mangaList, isTracked]
  );

  const getCategoryColor = (colorKey: string) => {
    const map: Record<string, string> = {
      primary: currentTheme.primary,
      error: currentTheme.status?.error || '#ef4444',
      accent: currentTheme.accent,
      success: currentTheme.status?.success || '#22c55e',
    };
    return map[colorKey] || currentTheme.primary;
  };

  return (
    <div style={{ minHeight: '100vh', background: currentTheme.background.default }}>
      {/* ─── Sticky Header ───────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}e8`,
          backdropFilter: 'blur(28px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}15 0%, transparent 100%)`,
            padding: '14px 20px',
            paddingTop: 'calc(14px + env(safe-area-inset-top))',
          }}
        >
          {/* Title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <BackButton />
            <GradientText
              from={currentTheme.primary}
              to={currentTheme.accent}
              style={{
                fontSize: 20,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}
            >
              Entdecken
            </GradientText>
            <div style={{ flex: 1 }} />
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/manga/search')}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.text.secondary,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <Search style={{ fontSize: 22 }} />
            </motion.button>
          </div>

          {/* Categories */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 8,
              marginBottom: 12,
            }}
          >
            {CATEGORIES.map((cat) => {
              const active = category === cat.id;
              const color = getCategoryColor(cat.colorKey);
              return (
                <motion.button
                  key={cat.id}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 4px',
                    borderRadius: 12,
                    border: 'none',
                    background: active
                      ? `linear-gradient(135deg, ${color}25, ${color}10)`
                      : 'transparent',
                    color: active ? color : currentTheme.text.secondary,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
                    opacity: active ? 1 : 0.6,
                    transition: 'all 0.2s',
                  }}
                >
                  {cat.icon}
                  {cat.label}
                </motion.button>
              );
            })}
          </div>

          {/* Country Filter */}
          <div style={{ display: 'flex', gap: 6 }}>
            {COUNTRY_FILTERS.map((f) => {
              const active = countryFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setCountryFilter(f.key)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: 8,
                    border: `1px solid ${active ? currentTheme.primary : 'rgba(255,255,255,0.06)'}`,
                    background: active ? `${currentTheme.primary}20` : 'transparent',
                    color: active ? currentTheme.primary : currentTheme.text.secondary,
                    fontSize: 11,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${currentTheme.primary}18, rgba(255,255,255,0.06), transparent)`,
          }}
        />
      </div>

      {/* ─── Content ─────────────────────────────── */}
      <div style={{ padding: '16px 20px', paddingBottom: 100 }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5, fontSize: 14 }}>
            Laden...
          </div>
        ) : results.length > 0 ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                gap: 14,
              }}
            >
              {[...results]
                .sort((a, b) => {
                  // Push tracked manga to the end
                  const aT = isTracked(a.id) ? 1 : 0;
                  const bT = isTracked(b.id) ? 1 : 0;
                  return aT - bT;
                })
                .map((result) => {
                  const displayFormat = getDisplayFormat(result.countryOfOrigin, result.format);
                  const formatKey = getDisplayFormatKey(result.countryOfOrigin, result.format);
                  const formatColor = FORMAT_COLORS[formatKey] || '#a78bfa';
                  const tracked = isTracked(result.id);
                  const selected = selectedId === result.id;
                  const cleanDesc = result.description?.replace(/<[^>]*>/g, '') || '';

                  return (
                    <motion.div
                      key={result.id}
                      layout
                      style={{
                        borderRadius: 14,
                        overflow: 'hidden',
                        position: 'relative',
                        aspectRatio: '2/3',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px -4px rgba(0,0,0,0.4)',
                        opacity: tracked ? 0.5 : 1,
                      }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        if (selected) {
                          if (tracked) navigate(`/manga/${result.id}`);
                          else addManga(result).then(() => navigate(`/manga/${result.id}`));
                        } else {
                          setSelectedId(result.id);
                        }
                      }}
                    >
                      <img
                        src={result.coverImage.large}
                        alt={result.title.romaji}
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />

                      {/* Format badge */}
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          left: 8,
                          fontSize: 9,
                          fontWeight: 700,
                          padding: '3px 7px',
                          borderRadius: 6,
                          background: 'rgba(0,0,0,0.6)',
                          backdropFilter: 'blur(8px)',
                          color: formatColor,
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}
                      >
                        {displayFormat}
                      </div>

                      {/* Score */}
                      {result.averageScore && !tracked && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '3px 6px',
                            borderRadius: 6,
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(8px)',
                            color: '#f59e0b',
                          }}
                        >
                          ⭐ {result.averageScore}%
                        </div>
                      )}

                      {tracked && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            width: 24,
                            height: 24,
                            borderRadius: 8,
                            background: `${currentTheme.primary}dd`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Check style={{ fontSize: 14, color: '#fff' }} />
                        </div>
                      )}

                      {/* Bottom info */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: '24px 10px 10px',
                          background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {result.title.english || result.title.romaji}
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.5)',
                            marginTop: 2,
                            display: 'flex',
                            gap: 6,
                          }}
                        >
                          {result.chapters && <span>{result.chapters} Kap.</span>}
                          {result.status === 'RELEASING' && (
                            <span style={{ color: '#22c55e' }}>Laufend</span>
                          )}
                          {result.status === 'FINISHED' && <span>Abgeschlossen</span>}
                        </div>
                      </div>

                      {/* Info Overlay */}
                      <AnimatePresence>
                        {selected && (
                          <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            style={{
                              position: 'absolute',
                              bottom: 0,
                              left: 0,
                              right: 0,
                              height: '70%',
                              background: 'rgba(10,14,26,0.8)',
                              backdropFilter: 'blur(20px) saturate(1.4)',
                              borderRadius: '16px 16px 0 0',
                              padding: '14px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              borderTop: '1px solid rgba(255,255,255,0.12)',
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 3,
                                borderRadius: 2,
                                background: 'rgba(255,255,255,0.2)',
                                margin: '0 auto 10px',
                              }}
                            />
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: 6,
                                lineHeight: 1.3,
                              }}
                            >
                              {result.title.english || result.title.romaji}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: 'rgba(255,255,255,0.6)',
                                lineHeight: 1.5,
                                flex: 1,
                                overflow: 'hidden',
                                display: '-webkit-box',
                                WebkitLineClamp: 4,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {cleanDesc || 'Keine Beschreibung verfügbar.'}
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              {!tracked ? (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addManga(result);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 10,
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6,
                                  }}
                                >
                                  {addingId === result.id ? (
                                    'Wird hinzugefügt...'
                                  ) : (
                                    <>
                                      <Add style={{ fontSize: 16 }} />
                                      Hinzufügen
                                    </>
                                  )}
                                </motion.button>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/manga/${result.id}`);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: 10,
                                    border: `1px solid ${currentTheme.primary}40`,
                                    background: `${currentTheme.primary}15`,
                                    color: currentTheme.primary,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'var(--font-body)',
                                  }}
                                >
                                  Details ansehen
                                </motion.button>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Quick add button */}
                      {!selected && !tracked && (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addManga(result);
                          }}
                          style={{
                            position: 'absolute',
                            bottom: 42,
                            right: 8,
                            width: 30,
                            height: 30,
                            borderRadius: 10,
                            border: 'none',
                            background: `${currentTheme.primary}dd`,
                            backdropFilter: 'blur(8px)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Add style={{ fontSize: 18 }} />
                        </motion.button>
                      )}
                    </motion.div>
                  );
                })}
            </div>

            {/* Infinite scroll trigger */}
            <div ref={loadMoreRef} style={{ height: 1 }} />
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: 20, opacity: 0.5, fontSize: 14 }}>
                Mehr laden...
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>📚</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: currentTheme.text.primary }}>
              Keine Ergebnisse
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
