import { useDeferredValue, useEffect, useMemo, useState, useTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import { useSeriesList } from '../../contexts/SeriesListContext';
import { useActiveSubscriptions } from '../../hooks/useActiveSubscriptions';
import { useEpisodeDragDrop } from '../../hooks/useEpisodeDragDrop';
import { usePersistedState } from '../../hooks/usePersistedState';
import { useScrollRestore } from '../../hooks/useScrollRestore';
import { useWatchNextEpisodes } from '../../hooks/useWatchNextEpisodes';
import { PageLayout, ScrollToTopButton } from '../../components/ui';
import { hasActiveRewatch } from '../../lib/validation/rewatch.utils';
import { useWatchNextSwipe } from './useWatchNextSwipe';
import { buildFillerLookup, readFillerCacheSync } from '../../services/animeFillerService';
import { RewatchToggle } from './components/RewatchToggle';
import { WatchNextEmptyState } from './components/WatchNextEmptyState';
import { WatchNextEpisodeList } from './components/WatchNextEpisodeList';
import { WatchNextHeader } from './components/WatchNextHeader';
import './WatchNextPage.css';

export const WatchNextPage = () => {
  const { user = null } = useAuth() || {};
  const { seriesList } = useSeriesList();
  const [searchParams] = useSearchParams();

  const [, startTransition] = useTransition();

  // UI State
  const [showFilter, setShowFilter] = useState(false);
  const [filterInput, setFilterInput] = useState('');
  // React 19: useDeferredValue ersetzt den vorigen setTimeout-Debounce. Tippt
  // der User schnell, bleibt die Eingabe fluessig (priorisiert) und das schwere
  // Re-Filter laeuft mit niedrigerer Prioritaet in einer interruptiblen Render-
  // Phase ab. Kein Drift-Risiko durch ein zweites State-Field mehr.
  const debouncedFilter = useDeferredValue(filterInput);
  const [showRewatches, setShowRewatches] = useState(searchParams.get('rewatches') === 'open');
  const [editModeActive, setEditModeActive] = useState(false);
  const [customOrderActive, setCustomOrderActive] = usePersistedState(
    'watchNextCustomOrderActive',
    false
  );
  const [sortOption, setSortOption] = usePersistedState('watchNextSortOption', 'name-asc');
  const [providerFilter, setProviderFilter] = usePersistedState<string | null>(
    'watchNextProvider',
    null
  );
  const [onlyMySubs, setOnlyMySubs] = usePersistedState('watchNextOnlyMySubs', false);
  const { activeProviders, hasAnySubscription } = useActiveSubscriptions();

  // Swipe hook
  const swipe = useWatchNextSwipe({ user, seriesList });

  // Extract unique providers from watchlist series
  const availableProviders = useMemo(() => {
    const providerSet = new Map<string, string>();
    seriesList
      .filter((s) => s.watchlist)
      .forEach((s) => {
        s.provider?.provider?.forEach((p) => {
          if (p.name && !providerSet.has(p.name)) {
            providerSet.set(p.name, p.logo || '');
          }
        });
      });
    return Array.from(providerSet.entries())
      .map(([name, logo]) => ({ name, logo }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [seriesList]);

  // First call to get initial episodes (needed by drag/drop hook)
  const nextEpisodes = useWatchNextEpisodes(
    seriesList,
    debouncedFilter,
    showRewatches,
    sortOption,
    customOrderActive,
    [],
    providerFilter,
    onlyMySubs ? activeProviders : null
  );

  // Filler/recap lookup for the displayed next-up episodes – cache-only.
  // Watchlist is the canonical "what's next" list, so the chip belongs here
  // exactly like on the Continue Watching block.
  const fillerByEpisode = useMemo(() => {
    const map = new Map<number, ReturnType<typeof buildFillerLookup>>();
    const seriesById = new Map(seriesList.map((s) => [s.id, s]));
    for (const ep of nextEpisodes) {
      const series = seriesById.get(ep.seriesId);
      if (!series) continue;
      const cached = readFillerCacheSync(ep.seriesId);
      if (!cached) continue;
      map.set(ep.seriesId, buildFillerLookup(series.seasons, cached.episodes));
    }
    return map;
  }, [nextEpisodes, seriesList]);

  const dragDrop = useEpisodeDragDrop({ nextEpisodes, user, editModeActive });
  const { containerRef, draggedIndex, watchlistOrder } = dragDrop;

  // Re-compute with actual watchlistOrder
  const actualNextEpisodes = useWatchNextEpisodes(
    seriesList,
    debouncedFilter,
    showRewatches,
    sortOption,
    customOrderActive,
    watchlistOrder,
    providerFilter,
    onlyMySubs ? activeProviders : null
  );

  useScrollRestore('watchNext-scroll', '.episodes-scroll-container', { restoreOnPop: true });

  // Persist hideRewatches — derived from showRewatches; the rest is handled by usePersistedState.
  useEffect(() => {
    localStorage.setItem('watchNextHideRewatches', (!showRewatches).toString());
  }, [showRewatches]);

  // Count active rewatches
  const activeRewatchCount = useMemo(() => {
    return seriesList.filter((s) => s.watchlist && hasActiveRewatch(s)).length;
  }, [seriesList]);

  // Sort toggle
  const toggleSort = (field: string) => {
    let newOption: string;
    if (customOrderActive) {
      setCustomOrderActive(false);
      newOption = `${field}-asc`;
    } else if (sortOption.startsWith(field)) {
      newOption = `${field}-${sortOption.endsWith('asc') ? 'desc' : 'asc'}`;
    } else {
      newOption = `${field}-asc`;
    }
    startTransition(() => setSortOption(newOption));
  };

  const toggleCustomOrder = () => {
    const newValue = !customOrderActive;
    startTransition(() => setCustomOrderActive(newValue));
    if (customOrderActive) {
      setEditModeActive(false);
    }
  };

  // Swipe hint — show once for new users
  const [showSwipeHint, setShowSwipeHint] = useState(() => {
    return !localStorage.getItem('watchNextSwipeHintSeen');
  });

  useEffect(() => {
    if (showSwipeHint && actualNextEpisodes.length > 0) {
      localStorage.setItem('watchNextSwipeHintSeen', '1');
      const timer = setTimeout(() => setShowSwipeHint(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [showSwipeHint, actualNextEpisodes.length]);

  return (
    <PageLayout
      style={{ height: '100vh', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        ref={containerRef}
        style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}
      >
        {/* Header */}
        <WatchNextHeader
          episodeCount={actualNextEpisodes.length}
          customOrderActive={customOrderActive}
          editModeActive={editModeActive}
          onToggleEditMode={() => {
            const newVal = !editModeActive;
            setEditModeActive(newVal);
          }}
          showFilter={showFilter}
          onToggleFilter={() => setShowFilter(!showFilter)}
          filterInput={filterInput}
          onFilterInputChange={setFilterInput}
          sortOption={sortOption}
          onSort={toggleSort}
          onToggleCustomOrder={toggleCustomOrder}
          availableProviders={availableProviders}
          providerFilter={providerFilter}
          onSelectProvider={(p) => startTransition(() => setProviderFilter(p))}
          hasAnySubscription={hasAnySubscription}
          onlyMySubs={onlyMySubs}
          onToggleOnlyMySubs={() => startTransition(() => setOnlyMySubs((v) => !v))}
        />

        {/* Scrollable Content */}
        <div
          className="episodes-scroll-container watch-next-scroll hide-scrollbar"
          style={{
            touchAction: draggedIndex !== null && editModeActive ? 'none' : 'auto',
          }}
        >
          {/* Rewatch Toggle */}
          {activeRewatchCount > 0 && (
            <RewatchToggle
              activeRewatchCount={activeRewatchCount}
              showRewatches={showRewatches}
              onToggle={() => setShowRewatches(!showRewatches)}
            />
          )}

          {actualNextEpisodes.length === 0 ? (
            <WatchNextEmptyState />
          ) : (
            <WatchNextEpisodeList
              episodes={actualNextEpisodes}
              fillerByEpisode={fillerByEpisode}
              showSwipeHint={showSwipeHint}
              editModeActive={editModeActive}
              swipe={swipe}
              dragDrop={dragDrop}
            />
          )}

          <div className="watch-next-bottom-pad" />
        </div>
      </div>
      <ScrollToTopButton scrollContainerSelector=".episodes-scroll-container" />
    </PageLayout>
  );
};
