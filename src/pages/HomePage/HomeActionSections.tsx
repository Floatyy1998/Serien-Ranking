import React from 'react';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Group from '@mui/icons-material/Group';
import History from '@mui/icons-material/History';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import Star from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import { useDeviceType } from '../../hooks/useDeviceType';
import { tapScale } from '../../lib/motion';

interface QuickActionsProps {
  config: {
    quickActionsOrder: string[];
    hiddenQuickActions: string[];
  };
  navigate: (path: string) => void;
}

export const QuickActionsSection: React.FC<QuickActionsProps> = ({ config, navigate }) => {
  const { currentTheme } = useTheme();
  const { isMobile } = useDeviceType();

  const all: Record<
    string,
    { icon: React.ReactNode; label: string; path: string; color: string; badge?: number }
  > = {
    ratings: {
      icon: <Star style={{ fontSize: '22px' }} />,
      label: 'Ratings',
      path: '/ratings',
      color: currentTheme.status.warning,
    },
    discover: {
      icon: <AutoAwesome style={{ fontSize: '22px' }} />,
      label: 'Entdecken',
      path: '/discover',
      color: currentTheme.status.success,
    },
    history: {
      icon: <History style={{ fontSize: '22px' }} />,
      label: 'Verlauf',
      path: '/recently-watched',
      color: currentTheme.status.error,
    },
    friends: {
      icon: <Group style={{ fontSize: '22px' }} />,
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
            whileHover={{ y: -2 }}
            onClick={() => {
              navigate(a.path);
            }}
            style={{
              display: 'flex',
              // Desktop: horizontale Glas-Buttons (Icon + Label nebeneinander) —
              // vertikal gestapelte Icons wirken in breiten Kacheln verloren.
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '6px' : '10px',
              padding: isMobile ? '14px 8px' : '14px 12px',
              borderRadius: '16px',
              background: `linear-gradient(160deg, ${a.color}16, transparent 60%), var(--glass-light)`,
              border: `1px solid ${a.color}26`,
              boxShadow: 'var(--glass-specular)',
              cursor: 'pointer',
              transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: `${a.color}1f`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px -8px ${a.color}66`,
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
                fontSize: isMobile ? '12px' : '14px',
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
      icon: <EmojiEvents style={{ fontSize: '22px' }} />,
      label: 'Rangliste',
      path: '/leaderboard',
      bg: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
      border: '1px solid rgba(245, 158, 11, 0.2)',
      color: currentTheme.status?.warning || '#f59e0b',
    },
    badges: {
      icon: <AutoAwesome style={{ fontSize: '22px' }} />,
      label: 'Badges',
      path: '/badges',
      bg: `linear-gradient(135deg, ${currentTheme.primary}1A 0%, ${currentTheme.accent}1A 100%)`,
      border: `1px solid ${currentTheme.primary}33`,
      color: currentTheme.primary,
    },
    pets: {
      icon: <LocalFireDepartment style={{ fontSize: '22px' }} />,
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
            whileTap={tapScale}
            whileHover={{ y: -2 }}
            onClick={() => {
              navigate(a.path);
            }}
            style={{
              padding: '13px 10px',
              background: a.bg,
              border: a.border,
              borderRadius: '14px',
              boxShadow: 'var(--glass-specular)',
              color: a.color,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
            }}
          >
            {a.icon}
            <span style={{ fontSize: '13px', fontWeight: 600 }}>{a.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
};
