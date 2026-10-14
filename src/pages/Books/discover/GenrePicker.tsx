import { AutoAwesome, Check } from '@mui/icons-material';
import { useState } from 'react';
import { BottomSheet } from '../../../components/ui/overlay/BottomSheet';
import { useTheme } from '../../../contexts/ThemeContext';
import { pickedGenres } from '../../../lib/books/genrePrefs';
import { t } from '../../../services/i18n';
import { getOptimalTextColor } from '../../../theme/colorUtils';
import { GENRES } from '../data/genres';
import './genrePicker.css';

const ALL_IDS = GENRES.map((g) => g.id);

interface GenrePickerSheetProps {
  open: boolean;
  initial: string[];
  onClose: () => void;
  onSave: (ids: string[]) => void;
}

/** Lieblingsgenres fürs Stöbern wählen — „Für dich" und die Regal-Reihenfolge richten sich danach. */
export const GenrePickerSheet = ({ open, initial, onClose, onSave }: GenrePickerSheetProps) => (
  <BottomSheet isOpen={open} onClose={onClose} ariaLabel={t('Lieblingsgenres')}>
    <GenrePickerBody initial={initial} onClose={onClose} onSave={onSave} />
  </BottomSheet>
);

const GenrePickerBody = ({ initial, onClose, onSave }: Omit<GenrePickerSheetProps, 'open'>) => {
  const { currentTheme } = useTheme();
  const [picked, setPicked] = useState<string[]>(initial);
  const toggle = (id: string) =>
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));

  return (
    <div className="bk-sheet">
      <div>
        <h3 className="bk-sheet-title" style={{ color: currentTheme.text.secondary }}>
          {t('Welche Genres liest du gern?')}
        </h3>
        <p className="bk-muted gp-hint" style={{ color: currentTheme.text.muted }}>
          {t('Danach richten sich „Für dich" und die Reihenfolge der Regale.')}
        </p>
      </div>
      <div className="gp-grid" role="group" aria-label={t('Lieblingsgenres')}>
        {GENRES.map((genre) => {
          const on = picked.includes(genre.id);
          const Icon = genre.icon;
          return (
            <button
              key={genre.id}
              type="button"
              className={`gp-tile${on ? ' gp-tile--on' : ''}`}
              aria-pressed={on}
              onClick={() => toggle(genre.id)}
              style={{
                background: `radial-gradient(120% 140% at 0% 100%, ${genre.colors[0]}, transparent 70%), linear-gradient(135deg, ${genre.colors[0]}, ${genre.colors[1]})`,
              }}
            >
              <Icon className="gp-tile-icon" aria-hidden />
              <span className="gp-tile-label">{genre.label()}</span>
              <span className="gp-tile-check" aria-hidden>
                {on && <Check style={{ fontSize: 16 }} />}
              </span>
            </button>
          );
        })}
      </div>
      <div className="gp-actions">
        <button
          type="button"
          className="bk-cta bk-cta--ghost"
          onClick={onClose}
          style={{ color: currentTheme.text.secondary }}
        >
          {t('Abbrechen')}
        </button>
        <button
          type="button"
          className="bk-cta"
          onClick={() => onSave(pickedGenres(ALL_IDS, picked))}
          style={{
            color: getOptimalTextColor(currentTheme.primary),
            background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
          }}
        >
          {t('Speichern')}
        </button>
      </div>
    </div>
  );
};

/** Ohne Lesegeschmack und ohne Wahl: Einladung, Lieblingsgenres festzulegen. */
export const GenrePrompt = ({ onPick }: { onPick: () => void }) => {
  const { currentTheme } = useTheme();
  return (
    <section className="bk-section">
      <div className="bk-pad">
        <div
          className="gp-prompt"
          style={{
            borderColor: `${currentTheme.accent}55`,
            background: `linear-gradient(150deg, ${currentTheme.accent}1f, var(--glass-light) 60%)`,
          }}
        >
          <AutoAwesome style={{ fontSize: 22, color: currentTheme.accent }} aria-hidden />
          <div className="gp-prompt-text">
            <strong style={{ color: currentTheme.text.secondary }}>
              {t('Was liest du gern?')}
            </strong>
            <span className="bk-muted" style={{ color: currentTheme.text.muted }}>
              {t('Wähl deine Lieblingsgenres, dann passen die Vorschläge zu dir.')}
            </span>
          </div>
          <button
            type="button"
            className="bk-cta"
            onClick={onPick}
            style={{
              color: getOptimalTextColor(currentTheme.primary),
              background: `linear-gradient(135deg, ${currentTheme.primary}, ${currentTheme.accent})`,
            }}
          >
            {t('Genres wählen')}
          </button>
        </div>
      </div>
    </section>
  );
};
