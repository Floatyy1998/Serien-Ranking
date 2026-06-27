import { memo } from 'react';
import { Tooltip } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContextDef';

interface FillerChipProps {
  filler?: boolean;
  recap?: boolean;
  /** Compact = single-letter pill (for episode rows / posters). */
  variant?: 'compact' | 'label';
  /**
   * Size of the label variant.
   * - `sm` (default): matches inline list text (~11 px)
   * - `md`: matches hero-style badge rows (~14 px, 6×12 px padding)
   */
  size?: 'sm' | 'md';
}

/**
 * F / R indicator for Anime episodes. Compact variant fits next to
 * the episode number in lists; "label" variant is meant for hero/header
 * usage and includes the word.
 */
export const FillerChip = memo<FillerChipProps>(
  ({ filler, recap, variant = 'compact', size = 'sm' }) => {
    const { currentTheme } = useTheme();
    if (!filler && !recap) return null;

    const isFiller = filler === true;
    const tone = isFiller ? currentTheme.status.warning : currentTheme.primary;
    const letter = isFiller ? 'F' : 'R';
    const title = isFiller ? 'Filler-Episode' : 'Recap-Episode';
    const label = isFiller ? 'Filler' : 'Recap';

    const isMdLabel = variant === 'label' && size === 'md';
    const base: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 800,
      color: tone,
      background: `color-mix(in srgb, ${tone} 16%, transparent)`,
      border: `1px solid color-mix(in srgb, ${tone} 42%, transparent)`,
      // md label sits next to other Hero badges that use default line-height –
      // forcing 1 here makes the chip shorter so the same 12 px radius reads
      // as a full pill instead of a rounded rectangle.
      lineHeight: isMdLabel ? 'inherit' : 1,
      flexShrink: 0,
      letterSpacing: variant === 'compact' ? 0 : '0.02em',
    };

    if (variant === 'compact') {
      return (
        <Tooltip title={title} arrow enterDelay={300}>
          <span
            aria-label={title}
            style={{
              ...base,
              width: 18,
              height: 18,
              borderRadius: 5,
              fontSize: 10,
            }}
          >
            {letter}
          </span>
        </Tooltip>
      );
    }

    return (
      <span
        aria-label={title}
        style={{
          ...base,
          padding: isMdLabel ? '6px 14px' : '2px 7px',
          borderRadius: 'var(--radius-md, 12px)',
          fontSize: isMdLabel ? 14 : 10.5,
          fontWeight: isMdLabel ? 700 : 800,
        }}
      >
        {label}
      </span>
    );
  }
);
FillerChip.displayName = 'FillerChip';
