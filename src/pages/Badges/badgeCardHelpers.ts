import type { useTheme } from '../../contexts/ThemeContextDef';

type ThemeColors = ReturnType<typeof useTheme>['currentTheme'];

export const getRarityColor = (rarity: string, theme: ThemeColors): string => {
  switch (rarity) {
    case 'common':
      return theme.text.muted;
    case 'rare':
      return theme.primary;
    case 'epic':
      return theme.accent || theme.primary;
    case 'legendary':
      return theme.status.warning;
    default:
      return theme.text.muted;
  }
};
