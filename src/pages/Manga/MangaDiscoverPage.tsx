import { Add, NewReleases, Search, Star, TrendingUp, Whatshot } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { BackButton, GradientText, ScrollToTopButton } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
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
  const { isMobile } = useDeviceType();

  const [category, setCategory] = useState<DiscoverCategory>('trending');
  const [countryFilter, setCountryFilter] = useState('all');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const pageRef = useRef(1);

  const trackedIds = useMemo(() => new Set(mangaList.map((m) => m.anilistId)), [mangaList]);
  const filteredResults = useMemo(
    () => results.filter((r) => !trackedIds.has(r.id)),
    [results, trackedIds]
  );

  // Refs for stable scroll handler
  const hasNextPageRef = useRef(hasNextPage);
  const loadingMoreRef = useRef(loadingMore);
  const loadingRef = useRef(loading);
  const categoryRef = useRef(category);
  const countryFilterRef = useRef(countryFilter);
  hasNextPageRef.current = hasNextPage;
  loadingMoreRef.current = loadingMore;
  loadingRef.current = loading;
  categoryRef.current = category;
  countryFilterRef.current = countryFilter;

  // Fetch initial data
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    pageRef.current = 1;
    discoverManga(category, 1, 30, countryFilter)
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

  // Stable fetchMore using refs
  const fetchMore = useCallback(() => {
    if (loadingMoreRef.current || !hasNextPageRef.current || loadingRef.current) return;
    setLoadingMore(true);
    const nextPage = pageRef.current + 1;
    discoverManga(categoryRef.current, nextPage, 30, countryFilterRef.current)
      .then(({ results: r, hasNextPage: hn }) => {
        pageRef.current = nextPage;
        setResults((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          return [...prev, ...r.filter((m) => !existingIds.has(m.id))];
        });
        setHasNextPage(hn);
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false));
  }, []);

  // Scroll listener on .mobile-content (the actual scrolling container from Layout)
  useEffect(() => {
    const container = document.querySelector('.mobile-content');
    if (!container) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const distFromBottom =
          container.scrollHeight - container.scrollTop - container.clientHeight;
        if (distFromBottom < 500) {
          fetchMore();
        }
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [fetchMore]);

  const handleAdd = useCallback(
    async (e: React.MouseEvent, result: AniListMangaSearchResult) => {
      e.stopPropagation();
      if (!user) return;
      setAddingId(result.id);
      const nextNmr = mangaList.length > 0 ? Math.max(...mangaList.map((m) => m.nmr)) + 1 : 1;
      await addMangaToList(user.uid, result, nextNmr);
      setAddingId(null);
    },
    [user, mangaList]
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
          zIndex: 'var(--z-sticky)' as string,
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
                  }}
                >
                  {cat.icon}
                  {cat.label}
                </motion.button>
              );
            })}
          </div>

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
        ) : filteredResults.length > 0 ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile
                  ? 'repeat(2, 1fr)'
                  : 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: isMobile ? 16 : 24,
              }}
            >
              {filteredResults.map((result) => {
                const displayFormat = getDisplayFormat(result.countryOfOrigin, result.format);
                const formatKey = getDisplayFormatKey(result.countryOfOrigin, result.format);
                const formatColor = FORMAT_COLORS[formatKey] || '#a78bfa';

                return (
                  <motion.div
                    key={result.id}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate(`/manga/${result.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div
                      style={{
                        position: 'relative',
                        borderRadius: 14,
                        aspectRatio: '2/3',
                        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={result.coverImage.large}
                        alt={result.title.romaji}
                        loading="lazy"
                        decoding="async"
                        style={{
                          position: 'absolute',
                          inset: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          borderRadius: 14,
                        }}
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
                      {result.averageScore && (
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

                      {/* Bottom gradient */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: '60%',
                          background:
                            'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                          borderRadius: '0 0 14px 14px',
                          pointerEvents: 'none',
                        }}
                      />

                      {/* Add button */}
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => handleAdd(e, result)}
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          right: 10,
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          border: 'none',
                          background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                          zIndex: 2,
                        }}
                      >
                        {addingId === result.id ? (
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              border: '2px solid rgba(255,255,255,0.3)',
                              borderTopColor: '#fff',
                              borderRadius: '50%',
                              animation: 'spin 0.6s linear infinite',
                            }}
                          />
                        ) : (
                          <Add style={{ fontSize: 20 }} />
                        )}
                      </motion.button>
                    </div>

                    {/* Title + meta below card (like series Discover) */}
                    <div style={{ marginTop: 8 }}>
                      <div
                        style={{
                          fontSize: isMobile ? 13 : 14,
                          fontWeight: 600,
                          color: currentTheme.text.primary,
                          lineHeight: 1.3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                      >
                        {result.title.english || result.title.romaji}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: currentTheme.text.secondary,
                          opacity: 0.6,
                          marginTop: 2,
                        }}
                      >
                        {result.startDate?.year || ''}
                        {result.chapters ? ` · ${result.chapters} Kap.` : ''}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

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
              Keine neuen Manga
            </div>
            <div
              style={{
                fontSize: 13,
                color: currentTheme.text.secondary,
                opacity: 0.6,
                marginTop: 4,
              }}
            >
              Alle Manga in dieser Kategorie sind bereits in deiner Sammlung.
            </div>
          </div>
        )}
      </div>
      <ScrollToTopButton />
    </div>
  );
};
