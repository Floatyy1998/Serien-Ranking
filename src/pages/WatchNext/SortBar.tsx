import { ArrowDownward, ArrowUpward } from '@mui/icons-material';
import React from 'react';
import { t } from '../../services/i18n';
import { FilterChip, FilterSection, FilterSwitch } from './FilterSection';

const SORT_OPTIONS: { key: string; label: string }[] = [
  { key: 'name', label: t('Name') },
  { key: 'date', label: t('Datum') },
  { key: 'progress', label: t('Fortschritt') },
  { key: 'remaining', label: t('Übrig') },
];

interface SortBarProps {
  sortOption: string;
  customOrderActive: boolean;
  onSort: (field: string) => void;
  onToggleCustom: () => void;
}

export const SortBar = React.memo(
  ({ sortOption, customOrderActive, onSort, onToggleCustom }: SortBarProps) => {
    const renderArrow = (key: string) => {
      if (customOrderActive || !sortOption.startsWith(key)) return null;
      return sortOption.endsWith('asc') ? (
        <ArrowUpward className="wn-chip__icon" />
      ) : (
        <ArrowDownward className="wn-chip__icon" />
      );
    };

    return (
      <FilterSection
        label={t('Sortieren')}
        layout="segmented"
        action={
          <FilterSwitch
            label={t('Benutzerdefiniert')}
            on={customOrderActive}
            onToggle={onToggleCustom}
          />
        }
      >
        {SORT_OPTIONS.map((opt) => (
          <FilterChip
            key={opt.key}
            active={!customOrderActive && sortOption.startsWith(opt.key)}
            onClick={() => onSort(opt.key)}
          >
            <span className="wn-chip__text">{opt.label}</span>
            {renderArrow(opt.key)}
          </FilterChip>
        ))}
      </FilterSection>
    );
  }
);

SortBar.displayName = 'SortBar';
