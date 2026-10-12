import { ChevronRight, LocalLibrary } from '@mui/icons-material';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookSearch } from '../../../hooks/books/useBookSearch';
import { useBookShelf } from '../../../hooks/books/useBookShelf';
import { t } from '../../../services/i18n';
import { GENRES } from '../data/genres';
import { DiscoverCard, SkeletonCards } from '../discover/DiscoverParts';
import '../discover/discover.css';
import { useAddFlow } from '../discover/useAddFlow';
import './books.css';

interface Props {
  query: string;
  /** Reihe unter den Serien/Film-Treffern oder volles Poster-Raster beim Bücher-Filter. */
  variant: 'row' | 'grid';
  sheetZIndex?: number;
  onCount?: (count: number, loading: boolean) => void;
  onSeeAll?: () => void;
}

/** Buch-Treffer im Such-Overlay — gleiche Poster-Karten wie beim Stöbern. */
export const BookQuickResults: React.FC<Props> = ({
  query,
  variant,
  sheetZIndex,
  onCount,
  onSeeAll,
}) => {
  const { currentTheme } = useTheme();
  const { results, loading } = useBookSearch(query);
  const { openAdd, sheet } = useAddFlow(sheetZIndex);

  useEffect(() => {
    onCount?.(results.length, loading);
  }, [results.length, loading, onCount]);

  if (query.trim().length < 2) return null;
  if (variant === 'row' && !loading && results.length === 0) return null;

  const list = results.slice(0, variant === 'row' ? 12 : 30);

  return (
    <div style={{ marginTop: variant === 'row' ? 22 : 4 }}>
      {variant === 'row' && (
        <button
          type="button"
          onClick={onSeeAll}
          className="bk-tap bk-overlay-heading"
          style={{ color: currentTheme.text.muted }}
        >
          <LocalLibrary style={{ fontSize: 16, color: currentTheme.primary }} />
          {t('Bücher')}
          <ChevronRight style={{ fontSize: 16 }} />
        </button>
      )}
      {variant === 'grid' && !loading && list.length === 0 ? (
        <div
          className="bk-muted"
          style={{ color: currentTheme.text.muted, textAlign: 'center', padding: 32 }}
        >
          {t('Keine Bücher gefunden')}
        </div>
      ) : (
        <div
          className={variant === 'row' ? 'dsc-row' : 'dsc-grid'}
          style={variant === 'row' ? { padding: '4px 0 10px' } : { padding: 0 }}
        >
          {loading && list.length === 0 ? (
            <SkeletonCards count={variant === 'row' ? 5 : 10} />
          ) : (
            list.map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
          )}
        </div>
      )}
      <div onClick={(e) => e.stopPropagation()}>{sheet}</div>
    </div>
  );
};

/** Startzustand des Bücher-Filters: Genre-Chips und beliebte Neuerscheinungen. */
export const BookOverlayIdle: React.FC<{ sheetZIndex?: number }> = ({ sheetZIndex }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { items, loading } = useBookShelf('new', { eager: true });
  const { openAdd, sheet } = useAddFlow(sheetZIndex);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="hso__chips">
        {GENRES.map((g) => (
          <button
            key={g.id}
            type="button"
            className="hso__chip"
            onClick={() => navigate(`/books/search?genre=${g.id}`)}
            style={{
              color: '#fff',
              background: `linear-gradient(135deg, ${g.colors[0]}, ${g.colors[1]})`,
              border: '1px solid rgba(255,255,255,0.14)',
            }}
          >
            {g.label()}
          </button>
        ))}
      </div>
      <div>
        <div
          className="hso__group-title"
          style={{ color: currentTheme.text.muted, marginBottom: 10 }}
        >
          {t('Neu & beliebt')}
        </div>
        <div className="dsc-grid" style={{ padding: 0 }}>
          {loading && items.length === 0 ? (
            <SkeletonCards count={10} />
          ) : (
            items.slice(0, 18).map((r) => <DiscoverCard key={r.id} result={r} onAdd={openAdd} />)
          )}
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()}>{sheet}</div>
    </div>
  );
};
