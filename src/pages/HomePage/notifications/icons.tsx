import {
  BugReport,
  ChatBubbleOutline,
  Favorite,
  Flag,
  Lightbulb,
  Movie as MovieIcon,
  NewReleases,
  Notifications,
  PersonAdd,
  Pets,
  PlayCircle,
  Recommend,
  Star,
  Tv,
} from '@mui/icons-material';
import type React from 'react';
import type { ThemeContextType } from '../../../contexts/ThemeContextDef';

type Theme = ThemeContextType['currentTheme'];

const ICON_MAP: Record<string, (theme: Theme) => React.ReactNode> = {
  tv: (t) => <Tv style={{ fontSize: '18px', color: t.primary }} />,
  movie: (t) => <MovieIcon style={{ fontSize: '18px', color: t.status.error }} />,
  star: (t) => <Star style={{ fontSize: '18px', color: t.status.warning }} />,
  watchlist: (t) => <PlayCircle style={{ fontSize: '18px', color: t.primary }} />,
  person: (t) => <PersonAdd style={{ fontSize: '18px', color: t.status.success }} />,
  chat: (t) => <ChatBubbleOutline style={{ fontSize: '18px', color: t.primary }} />,
  heart: (t) => <Favorite style={{ fontSize: '18px', color: t.status?.error || '#ef4444' }} />,
  flag: (t) => <Flag style={{ fontSize: '18px', color: t.status.warning }} />,
  announcement: (t) => <NewReleases style={{ fontSize: '18px', color: t.accent }} />,
  bug: (t) => <BugReport style={{ fontSize: '18px', color: t.status.warning }} />,
  feature: () => <Lightbulb style={{ fontSize: '18px', color: '#8b5cf6' }} />,
  pet: () => <Pets style={{ fontSize: '18px', color: '#FF9800' }} />,
  recommendation: (t) => <Recommend style={{ fontSize: '18px', color: t.primary }} />,
};

const ICON_BG_MAP: Record<string, (t: Theme) => string> = {
  person: (t) => `linear-gradient(135deg, ${t.status.success}20, ${t.status.success}08)`,
  star: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  heart: (t) =>
    `linear-gradient(135deg, ${t.status?.error || '#ef4444'}20, ${t.status?.error || '#ef4444'}08)`,
  flag: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  movie: (t) => `linear-gradient(135deg, ${t.status.error}20, ${t.status.error}08)`,
  announcement: (t) => `linear-gradient(135deg, ${t.accent}20, ${t.accent}08)`,
  bug: (t) => `linear-gradient(135deg, ${t.status.warning}20, ${t.status.warning}08)`,
  feature: () => `linear-gradient(135deg, #8b5cf620, #8b5cf608)`,
  pet: () => `linear-gradient(135deg, #FF980020, #FF980008)`,
  recommendation: (t) => `linear-gradient(135deg, ${t.primary}25, ${t.accent}10)`,
};

export const getNotificationIcon = (icon: string, theme: Theme): React.ReactNode => {
  const factory = ICON_MAP[icon];
  return factory ? (
    factory(theme)
  ) : (
    <Notifications style={{ fontSize: '18px', color: theme.text.muted }} />
  );
};

export const getNotificationIconBg = (icon: string, theme: Theme): string => {
  const factory = ICON_BG_MAP[icon];
  return factory
    ? factory(theme)
    : `linear-gradient(135deg, ${theme.primary}20, ${theme.primary}08)`;
};
