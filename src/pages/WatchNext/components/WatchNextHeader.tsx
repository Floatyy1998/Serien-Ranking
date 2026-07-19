import React from 'react';
import Edit from '@mui/icons-material/Edit';
import FilterList from '@mui/icons-material/FilterList';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { GradientText, NavEscapeButtons } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScale } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { ProviderFilter } from '../ProviderFilter';
import { SortBar } from '../SortBar';

interface WatchNextHeaderProps {
  episodeCount: number;
  customOrderActive: boolean;
  editModeActive: boolean;
  onToggleEditMode: () => void;
  showFilter: boolean;
  onToggleFilter: () => void;
  filterInput: string;
  onFilterInputChange: (value: string) => void;
  sortOption: string;
  onSort: (field: string) => void;
  onToggleCustomOrder: () => void;
  availableProviders: { name: string; logo: string }[];
  providerFilter: string | null;
  onSelectProvider: (provider: string | null) => void;
  hasAnySubscription: boolean;
  onlyMySubs: boolean;
  onToggleOnlyMySubs: () => void;
}

/** Seitenkopf mit Titel, Episoden-Zähler, Edit-/Filter-Buttons und ausklappbarer Filter-Sektion. */
export const WatchNextHeader = ({
  episodeCount,
  customOrderActive,
  editModeActive,
  onToggleEditMode,
  showFilter,
  onToggleFilter,
  filterInput,
  onFilterInputChange,
  sortOption,
  onSort,
  onToggleCustomOrder,
  availableProviders,
  providerFilter,
  onSelectProvider,
  hasAnySubscription,
  onlyMySubs,
  onToggleOnlyMySubs,
}: WatchNextHeaderProps) => {
  const { currentTheme } = useTheme();

  const theme = {
    primary: currentTheme.primary,
    accent: currentTheme.accent,
    text: currentTheme.text,
    status: currentTheme.status,
    background: currentTheme.background,
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="watch-next-header"
      style={{ background: `${currentTheme.background.default}90` }}
    >
      <div className="watch-next-header__top">
        <NavEscapeButtons />
        <div>
          <GradientText
            as="h1"
            to={currentTheme.status.success}
            style={{
              fontSize: '22px',
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              margin: 0,
            }}
          >
            {t('Als Nächstes')}
          </GradientText>
          <p
            style={{
              color: currentTheme.text.secondary,
              fontSize: '14px',
              margin: '4px 0 0 0',
            }}
          >
            {t('{n} nächste Episoden', { n: episodeCount })}
          </p>
        </div>

        <div className="watch-next-header__actions">
          {customOrderActive && (
            <Tooltip title={t('Reihenfolge bearbeiten')} arrow>
              <motion.button
                whileTap={tapScale}
                onClick={onToggleEditMode}
                aria-label={t('Reihenfolge bearbeiten')}
                aria-pressed={editModeActive}
                className={`watch-next-header__btn${editModeActive ? ' watch-next-header__btn--active' : ''}`}
                style={
                  {
                    background: editModeActive
                      ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                      : `var(--glass-light)`,
                    color: editModeActive
                      ? getOptimalTextColor(currentTheme.primary)
                      : currentTheme.text.primary,
                    '--btn-active-shadow': `0 4px 15px ${currentTheme.primary}40`,
                  } as React.CSSProperties
                }
              >
                <Edit />
              </motion.button>
            </Tooltip>
          )}

          <Tooltip title={t('Filter')} arrow>
            <motion.button
              whileTap={tapScale}
              onClick={onToggleFilter}
              aria-label={t('Filter')}
              aria-expanded={showFilter}
              className={`watch-next-header__btn${showFilter ? ' watch-next-header__btn--active' : ''}`}
              style={
                {
                  background: showFilter
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                    : `var(--glass-light)`,
                  color: showFilter
                    ? getOptimalTextColor(currentTheme.primary)
                    : currentTheme.text.primary,
                  '--btn-active-shadow': `0 4px 15px ${currentTheme.primary}40`,
                } as React.CSSProperties
              }
            >
              <FilterList />
            </motion.button>
          </Tooltip>
        </div>
      </div>

      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="watch-next-filter"
          >
            <input
              type="text"
              placeholder={t('Serie suchen...')}
              aria-label={t('Serie suchen')}
              value={filterInput}
              onChange={(e) => onFilterInputChange(e.target.value)}
              className="watch-next-filter__input"
              style={{ color: currentTheme.text.primary }}
            />

            <SortBar
              sortOption={sortOption}
              customOrderActive={customOrderActive}
              onSort={onSort}
              onToggleCustom={onToggleCustomOrder}
              theme={theme}
            />

            <ProviderFilter
              providers={availableProviders}
              selected={providerFilter}
              onSelect={onSelectProvider}
              theme={theme}
            />

            {hasAnySubscription && (
              <motion.button
                whileTap={tapScale}
                onClick={onToggleOnlyMySubs}
                style={{
                  marginTop: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  minHeight: 44,
                  padding: '7px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: `1px solid ${onlyMySubs ? currentTheme.primary : currentTheme.border.default}`,
                  background: onlyMySubs
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                    : 'var(--glass-light)',
                  color: onlyMySubs
                    ? getOptimalTextColor(currentTheme.primary)
                    : currentTheme.text.primary,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                aria-pressed={onlyMySubs}
                aria-label={t('Nur meine Abos anzeigen')}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    background: onlyMySubs
                      ? getOptimalTextColor(currentTheme.primary)
                      : currentTheme.text.muted,
                  }}
                />
                {t('Nur meine Abos')}
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
