import { Flag } from '@mui/icons-material';
import { useState } from 'react';
import { IconContainer, NavCard } from '../../../components/ui';
import { useTheme } from '../../../contexts/ThemeContext';
import { goalPace } from '../../../lib/books/bookStats';
import { t } from '../../../services/i18n';
import { GoalSheet } from '../../Books/sections/GoalSheet';

interface ReadingGoalCardProps {
  year: number;
  goal: number;
  finished: number;
  now: number;
  onSaveGoal: (goal: number) => void;
}

/** Leseziel als kompakte Karte in „Für dich"; Antippen setzt oder ändert das Ziel. */
export const ReadingGoalCard = ({
  year,
  goal,
  finished,
  now,
  onSaveGoal,
}: ReadingGoalCardProps) => {
  const { currentTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const pace = goal ? goalPace(goal, finished, now) : null;
  const sub = !goal
    ? t('{n} Bücher hast du dieses Jahr schon gelesen.', { n: finished })
    : pace?.done
      ? t('Ziel geschafft!')
      : pace && pace.diff > 0
        ? t('{n} Bücher vor dem Plan', { n: pace.diff })
        : pace && pace.diff < 0
          ? t('{n} Bücher hinter dem Plan', { n: -pace.diff })
          : t('Genau im Plan');

  return (
    <>
      <NavCard onClick={() => setEditing(true)} accentColor={currentTheme.status.warning}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
          <IconContainer color={currentTheme.status.warning} size={40} borderRadius={12}>
            <Flag style={{ fontSize: 20 }} />
          </IconContainer>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: currentTheme.text.primary,
                fontFamily: 'var(--font-display)',
              }}
            >
              {goal
                ? t('Lesechallenge {year}: {n} / {m}', { year, n: finished, m: goal })
                : t('Setz dir ein Leseziel für {year}', { year })}
            </div>
            <div style={{ fontSize: 12, color: currentTheme.text.secondary, opacity: 0.7 }}>
              {sub}
            </div>
          </div>
        </div>
      </NavCard>
      {editing && (
        <GoalSheet
          open={editing}
          initial={goal}
          year={year}
          onClose={() => setEditing(false)}
          onSave={(next) => {
            onSaveGoal(next);
            setEditing(false);
          }}
        />
      )}
    </>
  );
};
