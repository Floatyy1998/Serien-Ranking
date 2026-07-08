import { Recommend, Search, Subscriptions } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import { LoadingSpinner } from '../../components/ui';
import { ItemCard } from './DiscoverItemCard';
import { SearchSuggestions } from './SearchSuggestions';
import type { DiscoverItem } from './discoverItemHelpers';

interface DiscoverContentProps {
  activeCategory: string;
  showSearch: boolean;
  searchQuery: string;
  isDesktop: boolean;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  results: DiscoverItem[];
  /** True während der Browse-Grid gerade lädt (unterdrückt den leeren Abo-Hinweis). */
  loading?: boolean;
  /** F7: True, wenn der "Auf meinen Abos"-Filter wirksam ist. */
  onlyMyProviders?: boolean;
  searchResults: DiscoverItem[];
  searchLoading: boolean;
  /** Beliebte + zuletzt gesuchte Begriffe (Suchvorschläge bei leerer Eingabe). */
  popularSearches: string[];
  recentSearches: string[];
  onSelectTerm: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  recommendations: DiscoverItem[];
  recommendationsLoading: boolean;
  addingItem: string | null;
  handleItemClick: (item: DiscoverItem) => void;
  addToList: (item: DiscoverItem, event?: React.MouseEvent) => Promise<void>;
}

/** Zusatzzeile für Empty-States, wenn der Abo-Filter aktiv ist. */
const AboFilterHint = ({ color }: { color: string }) => (
  <p style={{ fontSize: 'var(--text-sm)', color, marginTop: '10px', fontWeight: 500 }}>
    Der Filter „Auf meinen Abos" ist aktiv – tippe oben rechts, um ihn auszuschalten.
  </p>
);

export const DiscoverContent = memo(
  ({
    activeCategory,
    showSearch,
    searchQuery,
    isDesktop,
    currentTheme,
    results,
    loading,
    onlyMyProviders,
    searchResults,
    searchLoading,
    popularSearches,
    recentSearches,
    onSelectTerm,
    onRemoveRecent,
    recommendations,
    recommendationsLoading,
    addingItem,
    handleItemClick,
    addToList,
  }: DiscoverContentProps) => {
    if (activeCategory === 'recommendations') {
      if (recommendationsLoading && recommendations.length === 0) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoadingSpinner size={50} text="Lade Empfehlungen..." />
          </motion.div>
        );
      }
      if (!recommendationsLoading && recommendations.length === 0) {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: currentTheme.background.surface,
              borderRadius: 'var(--radius-xl)',
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <Recommend
              style={{
                fontSize: '56px',
                marginBottom: '16px',
                color: currentTheme.text.muted,
              }}
            />
            <p
              style={{
                fontSize: 'var(--text-md)',
                color: currentTheme.text.secondary,
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              Keine Empfehlungen verfügbar
            </p>
            <p style={{ fontSize: 'var(--text-base)', color: currentTheme.text.secondary }}>
              Füge Serien oder Filme zu deiner Liste hinzu oder bewerte sie – dann findest du hier
              passende Empfehlungen.
            </p>
            {onlyMyProviders && <AboFilterHint color={currentTheme.text.muted} />}
          </motion.div>
        );
      }
      return (
        <div>
          <p
            style={{
              fontSize: 'var(--text-base)',
              color: currentTheme.text.muted,
              marginBottom: '20px',
              textAlign: 'center',
              fontWeight: 500,
            }}
          >
            Basierend auf deiner Liste
          </p>
          <div
            className="discover-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(2, 1fr)',
              gap: isDesktop ? '24px' : '16px',
              maxWidth: '100%',
              margin: '0',
            }}
          >
            {recommendations.map((item) => (
              <div key={`rec-${item.type}-${item.id}`} className="discover-grid-item">
                <ItemCard
                  item={item}
                  onItemClick={handleItemClick}
                  onAddToList={addToList}
                  addingItem={addingItem}
                  currentTheme={currentTheme}
                  isDesktop={isDesktop}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (showSearch) {
      // Leere Eingabe → Suchvorschläge (beliebte + zuletzt gesucht) statt Grid.
      if (!searchQuery.trim() && !searchLoading) {
        return (
          <SearchSuggestions
            popularSearches={popularSearches}
            recentSearches={recentSearches}
            onSelectTerm={onSelectTerm}
            onRemoveRecent={onRemoveRecent}
            currentTheme={currentTheme}
          />
        );
      }

      if (searchLoading) {
        return (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <LoadingSpinner size={50} text="Suche läuft..." />
          </motion.div>
        );
      }

      if (searchResults.length === 0) {
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              textAlign: 'center',
              padding: '60px 20px',
              background: currentTheme.background.surface,
              borderRadius: 'var(--radius-xl)',
              border: `1px solid ${currentTheme.border.default}`,
            }}
          >
            <Search
              style={{ fontSize: '56px', marginBottom: '16px', color: currentTheme.text.muted }}
            />
            <p style={{ color: currentTheme.text.secondary, fontSize: '15px' }}>
              Keine Ergebnisse für "{searchQuery}"
            </p>
            {onlyMyProviders && <AboFilterHint color={currentTheme.text.muted} />}
          </motion.div>
        );
      }

      return (
        <div>
          <p className="discover-search-count" style={{ color: currentTheme.text.muted }}>
            <span className="discover-search-count-number" style={{ color: currentTheme.primary }}>
              {searchResults.length}
            </span>{' '}
            {searchResults.length === 1 ? 'Ergebnis' : 'Ergebnisse'}
          </p>
          <div
            className="discover-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: isDesktop
                ? 'repeat(auto-fill, minmax(200px, 1fr))'
                : 'repeat(2, 1fr)',
              gap: isDesktop ? '24px' : '16px',
              maxWidth: '100%',
              margin: '0',
            }}
          >
            {searchResults.map((item) => (
              <div key={`search-${item.type}-${item.id}`} className="discover-grid-item">
                <ItemCard
                  item={item}
                  onItemClick={handleItemClick}
                  onAddToList={addToList}
                  addingItem={addingItem}
                  currentTheme={currentTheme}
                  isDesktop={isDesktop}
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!loading && results.length === 0 && onlyMyProviders) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: currentTheme.background.surface,
            borderRadius: 'var(--radius-xl)',
            border: `1px solid ${currentTheme.border.default}`,
          }}
        >
          <Subscriptions
            style={{ fontSize: '56px', marginBottom: '16px', color: currentTheme.text.muted }}
          />
          <p
            style={{
              fontSize: 'var(--text-md)',
              color: currentTheme.text.secondary,
              fontWeight: 600,
            }}
          >
            Nichts auf deinen Abos
          </p>
          <AboFilterHint color={currentTheme.text.muted} />
        </motion.div>
      );
    }

    return (
      <div
        className="discover-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop
            ? 'repeat(auto-fill, minmax(200px, 1fr))'
            : 'repeat(2, 1fr)',
          gap: isDesktop ? '24px' : '16px',
          maxWidth: '100%',
          margin: '0',
        }}
      >
        {results.map((item) => (
          <div key={`${item.type}-${item.id}`} className="discover-grid-item">
            <ItemCard
              item={item}
              onItemClick={handleItemClick}
              onAddToList={addToList}
              addingItem={addingItem}
              currentTheme={currentTheme}
              isDesktop={isDesktop}
            />
          </div>
        ))}
      </div>
    );
  }
);

DiscoverContent.displayName = 'DiscoverContent';
