import { AutoStories, Close, History, Search, SearchOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, HorizontalScrollContainer } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  filterCollection,
  mangaProgressPercent,
  mangaTotalChapters,
} from '../../lib/manga/overview';
import { tapScale, tapScaleTight } from '../../lib/motion';
import { searchMangaWithTitleFallback } from '../../services/api/mangaSearch';
import { t } from '../../services/i18n';
import type { AniListMangaSearchResult, Manga } from '../../types/Manga';
import { addMangaToList } from './addMangaToList';
import { MangaPosterCard } from './components/MangaPosterCard';
import { MangaResultCard } from './components/MangaResultCard';
import './components/MangaCards.css';
import { STATUS_LABELS } from './mangaUtils';

const FORMAT_FILTERS = [
  { key: 'all', label: t('Alle') },
  { key: 'JP', label: 'Manga' },
  { key: 'KR', label: 'Manhwa' },
  { key: 'CN', label: 'Manhua' },
] as const;

const COUNTRY_TO_FORMAT: Record<string, string> = { JP: 'MANGA', KR: 'MANHWA', CN: 'MANHUA' };

export const MangaSearchPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList, hiddenMangaList } = useMangaList();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [aliases, setAliases] = useState<Record<number, string>>({});
  const [searching, setSearching] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [addingId, setAddingId] = useState<number | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mangaRecentSearches') || '[]');
    } catch {
      return [];
    }
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recentSearchesRef = useRef(recentSearches);
  useEffect(() => {
    recentSearchesRef.current = recentSearches;
  }, [recentSearches]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query.trim()) {
      setResults([]);
      setAliases({});
      return;
    }
    let cancelled = false;
    setSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const outcome = await searchMangaWithTitleFallback(query.trim(), 30);
        if (cancelled) return;
        setResults(outcome.results);
        setAliases(outcome.aliases);
        const updated = [
          query.trim(),
          ...recentSearchesRef.current.filter((s) => s !== query.trim()),
        ].slice(0, 8);
        setRecentSearches(updated);
        localStorage.setItem('mangaRecentSearches', JSON.stringify(updated));
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const allOwned = useMemo(() => [...mangaList, ...hiddenMangaList], [mangaList, hiddenMangaList]);
  const ownedById = useMemo(() => {
    const map = new Map<number, Manga>();
    for (const m of allOwned) map.set(m.anilistId, m);
    return map;
  }, [allOwned]);

  // Eigene Treffer sofort, ohne auf AniList zu warten — auch versteckte Manga.
  const libraryMatches = useMemo(() => {
    if (query.trim().length < 2) return [];
    return filterCollection(
      allOwned,
      {
        query,
        status: 'all',
        format: countryFilter === 'all' ? 'all' : COUNTRY_TO_FORMAT[countryFilter],
        sort: 'recent',
      },
      user?.uid
    );
  }, [allOwned, query, countryFilter, user?.uid]);

  const libraryIds = useMemo(
    () => new Set(libraryMatches.map((m) => m.anilistId)),
    [libraryMatches]
  );

  const filteredResults = useMemo(
    () =>
      results.filter(
        (r) =>
          !libraryIds.has(r.id) && (countryFilter === 'all' || r.countryOfOrigin === countryFilter)
      ),
    [results, libraryIds, countryFilter]
  );

  const handleAdd = useCallback(
    async (e: React.MouseEvent, result: AniListMangaSearchResult) => {
      e.stopPropagation();
      if (!user) return;
      setAddingId(result.id);
      const nextNmr = allOwned.length > 0 ? Math.max(...allOwned.map((m) => m.nmr)) + 1 : 1;
      try {
        await addMangaToList(user.uid, result, nextNmr);
      } finally {
        setAddingId(null);
      }
    },
    [user, allOwned]
  );

  const clearRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('mangaRecentSearches');
    } catch {
      /* ignore */
    }
  };

  const hasQuery = !!query.trim();
  const nothingFound =
    hasQuery && !searching && filteredResults.length === 0 && libraryMatches.length === 0;

  return (
    <div style={{ minHeight: 'var(--vh, 100vh)', background: currentTheme.background.default }}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}e8`,
          backdropFilter: 'var(--glass-filter-lg)',
          WebkitBackdropFilter: 'var(--glass-filter-lg)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}15 0%, transparent 100%)`,
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <motion.button
              type="button"
              aria-label={t('Suche schließen')}
              whileTap={tapScaleTight}
              onClick={() => navigate('/manga')}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.text.primary,
                cursor: 'pointer',
                padding: 4,
                minWidth: 44,
                minHeight: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Close style={{ fontSize: 22 }} />
            </motion.button>
            <div style={{ flex: 1, position: 'relative', maxWidth: 860 }}>
              <Search
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 20,
                  color: currentTheme.primary,
                }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Manga, Manhwa, Manhua suchen...')}
                aria-label={t('Manga suchen')}
                style={{
                  width: '100%',
                  padding: '13px 44px 13px 44px',
                  borderRadius: 16,
                  border: `1px solid ${currentTheme.primary}33`,
                  background: `linear-gradient(135deg, ${currentTheme.primary}14, transparent 45%), var(--glass-light)`,
                  color: currentTheme.text.primary,
                  fontSize: 15,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  boxShadow: 'var(--glass-specular)',
                }}
              />
              {query && (
                <button
                  type="button"
                  className="manga-collection-clear"
                  aria-label={t('Suche leeren')}
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: currentTheme.text.muted,
                  }}
                >
                  <Close style={{ fontSize: 16 }} />
                </button>
              )}
            </div>
          </div>

          <div className="manga-pill-row" style={{ padding: 0, margin: 0 }}>
            {FORMAT_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={`manga-pill ${countryFilter === f.key ? 'manga-pill--active' : ''}`}
                onClick={() => setCountryFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${currentTheme.primary}18, rgba(255,255,255,0.06), transparent)`,
          }}
        />
      </div>

      <div style={{ padding: '16px 0', paddingBottom: 'var(--page-bottom-gap)' }}>
        {!hasQuery && recentSearches.length > 0 && (
          <div style={{ marginBottom: 24, padding: '0 20px' }}>
            <div className="manga-search-label" style={{ color: currentTheme.text.muted }}>
              <History style={{ fontSize: 16 }} />
              {t('Letzte Suchen')}
              <button
                type="button"
                className="manga-search-label-action"
                onClick={clearRecent}
                style={{ color: currentTheme.text.muted }}
              >
                {t('Leeren')}
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recentSearches.map((s) => (
                <motion.button
                  key={s}
                  type="button"
                  whileTap={tapScale}
                  className="manga-pill"
                  onClick={() => setQuery(s)}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {libraryMatches.length > 0 && (
          <section style={{ marginBottom: 26 }}>
            <div
              className="manga-search-label"
              style={{ color: currentTheme.text.muted, padding: '0 20px' }}
            >
              <AutoStories style={{ fontSize: 16, color: currentTheme.primary }} />
              {t('In deiner Sammlung')}
              <span className="manga-pill-count">{libraryMatches.length}</span>
            </div>
            <HorizontalScrollContainer gap={14} style={{ padding: '0 20px' }}>
              {libraryMatches.map((manga) => {
                const total = mangaTotalChapters(manga);
                return (
                  <MangaPosterCard
                    key={manga.anilistId}
                    title={manga.title}
                    poster={manga.poster}
                    format={manga.format}
                    countryOfOrigin={manga.countryOfOrigin}
                    owned
                    progress={mangaProgressPercent(manga)}
                    meta={
                      manga.currentChapter > 0
                        ? total > 0
                          ? t('Kap. {a} / {b}', { a: manga.currentChapter, b: total })
                          : t('Kap. {n}', { n: manga.currentChapter })
                        : STATUS_LABELS[manga.readStatus]
                    }
                    onClick={() => navigate(`/manga/${manga.anilistId}`)}
                  />
                );
              })}
            </HorizontalScrollContainer>
          </section>
        )}

        <div style={{ padding: '0 20px' }}>
          {hasQuery && (searching || filteredResults.length > 0) && (
            <div className="manga-search-label" style={{ color: currentTheme.text.muted }}>
              <Search style={{ fontSize: 16 }} />
              {libraryMatches.length > 0 ? t('Weitere Treffer') : t('Treffer')}
            </div>
          )}

          {searching && filteredResults.length === 0 && (
            <div className="manga-result-grid" aria-busy>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="mrc">
                  <div className="mrc-art skeleton-shimmer" />
                  <div className="mrc-info">
                    <div
                      className="skeleton-shimmer"
                      style={{ height: 12, borderRadius: 6, width: '80%' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredResults.length > 0 && (
            <div className="manga-result-grid" style={{ opacity: searching ? 0.6 : 1 }}>
              {filteredResults.map((result) => (
                <MangaResultCard
                  key={result.id}
                  result={result}
                  owned={ownedById.get(result.id)}
                  alias={aliases[result.id]}
                  adding={addingId === result.id}
                  onOpen={() => navigate(`/manga/${result.id}`)}
                  onAdd={(e) => handleAdd(e, result)}
                />
              ))}
            </div>
          )}

          {nothingFound && (
            <EmptyState
              icon={<SearchOff style={{ fontSize: 44 }} />}
              title={t('Keine Ergebnisse')}
              description={t(
                'Versuche einen anderen Suchbegriff — auch deutsche oder englische Titel funktionieren.'
              )}
            />
          )}

          {!hasQuery && recentSearches.length === 0 && (
            <EmptyState
              icon={<AutoStories style={{ fontSize: 48 }} />}
              title={t('Manga entdecken')}
              description={t(
                'Suche nach Manga, Manhwa oder Manhua — deine eigenen Titel findest du hier auch.'
              )}
              action={{ label: t('Entdecken'), onClick: () => navigate('/manga/discover') }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
