import {
  generateColorPalette,
  createAccessibleTextColors,
  darkenColor,
  lightenColor,
  withOpacity,
  generateHoverColor,
} from './colorUtils';

// Interface für Benutzer-Theme-Konfiguration
export interface UserThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor?: string;
  accentColor?: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  backgroundImageBlur?: number;
  backgroundIsVideo?: boolean;
}

// Generiert ein vollständiges Theme basierend auf Benutzer-Eingaben
export function generateDynamicTheme(config: UserThemeConfig) {
  const { primaryColor, backgroundColor, surfaceColor, accentColor } = config;

  // Automatische Palette-Generierung
  const primaryPalette = generateColorPalette(primaryColor);
  const backgroundTextColors = createAccessibleTextColors(backgroundColor);

  // Automatische Surface-Farbe falls nicht angegeben
  const autoSurfaceColor = surfaceColor || lightenColor(backgroundColor, 0.1);
  const surfaceTextColors = createAccessibleTextColors(autoSurfaceColor);

  // Accent-Farbe als Fallback auf aufgehellte Primärfarbe
  const finalAccentColor = accentColor || lightenColor(primaryColor, 0.2);

  return {
    // Primäre Farben
    primary: primaryColor,
    primaryHover: primaryPalette.primaryHover,
    primaryDark: primaryPalette.primaryDark,
    primaryLight: primaryPalette.primaryLight,

    // Accent-Farbe
    accent: finalAccentColor,
    accentHover: generateHoverColor(finalAccentColor),

    // Hintergrundfarben
    background: {
      default: backgroundColor,
      paper: backgroundColor,
      dialog: darkenColor(backgroundColor, 0.05),
      card: backgroundColor,
      input: darkenColor(backgroundColor, 0.1),
      loading: darkenColor(backgroundColor, 0.02),
      surface: autoSurfaceColor,
      surfaceHover: generateHoverColor(autoSurfaceColor),
      gradient: {
        dark: backgroundColor,
        light: lightenColor(backgroundColor, 0.05),
        complex: autoSurfaceColor, // Einfach die Surface-Farbe ohne Gradients
      },
    },

    // Automatische Textfarben basierend auf Kontrast
    text: {
      primary: primaryColor,
      secondary: backgroundTextColors.secondary,
      muted: backgroundTextColors.muted,
      onPrimary: primaryPalette.textOnPrimary,
      onSurface: surfaceTextColors.primary,
      white: '#ffffff',
      black: '#000000',
    },

    // Statusfarben - bleiben konsistent aber mit Theme-Anpassung
    status: {
      error: '#ff4444',
      errorHover: '#cc3333',
      warning: '#FFC107', // Gelb für Warnungen
      warningDark: '#ffd700', // Dunkleres Gelb
      success: '#4caf50',
      successLight: '#42d10f', // Helles Grün
      purple: '#b103fc', // Lila für besondere Hervorhebungen
      info: {
        main: primaryColor,
        gradient: `linear-gradient(135deg, ${withOpacity(primaryColor, 0.1)} 0%, ${withOpacity(primaryColor, 0.05)} 100%)`,
      },
    },

    // Border und Linien mit Theme-Farben
    border: {
      default: withOpacity(backgroundTextColors.muted, 0.3),
      primary: primaryColor,
      light: withOpacity(primaryColor, 0.08),
      lighter: withOpacity(primaryColor, 0.05),
    },

    // Transparente Overlays mit Theme-Farben
    overlay: {
      light: withOpacity(primaryColor, 0.02),
      medium: withOpacity(primaryColor, 0.08),
      dark: withOpacity(backgroundColor, 0.8),
      white: withOpacity('#ffffff', 0.2),
      black: withOpacity('#000000', 0.2),
    },

    // Schatten mit Theme-Anpassung
    shadow: {
      card: `0 25px 50px -12px ${withOpacity(primaryColor, 0.15)}`,
      dialog: `0 25px 50px -12px ${withOpacity(primaryColor, 0.15)}`,
    },

    // Button-Farben einfach gehalten
    button: {
      primary: {
        gradient: primaryColor,
        gradientHover: primaryPalette.primaryHover,
      },
      secondary: {
        gradient: withOpacity(backgroundTextColors.secondary, 0.1),
        gradientHover: withOpacity(backgroundTextColors.secondary, 0.15),
      },
      error: {
        gradient: withOpacity('#ff4444', 0.1),
        gradientHover: withOpacity('#ff4444', 0.15),
      },
    },
  };
}

// Standard-Theme als Fallback
export const defaultThemeConfig: UserThemeConfig = {
  primaryColor: '#00fed7',
  backgroundColor: '#000000',
  surfaceColor: '#2d2d30',
  accentColor: '#00e6c3',
  backgroundImage: undefined,
  backgroundImageOpacity: 0.5,
  backgroundImageBlur: 0,
  backgroundIsVideo: false,
};

// Generiert das Standard-Theme
export const defaultDynamicTheme = generateDynamicTheme(defaultThemeConfig);

// Theme-Validierung
export function validateThemeConfig(config: Partial<UserThemeConfig>): UserThemeConfig {
  return {
    primaryColor: config.primaryColor || defaultThemeConfig.primaryColor,
    backgroundColor: config.backgroundColor || defaultThemeConfig.backgroundColor,
    surfaceColor: config.surfaceColor || defaultThemeConfig.surfaceColor,
    accentColor: config.accentColor || defaultThemeConfig.accentColor,
    backgroundImage: config.backgroundImage || defaultThemeConfig.backgroundImage,
    backgroundImageOpacity:
      config.backgroundImageOpacity ?? defaultThemeConfig.backgroundImageOpacity,
    backgroundImageBlur: config.backgroundImageBlur ?? defaultThemeConfig.backgroundImageBlur,
    backgroundIsVideo: config.backgroundIsVideo ?? defaultThemeConfig.backgroundIsVideo,
  };
}

// Exportiert Theme für Material-UI
export function createMuiTheme(dynamicTheme: ReturnType<typeof generateDynamicTheme>) {
  return {
    palette: {
      mode: 'dark' as const,
      primary: {
        main: dynamicTheme.primary,
      },
      background: {
        default: dynamicTheme.background.default,
        paper: dynamicTheme.background.paper,
      },
      text: {
        primary: dynamicTheme.text.primary,
        secondary: dynamicTheme.text.secondary,
      },
    },
    // ... weitere MUI-Theme-Konfiguration
  };
}
