import { Add, Close, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { searchManga } from '../../services/anilistService';
import type { AniListMangaSearchResult } from '../../types/Manga';
import { addMangaToList } from './addMangaToList';
import { FORMAT_COLORS, getDisplayFormat, getDisplayFormatKey } from './mangaUtils';

const FORMAT_FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'JP', label: 'Manga' },
  { key: 'KR', label: 'Manhwa' },
  { key: 'CN', label: 'Manhua' },
] as const;

export const MangaSearchPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const navigate = useNavigate();
  const { isMobile } = useDeviceType();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
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
  recentSearchesRef.current = recentSearches;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const { results: r } = await searchManga(query.trim(), 1, 30);
        setResults(r);
        const updated = [
          query.trim(),
          ...recentSearchesRef.current.filter((s) => s !== query.trim()),
        ].slice(0, 8);
        setRecentSearches(updated);
        localStorage.setItem('mangaRecentSearches', JSON.stringify(updated));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query]);

  const trackedIds = useMemo(() => new Set(mangaList.map((m) => m.anilistId)), [mangaList]);

  // Filter: by country + remove tracked
  const filteredResults = useMemo(() => {
    let filtered = results.filter((r) => !trackedIds.has(r.id));
    if (countryFilter !== 'all') {
      filtered = filtered.filter((r) => r.countryOfOrigin === countryFilter);
    }
    return filtered;
  }, [results, trackedIds, countryFilter]);

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
            padding: '16px 20px',
            paddingTop: 'calc(16px + env(safe-area-inset-top))',
          }}
        >
          {/* Back + Search Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/manga')}
              style={{
                background: 'none',
                border: 'none',
                color: currentTheme.text.primary,
                cursor: 'pointer',
                padding: 4,
                display: 'flex',
              }}
            >
              <Close style={{ fontSize: 22 }} />
            </motion.button>
            <div style={{ flex: 1, position: 'relative' }}>
              <Search
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: currentTheme.text.secondary,
                  opacity: 0.4,
                }}
              />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Manga, Manhwa, Manhua suchen..."
                style={{
                  width: '100%',
                  padding: '12px 14px 12px 40px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.06)',
                  color: currentTheme.text.primary,
                  fontSize: 14,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                }}
              />
            </div>
          </div>

          {/* Format Filters */}
          <div style={{ display: 'flex', gap: 8 }}>
            {FORMAT_FILTERS.map((f) => {
              const active = countryFilter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setCountryFilter(f.key)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 10,
                    border: `1px solid ${active ? currentTheme.primary : 'rgba(255,255,255,0.06)'}`,
                    background: active ? `${currentTheme.primary}20` : 'rgba(255,255,255,0.04)',
                    color: active ? currentTheme.primary : currentTheme.text.secondary,
                    fontSize: 12,
                    fontWeight: active ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                    whiteSpace: 'nowrap',
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
        {/* Recent Searches */}
        {!query && recentSearches.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: currentTheme.text.secondary,
                marginBottom: 10,
                opacity: 0.6,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Letzte Suchen
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {recentSearches.map((s) => (
                <motion.button
                  key={s}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setQuery(s)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.06)',
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)',
                    color: currentTheme.text.secondary,
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {s}
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {searching && (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5, fontSize: 14 }}>
            Suche...
          </div>
        )}

        {/* Results Grid - exact same cards as Discover */}
        {!searching && filteredResults.length > 0 && (
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
                        background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
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

                  {/* Title + meta below card (like Discover) */}
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
        )}

        {!searching && query && filteredResults.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>🔍</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: currentTheme.text.primary,
                marginBottom: 4,
              }}
            >
              Keine Ergebnisse
            </div>
            <div style={{ fontSize: 13, color: currentTheme.text.secondary, opacity: 0.6 }}>
              Versuche einen anderen Suchbegriff
            </div>
          </div>
        )}

        {!query && recentSearches.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>📚</div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: currentTheme.text.primary,
                marginBottom: 4,
              }}
            >
              Manga entdecken
            </div>
            <div
              style={{
                fontSize: 13,
                color: currentTheme.text.secondary,
                opacity: 0.6,
                maxWidth: 240,
                margin: '0 auto',
                lineHeight: 1.5,
              }}
            >
              Suche nach Manga, Manhwa oder Manhua und füge sie zu deiner Sammlung hinzu.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
