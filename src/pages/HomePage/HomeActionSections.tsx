import React from 'react';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Group from '@mui/icons-material/Group';
import History from '@mui/icons-material/History';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import Star from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';

interface QuickActionsProps {
  config: {
    quickActionsOrder: string[];
    hiddenQuickActions: string[];
  };
  navigate: (path: string) => void;
}

export const QuickActionsSection: React.FC<QuickActionsProps> = ({ config, navigate }) => {
  const { currentTheme } = useTheme();

  const all: Record<
    string,
    { icon: React.ReactNode; label: string; path: string; color: string; badge?: number }
  > = {
    ratings: {
      icon: <Star style={{ fontSize: '18px' }} />,
      label: 'Ratings',
      path: '/ratings',
      color: currentTheme.status.warning,
    },
    discover: {
      icon: <AutoAwesome style={{ fontSize: '18px' }} />,
      label: 'Entdecken',
      path: '/discover',
      color: currentTheme.status.success,
    },
    history: {
      icon: <History style={{ fontSize: '18px' }} />,
      label: 'Verlauf',
      path: '/recently-watched',
      color: currentTheme.status.error,
    },
    friends: {
      icon: <Group style={{ fontSize: '18px' }} />,
      label: 'Freunde',
      path: '/activity',
      color: currentTheme.status.info.main,
    },
  };
  const visible = config.quickActionsOrder.filter((id) => !config.hiddenQuickActions.includes(id));
  if (visible.length === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${visible.length}, 1fr)`,
        gap: '10px',
        padding: '0 20px',
        marginBottom: '16px',
      }}
    >
      {visible.map((id) => {
        const a = all[id];
        if (!a) return null;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.93 }}
            onClick={() => {
              navigate(a.path);
            }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 6px',
              borderRadius: '12px',
              background: `${a.color}0D`,
              border: `1px solid ${a.color}20`,
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '32px',
                height: '32px',
                borderRadius: '10px',
                background: `${a.color}1A`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: a.color,
              }}
            >
              {a.icon}
              {a.badge != null && a.badge > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -8,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '8px',
                    background: a.color,
                    color: '#fff',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: `0 2px 6px ${a.color}60`,
                  }}
                >
                  {a.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: currentTheme.text.secondary,
                letterSpacing: '0.2px',
              }}
            >
              {a.label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
};

interface SecondaryActionsProps {
  config: {
    secondaryActionsOrder: string[];
    hiddenSecondaryActions: string[];
  };
  navigate: (path: string) => void;
}

export const SecondaryActionsSection: React.FC<SecondaryActionsProps> = ({ config, navigate }) => {
  const { currentTheme } = useTheme();

  const all: Record<
    string,
    {
      icon: React.ReactElement;
      label: string;
      path: string;
      bg: string;
      border: string;
      color: string;
    }
  > = {
    leaderboard: {
      icon: <EmojiEvents style={{ fontSize: '18px' }} />,
      label: 'Rangliste',
      path: '/leaderboard',
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      color: currentTheme.status?.warning || '#f59e0b',
    },
    badges: {
      icon: <AutoAwesome style={{ fontSize: '18px' }} />,
      label: 'Badges',
      path: '/badges',
      bg: `linear-gradient(135deg, ${currentTheme.primary}1A 0%, ${currentTheme.accent}1A 100%)`,
      border: `1px solid ${currentTheme.primary}33`,
      color: currentTheme.primary,
    },
    pets: {
      icon: <LocalFireDepartment style={{ fontSize: '18px' }} />,
      label: 'Pets',
      path: '/pets',
      bg: `linear-gradient(135deg, ${currentTheme.status.success}1A 0%, ${currentTheme.status.info.main}1A 100%)`,
      border: `1px solid ${currentTheme.status.success}33`,
      color: currentTheme.status.success,
    },
  };
  const visible = config.secondaryActionsOrder.filter(
    (id) => !config.hiddenSecondaryActions.includes(id)
  );
  if (visible.length === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(visible.length, 3)}, 1fr)`,
        gap: '10px',
        padding: '0 20px',
        marginBottom: '32px',
      }}
    >
      {visible.map((id) => {
        const a = all[id];
        if (!a) return null;
        return (
          <motion.button
            key={id}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              navigate(a.path);
            }}
            style={{
              padding: '10px',
              background: a.bg,
              border: a.border,
              borderRadius: '10px',
              color: a.color,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
            }}
          >
            {a.icon}
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{a.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
