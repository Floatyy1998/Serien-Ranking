/**
 * SearchPage - Premium Search Experience
 * Slim composition component. Business logic in useSearchPage, UI in subcomponents.
 */

import { CalendarToday, Close, Movie, Search, Subscriptions } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { useActiveSubscriptions } from '../../hooks/useActiveSubscriptions';
import { getOptimalTextColor } from '../../theme/colorUtils';
import {
  Dialog,
  EmptyState,
  SkeletonRatingsGrid,
  PageHeader,
  ScrollToTopButton,
  Snackbar,
} from '../../components/ui';
import { SearchResultCard } from './SearchResultCard';
import { SearchSuggestions } from './SearchSuggestions';
import { useSearchPage } from './useSearchPage';
import type { SearchTypeFilter } from './useSearchPage';
import './SearchPage.css';

export const SearchPage = memo(() => {
  const { currentTheme } = useTheme();
  const { activeProviders } = useActiveSubscriptions();
  const canFilterByProviders = activeProviders.size > 0;

  const {
    searchQuery,
    setSearchQuery,
    searchType,
    setSearchType,
    searchResults,
    loading,
    recentSearches,
    popularSearches,
    isDesktop,
    snackbar,
    dialog,
    setDialog,
    handleItemClick,
    addToList,
    pendingAddIds,
    removeRecentSearch,
    onlyMyProviders,
    setOnlyMyProviders,
  } = useSearchPage(activeProviders);

  const providerFilterActive = onlyMyProviders && canFilterByProviders;

  const filterTabs: {
    key: SearchTypeFilter;
    label: string;
    icon: React.ElementType | null;
    gradient: string;
  }[] = [
    {
      key: 'all',
      label: 'Alle',
      icon: null,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    },
    {
      key: 'series',
      label: 'Serien',
      icon: CalendarToday,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    },
    {
      key: 'movies',
      label: 'Filme',
      icon: Movie,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    },
  ];

  return (
    <div className="search-page" style={{ background: currentTheme.background.default }}>
      {/* Decorative Background */}
      <div
        className="search-bg-gradient"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% -20%, ${currentTheme.primary}35, transparent),
            radial-gradient(ellipse 60% 40% at 80% 10%, ${currentTheme.status.error}20, transparent)
          `,
        }}
      />

      {/* Search Header */}
      <div className="search-header" style={{ background: `${currentTheme.background.default}ee` }}>
        <PageHeader
          title="Suche"
          gradientFrom={currentTheme.text.primary}
          gradientTo={currentTheme.primary}
          sticky={false}
          style={{ paddingTop: 'calc(20px + env(safe-area-inset-top))' }}
        />

        {/* Search Input */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{ padding: '0 20px 16px' }}
        >
          <div
            className="search-input-wrapper"
            style={{
              background: currentTheme.background.surface,
              border: `1px solid ${currentTheme.border.default}`,
              outline: 'none',
            }}
          >
            <Search style={{ fontSize: '22px', color: currentTheme.text.muted, flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Serien & Filmen..."
              aria-label="Suche nach Serien und Filmen"
              autoFocus
              className="search-input"
              style={{ color: currentTheme.text.primary, outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => searchQuery && setSearchQuery('')}
              className="search-clear-btn"
              aria-label="Suche löschen"
              style={{
                background: searchQuery ? `${currentTheme.text.muted}20` : 'transparent',
                color: currentTheme.text.muted,
                opacity: searchQuery ? 1 : 0,
                pointerEvents: searchQuery ? 'auto' : 'none',
                transition: 'opacity 0.15s ease',
              }}
            >
              <Close style={{ fontSize: '16px' }} />
            </button>
          </div>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="search-filter-tabs"
        >
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className="search-filter-btn"
              onClick={() => setSearchType(tab.key)}
              aria-pressed={searchType === tab.key}
              aria-label={`Filter: ${tab.label}`}
              style={{
                background: searchType === tab.key ? tab.gradient : currentTheme.background.surface,
                border:
                  searchType === tab.key ? 'none' : `1px solid ${currentTheme.border.default}`,
                color:
                  searchType === tab.key
                    ? getOptimalTextColor(currentTheme.primary)
                    : currentTheme.text.muted,
                boxShadow: searchType === tab.key ? `0 4px 15px ${currentTheme.primary}40` : 'none',
              }}
            >
              {tab.icon && <tab.icon style={{ fontSize: '16px' }} />}
              {tab.label}
            </button>
          ))}

          {/* F7: "Auf meinen Abos"-Toggle */}
          <button
            type="button"
            className="search-filter-btn search-abo-toggle"
            onClick={() => {
              if (canFilterByProviders) setOnlyMyProviders(!onlyMyProviders);
            }}
            disabled={!canFilterByProviders}
            aria-pressed={providerFilterActive}
            aria-label="Nur Titel auf meinen aktiven Abos anzeigen"
            title={
              canFilterByProviders
                ? 'Nur was ich streamen kann'
                : 'Aktiviere zuerst ein Streaming-Abo in den Abo-Einstellungen'
            }
            style={{
              background: providerFilterActive
                ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`
                : currentTheme.background.surface,
              border: providerFilterActive ? 'none' : `1px solid ${currentTheme.border.default}`,
              color: providerFilterActive
                ? getOptimalTextColor(currentTheme.primary)
                : currentTheme.text.muted,
              opacity: canFilterByProviders ? 1 : 0.5,
              cursor: canFilterByProviders ? 'pointer' : 'not-allowed',
              boxShadow: providerFilterActive ? `0 4px 15px ${currentTheme.primary}40` : 'none',
            }}
          >
            <Subscriptions style={{ fontSize: '16px' }} />
            Abos
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="search-content">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="search-loading"
            >
              <SkeletonRatingsGrid count={8} />
            </motion.div>
          ) : searchQuery && searchResults.length > 0 ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Results Count */}
              <p className="search-results-count" style={{ color: currentTheme.text.muted }}>
                <span
                  className="search-results-count-number"
                  style={{ color: currentTheme.primary }}
                >
                  {searchResults.length}
                </span>{' '}
                Ergebnisse für "{searchQuery}"
              </p>

              {/* Results Grid */}
              <div
                className={`search-results-grid ${isDesktop ? 'search-results-grid--desktop' : ''}`}
              >
                {searchResults.map((item) => (
                  <SearchResultCard
                    key={`${item.type}-${item.id}`}
                    item={item}
                    onItemClick={handleItemClick}
                    onAddToList={addToList}
                    currentTheme={currentTheme}
                    isDesktop={isDesktop}
                    isPending={pendingAddIds.has(`${item.type}-${item.id}`)}
                  />
                ))}
              </div>
            </motion.div>
          ) : searchQuery && !loading ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState
                icon={<Search style={{ fontSize: '48px' }} />}
                title="Keine Ergebnisse"
                description={
                  providerFilterActive
                    ? `Keine Treffer für „${searchQuery}" auf deinen aktiven Abos. Schalte den Abo-Filter „Abos" aus, um alle Treffer zu sehen.`
                    : `Keine Treffer für „${searchQuery}". Prüfe die Schreibweise oder suche nach etwas anderem.`
                }
                action={
                  providerFilterActive
                    ? { label: 'Abo-Filter aus', onClick: () => setOnlyMyProviders(false) }
                    : { label: 'Suche löschen', onClick: () => setSearchQuery('') }
                }
              />
            </motion.div>
          ) : (
            <SearchSuggestions
              popularSearches={popularSearches}
              recentSearches={recentSearches}
              onSelectTerm={setSearchQuery}
              onRemoveRecent={removeRecentSearch}
              currentTheme={currentTheme}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Success Snackbar */}
      <Snackbar open={snackbar.open} message={snackbar.message} />

      <Dialog
        open={dialog.open}
        onClose={() => setDialog({ ...dialog, open: false })}
        message={dialog.message}
        type={dialog.type}
      />

      <ScrollToTopButton scrollContainerSelector=".mobile-content" />
    </div>
  );
});

SearchPage.displayName = 'SearchPage';
