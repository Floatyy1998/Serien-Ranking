import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { memo } from 'react';
import { t } from '../../../services/i18n';
import type { SettingsCategory, SettingsCategoryId } from './settingsCategories';

interface Props {
  categories: SettingsCategory[];
  active: SettingsCategoryId | null;
  onSelect: (id: SettingsCategoryId) => void;
}

export const SettingsCategoryList = memo(function SettingsCategoryList({
  categories,
  active,
  onSelect,
}: Props) {
  return (
    <nav className="settings-cats" aria-label={t('Bereiche der Einstellungen')}>
      {categories.map(({ id, title, description, Icon }) => (
        <button
          key={id}
          type="button"
          className={`settings-cat${active === id ? ' is-active' : ''}`}
          aria-current={active === id ? 'page' : undefined}
          onClick={() => onSelect(id)}
        >
          <span className="settings-cat-icon" aria-hidden>
            <Icon />
          </span>
          <span className="settings-cat-text">
            <span className="settings-cat-title">{t(title)}</span>
            <span className="settings-cat-desc">{t(description)}</span>
          </span>
          <ChevronRightRounded className="settings-cat-chevron" aria-hidden />
        </button>
      ))}
    </nav>
  );
});
