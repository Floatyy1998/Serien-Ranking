import { Add, Check, Close, Search } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
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

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
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
        const updated = [query.trim(), ...recentSearches.filter((s) => s !== query.trim())].slice(
          0,
          8
        );
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

  const filteredResults =
    countryFilter === 'all' ? results : results.filter((r) => r.countryOfOrigin === countryFilter);

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

  return (
    <div
      style={{
        minHeight: '100vh',
        background: currentTheme.background.default,
        position: 'relative',
      }}
    >
      {/* ─── Fixed Header ────────────────────────── */}
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

        {/* Subtle bottom edge */}
        <div
          style={{
            height: 1,
            background: `linear-gradient(90deg, transparent, ${currentTheme.primary}18, rgba(255,255,255,0.06), ${currentTheme.primary}18, transparent)`,
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

        {/* Loading */}
        {searching && (
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5, fontSize: 14 }}>
            Suche...
          </div>
        )}

        {/* Results Grid */}
        {!searching && filteredResults.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 16,
            }}
          >
            {filteredResults.map((result) => (
              <SearchResultCard
                key={result.id}
                result={result}
                isTracked={isTracked(result.id)}
                isSelected={selectedId === result.id}
                isAdding={addingId === result.id}
                onSelect={() => setSelectedId(selectedId === result.id ? null : result.id)}
                onAdd={() => addManga(result)}
                onDetail={() => {
                  if (isTracked(result.id)) {
                    navigate(`/manga/${result.id}`);
                  } else {
                    addManga(result).then(() => navigate(`/manga/${result.id}`));
                  }
                }}
                theme={currentTheme}
              />
            ))}
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

        {/* Empty State */}
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

// ─── Search Result Card (Discover-style) ─────────────

const SearchResultCard = ({
  result,
  isTracked,
  isSelected,
  isAdding,
  onSelect,
  onAdd,
  onDetail,
  theme,
}: {
  result: AniListMangaSearchResult;
  isTracked: boolean;
  isSelected: boolean;
  isAdding: boolean;
  onSelect: () => void;
  onAdd: () => void;
  onDetail: () => void;
  theme: ReturnType<typeof import('../../contexts/ThemeContextDef').useTheme>['currentTheme'];
}) => {
  const displayFormat = getDisplayFormat(result.countryOfOrigin, result.format);
  const formatKey = getDisplayFormatKey(result.countryOfOrigin, result.format);
  const formatColor = FORMAT_COLORS[formatKey] || '#a78bfa';
  const cleanDesc = result.description?.replace(/<[^>]*>/g, '') || '';

  return (
    <motion.div
      layout
      style={{
        borderRadius: 14,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '2/3',
        cursor: 'pointer',
      }}
      whileTap={{ scale: 0.97 }}
      onClick={() => {
        if (isSelected) {
          onDetail();
        } else {
          onSelect();
        }
      }}
    >
      {/* Poster */}
      <img
        src={result.coverImage.large}
        alt={result.title.romaji}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />

      {/* Format Badge */}
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

      {/* Score Badge */}
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

      {/* Already tracked badge */}
      {isTracked && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 24,
            height: 24,
            borderRadius: 8,
            background: `${theme.primary}dd`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check style={{ fontSize: 14, color: '#fff' }} />
        </div>
      )}

      {/* Bottom Info (always visible) */}
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
            lineHeight: 1.3,
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
          {result.volumes && <span>{result.volumes} Bde.</span>}
          {result.status === 'RELEASING' && <span style={{ color: '#22c55e' }}>Laufend</span>}
        </div>
      </div>

      {/* ─── Info Overlay (on select) ────────────── */}
      <AnimatePresence>
        {isSelected && (
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
              background: 'rgba(10, 14, 26, 0.8)',
              backdropFilter: 'blur(20px) saturate(1.4)',
              borderRadius: '16px 16px 0 0',
              padding: '14px 12px',
              display: 'flex',
              flexDirection: 'column',
              borderTop: '1px solid rgba(255,255,255,0.12)',
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                width: 32,
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.2)',
                margin: '0 auto 10px',
              }}
            />

            {/* Title */}
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

            {/* Description */}
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

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {!isTracked ? (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: 'none',
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
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
                  {isAdding ? (
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
                    onDetail();
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    borderRadius: 10,
                    border: `1px solid ${theme.primary}40`,
                    background: `${theme.primary}15`,
                    color: theme.primary,
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

      {/* Add button (when NOT selected and NOT tracked) */}
      {!isSelected && !isTracked && (
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          style={{
            position: 'absolute',
            bottom: 42,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 10,
            border: 'none',
            background: `${theme.primary}dd`,
            backdropFilter: 'blur(8px)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {isAdding ? (
            <div
              style={{
                width: 14,
                height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#fff',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }}
            />
          ) : (
            <Add style={{ fontSize: 18 }} />
          )}
        </motion.button>
      )}
    </motion.div>
  );
};
