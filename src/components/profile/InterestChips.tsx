import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { interestById, interestDirectoryPath } from '../../lib/interests/interests';
import { t } from '../../services/i18n';
import './InterestChips.css';

interface Props {
  ids: string[];
  shared?: ReadonlySet<string>;
  linkToDirectory?: boolean;
}

export const InterestChips = memo(function InterestChips({ ids, shared, linkToDirectory }: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const known = ids.map(interestById).filter((i) => i !== undefined);
  if (known.length === 0) return null;

  return (
    <ul className="interest-chips" aria-label={t('Interessen')}>
      {known.map((interest) => {
        const isShared = shared?.has(interest.id) ?? false;
        const style = {
          color: isShared ? currentTheme.primary : currentTheme.text.primary,
          background: isShared ? `${currentTheme.primary}1f` : 'var(--glass-light)',
          borderColor: isShared ? `${currentTheme.primary}66` : 'var(--glass-border-subtle)',
        };
        const label = t(interest.label);
        return (
          <li key={interest.id}>
            {linkToDirectory ? (
              <button
                type="button"
                className="interest-chip"
                style={style}
                onClick={() => navigate(interestDirectoryPath(interest.id))}
                aria-label={t('Profile mit Interesse {name} finden', { name: label })}
              >
                {label}
              </button>
            ) : (
              <span className="interest-chip" style={style}>
                {label}
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
});
