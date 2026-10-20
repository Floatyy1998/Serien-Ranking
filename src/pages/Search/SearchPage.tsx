/** Kompositions-Komponente — Logik in useSearchPage, UI in Subkomponenten. */

import { CalendarToday, Close, Movie, Person, Search, Subscriptions } from '@mui/icons-material';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PersonGridSkeleton, PersonSection } from '../../components/person/PersonSection';
import { useTheme } from '../../contexts/ThemeContext';
import { usePeopleSearch, usePopularPeople } from '../../hooks/person/usePeopleSearch';
import { useActiveSubscriptions } from '../../hooks/provider/useActiveSubscriptions';
import { peopleLeadResults, type PersonHit } from '../../lib/person/personSearch';
import { t } from '../../services/i18n';
import { getOptimalTextColor } from '../../theme/colorUtils';
import {
  Dialog,
  EmptyState,
  PageState,
  SkeletonRatingsGrid,
  PageHeader,
  Snackbar,
} from '../../components/ui';
import { QuickRatingSheet } from '../../components/ui/overlay/QuickRatingSheet';
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
    error,
    retrySearch,
    recentSearches,
    popularSearches,
    isDesktop,
    snackbar,
    dialog,
    setDialog,
    handleItemClick,
    addToList,
    pendingAddIds,
    markWatched,
    pendingWatchedIds,
    quickRating,
    openQuickRating,
    closeQuickRating,
    saveQuickRating,
    removeRecentSearch,
    onlyMyProviders,
    setOnlyMyProviders,
  } = useSearchPage(activeProviders);

  const providerFilterActive = onlyMyProviders && canFilterByProviders;
  const navigate = useNavigate();
  const peopleOnly = searchType === 'people';
  const { people, loading: peopleLoading } = usePeopleSearch(
    searchQuery,
    searchType === 'all' || peopleOnly
  );
  const popularPeople = usePopularPeople(peopleOnly && !searchQuery.trim());
  const peopleFirst = peopleLeadResults(people, searchResults, searchQuery);
  const hasQuery = searchQuery.trim().length >= 2;
  const openPerson = useCallback(
    (person: PersonHit) => navigate(`/person/${person.id}`),
    [navigate]
  );
  const peopleSection = (asRow: boolean) => (
    <PersonSection
      className="search-people"
      people={people}
      onSelect={openPerson}
      onSeeAll={asRow ? () => setSearchType('people') : undefined}
    />
  );

  const filterTabs: {
    key: SearchTypeFilter;
    label: string;
    icon: React.ElementType | null;
    gradient: string;
  }[] = [
    {
      key: 'all',
      label: t('Alle'),
      icon: null,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    },
    {
      key: 'series',
      label: t('Serien'),
      icon: CalendarToday,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    },
    {
      key: 'movies',
      label: t('Filme'),
      icon: Movie,
      gradient: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
    },
    {
      key: 'people',
      label: t('Personen'),
      icon: Person,
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
          title={t('Suche')}
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
              placeholder={t('Titel oder Schauspieler')}
              aria-label={t('Serien, Filme und Personen suchen')}
              autoFocus
              className="search-input"
              style={{ color: currentTheme.text.primary, outline: 'none' }}
            />
            <button
              type="button"
              onClick={() => searchQuery && setSearchQuery('')}
              className="search-clear-btn"
              aria-label={t('Suche löschen')}
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
              aria-label={t('Filter: {label}', { label: tab.label })}
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
            aria-label={t('Nur Titel auf meinen aktiven Abos anzeigen')}
            title={
              canFilterByProviders
                ? t('Nur was ich streamen kann')
                : t('Aktiviere zuerst ein Streaming-Abo in den Abo-Einstellungen')
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
            {t('Abos')}
          </button>
        </motion.div>
      </div>

      {/* Content */}
      <div className="search-content">
        <AnimatePresence mode="wait">
          {peopleOnly && !hasQuery ? (
            <motion.div key="people-popular" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="search-results-count" style={{ color: currentTheme.text.muted }}>
                {t('Gerade gefragt')}
              </p>
              {popularPeople === null ? (
                <PersonGridSkeleton />
              ) : (
                <PersonSection people={popularPeople} onSelect={openPerson} />
              )}
            </motion.div>
          ) : peopleOnly ? (
            peopleLoading ? (
              <motion.div key="people-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <PersonGridSkeleton />
              </motion.div>
            ) : people.length > 0 ? (
              <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {peopleSection(false)}
              </motion.div>
            ) : (
              <motion.div key="people-empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <EmptyState
                  icon={<Person style={{ fontSize: '48px' }} />}
                  title={t('Keine Personen gefunden')}
                  description={t('Keine Personen für „{query}“', { query: searchQuery })}
                  action={{ label: t('Suche löschen'), onClick: () => setSearchQuery('') }}
                />
              </motion.div>
            )
          ) : loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="search-loading"
            >
              <SkeletonRatingsGrid count={8} />
            </motion.div>
          ) : searchQuery && (searchResults.length > 0 || people.length > 0) ? (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {searchResults.length > 0 && (
                <p className="search-results-count" style={{ color: currentTheme.text.muted }}>
                  <span
                    className="search-results-count-number"
                    style={{ color: currentTheme.primary }}
                  >
                    {searchResults.length}
                  </span>{' '}
                  {t('Ergebnisse für "{query}"', { query: searchQuery })}
                </p>
              )}

              {peopleFirst && people.length > 0 && peopleSection(searchResults.length > 0)}

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
                    onRate={openQuickRating}
                    onMarkWatched={markWatched}
                    currentTheme={currentTheme}
                    isDesktop={isDesktop}
                    isPending={pendingAddIds.has(`${item.type}-${item.id}`)}
                    isWatchedPending={pendingWatchedIds.has(`${item.type}-${item.id}`)}
                  />
                ))}
              </div>

              {!peopleFirst && people.length > 0 && peopleSection(true)}
            </motion.div>
          ) : searchQuery && error && !loading ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <PageState
                mode="error"
                error={{
                  title: t('Suche fehlgeschlagen'),
                  description: error,
                  onRetry: retrySearch,
                }}
              />
            </motion.div>
          ) : searchQuery && !loading ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <EmptyState
                icon={<Search style={{ fontSize: '48px' }} />}
                title={t('Keine Ergebnisse')}
                description={
                  providerFilterActive
                    ? t(
                        'Keine Treffer für „{query}" auf deinen aktiven Abos. Schalte den Abo-Filter „Abos" aus, um alle Treffer zu sehen.',
                        { query: searchQuery }
                      )
                    : t(
                        'Keine Treffer für „{query}". Prüfe die Schreibweise oder suche nach etwas anderem.',
                        { query: searchQuery }
                      )
                }
                action={
                  providerFilterActive
                    ? { label: t('Abo-Filter aus'), onClick: () => setOnlyMyProviders(false) }
                    : { label: t('Suche löschen'), onClick: () => setSearchQuery('') }
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
    </div>
  );
});

SearchPage.displayName = 'SearchPage';
