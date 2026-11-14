import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Check } from '@mui/icons-material';
import type { useTheme } from '../../contexts/ThemeContext';
import { tapScale } from '../../lib/motion';

export interface PresetTheme {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  accentColor: string;
  /** Nur geteilte Designs bringen eine Textfarbe mit. */
  textColor?: string;
}

interface ThemePreviewCardProps {
  preset: PresetTheme;
  index: number;
  isActive: boolean;
  /** Zum Ansehen gewählt, aber noch nicht übernommen. */
  isPicked?: boolean;
  currentTheme: ReturnType<typeof useTheme>['currentTheme'];
  onApply: (preset: PresetTheme) => void;
  /** Zeiger oder Fokus auf der Karte: das Theme in der großen Vorschau zeigen (null = zurück). */
  onPreview?: (preset: PresetTheme | null) => void;
  /** Zweite Zeile unter dem Namen (Urheber, Zahl der Übernahmen). */
  meta?: ReactNode;
}

/** Ein fertiges Theme als kleines Bild der App in seinen Farben. */
export const ThemePreviewCard = memo(
  ({
    preset,
    isActive,
    isPicked,
    currentTheme,
    onApply,
    onPreview,
    meta,
  }: ThemePreviewCardProps) => (
    <motion.button
      type="button"
      whileTap={tapScale}
      onClick={() => onApply(preset)}
      onMouseEnter={() => onPreview?.(preset)}
      onMouseLeave={() => onPreview?.(null)}
      onFocus={() => onPreview?.(preset)}
      onBlur={() => onPreview?.(null)}
      aria-pressed={isActive}
      className={`theme-preset-btn${isActive ? ' is-active' : ''}${isPicked ? ' is-picked' : ''}`}
      style={{ borderColor: isActive || isPicked ? preset.primaryColor : undefined }}
    >
      <span className="theme-preset-art" style={{ background: preset.backgroundColor }}>
        <span
          className="theme-preset-art__title"
          style={{
            background: `linear-gradient(90deg, ${preset.primaryColor}, ${preset.accentColor})`,
          }}
        />
        <span className="theme-preset-art__tiles">
          {[0, 1, 2, 3].map((i) => (
            <i key={i} style={{ background: preset.surfaceColor }} />
          ))}
        </span>
        <span className="theme-preset-art__foot">
          <b style={{ background: preset.primaryColor }} />
          <em style={{ background: preset.accentColor }} />
        </span>
      </span>
      <span className="theme-preset-row">
        <span
          className="theme-preset-name"
          style={{ color: isActive ? preset.primaryColor : currentTheme.text.secondary }}
        >
          {preset.name}
        </span>
        {isActive && (
          <span className="theme-preset-check" style={{ background: preset.primaryColor }}>
            <Check style={{ fontSize: 13, color: preset.backgroundColor }} />
          </span>
        )}
      </span>
      {meta && <span className="theme-preset-meta">{meta}</span>}
    </motion.button>
  )
);

ThemePreviewCard.displayName = 'ThemePreviewCard';
