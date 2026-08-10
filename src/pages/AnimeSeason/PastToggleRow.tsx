/** Timeline-Zeile „Vergangenes anzeigen" — siehe `usePastCollapse`. */
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { t } from '../../services/i18n';

interface Props {
  count: number;
  expanded: boolean;
  onToggle: () => void;
  color?: string;
}

/** Sitzt als eigene Zeile ganz oben in der Timeline. */
export const PastToggleRow = ({ count, expanded, onToggle, color }: Props) => {
  if (!count) return null;
  const Icon = expanded ? ExpandLess : ExpandMore;
  return (
    <div className="as-past-row">
      <span className="as-day-node as-day-node--past" />
      <button
        type="button"
        className="as-jump"
        onClick={onToggle}
        style={color ? { color } : undefined}
      >
        <Icon style={{ fontSize: '14px' }} />
        {expanded ? t('Vergangenes ausblenden') : t('Vergangenes anzeigen ({n})', { n: count })}
      </button>
    </div>
  );
};
