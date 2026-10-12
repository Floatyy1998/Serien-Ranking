import React from 'react';
import { BackButton } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookShelf } from '../../../hooks/books/useBookShelf';
import type { ShelfId } from '../../../services/api/bookDiscovery';
import { t } from '../../../services/i18n';
import { BookCover } from '../components/BookCover';
import '../components/books.css';
import { GENRES, SHELF_TITLES } from '../data/genres';
import { DiscoverCard, SkeletonCards } from './DiscoverParts';
import './discover.css';
import { useAddFlow } from './useAddFlow';

/** Ganzes Genre-Regal als Poster-Raster mit farbigem Kopf. */
export const GenreView: React.FC<{ id: ShelfId }> = ({ id }) => {
  const { currentTheme } = useTheme();
  const { items, loading } = useBookShelf(id, { eager: true, limit: 60 });
  const { openAdd, sheet } = useAddFlow();
  const colors = GENRES.find((g) => g.id === id)?.colors ?? [
    currentTheme.primary,
    currentTheme.accent,
  ];

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
          {items.slice(0, 4).map((r) => (
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
          {t('Die beliebtesten Bücher in deiner Sprache')}
        </p>
      </header>

      <div className="dsc-grid">
        {loading && items.length === 0 ? (
          <SkeletonCards count={12} />
        ) : (
          items.map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
        )}
      </div>
      {sheet}
    </div>
  );
};
