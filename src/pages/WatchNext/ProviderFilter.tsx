import React from 'react';
import { t } from '../../services/i18n';
import { FilterChip, FilterSection } from './FilterSection';

interface Provider {
  name: string;
  logo: string;
}

interface ProviderFilterProps {
  providers: Provider[];
  selected: string | null;
  onSelect: (provider: string | null) => void;
  /** Rechts neben der Überschrift, z. B. der „Nur meine Abos"-Schalter. */
  action?: React.ReactNode;
}

export const ProviderFilter = React.memo(
  ({ providers, selected, onSelect, action }: ProviderFilterProps) => {
    if (providers.length === 0) return null;

    return (
      <FilterSection label={t('Anbieter')} action={action}>
        <FilterChip active={!selected} onClick={() => onSelect(null)}>
          <span className="wn-chip__text">{t('Alle')}</span>
        </FilterChip>
        {providers.map((provider) => (
          <FilterChip
            key={provider.name}
            active={selected === provider.name}
            onClick={() => onSelect(selected === provider.name ? null : provider.name)}
          >
            {provider.logo && (
              <img
                className="wn-chip__logo"
                src={`https://image.tmdb.org/t/p/w45${provider.logo}`}
                alt=""
                loading="lazy"
                decoding="async"
              />
            )}
            <span className="wn-chip__text">{provider.name}</span>
          </FilterChip>
        ))}
      </FilterSection>
    );
  }
);

ProviderFilter.displayName = 'ProviderFilter';
