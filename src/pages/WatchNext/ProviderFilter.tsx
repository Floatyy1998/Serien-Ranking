import { motion } from 'framer-motion';
import React from 'react';
import { HorizontalScrollContainer } from '../../components/ui';

interface Provider {
  name: string;
  logo: string;
}

interface ProviderFilterProps {
  providers: Provider[];
  selected: string | null;
  onSelect: (provider: string | null) => void;
  theme: {
    primary: string;
    text: { primary: string; muted: string };
  };
}

export const ProviderFilter = React.memo(
  ({ providers, selected, onSelect, theme }: ProviderFilterProps) => {
    if (providers.length === 0) return null;

    return (
      <div style={{ marginTop: '10px' }}>
        <p
          style={{
            fontSize: '12px',
            color: theme.text.muted,
            margin: '0 0 6px 0',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Provider
        </p>
        <HorizontalScrollContainer gap={6} style={{}}>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(null)}
            className="provider-chip"
            style={{
              background: !selected
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`
                : 'rgba(255, 255, 255, 0.05)',
              color: !selected ? 'white' : theme.text.primary,
            }}
          >
            Alle
          </motion.button>
          {providers.map((provider) => (
            <motion.button
              key={provider.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(selected === provider.name ? null : provider.name)}
              className="provider-chip"
              style={{
                background:
                  selected === provider.name
                    ? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}cc)`
                    : 'rgba(255, 255, 255, 0.05)',
                color: selected === provider.name ? 'white' : theme.text.primary,
              }}
            >
              {provider.logo && (
                <img
                  src={`https://image.tmdb.org/t/p/w45${provider.logo}`}
                  alt=""
                  style={{ width: '16px', height: '16px', borderRadius: '3px' }}
                />
              )}
              {provider.name}
            </motion.button>
          ))}
        </HorizontalScrollContainer>
      </div>
    );
  }
);

ProviderFilter.displayName = 'ProviderFilter';
