import { memo } from 'react';
import { Tooltip } from '@mui/material';
import SwapHorizRounded from '@mui/icons-material/SwapHorizRounded';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

interface CrossoverChipProps {
  /** Titel des Crossovers für Tooltip/aria. */
  title?: string;
  variant?: 'compact' | 'label';
  size?: 'sm' | 'md';
  onClick?: () => void;
}

/** Schwester des FillerChips — markiert eine Folge als Teil eines Crossovers. */
export const CrossoverChip = memo<CrossoverChipProps>(
  ({ title, variant = 'compact', size = 'sm', onClick }) => {
    const { currentTheme } = useTheme();
    const tone = currentTheme.accent || currentTheme.primary;
    const label = title ? t('Crossover: {title}', { title }) : t('Crossover-Folge');

    const surface: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      lineHeight: 1,
      color: tone,
      background: `color-mix(in srgb, ${tone} 8%, transparent)`,
      border: `1.5px solid color-mix(in srgb, ${tone} 55%, transparent)`,
      flexShrink: 0,
      verticalAlign: 'middle',
      cursor: onClick ? 'pointer' : 'default',
    };

    const interactive = onClick
      ? {
          role: 'button' as const,
          tabIndex: 0,
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            onClick();
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onClick();
            }
          },
        }
      : {};

    if (variant === 'compact') {
      return (
        <Tooltip title={label} arrow enterDelay={300}>
          <span
            aria-label={label}
            {...interactive}
            style={{ ...surface, width: 20, height: 20, justifyContent: 'center', borderRadius: 6 }}
          >
            <SwapHorizRounded style={{ fontSize: 14 }} />
          </span>
        </Tooltip>
      );
    }

    const isMd = size === 'md';
    return (
      <Tooltip title={label} arrow enterDelay={300}>
        <span
          aria-label={label}
          {...interactive}
          style={{
            ...surface,
            gap: isMd ? 5 : 4,
            padding: isMd ? '4px 11px 4px 8px' : '3px 9px 3px 7px',
            borderRadius: 999,
            fontSize: isMd ? 12.5 : 10.5,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          <SwapHorizRounded style={{ fontSize: isMd ? 16 : 14, marginLeft: -1 }} />
          Crossover
        </span>
      </Tooltip>
    );
  }
);
CrossoverChip.displayName = 'CrossoverChip';
