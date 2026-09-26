import React from 'react';
import { t } from '../../services/i18n';
import { FilterChip, FilterSection } from './FilterSection';

interface ListFilterProps {
  lists: { id: string; name: string }[];
  selected: string | null;
  onSelect: (listId: string | null) => void;
}

export const ListFilter = React.memo(({ lists, selected, onSelect }: ListFilterProps) => {
  if (lists.length === 0) return null;

  return (
    <FilterSection label={t('Listen')}>
      <FilterChip active={!selected} onClick={() => onSelect(null)}>
        <span className="wn-chip__text">{t('Alle')}</span>
      </FilterChip>
      {lists.map((list) => (
        <FilterChip
          key={list.id}
          active={selected === list.id}
          onClick={() => onSelect(selected === list.id ? null : list.id)}
        >
          <span className="wn-chip__text">{list.name}</span>
        </FilterChip>
      ))}
    </FilterSection>
  );
});

ListFilter.displayName = 'ListFilter';
