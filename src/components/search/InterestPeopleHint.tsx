import ChevronRightRounded from '@mui/icons-material/ChevronRightRounded';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { interestDirectoryPath, matchInterests } from '../../lib/interests/interests';
import { t } from '../../services/i18n';
import { fetchPublicDirectory } from '../../services/social/publicDirectoryService';
import type { PublicDirectoryEntry } from '../../types/PublicDirectory';
import './InterestPeopleHint.css';

interface Props {
  query: string;
  onOpen?: () => void;
}

export const InterestPeopleHint = memo(function InterestPeopleHint({ query, onOpen }: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const matches = useMemo(() => matchInterests(query, t).slice(0, 2), [query]);
  const [directory, setDirectory] = useState<PublicDirectoryEntry[] | null>(null);
  const needed = matches.length > 0 && !!user;

  useEffect(() => {
    if (!needed || directory) return;
    let cancelled = false;
    fetchPublicDirectory()
      .then((list) => {
        if (!cancelled) setDirectory(list);
      })
      .catch(() => {
        if (!cancelled) setDirectory([]);
      });
    return () => {
      cancelled = true;
    };
  }, [needed, directory]);

  if (!needed || !directory) return null;

  const rows = matches
    .map((interest) => ({
      interest,
      count: directory.filter((e) => e.uid !== user?.uid && e.interests.includes(interest.id))
        .length,
    }))
    .filter((row) => row.count > 0);
  if (rows.length === 0) return null;

  return (
    <div className="interest-hint">
      {rows.map(({ interest, count }) => {
        const label = t(interest.label);
        return (
          <button
            key={interest.id}
            type="button"
            className="interest-hint__row"
            onClick={() => {
              onOpen?.();
              navigate(interestDirectoryPath(interest.id));
            }}
            style={{
              background: 'var(--glass-light)',
              borderColor: 'var(--glass-border-subtle)',
              color: currentTheme.text.primary,
            }}
          >
            <span
              className="interest-hint__icon"
              style={{ background: `${currentTheme.primary}22`, color: currentTheme.primary }}
            >
              <GroupsRounded style={{ fontSize: 20 }} />
            </span>
            <span className="interest-hint__text">
              <span className="interest-hint__title">
                {t('Leute mit Interesse {name}', { name: label })}
              </span>
              <span className="interest-hint__sub" style={{ color: currentTheme.text.muted }}>
                {count === 1
                  ? t('1 öffentliches Profil')
                  : t('{n} öffentliche Profile', { n: count })}
              </span>
            </span>
            <ChevronRightRounded style={{ fontSize: 20, color: currentTheme.text.muted }} />
          </button>
        );
      })}
    </div>
  );
});
