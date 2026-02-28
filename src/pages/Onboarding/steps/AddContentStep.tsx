import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from '@mui/icons-material';
import { useTheme } from '../../../contexts/ThemeContext';
import { OnboardingItemCard } from '../components/OnboardingItemCard';
import type { OnboardingItem } from '../hooks/useOnboardingSearch';

interface Props {
  suggestions: OnboardingItem[];
  searchResults: OnboardingItem[];
  loading: boolean;
  searchLoading: boolean;
  addedIds: Set<string>;
  addingId: string | null;
  addedCount: number;
  contentType: 'series' | 'movie';
  onSearch: (query: string) => void;
  onAdd: (item: OnboardingItem) => Promise<boolean>;
  onRemove: (item: OnboardingItem) => void;
  onSeasonSelect: (item: OnboardingItem, season: number | 'all' | 'none') => void;
  onClearSearch: () => void;
  onNext: () => void;
  onSkip: () => void;
}

export const AddContentStep: React.FC<Props> = ({
  suggestions,
  searchResults,
  loading,
  searchLoading,
  addedIds,
  addingId,
  addedCount,
  contentType,
  onSearch,
  onAdd,
  onRemove,
  onSeasonSelect,
  onClearSearch,
  onNext,
  onSkip,
}) => {
  const { currentTheme } = useTheme();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const isSearching = query.trim().length > 0;
  const allItems = isSearching ? searchResults : suggestions;
  const displayItems = allItems.filter((item) => item.type === contentType);

  useEffect(() => {
    onSearch(query);
  }, [query, onSearch]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -60 }}
      transition={{ duration: 0.3 }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        padding: '0 clamp(20px, 5vw, 60px)',
        width: '100%',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginTop: 16, flexShrink: 0 }}>
        <h2
          style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 700,
            color: currentTheme.text.primary,
          }}
        >
          {isSearching
            ? 'Suchergebnisse'
            : contentType === 'series'
              ? 'Serien für dich'
              : 'Filme für dich'}
        </h2>
        {addedCount > 0 && (
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              margin: '6px 0 0',
              fontSize: 12,
              fontWeight: 600,
              color: currentTheme.primary,
            }}
          >
            ✓ {addedCount}{' '}
            {contentType === 'series'
              ? addedCount === 1
                ? 'Serie'
                : 'Serien'
              : addedCount === 1
                ? 'Film'
                : 'Filme'}
          </motion.p>
        )}
      </div>

      {/* Search */}
      <div
        style={{
          position: 'relative',
          marginTop: 16,
          flexShrink: 0,
        }}
      >
        <Search
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 20,
            color: currentTheme.text.muted,
          }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={contentType === 'series' ? 'Serie suchen...' : 'Film suchen...'}
          style={{
            width: '100%',
            padding: '12px 14px 12px 42px',
            borderRadius: 14,
            border: `1px solid ${currentTheme.border.default}`,
            background: currentTheme.background.surface,
            color: currentTheme.text.primary,
            fontSize: 15,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => (e.target.style.borderColor = currentTheme.primary)}
          onBlur={(e) => (e.target.style.borderColor = currentTheme.border.default)}
        />
        {isSearching && (
          <button
            onClick={() => {
              setQuery('');
              onClearSearch();
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: currentTheme.text.muted,
              fontSize: 18,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Items */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          marginTop: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          paddingBottom: 16,
        }}
      >
        {(loading || searchLoading) && (
          <div
            style={{
              textAlign: 'center',
              color: currentTheme.text.muted,
              fontSize: 14,
              padding: '40px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: `3px solid ${currentTheme.primary}40`,
                borderTop: `3px solid ${currentTheme.primary}`,
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ margin: 0 }}>Lädt...</p>
          </div>
        )}

        {!loading && !searchLoading && displayItems.length === 0 && isSearching && (
          <div
            style={{
              textAlign: 'center',
              color: currentTheme.text.muted,
              fontSize: 14,
              padding: '40px 20px',
            }}
          >
            <p style={{ margin: 0, fontSize: 16, marginBottom: 4 }}>🔍</p>
            <p style={{ margin: 0 }}>Keine Ergebnisse für &ldquo;{query}&rdquo;</p>
          </div>
        )}

        {!loading && !searchLoading && displayItems.length === 0 && !isSearching && (
          <div
            style={{
              textAlign: 'center',
              color: currentTheme.text.muted,
              fontSize: 14,
              padding: '40px 20px',
            }}
          >
            <p style={{ margin: 0, fontSize: 16, marginBottom: 4 }}>📺</p>
            <p style={{ margin: 0 }}>Keine Vorschläge verfügbar</p>
            <p style={{ margin: '8px 0 0', fontSize: 12 }}>Nutze die Suche oben</p>
          </div>
        )}

        {!loading && !searchLoading && displayItems.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 12,
            }}
          >
            {displayItems.map((item) => {
              const key = `${item.type}-${item.id}`;
              return (
                <OnboardingItemCard
                  key={key}
                  item={item}
                  isAdded={addedIds.has(key)}
                  isAdding={addingId === key}
                  onAdd={onAdd}
                  onRemove={onRemove}
                  onSeasonSelect={onSeasonSelect}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Actions */}
      <div
        style={{
          padding: '12px 0 32px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <button
          onClick={onNext}
          style={{
            width: '100%',
            padding: '14px 0',
            borderRadius: 14,
            border: 'none',
            background:
              addedCount > 0
                ? `linear-gradient(135deg, ${currentTheme.primary}, #a855f7)`
                : currentTheme.background.surface,
            color: addedCount > 0 ? 'white' : currentTheme.text.muted,
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          {addedCount > 0 ? 'Weiter' : 'Ohne Titel fortfahren'}
        </button>
        <button
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: currentTheme.text.muted,
            fontSize: 13,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
        >
          Überspringen
        </button>
      </div>
    </motion.div>
  );
};
