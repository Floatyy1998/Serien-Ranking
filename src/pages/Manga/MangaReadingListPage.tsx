/**
 * MangaReadingListPage - 1:1 equivalent of WatchNextPage
 * Shows all manga with readStatus 'reading' or 'planned' as SwipeableEpisodeRows.
 * Swipe right = mark next chapter as read.
 */
import { FilterList, MenuBook } from '@mui/icons-material';
import firebase from 'firebase/compat/app';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContextDef';
import { useDeviceType } from '../../hooks/useDeviceType';
import { logChapterRead } from '../../services/readActivityService';
import {
  GradientText,
  PageLayout,
  ScrollToTopButton,
  SwipeableEpisodeRow,
} from '../../components/ui';
import { getDisplayFormat, getEffectiveChapterCount, STATUS_COLORS } from './mangaUtils';
import type { Manga } from '../../types/Manga';

type SortOption = 'name-asc' | 'name-desc' | 'progress-asc' | 'progress-desc' | 'recent-desc';

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'name-asc', label: 'Name A-Z' },
  { value: 'name-desc', label: 'Name Z-A' },
  { value: 'progress-desc', label: 'Fortschritt ↓' },
  { value: 'progress-asc', label: 'Fortschritt ↑' },
  { value: 'recent-desc', label: 'Zuletzt gelesen' },
];

const FORMAT_FILTERS = [
  { key: 'all', label: 'Alle' },
  { key: 'MANGA', label: 'Manga' },
  { key: 'MANHWA', label: 'Manhwa' },
  { key: 'MANHUA', label: 'Manhua' },
];

export const MangaReadingListPage = () => {
  const { user } = useAuth() || {};
  const { mangaList } = useMangaList();
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();
  const navigate = useNavigate();
  const [, startTransition] = useTransition();

  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>(
    (localStorage.getItem('mangaReadingListSort') as SortOption) || 'recent-desc'
  );
  const [formatFilter, setFormatFilter] = useState(
    localStorage.getItem('mangaReadingListFormat') || 'all'
  );

  // Swipe state
  const [swipingEpisodes, setSwipingEpisodes] = useState<Set<string>>(new Set());
  const [dragOffsets, setDragOffsets] = useState<Record<string, number>>({});
  const [completingEpisodes, setCompletingEpisodes] = useState<Set<string>>(new Set());
  const [swipeDirections, setSwipeDirections] = useState<Record<string, 'left' | 'right'>>({});

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => setDebouncedFilter(filterInput));
    }, 250);
    return () => clearTimeout(timer);
  }, [filterInput]);

  // Persist preferences
  useEffect(() => {
    localStorage.setItem('mangaReadingListSort', sortOption);
    localStorage.setItem('mangaReadingListFormat', formatFilter);
  }, [sortOption, formatFilter]);

  // Filter + Sort
  const items = useMemo(() => {
    let filtered = mangaList.filter(
      (m) => m.readStatus === 'reading' || m.readStatus === 'planned'
    );

    if (debouncedFilter) {
      const q = debouncedFilter.toLowerCase();
      filtered = filtered.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (formatFilter !== 'all') {
      filtered = filtered.filter((m) => m.format === formatFilter);
    }

    filtered.sort((a, b) => {
      switch (sortOption) {
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'progress-desc': {
          const pA = a.chapters ? (a.currentChapter / a.chapters) * 100 : 0;
          const pB = b.chapters ? (b.currentChapter / b.chapters) * 100 : 0;
          return pB - pA;
        }
        case 'progress-asc': {
          const pA2 = a.chapters ? (a.currentChapter / a.chapters) * 100 : 0;
          const pB2 = b.chapters ? (b.currentChapter / b.chapters) * 100 : 0;
          return pA2 - pB2;
        }
        case 'recent-desc': {
          const tA = a.lastReadAt ? new Date(a.lastReadAt).getTime() : 0;
          const tB = b.lastReadAt ? new Date(b.lastReadAt).getTime() : 0;
          return tB - tA;
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [mangaList, debouncedFilter, formatFilter, sortOption]);

  const handleComplete = useCallback(
    async (manga: Manga, direction: 'left' | 'right' = 'right') => {
      if (!user) return;
      const key = String(manga.anilistId);
      const newChapter = manga.currentChapter + 1;

      setSwipeDirections((prev) => ({ ...prev, [key]: direction }));
      setCompletingEpisodes((prev) => new Set(prev).add(key));
      setTimeout(() => {
        setCompletingEpisodes((prev) => {
          const s = new Set(prev);
          s.delete(key);
          return s;
        });
      }, 250);

      const updates: Record<string, unknown> = {
        currentChapter: newChapter,
        lastReadAt: new Date().toISOString(),
      };
      if (manga.readStatus === 'planned') {
        updates.readStatus = 'reading';
        if (!manga.startedAt) updates.startedAt = new Date().toISOString();
      }
      const effectiveTotal = getEffectiveChapterCount(manga);
      // Nur auto-completen, wenn das Total wirklich plausibel ist:
      // currentChapter muss vor dem Increment darunter gelegen haben.
      // Schutz gegen stale chapters-Werte (z.B. Vagabond: AniList meldet 2).
      if (effectiveTotal && manga.currentChapter < effectiveTotal && newChapter >= effectiveTotal) {
        updates.readStatus = 'completed';
        updates.completedAt = new Date().toISOString();
      }

      await firebase.database().ref(`users/${user.uid}/manga/${manga.anilistId}`).update(updates);
      await logChapterRead(user.uid, manga, newChapter, manga.currentChapter);
    },
    [user]
  );

  return (
    <PageLayout
      style={{ height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={{
            padding: '20px',
            paddingTop: 'calc(20px + env(safe-area-inset-top))',
            background: `${currentTheme.background.default}90`,
            backdropFilter: 'blur(24px) saturate(1.4)',
            WebkitBackdropFilter: 'blur(24px) saturate(1.4)',
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
          >
            <div>
              <GradientText
                as="h1"
                from={currentTheme.primary}
                to={currentTheme.accent}
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  margin: 0,
                }}
              >
                Leseliste
              </GradientText>
              <p
                style={{
                  color: currentTheme.text.secondary,
                  fontSize: '14px',
                  margin: '4px 0 0 0',
                }}
              >
                {items.length} Manga zum Lesen
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFilter(!showFilter)}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: showFilter
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                  : 'rgba(255,255,255,0.05)',
                color: showFilter ? '#fff' : currentTheme.text.primary,
              }}
            >
              <FilterList />
            </motion.button>
          </div>

          {/* Filter Section */}
          <AnimatePresence>
            {showFilter && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden', marginTop: 12 }}
              >
                <input
                  type="text"
                  placeholder="Manga suchen..."
                  value={filterInput}
                  onChange={(e) => setFilterInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.05)',
                    color: currentTheme.text.primary,
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'var(--font-body)',
                    marginBottom: 10,
                  }}
                />

                {/* Sort */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {SORT_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => startTransition(() => setSortOption(s.value))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: 'none',
                        background:
                          sortOption === s.value
                            ? `${currentTheme.primary}25`
                            : 'rgba(255,255,255,0.05)',
                        color:
                          sortOption === s.value
                            ? currentTheme.primary
                            : currentTheme.text.secondary,
                        fontSize: 11,
                        fontWeight: sortOption === s.value ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {/* Format filter */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {FORMAT_FILTERS.map((f) => (
                    <button
                      key={f.key}
                      onClick={() => startTransition(() => setFormatFilter(f.key))}
                      style={{
                        padding: '5px 10px',
                        borderRadius: 8,
                        border: `1px solid ${formatFilter === f.key ? currentTheme.primary : 'rgba(255,255,255,0.06)'}`,
                        background:
                          formatFilter === f.key ? `${currentTheme.primary}20` : 'transparent',
                        color:
                          formatFilter === f.key
                            ? currentTheme.primary
                            : currentTheme.text.secondary,
                        fontSize: 11,
                        fontWeight: formatFilter === f.key ? 600 : 400,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Scrollable Content */}
        <div
          className="episodes-scroll-container hide-scrollbar"
          style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 100px' }}
        >
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: 'center', padding: '60px 20px' }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `linear-gradient(135deg, ${currentTheme.primary}20, ${currentTheme.accent}15)`,
                }}
              >
                <MenuBook style={{ fontSize: 44, color: currentTheme.primary }} />
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: currentTheme.text.primary,
                  margin: '0 0 8px',
                }}
              >
                Keine Manga zum Lesen
              </h2>
              <p
                style={{
                  fontSize: 15,
                  color: currentTheme.text.secondary,
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                Füge Manga hinzu und setze den
                <br />
                Status auf &quot;Lese ich&quot; oder &quot;Geplant&quot;!
              </p>
            </motion.div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence mode="popLayout">
                {items.map((manga) => {
                  const key = String(manga.anilistId);
                  const effectiveTotal = getEffectiveChapterCount(manga);
                  const progress =
                    effectiveTotal && effectiveTotal > 0
                      ? Math.min((manga.currentChapter / effectiveTotal) * 100, 100)
                      : 0;
                  const format = getDisplayFormat(manga.countryOfOrigin, manga.format);
                  const isPlanned = manga.readStatus === 'planned';

                  return (
                    <SwipeableEpisodeRow
                      key={key}
                      itemKey={key}
                      poster={manga.poster}
                      posterAlt={manga.title}
                      accentColor={isPlanned ? STATUS_COLORS.planned : currentTheme.primary}
                      isCompleting={completingEpisodes.has(key)}
                      isSwiping={swipingEpisodes.has(key)}
                      dragOffset={dragOffsets[key] || 0}
                      swipeDirection={swipeDirections[key]}
                      canSwipe={true}
                      onSwipeStart={() => setSwipingEpisodes((prev) => new Set(prev).add(key))}
                      onSwipeDrag={(offset) =>
                        setDragOffsets((prev) => ({ ...prev, [key]: offset }))
                      }
                      onSwipeEnd={() => {
                        setSwipingEpisodes((prev) => {
                          const s = new Set(prev);
                          s.delete(key);
                          return s;
                        });
                        setDragOffsets((prev) => ({ ...prev, [key]: 0 }));
                      }}
                      onComplete={(dir) => handleComplete(manga, dir)}
                      onPosterClick={() => navigate(`/manga/${manga.anilistId}`)}
                      action={null}
                      content={
                        <>
                          <h2
                            style={{
                              fontSize: isMobile ? '13px' : '16px',
                              fontWeight: 700,
                              margin: '0 0 2px 0',
                              letterSpacing: '-0.01em',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {manga.title}
                          </h2>
                          <p
                            style={{
                              fontSize: isMobile ? '11px' : '14px',
                              fontWeight: 500,
                              margin: 0,
                              color: isPlanned ? STATUS_COLORS.planned : currentTheme.accent,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            Kap. {manga.currentChapter}
                            {effectiveTotal ? ` / ${effectiveTotal}` : ''}
                            {' · '}
                            {format}
                            {isPlanned && (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 4,
                                  marginLeft: 6,
                                  background: `${STATUS_COLORS.planned}20`,
                                  color: STATUS_COLORS.planned,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.3px',
                                }}
                              >
                                Geplant
                              </span>
                            )}
                          </p>
                          <p
                            style={{
                              fontSize: isMobile ? '10px' : '13px',
                              margin: '2px 0 0 0',
                              color: currentTheme.text.secondary,
                              opacity: 0.6,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {effectiveTotal && manga.currentChapter < effectiveTotal
                              ? `${effectiveTotal - manga.currentChapter} Kapitel übrig`
                              : manga.status === 'RELEASING'
                                ? 'Laufend · Wartet auf neue Kapitel'
                                : 'Fortschritt unbekannt'}
                          </p>
                          <div
                            style={{
                              marginTop: 6,
                              height: 3,
                              background: 'rgba(255,255,255,0.08)',
                              borderRadius: 2,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${progress}%`,
                                height: '100%',
                                background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                                transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          </div>
                        </>
                      }
                    />
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".episodes-scroll-container" />
    </PageLayout>
  );
};
