/** Beliebte + letzte Suchbegriffe — sichtbar bei leerem Suchfeld. */

import { Close, History, Search, TrendingUp } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { memo } from 'react';
import type { useTheme } from '../../contexts/ThemeContext';
import { tapScale, tapScaleTight } from '../../lib/motion';
import { t } from '../../services/i18n';

export interface SearchSuggestionsProps {
  popularSearches: string[];
  recentSearches: string[];
  onSelectTerm: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
}

export const SearchSuggestions = memo(
  ({
    popularSearches,
    recentSearches,
    onSelectTerm,
    onRemoveRecent,
    currentTheme,
  }: SearchSuggestionsProps) => {
    return (
      <motion.div
        key="suggestions"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Trending Searches */}
        <section className="search-suggestions-section">
          <h2 className="search-suggestions-heading" style={{ color: currentTheme.text.primary }}>
            <TrendingUp style={{ fontSize: '20px', color: currentTheme.primary }} />
            {t('Beliebte Suchen')}
          </h2>

          <div className="search-popular-tags">
            {popularSearches.map((term, index) => (
              <motion.button
                key={term}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + index * 0.03 }}
                whileHover={{ scale: 1.05 }}
                whileTap={tapScale}
                onClick={() => onSelectTerm(term)}
                className="search-popular-tag"
                style={{
                  background: currentTheme.background.surface,
                  border: `1px solid ${currentTheme.border.default}`,
                  color: currentTheme.text.primary,
                }}
              >
                {term}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <section>
            <h2 className="search-suggestions-heading" style={{ color: currentTheme.text.primary }}>
              <History style={{ fontSize: '20px', color: currentTheme.text.muted }} />
              {t('Zuletzt gesucht')}
            </h2>

            <div
              className="search-recent-list"
              style={{
                background: currentTheme.background.surface,
                border: `1px solid ${currentTheme.border.default}`,
              }}
            >
              {recentSearches.map((term, index) => (
                <motion.div
                  key={term}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.03 }}
                  className="search-recent-row"
                  style={{
                    borderBottom:
                      index < recentSearches.length - 1
                        ? `1px solid ${currentTheme.border.default}`
                        : 'none',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelectTerm(term)}
                    className="search-recent-item"
                    aria-label={t('Nach „{term}" suchen', { term })}
                    style={{ color: currentTheme.text.primary }}
                  >
                    <span className="search-recent-item-content">
                      <Search style={{ fontSize: '18px', color: currentTheme.text.muted }} />
                      <span>{term}</span>
                    </span>
                  </button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.1 }}
                    whileTap={tapScaleTight}
                    onClick={() => onRemoveRecent(term)}
                    className="search-recent-remove-btn"
                    aria-label={t('„{term}" entfernen', { term })}
                    style={{ background: `${currentTheme.text.muted}15` }}
                  >
                    <Close style={{ fontSize: '16px', color: currentTheme.text.muted }} />
                  </motion.button>
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </motion.div>
    );
  }
);

SearchSuggestions.displayName = 'SearchSuggestions';
