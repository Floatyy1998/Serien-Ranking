import { useTheme } from '../../contexts/ThemeContext';
import { t } from '../../services/i18n';
import './RatingSheetTabs.css';

export type RatingSheetTab = 'rate' | 'friends';

interface RatingSheetTabsProps {
  value: RatingSheetTab;
  onChange: (tab: RatingSheetTab) => void;
  /** Anzahl der Favoriten — steht als Zähler am zweiten Reiter. */
  friendCount: number;
}

/**
 * Umschalter zwischen eigener Bewertung und den Bewertungen der Favoriten.
 * Erscheint nur, wenn Favoriten gesetzt sind — sonst bleibt das Sheet, wie es war.
 */
export const RatingSheetTabs: React.FC<RatingSheetTabsProps> = ({
  value,
  onChange,
  friendCount,
}) => {
  const { currentTheme } = useTheme();
  const accent = currentTheme.accent || currentTheme.primary;

  const tabs: { key: RatingSheetTab; label: string }[] = [
    { key: 'rate', label: t('Bewerten') },
    { key: 'friends', label: `${t('Freunde')} · ${friendCount}` },
  ];

  return (
    <div
      className="rating-tabs"
      role="tablist"
      aria-label={t('Ansicht wählen')}
      style={{ background: `${currentTheme.text.muted}12` }}
    >
      <span
        aria-hidden
        className={`rating-tabs__marker${value === 'friends' ? ' is-second' : ''}`}
        style={{ background: accent }}
      />
      {tabs.map((tab) => {
        const selected = value === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={selected}
            className="rating-tabs__tab"
            onClick={() => onChange(tab.key)}
            style={{
              color: selected ? currentTheme.background.default : currentTheme.text.secondary,
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
