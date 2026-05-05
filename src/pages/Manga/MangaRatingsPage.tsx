import { BarChart, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { PageHeader, PageLayout } from '../../components/ui';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import type { Manga } from '../../types/Manga';
import { getDisplayFormat, getEffectiveChapterCount } from './mangaUtils';
import './MangaPage.css';

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
            overflowX: 'auto',
            marginBottom: 12,
            paddingBottom: 4,
          }}
        >
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setQuickFilter(f.id)}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                border: `1px solid ${quickFilter === f.id ? currentTheme.primary : 'rgba(255,255,255,0.08)'}`,
                background:
                  quickFilter === f.id ? `${currentTheme.primary}20` : 'rgba(255,255,255,0.04)',
                color: quickFilter === f.id ? currentTheme.primary : currentTheme.text.secondary,
                fontSize: 12,
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                opacity: quickFilter === f.id ? 1 : 0.7,
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
          {SORT_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => setSortBy(s.value)}
              style={{
                padding: '5px 10px',
                borderRadius: 8,
                border: 'none',
                background: sortBy === s.value ? `${currentTheme.primary}25` : 'transparent',
                color: sortBy === s.value ? currentTheme.primary : currentTheme.text.secondary,
                fontSize: 11,
                fontWeight: sortBy === s.value ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                opacity: sortBy === s.value ? 1 : 0.5,
              }}
            >
              {s.label}
            </button>
          ))}
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
                onClick={() => navigate(`/manga/${manga.anilistId}`)}
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  aspectRatio: '2/3',
                }}
                whileTap={{ scale: 0.96 }}
              >
                <img
                  src={manga.poster}
                  alt={manga.title}
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: 8,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#fff',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {manga.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    {rating > 0 && (
                      <>
                        <Star style={{ fontSize: 12, color: '#f59e0b' }} />
                        <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>
                          {rating}
                        </span>
                      </>
                    )}
                    {manga.format && (
                      <span
                        style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)', marginLeft: 'auto' }}
                      >
                        {getDisplayFormat(manga.countryOfOrigin, manga.format)}
                      </span>
                    )}
                  </div>
                </div>

                {progress > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: 3,
                      background: 'rgba(255,255,255,0.1)',
                    }}
                  >
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
          <div style={{ textAlign: 'center', padding: 60, opacity: 0.5, fontSize: 14 }}>
            Keine Manga mit diesem Filter
          </div>
        )}
      </div>
    </PageLayout>
  );
};
