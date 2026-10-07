import { AutoStories, NewReleases, Search, Star, TrendingUp, Whatshot } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BackButton, EmptyState, GradientText, ScrollToTopButton } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/platform/useDeviceType';
import { discoverManga, type DiscoverCategory } from '../../services/api/anilistService';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { addMangaToList } from './addMangaToList';
import { MangaResultCard } from './components/MangaResultCard';
import './components/MangaCards.css';
import { tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';

const CATEGORIES: {
  id: DiscoverCategory;
  label: string;
  icon: React.ReactNode;
  colorKey: string;
}[] = [
  {
    id: 'trending',
    label: t('Trend'),
    icon: <TrendingUp style={{ fontSize: 18 }} />,
    colorKey: 'primary',
  },
  {
    id: 'popular',
    label: t('Beliebt'),
    icon: <Whatshot style={{ fontSize: 18 }} />,
    colorKey: 'error',
  },
  { id: 'top_rated', label: 'Top', icon: <Star style={{ fontSize: 18 }} />, colorKey: 'accent' },
  {
    id: 'upcoming',
    label: t('Neu'),
    icon: <NewReleases style={{ fontSize: 18 }} />,
    colorKey: 'success',
  },
];

const COUNTRY_FILTERS = [
  { key: 'all', label: t('Alle') },
  { key: 'JP', label: 'Manga' },
  { key: 'KR', label: 'Manhwa' },
  { key: 'CN', label: 'Manhua' },
];

export const MangaDiscoverPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList, hiddenMangaList } = useMangaList();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  const [searchParams] = useSearchParams();
  const [category, setCategory] = useState<DiscoverCategory>(() => {
    const fromUrl = searchParams.get('category');
    return CATEGORIES.some((c) => c.id === fromUrl) ? (fromUrl as DiscoverCategory) : 'trending';
  });
  const [countryFilter, setCountryFilter] = useState('all');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [addingId, setAddingId] = useState<number | null>(null);
  const pageRef = useRef(1);

  const ownedById = useMemo(() => {
    const map = new Map<number, Manga>();
    for (const m of [...mangaList, ...hiddenMangaList]) map.set(m.anilistId, m);
    return map;
  }, [mangaList, hiddenMangaList]);
  // Eigene Manga bleiben sichtbar (markiert) — sonst wirkt die Liste lückenhaft.
  const filteredResults = results;

  // Refs for stable scroll handler
  const hasNextPageRef = useRef(hasNextPage);
  const loadingMoreRef = useRef(loadingMore);
  const loadingRef = useRef(loading);
  const categoryRef = useRef(category);
  const countryFilterRef = useRef(countryFilter);
  useEffect(() => {
    hasNextPageRef.current = hasNextPage;
    loadingMoreRef.current = loadingMore;
    loadingRef.current = loading;
    categoryRef.current = category;
    countryFilterRef.current = countryFilter;
  });

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
      .catch((error) => console.error('Weitere Manga konnten nicht geladen werden:', error))
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
    <div style={{ minHeight: 'var(--vh, 100vh)', background: currentTheme.background.default }}>
      {/* ─── Sticky Header ───────────────────────── */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 'var(--z-sticky)' as string,
          background: `${currentTheme.background.default}e8`,
          backdropFilter: 'var(--glass-filter-lg)',
          WebkitBackdropFilter: 'var(--glass-filter-lg)',
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
              {t('Entdecken')}
            </GradientText>
            <div style={{ flex: 1 }} />
            <motion.button
              type="button"
              aria-label={t('Manga suchen')}
              whileTap={tapScaleTight}
              onClick={() => navigate('/manga/search')}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.text.secondary,
                cursor: 'pointer',
                padding: 4,
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Search style={{ fontSize: 22 }} />
            </motion.button>
          </div>

          <div
            style={{
              display: 'grid',
              /* Desktop: kompakte Kacheln statt vollbreiter Streifen */
              gridTemplateColumns: isMobile
                ? 'repeat(4, minmax(0, 1fr))'
                : 'repeat(4, minmax(110px, 150px))',
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
                  whileTap={{ opacity: 0.7 }}
                  onClick={() => setCategory(cat.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 4,
                    padding: '10px 4px',
                    borderRadius: 12,
                    border: active
                      ? `1px solid ${color}40`
                      : '1px solid var(--glass-border-subtle)',
                    background: active
                      ? `linear-gradient(135deg, ${color}25, ${color}10)`
                      : 'linear-gradient(135deg, var(--glass-light) 0%, var(--glass-subtle) 100%)',
                    color: active ? color : currentTheme.text.secondary,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    fontWeight: active ? 700 : 500,
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
                    border: `1px solid ${active ? currentTheme.primary : 'var(--glass-border-subtle)'}`,
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
      <div style={{ padding: '16px 20px', paddingBottom: 'var(--page-bottom-gap)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5, fontSize: 14 }}>
            {t('Laden...')}
          </div>
        ) : filteredResults.length > 0 ? (
          <>
            <div className="manga-result-grid">
              {filteredResults.map((result) => (
                <MangaResultCard
                  key={result.id}
                  result={result}
                  owned={ownedById.get(result.id)}
                  adding={addingId === result.id}
                  onOpen={() => navigate(`/manga/${result.id}`)}
                  onAdd={(e) => handleAdd(e, result)}
                />
              ))}
            </div>

            {loadingMore && (
              <div style={{ textAlign: 'center', padding: 20, opacity: 0.5, fontSize: 14 }}>
                {t('Mehr laden...')}
              </div>
            )}
          </>
        ) : (
          <EmptyState
            icon={<AutoStories style={{ fontSize: 44 }} />}
            title={t('Keine Manga gefunden')}
            description={t('In dieser Kategorie gibt es gerade nichts zu entdecken.')}
          />
        )}
      </div>
      <ScrollToTopButton />
    </div>
  );
};
