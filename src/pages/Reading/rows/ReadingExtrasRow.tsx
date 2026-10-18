import { AutoAwesome, LocalFireDepartment } from '@mui/icons-material';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePetEnabled } from '../../../hooks/pet/usePetEnabled';
import { t } from '../../../services/i18n';
import './ReadingQuickActions.css';

/** Reihe unter dem Schnellzugriff wie auf der Startseite: Leseziel statt Rangliste, dazu Badges und Pets. */
export const ReadingExtrasRow = ({ goal }: { goal: ReactNode }) => {
  const { currentTheme } = useTheme();
  const navigate = useNavigate();
  const petEnabled = usePetEnabled();

  const pills = [
    {
      key: 'badges',
      icon: <AutoAwesome style={{ fontSize: 22 }} />,
      label: t('Badges'),
      path: '/badges',
      bg: `linear-gradient(135deg, ${currentTheme.primary}1A 0%, ${currentTheme.accent}1A 100%)`,
      border: `1px solid ${currentTheme.primary}33`,
      color: currentTheme.primary,
    },
    ...(petEnabled
      ? [
          {
            key: 'pets',
            icon: <LocalFireDepartment style={{ fontSize: 22 }} />,
            label: t('Pets'),
            path: '/pets',
            bg: `linear-gradient(135deg, ${currentTheme.status.success}1A 0%, ${currentTheme.status.info.main}1A 100%)`,
            border: `1px solid ${currentTheme.status.success}33`,
            color: currentTheme.status.success,
          },
        ]
      : []),
  ];

  return (
    <div className="rqa-extras">
      {goal}
      {pills.map((pill) => (
        <motion.button
          key={pill.key}
          type="button"
          whileTap={{ opacity: 0.7 }}
          onClick={() => navigate(pill.path)}
          className="rqa-pill"
          style={{ background: pill.bg, border: pill.border, color: pill.color }}
        >
          {pill.icon}
          <span className="rqa-pill-label">{pill.label}</span>
        </motion.button>
      ))}
    </div>
  );
};
