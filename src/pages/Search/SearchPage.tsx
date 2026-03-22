/**
 * SearchPage - Premium Search Experience
 * Slim composition component. Business logic in useSearchPage, UI in subcomponents.
 */

import { CalendarToday, Check, Close, Movie, Search } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Dialog, LoadingSpinner, PageHeader, ScrollToTopButton } from '../../components/ui';
import { SearchResultCard } from './SearchResultCard';
import { SearchSuggestions } from './SearchSuggestions';
import { useSearchPage } from './useSearchPage';
import type { SearchTypeFilter } from './useSearchPage';
import './SearchPage.css';

export const SearchPage = memo(() => {
  const { currentTheme } = useTheme();

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
    removeRecentSearch,
  } = useSearchPage();

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
              autoFocus
              className="search-input"
              style={{ color: currentTheme.text.primary, outline: 'none' }}
            />
            <button
              onClick={() => searchQuery && setSearchQuery('')}
              className="search-clear-btn"
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
              className="search-filter-btn"
              onClick={() => setSearchType(tab.key)}
              style={{
                background: searchType === tab.key ? tab.gradient : currentTheme.background.surface,
                border:
                  searchType === tab.key ? 'none' : `1px solid ${currentTheme.border.default}`,
                color:
                  searchType === tab.key ? currentTheme.text.secondary : currentTheme.text.muted,
                boxShadow: searchType === tab.key ? `0 4px 15px ${currentTheme.primary}40` : 'none',
              }}
            >
              {tab.icon && <tab.icon style={{ fontSize: '16px' }} />}
              {tab.label}
            </button>
          ))}
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
              <LoadingSpinner text="Suche läuft..." />
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
                  />
                ))}
              </div>
            </motion.div>
          ) : searchQuery && !loading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="search-empty-state"
            >
              <div
                className="search-empty-icon"
                style={{ background: `${currentTheme.text.muted}10` }}
              >
                <Search style={{ fontSize: '48px', color: currentTheme.text.muted }} />
              </div>
              <h2 className="search-empty-title" style={{ color: currentTheme.text.primary }}>
                Keine Ergebnisse
              </h2>
              <p className="search-empty-text" style={{ color: currentTheme.text.muted }}>
                Keine Ergebnisse für "{searchQuery}"
              </p>
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
      <AnimatePresence>
        {snackbar.open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="search-snackbar"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.status.success}, ${currentTheme.status?.success || '#22c55e'})`,
              boxShadow: `0 8px 24px ${currentTheme.status.success}40`,
            }}
          >
            <Check style={{ fontSize: '22px' }} />
            <span className="search-snackbar-text">{snackbar.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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
