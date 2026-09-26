import React from 'react';
import Edit from '@mui/icons-material/Edit';
import Close from '@mui/icons-material/Close';
import FilterList from '@mui/icons-material/FilterList';
import Search from '@mui/icons-material/Search';
import { Tooltip } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { GradientText, NavEscapeButtons } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { tapScale } from '../../../lib/motion';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { FilterSwitch } from '../FilterSection';
import { ListFilter } from '../ListFilter';
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
  availableLists?: { id: string; name: string }[];
  listFilter?: string | null;
  onSelectList?: (listId: string | null) => void;
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
  availableLists = [],
  listFilter = null,
  onSelectList = () => {},
  hasAnySubscription,
  onlyMySubs,
  onToggleOnlyMySubs,
}: WatchNextHeaderProps) => {
  const { currentTheme } = useTheme();
  const activeFilterCount =
    (filterInput.trim() ? 1 : 0) +
    (providerFilter ? 1 : 0) +
    (listFilter ? 1 : 0) +
    (onlyMySubs ? 1 : 0);

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
              aria-label={
                activeFilterCount > 0
                  ? t('Filter ({n} aktiv)', { n: activeFilterCount })
                  : t('Filter')
              }
              aria-expanded={showFilter}
              className={`watch-next-header__btn${showFilter ? ' watch-next-header__btn--active' : ''}`}
              style={
                {
                  background: showFilter
                    ? `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.primary}cc)`
                    : activeFilterCount > 0
                      ? `color-mix(in srgb, ${currentTheme.primary} 22%, transparent)`
                      : `var(--glass-light)`,
                  borderColor:
                    !showFilter && activeFilterCount > 0 ? currentTheme.primary : undefined,
                  color: showFilter
                    ? getOptimalTextColor(currentTheme.primary)
                    : activeFilterCount > 0
                      ? currentTheme.primary
                      : currentTheme.text.primary,
                  '--btn-active-shadow': `0 4px 15px ${currentTheme.primary}40`,
                } as React.CSSProperties
              }
            >
              <FilterList />
              {activeFilterCount > 0 && (
                <span
                  className="watch-next-header__badge"
                  aria-hidden="true"
                  style={{
                    background: currentTheme.primary,
                    color: getOptimalTextColor(currentTheme.primary),
                    boxShadow: `0 0 0 2px ${currentTheme.background.default}`,
                  }}
                >
                  {activeFilterCount}
                </span>
              )}
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
            style={
              {
                '--wn-primary': currentTheme.primary,
                '--wn-text': currentTheme.text.primary,
                '--wn-text-2': currentTheme.text.secondary,
                '--wn-muted': currentTheme.text.muted,
              } as React.CSSProperties
            }
          >
            <div className="wn-filter-grid">
              <div className="wn-filter-col">
                <div className="wn-search">
                  <Search className="wn-search__icon" />
                  <input
                    type="text"
                    placeholder={t('Serie suchen...')}
                    aria-label={t('Serie suchen')}
                    value={filterInput}
                    onChange={(e) => onFilterInputChange(e.target.value)}
                    className="watch-next-filter__input"
                  />
                  {filterInput && (
                    <button
                      type="button"
                      className="wn-search__clear"
                      onClick={() => onFilterInputChange('')}
                      aria-label={t('Suche leeren')}
                    >
                      <Close />
                    </button>
                  )}
                </div>

                <SortBar
                  sortOption={sortOption}
                  customOrderActive={customOrderActive}
                  onSort={onSort}
                  onToggleCustom={onToggleCustomOrder}
                />

                <ListFilter lists={availableLists} selected={listFilter} onSelect={onSelectList} />
              </div>

              <div className="wn-filter-col">
                <ProviderFilter
                  providers={availableProviders}
                  selected={providerFilter}
                  onSelect={onSelectProvider}
                  action={
                    hasAnySubscription ? (
                      <FilterSwitch
                        label={t('Nur meine Abos')}
                        ariaLabel={t('Nur meine Abos anzeigen')}
                        on={onlyMySubs}
                        onToggle={onToggleOnlyMySubs}
                      />
                    ) : undefined
                  }
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};
