import { Search } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../AuthContext';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContextDef';
import { searchManga } from '../../../services/anilistService';
import type { AniListMangaSearchResult } from '../../../types/Manga';
import { addMangaToList } from '../addMangaToList';
import { getDisplayFormat } from '../mangaUtils';

export const MangaSearchSection: React.FC = React.memo(() => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AniListMangaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const { results: r } = await searchManga(query.trim());
        setResults(r);
        setShowResults(true);
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

  const handleAddManga = useCallback(
    async (result: AniListMangaSearchResult) => {
      if (!user) return;
      if (mangaList.some((m) => m.anilistId === result.id)) {
        navigate(`/manga/${result.id}`);
        setShowResults(false);
        setQuery('');
        return;
      }

      const nextNmr = mangaList.length > 0 ? Math.max(...mangaList.map((m) => m.nmr)) + 1 : 1;
      await addMangaToList(user.uid, result, nextNmr);
      setShowResults(false);
      setQuery('');
      navigate(`/manga/${result.id}`);
    },
    [user, mangaList, navigate]
  );

  const isTracked = useCallback(
    (id: number) => mangaList.some((m) => m.anilistId === id),
    [mangaList]
  );

  return (
    <section style={{ padding: '0 20px', marginBottom: 20, position: 'relative' }} ref={wrapperRef}>
      <div style={{ position: 'relative' }}>
        <Search
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            opacity: 0.4,
            fontSize: 20,
            color: currentTheme.text.secondary,
            pointerEvents: 'none',
          }}
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          placeholder="Manga, Manhwa, Manhua suchen..."
          style={{
            width: '100%',
            padding: '14px 16px 14px 44px',
            borderRadius: 16,
            border: `1px solid rgba(255,255,255,0.08)`,
            background: 'rgba(255,255,255,0.05)',
            color: currentTheme.text.primary,
            fontSize: 15,
            outline: 'none',
            fontFamily: 'var(--font-body)',
            backdropFilter: 'blur(8px)',
          }}
        />
      </div>

      <AnimatePresence>
        {showResults && (results.length > 0 || searching) && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              top: '100%',
              left: 20,
              right: 20,
              marginTop: 8,
              background: 'rgba(20,20,25,0.98)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.1)',
              maxHeight: 400,
              overflowY: 'auto',
              zIndex: 100,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
            }}
          >
            {searching ? (
              <div style={{ padding: 20, textAlign: 'center', opacity: 0.5, fontSize: 14 }}>
                Suche...
              </div>
            ) : (
              results.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleAddManga(r)}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '12px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    alignItems: 'center',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background =
                      'rgba(255,255,255,0.06)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLDivElement).style.background = 'transparent')
                  }
                >
                  <img
                    src={r.coverImage.medium}
                    alt={r.title.romaji}
                    loading="lazy"
                    style={{
                      width: 45,
                      height: 64,
                      borderRadius: 8,
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        color: currentTheme.text.primary,
                      }}
                    >
                      {r.title.english || r.title.romaji}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        opacity: 0.5,
                        marginTop: 2,
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                      }}
                    >
                      <span>{getDisplayFormat(r.countryOfOrigin, r.format)}</span>
                      {r.chapters && <span>{r.chapters} Kapitel</span>}
                      {r.averageScore && <span>⭐ {r.averageScore}%</span>}
                    </div>
                  </div>
                  {isTracked(r.id) && (
                    <span
                      style={{
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 6,
                        background: `${currentTheme.primary}30`,
                        color: currentTheme.primary,
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      Hinzugefügt
                    </span>
                  )}
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
});
