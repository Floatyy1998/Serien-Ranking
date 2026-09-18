import { memo } from 'react';
import { Add, PlaylistAddCheck } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import { useCalendarViewMode } from './calendarViewMode';

interface AddToListButtonProps {
  seriesId: number;
  title: string;
  /** `overlay` sitzt auf dem Desktop-Poster, `inline` in der Mobile-Zeile. */
  variant: 'overlay' | 'inline';
}

/**
 * Nur im fremden Kalender sichtbar: holt die Serie in die eigene Liste. Steht
 * an derselben Stelle wie im eigenen Kalender der Haken — dort ist im
 * Nur-Lese-Modus ohnehin nichts zu tun.
 */
export const AddToListButton = memo(({ seriesId, title, variant }: AddToListButtonProps) => {
  const { addToList } = useCalendarViewMode();
  const { currentTheme } = useTheme();

  if (!addToList) return null;

  const accent = currentTheme.accent ?? currentTheme.primary;
  const muted = currentTheme.text.muted;

  // Bewusst ein Listen-Haken in gedecktem Grau: der gruene Haken daneben ist
  // der Fortschritt des Freundes, zwei gleiche Haken waeren nicht zu trennen.
  if (addToList.inList(seriesId)) {
    const label = t('In deiner Liste');
    return (
      <span
        className={`cal-ep-add cal-ep-add--${variant} is-in-list`}
        style={{
          color: muted,
          borderColor: `${muted}40`,
          background: variant === 'inline' ? `${muted}14` : undefined,
        }}
        role="img"
        aria-label={label}
        title={label}
      >
        <PlaylistAddCheck className="cal-ep-add__icon" />
        <span className="cal-ep-add__label">{label}</span>
      </span>
    );
  }

  const busy = addToList.adding(seriesId);
  const label = t('Zur Liste hinzufügen');

  return (
    <button
      type="button"
      className={`cal-ep-add cal-ep-add--${variant}${busy ? ' is-busy' : ''}`}
      style={{
        color: accent,
        borderColor: `${accent}66`,
        background: variant === 'inline' ? `${accent}1f` : undefined,
      }}
      aria-label={t('{title} zur Liste hinzufügen', { title })}
      aria-busy={busy}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        if (busy) return;
        addToList.add(seriesId, title);
      }}
    >
      <Add className="cal-ep-add__icon" />
      <span className="cal-ep-add__label">{label}</span>
    </button>
  );
});
AddToListButton.displayName = 'AddToListButton';
