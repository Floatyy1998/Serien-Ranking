import { BarChart, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { EmptyState, PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import type { Manga } from '../../types/Manga';
import { getDisplayFormat, getEffectiveChapterCount } from './mangaUtils';
import './MangaPage.css';
import { tapScale } from '../../lib/motion';

type SortBy = 'rating-desc' | 'rating-asc' | 'name-asc' | 'name-desc' | 'progress-desc';
type QuickFilterType =
  | 'all'
  | 'rated'
  | 'unrated'
  | 'reading'
  | 'completed'
  | 'manga'
  | 'manhwa'
  | 'manhua';

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'rating-desc', label: 'Bewertung ↓' },
  { value: 'rating-asc', label: 'Bewertung ↑' },
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'progress-desc', label: 'Fortschritt ↓' },
];

// Static inline styles hoisted out of render (no per-render allocation in the grid loop)
const GRID_ITEM_STYLE: React.CSSProperties = {
  borderRadius: 12,
  overflow: 'hidden',
  cursor: 'pointer',
  position: 'relative',
  aspectRatio: '2/3',
};
const POSTER_IMG_STYLE: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover' };
const OVERLAY_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: 8,
  background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
};
const TITLE_STYLE: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#fff',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};
const META_ROW_STYLE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  marginTop: 2,
};
const STAR_ICON_STYLE: React.CSSProperties = { fontSize: 12, color: '#f59e0b' };
const RATING_TEXT_STYLE: React.CSSProperties = { fontSize: 11, color: '#f59e0b', fontWeight: 600 };
const FORMAT_TEXT_STYLE: React.CSSProperties = {
  fontSize: 9,
  color: 'rgba(255,255,255,0.5)',
  marginLeft: 'auto',
};
const PROGRESS_TRACK_STYLE: React.CSSProperties = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: 3,
  background: 'rgba(255,255,255,0.1)',
};

const QUICK_FILTERS: { id: QuickFilterType; label: string }[] = [
  { id: 'all', label: 'Alle' },
  { id: 'rated', label: 'Bewertet' },
  { id: 'unrated', label: 'Unbewertet' },
  { id: 'reading', label: 'Lese ich' },
  { id: 'completed', label: 'Fertig' },
  { id: 'manga', label: 'Manga' },
  { id: 'manhwa', label: 'Manhwa' },
  { id: 'manhua', label: 'Manhua' },
];

export const MangaRatingsPage = () => {
  const { currentTheme } = useTheme();
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const navigate = useNavigate();

  const [sortBy, setSortBy] = useState<SortBy>('rating-desc');
  const [quickFilter, setQuickFilter] = useState<QuickFilterType>('all');

  const userId = user?.uid;
  const getRating = useCallback(
    (manga: Manga): number => (userId ? manga.rating?.[userId] || 0 : 0),
    [userId]
  );

  const items = useMemo(() => {
    let filtered = [...mangaList];

    switch (quickFilter) {
      case 'rated':
        filtered = filtered.filter((m) => getRating(m) > 0);
        break;
      case 'unrated':
        filtered = filtered.filter((m) => getRating(m) === 0);
        break;
      case 'reading':
        filtered = filtered.filter((m) => m.readStatus === 'reading');
        break;
      case 'completed':
        filtered = filtered.filter((m) => m.readStatus === 'completed');
        break;
      case 'manga':
        filtered = filtered.filter((m) => m.format === 'MANGA');
        break;
      case 'manhwa':
        filtered = filtered.filter((m) => m.format === 'MANHWA');
        break;
      case 'manhua':
        filtered = filtered.filter((m) => m.format === 'MANHUA');
        break;
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating-desc':
          return getRating(b) - getRating(a);
        case 'rating-asc':
          return getRating(a) - getRating(b);
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'progress-desc': {
          const pA = a.chapters ? (a.currentChapter / a.chapters) * 100 : 0;
          const pB = b.chapters ? (b.currentChapter / b.chapters) * 100 : 0;
          return pB - pA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [mangaList, sortBy, quickFilter, getRating]);

  const stats = useMemo(() => {
    const rated = items.filter((m) => getRating(m) > 0);
    const avg = rated.length > 0 ? rated.reduce((s, m) => s + getRating(m), 0) / rated.length : 0;
    return { count: rated.length, average: avg };
  }, [items, getRating]);

  return (
    <PageLayout>
      <PageHeader
        title="Manga Bewertungen"
        gradientFrom={currentTheme.primary}
        gradientTo={currentTheme.accent}
        subtitle={
          stats.count > 0
            ? `${stats.count} bewertet · Ø ${stats.average.toFixed(1)}`
            : `${mangaList.length} Manga`
        }
        icon={<BarChart />}
      />

      <div style={{ padding: '0 16px' }}>
        {/* Quick Filters */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 12,
          }}
        >
          {QUICK_FILTERS.map((f) => {
            const active = quickFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${active ? 'var(--theme-primary-40)' : 'var(--glass-border-subtle)'}`,
                  background: active ? 'var(--theme-primary-15)' : 'var(--glass-subtle)',
                  backdropFilter: 'var(--glass-filter-sm)',
                  WebkitBackdropFilter: 'var(--glass-filter-sm)',
                  boxShadow: active ? 'inset 0 0 0 1px var(--theme-primary-20)' : undefined,
                  color: active ? currentTheme.primary : currentTheme.text.secondary,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  opacity: active ? 1 : 0.75,
                  transition:
                    'background var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map((s) => {
            const active = sortBy === s.value;
            return (
              <button
                key={s.value}
                onClick={() => setSortBy(s.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${active ? 'var(--theme-primary-30)' : 'transparent'}`,
                  background: active ? 'var(--theme-primary-12)' : 'transparent',
                  color: active ? currentTheme.primary : currentTheme.text.secondary,
                  fontSize: 11,
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-body)',
                  opacity: active ? 1 : 0.55,
                  transition:
                    'background var(--duration-fast) ease, border-color var(--duration-fast) ease, color var(--duration-fast) ease',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Grid */}
        <div className="manga-collection-grid" style={{ paddingBottom: 100 }}>
          {items.map((manga) => {
            const rating = getRating(manga);
            const totalChapters = getEffectiveChapterCount(manga);
            const progress = totalChapters
              ? Math.min((manga.currentChapter / totalChapters) * 100, 100)
              : 0;

            return (
              <motion.div
                key={manga.anilistId}
                className="manga-ratings-item"
                role="button"
                tabIndex={0}
                aria-label={`${manga.title} öffnen`}
                onClick={() => navigate(`/manga/${manga.anilistId}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/manga/${manga.anilistId}`);
                  }
                }}
                style={GRID_ITEM_STYLE}
                whileTap={tapScale}
              >
                <img
                  src={manga.poster}
                  alt={manga.title}
                  loading="lazy"
                  style={POSTER_IMG_STYLE}
                  decoding="async"
                />
                <div style={OVERLAY_STYLE}>
                  <div style={TITLE_STYLE}>{manga.title}</div>
                  <div style={META_ROW_STYLE}>
                    {rating > 0 && (
                      <>
                        <Star style={STAR_ICON_STYLE} />
                        <span style={RATING_TEXT_STYLE}>{rating}</span>
                      </>
                    )}
                    {manga.format && (
                      <span style={FORMAT_TEXT_STYLE}>
                        {getDisplayFormat(manga.countryOfOrigin, manga.format)}
                      </span>
                    )}
                  </div>
                </div>

                {progress > 0 && (
                  <div style={PROGRESS_TRACK_STYLE}>
                    <div
                      style={{
                        height: '100%',
                        width: `${progress}%`,
                        background: progress === 100 ? '#22c55e' : currentTheme.primary,
                      }}
                    />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {items.length === 0 && (
          <EmptyState
            icon={<Star style={{ fontSize: 40 }} />}
            title="Keine Manga gefunden"
            description="Mit diesem Filter gibt es gerade nichts. Wähle einen anderen Filter oder füge neue Manga hinzu."
          />
        )}
      </div>
    </PageLayout>
  );
};
