import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { InterestChips } from '../../components/profile/InterestChips';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useInterestSuggestions, useOwnInterests } from '../../hooks/profile/useInterests';
import { interestById } from '../../lib/interests/interests';
import { t } from '../../services/i18n';

export const ProfileInterests = memo(function ProfileInterests() {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const interests = useOwnInterests(user?.uid);
  const empty = interests !== null && interests.length === 0;
  const { suggestions } = useInterestSuggestions(empty);

  if (interests === null) return null;

  const preview = suggestions
    .slice(0, 3)
    .map((s) => interestById(s.id))
    .filter((i) => i !== undefined)
    .map((i) => t(i.label))
    .join(', ');

  return (
    <section className="profile-interests" style={{ margin: '0 16px 20px' }}>
      <button
        type="button"
        className="profile-interests__head"
        onClick={() => navigate('/settings#interessen')}
        style={{ color: currentTheme.text.primary }}
      >
        <span className="profile-interests__title">{t('Interessen')}</span>
        <span className="profile-interests__edit" style={{ color: currentTheme.primary }}>
          {empty ? t('Hinzufügen') : t('Bearbeiten')}
          <ChevronRightRounded style={{ fontSize: 18 }} />
        </span>
      </button>
      {empty ? (
        <p style={{ color: currentTheme.text.muted, fontSize: 13, margin: '6px 0 0' }}>
          {preview
            ? t('Passend zu dem, was du schaust: {list}', { list: preview })
            : t('Zeig, was du gern schaust, und finde Leute mit denselben Interessen.')}
        </p>
      ) : (
        <div style={{ marginTop: 8 }}>
          <InterestChips ids={interests} linkToDirectory />
        </div>
      )}
    </section>
  );
});
