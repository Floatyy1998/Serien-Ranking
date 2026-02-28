import { useCurrentTheme } from '../contexts/ThemeContext';

/**
 * Vereinfachter Hook für Theme-Zugriff in Komponenten
 * Ersetzt die alten statischen Theme-Imports
 */
export const useAppTheme = () => {
  const theme = useCurrentTheme();

  return {
    // Direkte Farb-Zugriffe für Backward-Kompatibilität
    colors: theme,

    // Häufig verwendete Farben als direkte Properties
    primary: theme.primary,
    primaryHover: theme.primaryHover,
    background: theme.background.default,
    surface: theme.background.surface,
    textPrimary: theme.text.primary,
    textSecondary: theme.text.secondary,
    textMuted: theme.text.muted,

    // Status-Farben
    error: theme.status.error,
    warning: theme.status.warning,
    success: theme.status.success,

    // Utility-Funktionen
    getTextColor: (backgroundColor: string) => {
      // Einfache Kontrast-Bestimmung basierend auf Helligkeit
      const hex = backgroundColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const brightness = (r * 299 + g * 587 + b * 114) / 1000;
      return brightness > 128 ? theme.text.black : theme.text.white;
    },

    // Gradient-Helper
    getGradient: (type: 'dark' | 'light' | 'complex' = 'dark') => {
      return theme.background.gradient[type];
    },

    // Button-Styles
    getButtonStyle: (variant: 'primary' | 'secondary' | 'error' = 'primary') => {
      return {
        background: theme.button[variant].gradient,
        '&:hover': {
          background: theme.button[variant].gradientHover,
        },
      };
    },
  };
};
