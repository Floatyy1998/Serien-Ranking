import { Flag } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from '../../../services/i18n';
import { GoalSheet } from '../../Books/sections/GoalSheet';

interface ReadingGoalCardProps {
  year: number;
  goal: number;
  finished: number;
  onSaveGoal: (goal: number) => void;
}

/** Leseziel als schmaler Knopf im Stil der Rangliste; Antippen setzt oder ändert das Ziel. */
export const ReadingGoalCard = ({ year, goal, finished, onSaveGoal }: ReadingGoalCardProps) => {
  const { currentTheme } = useTheme();
  const [editing, setEditing] = useState(false);
  const color = currentTheme.status.warning;

  return (
    <>
      <motion.button
        type="button"
        whileTap={{ opacity: 0.7 }}
        onClick={() => setEditing(true)}
        className="rqa-pill"
        style={{
          background: `linear-gradient(135deg, ${color}1A 0%, ${currentTheme.status.error}1A 100%)`,
          border: `1px solid ${color}33`,
          color,
        }}
      >
        <Flag style={{ fontSize: 22 }} />
        <span className="rqa-pill-label">
          {goal ? t('Ziel {n}/{m}', { n: finished, m: goal }) : t('Leseziel')}
        </span>
      </motion.button>
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
