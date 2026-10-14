import { Edit } from '@mui/icons-material';
import { useRef, useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';

export interface EditableDetailRowProps {
  label: string;
  /** Angezeigter Wert; leer = „Eintragen". */
  value?: string;
  /** Startwert im Eingabefeld, wenn er sich vom angezeigten Wert unterscheidet (nur die Bandnummer). */
  draft?: string;
  placeholder: string;
  numeric?: boolean;
  maxLength?: number;
  onSave: (value: string) => void;
}

/** Detailzeile, die man antippt und direkt überschreibt — Enter oder Wegtippen speichert, Esc bricht ab. */
export const EditableDetailRow = ({
  label,
  value,
  draft,
  placeholder,
  numeric = false,
  maxLength = 60,
  onSave,
}: EditableDetailRowProps) => {
  const { currentTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const cancelled = useRef(false);
  const initial = (draft ?? value ?? '').trim();

  const start = () => {
    cancelled.current = false;
    setText(initial);
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    if (cancelled.current) return;
    const next = text.trim();
    if (next !== initial) onSave(next);
  };

  return (
    <div className="bd-detail-row bd-detail-row--editable">
      <span style={{ color: currentTheme.text.muted }}>{label}</span>
      {editing ? (
        <input
          className="bd-detail-input"
          autoFocus
          value={text}
          inputMode={numeric ? 'numeric' : undefined}
          maxLength={numeric ? 4 : maxLength}
          placeholder={placeholder}
          aria-label={label}
          onChange={(e) => setText(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.currentTarget.blur();
            if (e.key === 'Escape') {
              cancelled.current = true;
              e.currentTarget.blur();
            }
          }}
          style={{ color: currentTheme.text.secondary }}
        />
      ) : (
        <button
          type="button"
          className="bd-detail-edit"
          onClick={start}
          aria-label={t('{label} bearbeiten', { label })}
        >
          <span
            style={{
              color: value ? currentTheme.text.secondary : currentTheme.primary,
              fontWeight: 700,
            }}
          >
            {value || t('Eintragen')}
          </span>
          <Edit style={{ fontSize: 14, color: currentTheme.text.muted }} />
        </button>
      )}
    </div>
  );
};
