import { memo } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getOptimalTextColor } from '../../theme/colorUtils';
import { t } from '../../services/i18n';

interface MovieActionButtonsProps {
  isMobile: boolean;
  isReadOnlyTmdbMovie: boolean;
  isAdding: boolean;
  onAddMovie: () => void;
}

export const MovieActionButtons = memo(
  ({ isMobile, isReadOnlyTmdbMovie, isAdding, onAddMovie }: MovieActionButtonsProps) => {
    const { currentTheme } = useTheme();

    // Eigene Filme haben ihre Aktionen (Bewerten/Empfehlen/Löschen) jetzt im
    // Hero-Header — hier bleibt nur der "Film hinzufügen"-Button für Nur-Lese-TMDB-Filme.
    if (!isReadOnlyTmdbMovie) {
      return null;
    }

    return (
      <div className={`md-add-btn-wrap ${isMobile ? 'md-add-btn-wrap--mobile' : ''}`}>
        <button
          onClick={onAddMovie}
          disabled={isAdding}
          className={`md-add-btn ${isMobile ? 'md-add-btn--mobile' : ''}`}
          style={{
            background: isAdding
              ? `${currentTheme.primary}80`
              : `linear-gradient(135deg, ${currentTheme.primary}CC 0%, ${currentTheme.primary}CC 100%)`,
            border: `1px solid ${currentTheme.primary}80`,
            color: getOptimalTextColor(currentTheme.primary),
            boxShadow: isAdding
              ? 'none'
              : `var(--glow-primary), 0 4px 16px -4px ${currentTheme.primary}55`,
          }}
        >
          {isAdding ? t('Wird hinzugefügt...') : t('Film hinzufügen')}
        </button>
      </div>
    );
  }
);

MovieActionButtons.displayName = 'MovieActionButtons';
