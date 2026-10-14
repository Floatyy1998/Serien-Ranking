import { ChevronRight, LocalLibrary } from '@mui/icons-material';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useBookSearch } from '../../../hooks/books/useBookSearch';
import { useBookShelf } from '../../../hooks/books/useBookShelf';
import { useMangaVolumes } from '../../../hooks/books/useMangaVolumes';
import { useOwnedBooks } from '../../../hooks/books/useOwnedBooks';
import { groupMangaVolumes } from '../../../lib/books/mangaVolume';
import { mangaPath } from '../../../lib/manga/mangaSource';
import { volumeSnapshot } from '../../../lib/books/mangaBooks';
import { t } from '../../../services/i18n';
import { MangaResultCard } from '../../Manga/components/MangaResultCard';
import { useAddManga } from '../../Manga/useAddManga';
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
  /** Manga, die die Manga-Reihe darüber schon zeigt — ihre Bände fallen hier weg. */
  hideMangaIds?: number[];
  onCount?: (count: number, loading: boolean) => void;
  onSeeAll?: () => void;
  /** Treffer direkt hinzugefügt — Bücher landen im Regal, Manga-Bände bei den Manga. */
  onAdded?: (found: 'books' | 'manga') => void;
}

/** Buch-Treffer im Such-Overlay — gleiche Poster-Karten wie beim Stöbern. */
export const BookQuickResults: React.FC<Props> = ({
  query,
  variant,
  sheetZIndex,
  hideMangaIds,
  onCount,
  onSeeAll,
  onAdded,
}) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { results, loading: searching } = useBookSearch(query);
  const { openAdd, sheet } = useAddFlow(sheetZIndex, () => onAdded?.('books'));
  const ownedFor = useOwnedBooks();
  const { links, pending, isPending } = useMangaVolumes(results, { query, deep: true });
  const { add: addManga, addingId } = useAddManga();
  const loading = searching || pending;

  const entries = groupMangaVolumes(
    results.filter((r) => !isPending(r)),
    (r) => (ownedFor(r) || links.get(r.id)?.asBooks ? undefined : links.get(r.id))
  ).filter((e) => e.kind === 'book' || !hideMangaIds?.includes(e.link.manga.id));

  useEffect(() => {
    onCount?.(entries.length, loading);
  }, [entries.length, loading, onCount]);

  if (query.trim().length < 2) return null;
  if (variant === 'row' && !loading && entries.length === 0) return null;

  const list = entries.slice(0, variant === 'row' ? 12 : 30);

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
            list.map((entry) =>
              entry.kind === 'book' ? (
                <DiscoverCard key={entry.result.id} result={entry.result} onAdd={openAdd} />
              ) : (
                <div key={`manga-${entry.link.manga.id}`} className="dsc-card">
                  <MangaResultCard
                    result={entry.link.manga}
                    owned={entry.link.owned}
                    alias={entry.volumes.length === 1 ? entry.volumes[0].title : undefined}
                    adding={addingId === entry.link.manga.id}
                    onOpen={() =>
                      navigate(
                        mangaPath(
                          entry.link.manga.id,
                          entry.volumes.length === 1 ? entry.link.volume : undefined
                        )
                      )
                    }
                    onAdd={(e) => {
                      e.stopPropagation();
                      onAdded?.('manga');
                      void addManga(entry.link.manga, {
                        byVolume: true,
                        fromBooks:
                          entry.volumes.length === 1
                            ? [volumeSnapshot(entry.volumes[0], new Date().toISOString())]
                            : undefined,
                      });
                    }}
                  />
                </div>
              )
            )
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
