import React from 'react';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import DynamicFeed from '@mui/icons-material/DynamicFeed';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Group from '@mui/icons-material/Group';
import History from '@mui/icons-material/History';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import Star from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import { usePetEnabled } from '../../../hooks/pet/usePetEnabled';
import { useDeviceType } from '../../../hooks/platform/useDeviceType';
import { t } from '../../../services/i18n';

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
      icon: <Star style={{ fontSize: isMobile ? '18px' : '22px' }} />,
      label: t('Ratings'),
      path: '/ratings',
      color: currentTheme.status.warning,
    },
    discover: {
      icon: <AutoAwesome style={{ fontSize: isMobile ? '18px' : '22px' }} />,
      label: t('Entdecken'),
      path: '/discover',
      color: currentTheme.status.success,
    },
    history: {
      icon: <History style={{ fontSize: isMobile ? '18px' : '22px' }} />,
      label: t('Verlauf'),
      path: '/recently-watched',
      color: currentTheme.status.error,
    },
    friends: {
      icon: <Group style={{ fontSize: isMobile ? '18px' : '22px' }} />,
      label: t('Freunde'),
      path: '/activity?tab=friends',
      color: currentTheme.status.info.main,
    },
    activity: {
      icon: <DynamicFeed style={{ fontSize: isMobile ? '18px' : '22px' }} />,
      label: t('Aktivität'),
      path: '/activity',
      color: currentTheme.primary,
    },
  };
  const visible = config.quickActionsOrder.filter((id) => !config.hiddenQuickActions.includes(id));
  if (visible.length === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${visible.length}, 1fr)`,
        gap: isMobile ? '8px' : '10px',
        padding: isMobile ? '0 16px' : '0 20px',
        marginBottom: 'var(--home-row-gap)',
      }}
    >
      {visible.map((id) => {
        const a = all[id];
        if (!a) return null;
        return (
          <motion.button
            key={id}
            whileTap={{ opacity: 0.7 }}
            onClick={() => {
              navigate(a.path);
            }}
            className="home-quick-tile"
            style={{
              display: 'flex',
              // Desktop: horizontale Glas-Buttons (Icon + Label nebeneinander) —
              // vertikal gestapelte Icons wirken in breiten Kacheln verloren.
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '3px' : '10px',
              padding: isMobile ? '9px 4px 8px' : '12px',
              borderRadius: '14px',
              background: `linear-gradient(160deg, color-mix(in srgb, ${a.color} 9%, transparent), transparent 60%), var(--glass-light)`,
              border: `1px solid color-mix(in srgb, ${a.color} 10%, transparent)`,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: isMobile ? '26px' : '28px',
                height: isMobile ? '26px' : '28px',
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
                fontSize: isMobile ? '11.5px' : '14px',
                fontWeight: 600,
                color: currentTheme.text.secondary,
                letterSpacing: '0.2px',
                lineHeight: 1.2,
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
  const { isMobile } = useDeviceType();
  const petEnabled = usePetEnabled();

  const all: Record<
    string,
    {
      icon: React.ReactElement;
      label: string;
      path: string;
      color: string;
    }
  > = {
    leaderboard: {
      icon: <EmojiEvents style={{ fontSize: '22px' }} />,
      label: t('Rangliste'),
      path: '/leaderboard',
      color: currentTheme.status?.warning || '#f59e0b',
    },
    badges: {
      icon: <AutoAwesome style={{ fontSize: '22px' }} />,
      label: t('Badges'),
      path: '/badges',
      color: currentTheme.primary,
    },
    pets: {
      icon: <LocalFireDepartment style={{ fontSize: '22px' }} />,
      label: t('Pets'),
      path: '/pets',
      color: currentTheme.status.success,
    },
  };
  const visible = config.secondaryActionsOrder.filter(
    (id) => !config.hiddenSecondaryActions.includes(id) && (petEnabled || id !== 'pets')
  );
  if (visible.length === 0) return null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(visible.length, 3)}, 1fr)`,
        gap: isMobile ? '8px' : '10px',
        padding: isMobile ? '0 16px' : '0 20px',
        marginBottom: 'var(--home-section-gap)',
      }}
    >
      {visible.map((id) => {
        const a = all[id];
        if (!a) return null;
        return (
          <motion.button
            key={id}
            whileTap={{ opacity: 0.7 }}
            onClick={() => {
              navigate(a.path);
            }}
            className="home-quick-tile"
            style={{
              padding: isMobile ? '9px 10px' : '12px 10px',
              background: `linear-gradient(160deg, color-mix(in srgb, ${a.color} 10%, transparent), transparent 60%), var(--glass-light)`,
              border: `1px solid color-mix(in srgb, ${a.color} 12%, transparent)`,
              borderRadius: '14px',
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
