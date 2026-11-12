import AddRounded from '@mui/icons-material/AddRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import { memo, useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useInterestSuggestions, useOwnInterests } from '../../../hooks/profile/useInterests';
import { showToast } from '../../../lib/interaction/toast';
import { INTERESTS, MAX_INTERESTS, interestById } from '../../../lib/interests/interests';
import { t } from '../../../services/i18n';
import { saveInterests } from '../../../services/profile/interestsService';
import { SBlock, SRow } from '../kit/SettingsKit';

const GROUPS = [
  { group: 'franchise', title: 'Filmwelten & Studios' },
  { group: 'genre', title: 'Genres & Themen' },
] as const;

const Chip = ({
  label,
  active,
  count,
  onClick,
}: {
  label: string;
  active: boolean;
  count?: number;
  onClick: () => void;
}) => (
  <button
    type="button"
    className={`st-chip${active ? ' is-on' : ''}`}
    aria-pressed={active}
    onClick={onClick}
  >
    {active ? <CheckRounded aria-hidden /> : <AddRounded aria-hidden />}
    <span>{label}</span>
    {count !== undefined && <span className="st-chip-count">{count}</span>}
  </button>
);

export const InterestsSection = memo(() => {
  const { user } = useAuth() || {};
  const saved = useOwnInterests(user?.uid);
  const [draft, setDraft] = useState<string[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const { suggestions } = useInterestSuggestions(!!user);

  const selected = draft ?? saved ?? [];
  const selectedSet = new Set(selected);
  const openSuggestions = suggestions.filter((s) => !selectedSet.has(s.id));

  const persist = (next: string[]) => {
    if (!user) return;
    setDraft(next);
    saveInterests(user.uid, next)
      .catch(() => showToast(t('Speichern fehlgeschlagen'), 2500, 'error'))
      .finally(() => setDraft(null));
  };

  const toggle = (id: string) => {
    if (selectedSet.has(id)) {
      persist(selected.filter((s) => s !== id));
      return;
    }
    if (selected.length >= MAX_INTERESTS) {
      showToast(t('Höchstens {n} Interessen', { n: MAX_INTERESTS }), 2500);
      return;
    }
    persist([...selected, id]);
  };

  const takeAll = () => {
    const room = MAX_INTERESTS - selected.length;
    persist([...selected, ...openSuggestions.slice(0, room).map((s) => s.id)]);
  };

  return (
    <>
      <SRow
        icon={LocalOfferRounded}
        title={t('Deine Interessen')}
        subtitle={t(
          'Stehen in deinem Profil. Ist dein Profil öffentlich, finden dich Leute mit denselben Interessen über die Suche.'
        )}
        trailing={
          <span className="st-count">
            {t('{n} von {max}', { n: selected.length, max: MAX_INTERESTS })}
          </span>
        }
        below={
          selected.length === 0 ? (
            <p className="st-form-hint">{t('Noch keine ausgewählt')}</p>
          ) : (
            <div className="st-chips">
              {selected.map((id) => {
                const interest = interestById(id);
                if (!interest) return null;
                return (
                  <Chip key={id} label={t(interest.label)} active onClick={() => toggle(id)} />
                );
              })}
            </div>
          )
        }
      />

      {openSuggestions.length > 0 && (
        <SRow
          icon={AutoAwesomeRounded}
          title={t('Vorschläge aus deiner Bibliothek')}
          trailing={
            selected.length < MAX_INTERESTS ? (
              <button type="button" className="st-link-btn" onClick={takeAll}>
                {t('Alle übernehmen')}
              </button>
            ) : undefined
          }
          below={
            <div className="st-chips">
              {openSuggestions.map((s) => {
                const interest = interestById(s.id);
                if (!interest) return null;
                return (
                  <Chip
                    key={s.id}
                    label={t(interest.label)}
                    active={false}
                    count={s.count}
                    onClick={() => toggle(s.id)}
                  />
                );
              })}
            </div>
          }
        />
      )}

      <button
        type="button"
        className="st-row st-row--default st-row--action"
        aria-expanded={showAll}
        onClick={() => setShowAll((v) => !v)}
      >
        <span className="st-row-main">
          <span className="st-row-text">
            <span className="st-row-title">{t('Alle Interessen')}</span>
          </span>
          {showAll ? (
            <ExpandLess className="st-row-chev" aria-hidden />
          ) : (
            <ExpandMore className="st-row-chev" aria-hidden />
          )}
        </span>
      </button>

      {showAll && (
        <SBlock>
          {GROUPS.map(({ group, title }) => (
            <div key={group} className="st-chip-group">
              <span className="st-mini-title">{t(title)}</span>
              <div className="st-chips">
                {INTERESTS.filter((i) => i.group === group).map((interest) => (
                  <Chip
                    key={interest.id}
                    label={t(interest.label)}
                    active={selectedSet.has(interest.id)}
                    onClick={() => toggle(interest.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </SBlock>
      )}
    </>
  );
});

InterestsSection.displayName = 'InterestsSection';
