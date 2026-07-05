import { memo } from 'react';
import { Tooltip } from '@mui/material';
import FastForwardRounded from '@mui/icons-material/FastForwardRounded';
import HistoryRounded from '@mui/icons-material/HistoryRounded';
import { useTheme } from '../../contexts/ThemeContextDef';

interface FillerChipProps {
  filler?: boolean;
  recap?: boolean;
  /** Compact = square icon badge (for dense per-episode rows / posters). */
  variant?: 'compact' | 'label';
  /**
   * Size of the label variant.
   * - `sm` (default): inline next to episode meta (~10.5 px)
   * - `md`: hero / header badge rows (~12.5 px)
   */
  size?: 'sm' | 'md';
}

/**
 * Filler / recap marker for anime episodes — an outline "ghost" badge: a
 * colour-coded 1.5 px border over a barely-there tint, with a semantic icon.
 * Quiet and clean, it annotates the episode line without fighting it. Filler
 * is amber (skippable / non-canon, fast-forward icon); recap is the theme
 * accent (a look-back, history icon).
 */
export const FillerChip = memo<FillerChipProps>(
  ({ filler, recap, variant = 'compact', size = 'sm' }) => {
    const { currentTheme } = useTheme();
    if (!filler && !recap) return null;

    const isFiller = filler === true;
    const tone = isFiller ? currentTheme.status.warning : currentTheme.primary;
    const Icon = isFiller ? FastForwardRounded : HistoryRounded;
    const title = isFiller ? 'Filler-Episode' : 'Recap-Episode';
    const label = isFiller ? 'Filler' : 'Recap';

    // Shared outline surface — faint tinted fill + a crisp tone-coloured border.
    const surface: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      lineHeight: 1,
      color: tone,
      background: `color-mix(in srgb, ${tone} 8%, transparent)`,
      border: `1.5px solid color-mix(in srgb, ${tone} 55%, transparent)`,
      flexShrink: 0,
      verticalAlign: 'middle',
    };

    if (variant === 'compact') {
      return (
        <Tooltip title={title} arrow enterDelay={300}>
          <span
            aria-label={title}
            style={{
              ...surface,
              width: 20,
              height: 20,
              justifyContent: 'center',
              borderRadius: 6,
            }}
          >
            <Icon style={{ fontSize: 13 }} />
          </span>
        </Tooltip>
      );
    }

    const isMd = size === 'md';
    return (
      <Tooltip title={title} arrow enterDelay={300}>
        <span
          aria-label={title}
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
          <Icon style={{ fontSize: isMd ? 16 : 14, marginLeft: -1 }} />
          {label}
        </span>
      </Tooltip>
    );
  }
);
FillerChip.displayName = 'FillerChip';
