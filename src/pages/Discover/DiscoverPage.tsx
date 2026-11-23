import {
  CalendarToday,
  FilterList,
  Movie as MovieIcon,
  NewReleases,
  Recommend,
  Search,
  Star,
  Subscriptions,
  TrendingUp,
  Whatshot,
} from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMangaList } from '../../contexts/MangaListContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useActiveSubscriptions } from '../../hooks/provider/useActiveSubscriptions';
import { useQuickMediaActions } from '../../hooks/rating/useQuickMediaActions';
import { QuickRatingSheet } from '../../components/ui/overlay/QuickRatingSheet';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { useDiscoverFetch } from './useDiscoverFetch';
import { useDiscoverFilters } from './useDiscoverFilters';
import { activeViewFilterCount } from '../../lib/taste/discoverFilters';
import { DiscoverContent } from './DiscoverContent';
import { DiscoverFilterSheet } from './sheets/DiscoverFilterSheet';
import type { DiscoverItem, DiscoverQuickActions } from './discoverItemHelpers';
import {
  BackButton,
  Dialog,
  GradientText,
  LoadingSpinner,
  PageLayout,
  PageState,
  Snackbar,
  TabSwitcher,
  SearchInput,
} from '../../components/ui';
import './DiscoverPage.css';
import { tapScaleTight } from '../../lib/motion';

// Stabile leere Referenz: verhindert überflüssige Re-Fetches, solange der
// Abo-Filter aus ist (Identität ändert sich sonst, wenn die Abos nachladen).
const EMPTY_PROVIDERS: Set<string> = new Set();

const toQuickItem = (item: DiscoverItem) => ({
  id: item.id,
  type: item.type,
  title: item.title || item.name || '',
  poster_path: item.poster_path ?? undefined,
});

export const DiscoverPage = memo(() => {
  const { currentTheme } = useTheme();

  const {
    activeTab,
    setActiveTab,
    activeCategory,
    setActiveCategory,
    selectedGenre,
    showFilters,
    setShowFilters,
    showSearch,
    setShowSearch,
    searchQuery,
    setSearchQuery,
    onlyMyProviders,
    setOnlyMyProviders,
    viewFilters,
    setViewFilters,
    isRestoring,
    isDesktop,
    headerHeight,
    handleItemClick,
    fetchRecommendationsOnRestoreRef,
    fetchFromTMDBOnRestoreRef,
  } = useDiscoverFilters();

  const { activeProviders } = useActiveSubscriptions();
  const { allMangaList } = useMangaList();
  const readsManga = allMangaList.length >= 3;
  const fetchExtras = useMemo(
    () => ({ viewFilters, ownProviders: activeProviders, readsManga }),
    [viewFilters, activeProviders, readsManga]
  );
  const filterCount = activeViewFilterCount(viewFilters);

  // Beim Scrollen klappt die Titelzeile ein; Umschalter, Filter und Kategorien
  // bleiben stehen. Der Platzhalter unten behaelt die volle Kopfhoehe, damit
  // der Inhalt beim Einklappen nicht springt.
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  useEffect(() => {
    const box = document.querySelector('.mobile-discover-container');
    if (!box) return;
    const onScroll = () => setHeaderCollapsed(box.scrollTop > 24);
    box.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => box.removeEventListener('scroll', onScroll);
  }, []);
  // Der Toggle greift nur, wenn der Nutzer mindestens ein AKTIVES Abo gepflegt
  // hat — sonst gäbe es keine Grundlage zum Filtern (leer + verwirrend).
  const canFilterByProviders = activeProviders.size > 0;
  const providerFilterActive = onlyMyProviders && canFilterByProviders;
  const providerToggleTitle = !canFilterByProviders
    ? t('Aktiviere zuerst ein Streaming-Abo in den Abo-Einstellungen')
    : providerFilterActive
      ? t('Filter „Auf meinen Abos" aktiv')
      : t('Nur was ich streamen kann');

  const {
    results,
    loading,
    error,
    searchResults,
    searchLoading,
    recommendations,
    recommendationsLoading,
    addingItem,
    snackbar,
    dialog,
    setDialog,
    fetchFromTMDB,
    fetchRecommendations,
    addToList,
    setupScrollListener,
  } = useDiscoverFetch(
    activeTab,
    activeCategory,
    selectedGenre,
    showSearch,
    searchQuery,
    isRestoring,
    providerFilterActive,
    providerFilterActive ? activeProviders : EMPTY_PROVIDERS,
    fetchExtras
  );

  const [matchSeen, setMatchSeen] = useState(false);
  const hasMatches =
    recommendations.some((item) => item.match !== undefined) ||
    results.some((item) => item.match !== undefined);
  useEffect(() => {
    if (hasMatches) setMatchSeen(true);
  }, [hasMatches]);

  const [quickSnack, setQuickSnack] = useState('');
  const quickSnackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifyQuick = useCallback((message: string) => {
    if (quickSnackTimer.current) clearTimeout(quickSnackTimer.current);
    setQuickSnack(message);
    quickSnackTimer.current = setTimeout(() => setQuickSnack(''), 2500);
  }, []);
  useEffect(
    () => () => {
      if (quickSnackTimer.current) clearTimeout(quickSnackTimer.current);
    },
    []
  );

  const { statusOf, markWatched, rate, quickRating, closeQuickRating, saveQuickRating } =
    useQuickMediaActions({ source: 'discover', notify: notifyQuick });

  const quick = useMemo<DiscoverQuickActions>(
    () => ({
      statusOf,
      markWatched: (item, inList, event) => void markWatched(toQuickItem(item), inList, event),
      rate: (item, ownRating, event) => rate(toQuickItem(item), ownRating, event),
    }),
    [statusOf, markWatched, rate]
  );

  useEffect(() => {
    fetchRecommendationsOnRestoreRef.current = () => fetchRecommendations(true);
    fetchFromTMDBOnRestoreRef.current = () => fetchFromTMDB(true);
  }, [
    fetchRecommendations,
    fetchFromTMDB,
    fetchRecommendationsOnRestoreRef,
    fetchFromTMDBOnRestoreRef,
  ]);

  useEffect(() => {
    return setupScrollListener(activeCategory);
  }, [setupScrollListener, activeCategory]);

  const categories = [
    { id: 'trending', label: t('Trend'), icon: TrendingUp, color: currentTheme.primary },
    { id: 'popular', label: t('Beliebt'), icon: Whatshot, color: currentTheme.status.error },
    { id: 'top_rated', label: t('Top'), icon: Star, color: currentTheme.accent },
    {
      id: 'upcoming',
      label: activeTab === 'movies' ? t('Neu') : t('Läuft'),
      icon: NewReleases,
      color: currentTheme.status.success,
    },
    {
      id: 'recommendations',
      label: t('Für dich'),
      icon: Recommend,
      color: currentTheme.accent,
    },
  ] as const;

  return (
    <PageLayout style={{ height: 'var(--vh, 100vh)', overflow: 'hidden' }}>
      {/* Fixed Header and Controls */}
      <div
        data-header="discover-header"
        className={headerCollapsed ? 'discover-header is-collapsed' : 'discover-header'}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: `${currentTheme.background.default}e8`,
          backdropFilter: 'var(--glass-filter-lg)',
          WebkitBackdropFilter: 'var(--glass-filter-lg)',
        }}
      >
        <div
          style={{
            background: `linear-gradient(180deg, ${currentTheme.primary}15 0%, transparent 100%)`,
          }}
        >
          {/* Header */}
          <header
            style={{
              padding: 'var(--space-3) var(--page-x)',
              paddingTop: 'var(--nav-top)',
            }}
          >
            <div
              className="discover-head-row"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 'var(--space-2)',
              }}
            >
              <div
                className="discover-head-title"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  // Ohne minWidth:0 schiebt sich der Titel unter die Symbole,
                  // sobald die nutzbare Breite unter ~340px faellt (Zoom).
                  minWidth: 0,
                }}
              >
                <span className="discover-head-back">
                  <BackButton showHome={false} />
                </span>
                <GradientText
                  as="h1"
                  style={{
                    fontSize: 'var(--page-title-size)',
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.03em',
                    margin: 0,
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {t('Entdecken')}
                </GradientText>
              </div>

              <div
                className="discover-head-actions"
                style={{ display: 'flex', gap: '6px', flexShrink: 0 }}
              >
                <motion.button
                  whileTap={tapScaleTight}
                  onClick={() => {
                    const newValue = !showSearch;
                    setShowSearch(newValue);
                    if (newValue) {
                      setShowFilters(false);
                    }
                  }}
                  aria-label={showSearch ? t('Suche schließen') : t('Suche öffnen')}
                  aria-expanded={showSearch}
                  style={{
                    padding: '10px',
                    background: showSearch
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                      : currentTheme.background.surface,
                    border: showSearch ? 'none' : `1px solid ${currentTheme.border.default}`,
                    borderRadius: 'var(--radius-2xl)',
                    color: showSearch
                      ? getOptimalTextColor(currentTheme.primary)
                      : currentTheme.text.primary,
                    cursor: 'pointer',
                    boxShadow: showSearch ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                  }}
                >
                  <Search style={{ fontSize: '20px' }} />
                </motion.button>
              </div>
            </div>
          </header>

          {/* Search input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ padding: '4px var(--page-x) var(--space-3)', overflow: 'hidden' }}
              >
                <SearchInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={
                    activeTab === 'series' ? t('Serien suchen...') : t('Filme suchen...')
                  }
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Umschalter und die beiden Filter-Knoepfe teilen sich eine Reihe:
              drei getrennte Baender (Kopf, Umschalter, Kategorien) wirkten
              zerfallen und liessen in der engen Ansicht keinen Platz fuer den
              Zurueck-Knopf in der Kopfzeile. */}
          <div className="discover-control-row">
            <TabSwitcher
              tabs={[
                { id: 'series', label: t('Serien'), icon: CalendarToday },
                { id: 'movies', label: t('Filme'), icon: MovieIcon },
              ]}
              activeTab={activeTab}
              onTabChange={(id) => {
                setActiveTab(id as 'series' | 'movies');
                setShowSearch(false);
              }}
              className="discover-tabs"
              style={{ margin: 0 }}
            />
            <motion.button
              type="button"
              className="discover-abo-toggle"
              whileTap={canFilterByProviders ? tapScaleTight : undefined}
              onClick={() => {
                if (canFilterByProviders) setOnlyMyProviders((v) => !v);
              }}
              disabled={!canFilterByProviders}
              aria-pressed={providerFilterActive}
              aria-label={t('Nur Titel auf meinen aktiven Abos anzeigen')}
              title={providerToggleTitle}
              style={{
                background: providerFilterActive
                  ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                  : currentTheme.background.surface,
                border: providerFilterActive ? 'none' : `1px solid ${currentTheme.border.default}`,
                color: providerFilterActive
                  ? getOptimalTextColor(currentTheme.primary)
                  : currentTheme.text.primary,
                cursor: canFilterByProviders ? 'pointer' : 'not-allowed',
                opacity: canFilterByProviders ? 1 : 0.5,
                boxShadow: providerFilterActive ? `0 4px 12px ${currentTheme.primary}40` : 'none',
              }}
            >
              <Subscriptions style={{ fontSize: '20px' }} />
            </motion.button>
            {!showSearch && (
              <motion.button
                className="discover-filter-toggle"
                whileTap={tapScaleTight}
                onClick={() => setShowFilters(true)}
                aria-label={
                  filterCount > 0 ? t('Filter ({n} aktiv)', { n: filterCount }) : t('Filter')
                }
                aria-haspopup="dialog"
                style={{
                  background:
                    filterCount > 0
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                      : currentTheme.background.surface,
                  border: filterCount > 0 ? 'none' : `1px solid ${currentTheme.border.default}`,
                  color:
                    filterCount > 0
                      ? getOptimalTextColor(currentTheme.primary)
                      : currentTheme.text.primary,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: filterCount > 0 ? `0 4px 12px ${currentTheme.primary}40` : 'none',
                }}
                title={t('Filter')}
              >
                <FilterList style={{ fontSize: '20px' }} />
                {filterCount > 0 && (
                  <span
                    className="discover-filter-count"
                    style={{
                      background: currentTheme.background.default,
                      color: currentTheme.text.primary,
                    }}
                  >
                    {filterCount}
                  </span>
                )}
              </motion.button>
            )}
          </div>

          {/* Categories */}
          {!showSearch && (
            <div className="discover-cats">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <motion.button
                    key={cat.id}
                    whileTap={tapScaleTight}
                    onClick={() => {
                      setActiveCategory(cat.id);
                    }}
                    style={{
                      minHeight: 'var(--control-sm)',
                      padding: '0 var(--space-3)',
                      background: isActive
                        ? `linear-gradient(135deg, ${cat.color}25, ${cat.color}0a)`
                        : 'linear-gradient(135deg, var(--glass-light) 0%, var(--glass-subtle) 100%)',
                      border: isActive
                        ? `1px solid ${cat.color}40`
                        : '1px solid var(--glass-border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      color: isActive ? cat.color : currentTheme.text.secondary,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      boxShadow: isActive ? `0 4px 16px -4px ${cat.color}20` : 'none',
                    }}
                  >
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700 }}>{cat.label}</span>
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div
        className="mobile-discover-container"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* Spacer for fixed header */}
        <div style={{ height: `${headerHeight}px` }} />

        <div style={{ padding: '16px 20px' }}>
          {/* Page-Level-Fehler: nur als Sackgasse (kein Inhalt) — sonst wie gehabt */}
          {error && !loading && results.length === 0 && !showSearch && (
            <PageState
              mode="error"
              error={{
                title: t('Laden fehlgeschlagen'),
                description: error,
                onRetry: () => fetchFromTMDB(true),
              }}
            />
          )}
          <DiscoverContent
            activeCategory={activeCategory}
            showSearch={showSearch}
            searchQuery={searchQuery}
            isDesktop={isDesktop}
            currentTheme={currentTheme}
            results={results}
            loading={loading}
            onlyMyProviders={providerFilterActive}
            searchResults={searchResults}
            searchLoading={searchLoading}
            recommendations={recommendations}
            recommendationsLoading={recommendationsLoading}
            addingItem={addingItem}
            handleItemClick={handleItemClick}
            addToList={addToList}
            quick={quick}
            filtersActive={filterCount > 0}
          />

          {/* Loading indicator */}
          {((loading && !showSearch && activeCategory !== 'recommendations') ||
            (recommendationsLoading &&
              !showSearch &&
              activeCategory === 'recommendations' &&
              recommendations.length > 0)) && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LoadingSpinner size={36} />
            </motion.div>
          )}

          {/* Eigener Scroll-Container: das Polster der Shell greift hier nicht,
              also den Dock-Platz aus derselben Quelle reservieren. */}
          <div style={{ height: 'calc(var(--dock-reserve) + var(--page-bottom-gap))' }} />
        </div>
      </div>

      {/* Snackbar for success feedback */}
      <Snackbar
        open={snackbar.open || !!quickSnack}
        message={snackbar.open ? snackbar.message : quickSnack}
      />

      <DiscoverFilterSheet
        isOpen={showFilters && !showSearch}
        onClose={() => setShowFilters(false)}
        filters={viewFilters}
        onChange={setViewFilters}
        media={activeTab === 'series' ? 'series' : 'movie'}
        showMatch={matchSeen}
      />

      <QuickRatingSheet
        isOpen={quickRating.open}
        onClose={closeQuickRating}
        seriesTitle={quickRating.title}
        eyebrow={quickRating.afterWatched ? t('Als gesehen markiert') : t('In deiner Liste')}
        initialRating={quickRating.initialRating}
        genres={quickRating.genres}
        mediaType={quickRating.mediaType}
        itemId={quickRating.itemId}
        initialGenreRatings={quickRating.genreRatings}
        onRate={saveQuickRating}
      />

      {/* Dialog for alerts */}
      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />
    </PageLayout>
  );
});

DiscoverPage.displayName = 'DiscoverPage';
