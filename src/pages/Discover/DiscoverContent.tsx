import { Recommend, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { useTheme } from '../../contexts/ThemeContextDef';
import { LoadingSpinner } from '../../components/ui';
import { ItemCard } from './DiscoverItemCard';
import type { DiscoverItem } from './discoverItemHelpers';

interface DiscoverContentProps {
  activeCategory: string;
  showSearch: boolean;
  searchQuery: string;
  isDesktop: boolean;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  results: DiscoverItem[];
  searchResults: DiscoverItem[];
  searchLoading: boolean;
  recommendations: DiscoverItem[];
  recommendationsLoading: boolean;
  addingItem: string | null;
  handleItemClick: (item: DiscoverItem) => void;
  addToList: (item: DiscoverItem, event?: React.MouseEvent) => Promise<void>;
}

export const DiscoverContent = memo(
  ({
    activeCategory,
    showSearch,
    searchQuery,
    isDesktop,
    currentTheme,
    results,
    searchResults,
    searchLoading,
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
              borderRadius: '20px',
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
                fontSize: '16px',
                color: currentTheme.text.secondary,
                marginBottom: '8px',
                fontWeight: 600,
              }}
            >
              Keine Empfehlungen verfügbar
            </p>
            <p style={{ fontSize: '14px', color: currentTheme.text.muted }}>
              {/* seriesList/movieList length check handled by fetch hook */}
            </p>
          </motion.div>
        );
      }
      return (
        <div>
          <p
            style={{
              fontSize: '14px',
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
      return (
        <div>
          {searchLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <LoadingSpinner size={50} text="Suche läuft..." />
            </motion.div>
          ) : searchResults.length === 0 && searchQuery.trim() ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: currentTheme.background.surface,
                borderRadius: '20px',
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <Search
                style={{
                  fontSize: '56px',
                  marginBottom: '16px',
                  color: currentTheme.text.muted,
                }}
              />
              <p style={{ color: currentTheme.text.secondary, fontSize: '15px' }}>
                Keine Ergebnisse für "{searchQuery}"
              </p>
            </motion.div>
          ) : searchResults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: currentTheme.background.surface,
                borderRadius: '20px',
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              <Search
                style={{
                  fontSize: '56px',
                  marginBottom: '16px',
                  color: currentTheme.text.muted,
                }}
              />
              <p style={{ color: currentTheme.text.secondary, fontSize: '15px' }}>
                Gib einen Suchbegriff ein...
              </p>
            </motion.div>
          ) : (
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
          )}
        </div>
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
