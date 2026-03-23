import React from 'react';
import AutoAwesome from '@mui/icons-material/AutoAwesome';
import CalendarToday from '@mui/icons-material/CalendarToday';
import EmojiEvents from '@mui/icons-material/EmojiEvents';
import Group from '@mui/icons-material/Group';
import History from '@mui/icons-material/History';
import LocalFireDepartment from '@mui/icons-material/LocalFireDepartment';
import PlayCircle from '@mui/icons-material/PlayCircle';
import Star from '@mui/icons-material/Star';
import { motion } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContextDef';

interface MainActionsProps {
  config: {
    mainActionsOrder: string[];
    hiddenMainActions: string[];
  };
  totalSeriesWithUnwatched: number;
  featuredSeries:
    | {
        poster: string;
        title: string;
        nextEpisode: { seasonNumber: number; episodeNumber: number; name?: string };
        progress: number;
      }
    | undefined;
  navigate: (path: string) => void;
}

export const MainActionsSection: React.FC<MainActionsProps> = ({
  config,
  totalSeriesWithUnwatched,
  featuredSeries,
  navigate,
}) => {
  const { currentTheme } = useTheme();

  const allMainActions: Record<
    string,
    {
      icon: React.ReactNode;
      label: string;
      subtitle: string;
      path: string;
      bg: string;
      border: string;
      color: string;
    }
  > = {
    watchlist: {
      icon: (
        <PlayCircle
          style={{ fontSize: '22px', color: currentTheme.status.success, flexShrink: 0 }}
        />
      ),
      label: 'Weiterschauen',
      subtitle: `${totalSeriesWithUnwatched} Serien`,
      path: '/watchlist',
      bg: `linear-gradient(135deg, ${currentTheme.primary}26 0%, ${currentTheme.primary}26 100%)`,
      border: `1px solid ${currentTheme.primary}40`,
      color: currentTheme.status.success,
    },
    discover: {
      icon: (
        <AutoAwesome style={{ fontSize: '22px', color: currentTheme.primary, flexShrink: 0 }} />
      ),
      label: 'Entdecken',
      subtitle: 'Neue Inhalte',
      path: '/discover',
      bg: `linear-gradient(135deg, ${currentTheme.primary}26 0%, ${currentTheme.accent}26 100%)`,
      border: `1px solid ${currentTheme.primary}40`,
      color: currentTheme.primary,
    },
  };
  const visible = config.mainActionsOrder.filter((id) => !config.hiddenMainActions.includes(id));
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        padding: '0 20px',
        marginBottom: '16px',
      }}
    >
      {/* Featured Hero Card */}
      {featuredSeries && (
        <motion.div
          whileTap={{ scale: 0.97 }}
          onClick={() => navigate('/watchlist')}
          style={{
            position: 'relative',
            height: '140px',
            borderRadius: '20px',
            overflow: 'hidden',
            cursor: 'pointer',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          {/* Blurred backdrop */}
          <img
            src={featuredSeries.poster}
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'blur(20px) brightness(0.4)',
              transform: 'scale(1.2)',
            }}
          />
          {/* Gradient overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(135deg, rgba(6, 9, 15, 0.7) 0%, rgba(6, 9, 15, 0.3) 50%, rgba(6, 9, 15, 0.8) 100%)',
            }}
          />
          {/* Content */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              alignItems: 'flex-end',
              padding: '16px',
              gap: '14px',
            }}
          >
            {/* Small poster */}
            <img
              src={featuredSeries.poster}
              alt={featuredSeries.title}
              style={{
                width: '68px',
                aspectRatio: '2/3',
                objectFit: 'cover',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: currentTheme.primary,
                  margin: '0 0 4px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Weiterschauen
              </p>
              <h2
                style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  margin: '0 0 4px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {featuredSeries.title}
              </h2>
              <p
                style={{
                  fontSize: '12px',
                  color: currentTheme.text.secondary,
                  margin: '0 0 8px',
                }}
              >
                S{featuredSeries.nextEpisode.seasonNumber}E
                {featuredSeries.nextEpisode.episodeNumber}
                {featuredSeries.nextEpisode.name ? ` · ${featuredSeries.nextEpisode.name}` : ''}
              </p>
              {/* Progress bar */}
              <div
                style={{
                  height: '4px',
                  borderRadius: '2px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${featuredSeries.progress}%`,
                    background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.status.success})`,
                    borderRadius: '2px',
                    boxShadow: `0 0 8px ${currentTheme.primary}60`,
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Action buttons row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(visible.length, 2)}, 1fr)`,
          gap: '10px',
        }}
      >
        {visible.map((id) => {
          const a = allMainActions[id];
          if (!a) return null;
          return (
            <motion.div
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                navigate(a.path);
              }}
              style={{
                background: a.bg,
                border: a.border,
                borderRadius: '14px',
                padding: '12px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              {a.icon}
              <div>
                <h2
                  style={{
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  {a.label}
                </h2>
                <p
                  style={{
                    fontSize: '12px',
                    color: currentTheme.text.secondary,
                    margin: 0,
                  }}
                >
                  {a.subtitle}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

interface QuickActionsProps {
  config: {
    quickActionsOrder: string[];
    hiddenQuickActions: string[];
  };
  navigate: (path: string) => void;
}

export const QuickActionsSection: React.FC<QuickActionsProps> = ({ config, navigate }) => {
  const { currentTheme } = useTheme();

  const all: Record<string, { icon: React.ReactNode; label: string; path: string; color: string }> =
    {
      ratings: {
        icon: <Star style={{ fontSize: '18px' }} />,
        label: 'Ratings',
        path: '/ratings',
        color: currentTheme.status.warning,
      },
      calendar: {
        icon: <CalendarToday style={{ fontSize: '18px' }} />,
        label: 'Kalender',
        path: '/calendar',
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
