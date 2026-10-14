import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  BackButton,
  FilterPill,
  HorizontalScrollContainer,
  TabSwitcher,
} from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookShelf, useShelfMore } from '../../../hooks/books/useBookShelf';
import { curateShelf } from '../../../lib/books/discoverMix';
import { SHELF_SORTS, type ShelfId } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';
import { BookCover } from '../components/BookCover';
import '../components/books.css';
import { GENRES, SHELF_TITLES, SORT_HINTS, SORT_LABELS } from '../data/genres';
import { DiscoverCard, SkeletonCards } from './DiscoverParts';
import './discover.css';
import { useAddFlow, useHideOwned } from './useAddFlow';

const FEW_RESULTS = 6;

/** Ganzes Genre-Regal als Poster-Raster mit Sortierung, Untergenres und ohne eigene Bücher. */
export const GenreView: React.FC<{ id: ShelfId }> = ({ id }) => {
  const { currentTheme } = useTheme();
  const [params, setParams] = useSearchParams();
  const genre = GENRES.find((g) => g.id === id);
  const sorts = SHELF_SORTS[id];
  const sort = sorts.find((s) => s === params.get('sort')) ?? sorts[0];
  const themes = genre?.themes ?? [];
  const theme = themes.find((th) => th.id === params.get('theme'))?.id;
  const { items, loading, error } = useBookShelf(id, { eager: true, limit: 80, sort, theme });
  const canLoadMore = !loading && !error && items.length > 0;
  const {
    sentinelRef,
    items: moreItems,
    loadingMore,
    exhausted,
  } = useShelfMore(id, { sort, theme }, canLoadMore);
  const finished = !canLoadMore || exhausted;
  const hideOwned = useHideOwned();
  const { items: shown, hidden } = useMemo(
    () => curateShelf([...items, ...moreItems], { isOwned: hideOwned, perAuthor: 1 }),
    [items, moreItems, hideOwned]
  );
  const { openAdd, sheet } = useAddFlow();
  const colors = genre?.colors ?? [currentTheme.primary, currentTheme.accent];

  const setFilter = (key: 'sort' | 'theme', value: string | undefined) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );

  return (
    <div className="bk-page" style={{ background: currentTheme.background.default }}>
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: 'calc(14px + env(safe-area-inset-top)) 20px 26px',
          marginBottom: 18,
          background: `linear-gradient(160deg, ${colors[0]}, ${colors[1]}aa 60%, ${currentTheme.background.default})`,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: -20,
            bottom: -30,
            display: 'flex',
            gap: 10,
            opacity: 0.55,
            transform: 'rotate(-8deg)',
          }}
        >
          {shown.slice(0, 4).map((r) => (
            <BookCover key={r.id} book={r} width={84} />
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <BackButton />
        </div>
        <h1
          style={{
            position: 'relative',
            margin: '22px 0 4px',
            fontFamily: 'var(--font-display)',
            fontWeight: 900,
            fontSize: 'clamp(30px, 3vw + 18px, 52px)',
            letterSpacing: '-0.03em',
            color: '#fff',
            textShadow: '0 4px 24px rgba(0,0,0,0.35)',
          }}
        >
          {SHELF_TITLES[id]()}
        </h1>
        <p
          style={{
            position: 'relative',
            margin: 0,
            color: 'rgba(255,255,255,0.85)',
            fontWeight: 600,
          }}
        >
          {SORT_HINTS[sort]()}
        </p>
      </header>

      <div className="dsc-filters">
        {sorts.length > 1 && (
          <TabSwitcher
            className="dsc-sort-tabs"
            tabs={sorts.map((s) => ({ id: s, label: SORT_LABELS[s]() }))}
            activeTab={sort}
            onTabChange={(s) => setFilter('sort', s === sorts[0] ? undefined : s)}
            style={{ margin: '0 20px' }}
          />
        )}
        {themes.length > 0 && (
          <HorizontalScrollContainer scrollerClassName="dsc-themes" gap={8}>
            <FilterPill
              label={t('Alle')}
              active={!theme}
              onClick={() => setFilter('theme', undefined)}
            />
            {themes.map((th) => (
              <FilterPill
                key={th.id}
                label={th.label()}
                active={theme === th.id}
                onClick={() => setFilter('theme', th.id)}
              />
            ))}
          </HorizontalScrollContainer>
        )}
      </div>

      {!loading && !loadingMore && finished && shown.length === 0 ? (
        <div className="bk-card dsc-empty" style={{ color: currentTheme.text.muted }}>
          {error
            ? t('Die Buchsuche ist gerade nicht erreichbar.')
            : t(
                'Hier ist gerade nichts Neues für dich dabei. Probier eine andere Sortierung oder ein anderes Thema.'
              )}
        </div>
      ) : (
        <div className="dsc-grid">
          {loading && shown.length === 0 ? (
            <SkeletonCards count={12} />
          ) : (
            shown.map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
          )}
          {loadingMore && <SkeletonCards count={6} />}
        </div>
      )}
      <div ref={sentinelRef} aria-hidden style={{ height: 1 }} />
      {finished && shown.length > 0 && shown.length < FEW_RESULTS && (
        <p className="dsc-hidden-note" style={{ color: currentTheme.text.muted }}>
          {t('Nur wenige Treffer. Mit einer anderen Sortierung oder „Alle“ findest du mehr.')}
        </p>
      )}
      {!loading && hidden > 0 && (
        <p className="dsc-hidden-note" style={{ color: currentTheme.text.muted }}>
          {hidden === 1
            ? t('Ein Buch aus deiner Sammlung ausgeblendet')
            : t('{n} Bücher aus deiner Sammlung ausgeblendet', { n: hidden })}
        </p>
      )}
      {sheet}
    </div>
  );
};
