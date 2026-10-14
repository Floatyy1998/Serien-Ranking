import { AutoStories, ChevronRight } from '@mui/icons-material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangaList } from '../../../contexts/MangaListContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { mangaPath } from '../../../lib/manga/mangaSource';
import { discoverManga } from '../../../services/api/anilistService';
import { searchMangaWithTitleFallback } from '../../../services/api/mangaSearch';
import { t } from '../../../services/i18n';
import type { AniListMangaSearchResult, Manga } from '../../../types/Manga';
import { useAddManga } from '../useAddManga';
import { MangaResultCard } from './MangaResultCard';
import './MangaCards.css';
import './MangaQuickResults.css';

let popularCache: AniListMangaSearchResult[] | null = null;

function useMangaQuickSearch(query: string) {
  const q = query.trim();
  const [state, setState] = useState<{
    query: string;
    results: AniListMangaSearchResult[];
    aliases: Record<number, string>;
    volumes?: Record<number, number>;
  }>({ query: '', results: [], aliases: {} });
  const reqId = useRef(0);

  useEffect(() => {
    if (q.length < 2) return;
    const id = ++reqId.current;
    const timer = setTimeout(() => {
      searchMangaWithTitleFallback(q, 24)
        .catch(() => ({ results: [], aliases: {} }))
        .then((outcome) => {
          if (id === reqId.current) setState({ query: q, ...outcome });
        });
    }, 350);
    return () => clearTimeout(timer);
  }, [q]);

  const settled = state.query === q;
  return {
    results: q.length >= 2 && settled ? state.results : [],
    aliases: settled ? state.aliases : {},
    volumes: (settled && state.volumes) || {},
    loading: q.length >= 2 && !settled,
  };
}

function useMangaCards() {
  const navigate = useNavigate();
  const { allMangaList } = useMangaList();
  const { add, addingId } = useAddManga();

  const ownedById = useMemo(() => {
    const map = new Map<number, Manga>();
    for (const m of allMangaList) map.set(m.anilistId, m);
    return map;
  }, [allMangaList]);

  /** volume: über einen gedruckten Band gefunden (0 = Bandnummer unbekannt). */
  const render = (result: AniListMangaSearchResult, alias?: string, volume?: number) => (
    <MangaResultCard
      key={result.id}
      result={result}
      owned={ownedById.get(result.id)}
      alias={alias}
      adding={addingId === result.id}
      onOpen={() => navigate(mangaPath(result.id, volume))}
      onAdd={(e) => {
        e.stopPropagation();
        void add(result, { byVolume: volume !== undefined });
      }}
    />
  );

  return { ownedById, render };
}

interface MangaQuickResultsProps {
  query: string;
  variant: 'row' | 'grid';
  onCount?: (count: number, loading: boolean) => void;
  /** Gezeigte AniList-IDs — die Bücher-Reihe blendet deren Bände dann aus. */
  onIds?: (ids: number[]) => void;
  onSeeAll?: () => void;
}

export const MangaQuickResults = ({
  query,
  variant,
  onCount,
  onIds,
  onSeeAll,
}: MangaQuickResultsProps) => {
  const { currentTheme } = useTheme();
  const { results, aliases, volumes, loading } = useMangaQuickSearch(query);
  const { ownedById, render } = useMangaCards();

  const sorted = useMemo(
    () =>
      results
        .map((r, i) => ({ r, i, owned: ownedById.has(r.id) }))
        .sort((a, b) => Number(b.owned) - Number(a.owned) || a.i - b.i)
        .map(({ r }) => r),
    [results, ownedById]
  );

  useEffect(() => {
    onCount?.(sorted.length, loading);
  }, [sorted.length, loading, onCount]);

  const shownIds = sorted.map((r) => r.id).join(',');
  useEffect(() => {
    onIds?.(shownIds ? shownIds.split(',').map(Number) : []);
  }, [shownIds, onIds]);

  if (query.trim().length < 2) return null;
  if (variant === 'row' && !loading && sorted.length === 0) return null;

  return (
    <div className="mqr">
      {variant === 'row' && (
        <button
          type="button"
          onClick={onSeeAll}
          className="mqr-head"
          style={{ color: currentTheme.text.muted }}
        >
          <AutoStories style={{ fontSize: 16, color: currentTheme.primary }} />
          {t('Manga')}
          <ChevronRight style={{ fontSize: 16 }} />
        </button>
      )}
      {variant === 'grid' && !loading && sorted.length === 0 ? (
        <div className="mqr-empty" style={{ color: currentTheme.text.muted }}>
          {t('Keine Manga gefunden')}
        </div>
      ) : loading && sorted.length === 0 ? (
        <div className={`mqr-grid${variant === 'row' ? ' mqr-grid--row' : ''}`} aria-busy>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="mqr-skeleton"
              style={{ background: `${currentTheme.text.muted}18` }}
            />
          ))}
        </div>
      ) : (
        <div className={`mqr-grid${variant === 'row' ? ' mqr-grid--row' : ''}`}>
          {sorted.map((r) => render(r, aliases[r.id], volumes[r.id]))}
        </div>
      )}
    </div>
  );
};

export const MangaOverlayIdle = () => {
  const { currentTheme } = useTheme();
  const { render } = useMangaCards();
  const [items, setItems] = useState<AniListMangaSearchResult[] | null>(() => popularCache);

  useEffect(() => {
    if (popularCache) return;
    let alive = true;
    discoverManga('popular', 1, 24)
      .then(({ results }) => {
        if (results.length > 0) popularCache = results;
        if (alive) setItems(results);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="mqr">
      <div className="hso__group-title" style={{ color: currentTheme.text.muted }}>
        {t('Beliebt')}
      </div>
      <div className="mqr-grid">
        {items === null
          ? Array.from({ length: 9 }).map((_, i) => (
              <div
                key={i}
                className="mqr-skeleton"
                style={{ background: `${currentTheme.text.muted}18` }}
              />
            ))
          : items.map((r) => render(r))}
      </div>
    </div>
  );
};
