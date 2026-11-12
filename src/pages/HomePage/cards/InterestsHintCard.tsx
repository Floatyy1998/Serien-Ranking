import CheckRounded from '@mui/icons-material/CheckRounded';
import ChevronRight from '@mui/icons-material/ChevronRight';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import LocalOfferRounded from '@mui/icons-material/LocalOfferRounded';
import { memo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HintCard, HintDeck } from '../../../components/ui/notification/HintDeck';
import { useTheme } from '../../../contexts/ThemeContext';
import type { InterestExample } from '../../../hooks/profile/useInterests';
import { showToast } from '../../../lib/interaction/toast';
import { interestById, type InterestSuggestion } from '../../../lib/interests/interests';
import { t } from '../../../services/i18n';
import { saveInterests } from '../../../services/profile/interestsService';
import './InterestsHintCard.css';

interface Props {
  uid: string;
  suggestions: InterestSuggestion[];
  examples: Record<string, InterestExample>;
  onDismiss: () => void;
}

export const InterestsHintCard = memo(function InterestsHintCard({
  uid,
  suggestions,
  examples,
  onDismiss,
}: Props) {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(suggestions.map((s) => s.id))
  );
  const [saving, setSaving] = useState(false);
  const example = examples[suggestions[0]?.id ?? ''];

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const save = async () => {
    if (selected.size === 0 || saving) return;
    setSaving(true);
    try {
      await saveInterests(
        uid,
        suggestions.map((s) => s.id).filter((id) => selected.has(id))
      );
      showToast(t('Interessen stehen jetzt in deinem Profil'), 2500);
    } catch {
      showToast(t('Speichern fehlgeschlagen'), 2500, 'error');
      setSaving(false);
    }
  };

  return (
    <HintDeck
      color={currentTheme.primary}
      Icon={LocalOfferRounded}
      title={t('Deine Interessen')}
      count={1}
    >
      <HintCard
        key="interests"
        title={t('Zeig, was du gern schaust')}
        poster={example?.poster}
        backdrop={example?.backdrop}
        DetailIcon={GroupsRounded}
        detail={t('Leute mit denselben Interessen finden dich dann über die Suche.')}
        extra={
          <div className="interests-hint-chips" role="group" aria-label={t('Interessen')}>
            {suggestions.map((s) => {
              const interest = interestById(s.id);
              if (!interest) return null;
              const on = selected.has(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  className={`interests-hint-chip${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => toggle(s.id)}
                >
                  {on && <CheckRounded aria-hidden />}
                  {t(interest.label)}
                </button>
              );
            })}
          </div>
        }
        onDismiss={onDismiss}
        actions={
          <>
            <button
              type="button"
              className="hint-btn hint-btn--ghost"
              onClick={() => navigate('/settings#interessen')}
            >
              <span>{t('Anpassen')}</span>
              <ChevronRight />
            </button>
            <button
              type="button"
              className="hint-btn hint-btn--primary"
              disabled={selected.size === 0 || saving}
              onClick={save}
            >
              <CheckRounded />
              <span>{t('Ins Profil übernehmen')}</span>
            </button>
          </>
        }
      />
    </HintDeck>
  );
});
