import {
  generateColorPalette,
  createAccessibleTextColors,
  darkenColor,
  lightenColor,
  withOpacity,
  generateHoverColor,
  generateComplementaryColor,
  normalizeThemeColors,
} from './colorUtils';

// Interface für Benutzer-Theme-Konfiguration
export interface UserThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  surfaceColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundImage?: string;
  backgroundImageOpacity?: number;
  backgroundImageBlur?: number;
  backgroundIsVideo?: boolean;
}

// Generiert ein vollständiges Theme basierend auf Benutzer-Eingaben
const VALID_HEX = /^#?[0-9a-fA-F]{6}$/;
function safeHex(color: string | undefined, fallback: string): string {
  return color && VALID_HEX.test(color) ? color : fallback;
}

export function generateDynamicTheme(config: UserThemeConfig) {
  // Sanitize: ungültige/leere Farbwerte durch Defaults ersetzen
  const safeConfig: UserThemeConfig = {
    ...config,
    primaryColor: safeHex(config.primaryColor, '#00fed7'),
    backgroundColor: safeHex(config.backgroundColor, '#06090f'),
    surfaceColor: config.surfaceColor ? safeHex(config.surfaceColor, '#0e1420') : undefined,
    accentColor: config.accentColor ? safeHex(config.accentColor, '#ff6b6b') : undefined,
    textColor: config.textColor ? safeHex(config.textColor, '#ffffff') : undefined,
  };

  // Smarte Normalisierung: korrigiert schlechte Farbkombinationen für die Darstellung.
  // Die originalen gespeicherten Werte in localStorage/Firebase bleiben unverändert.
  const normalized = normalizeThemeColors(safeConfig);
  const { primaryColor, backgroundColor, surfaceColor, accentColor, textColor } = normalized;

  // Automatische Palette-Generierung
  const primaryPalette = generateColorPalette(primaryColor);
  const backgroundTextColors = createAccessibleTextColors(backgroundColor);

  // Automatische Surface-Farbe falls nicht angegeben
  const autoSurfaceColor = surfaceColor || lightenColor(backgroundColor, 0.1);

  // Accent-Farbe als Fallback auf aufgehellte Primärfarbe
  const finalAccentColor = accentColor || lightenColor(primaryColor, 0.2);

  // Komplementärfarbe für Gradients (immer berechnet, nie gespeichert)
  const secondaryColor = generateComplementaryColor(primaryColor);

  return {
    // Primäre Farben
    primary: primaryColor,
    primaryHover: primaryPalette.primaryHover,
    primaryDark: primaryPalette.primaryDark,
    primaryLight: primaryPalette.primaryLight,

    // Accent-Farbe
    accent: finalAccentColor,
    accentHover: generateHoverColor(finalAccentColor),

    // Komplementärfarbe für Gradients (theme-responsiv)
    secondary: secondaryColor,

    // Hintergrundfarben
    background: {
      default: backgroundColor,
      paper: backgroundColor,
      dialog: darkenColor(backgroundColor, 0.05),
      card: backgroundColor,
      input: darkenColor(backgroundColor, 0.1),
      loading: darkenColor(backgroundColor, 0.02),
      surface: autoSurfaceColor,
      surfaceElevated: lightenColor(autoSurfaceColor, 0.05),
      surfaceHover: generateHoverColor(autoSurfaceColor),
      gradient: {
        dark: backgroundColor,
        light: lightenColor(backgroundColor, 0.05),
        complex: autoSurfaceColor,
      },
    },

    /**
     * Semantische Textfarben:
     * - primary: Accent/highlight color (the theme's primary color)
     * - secondary: Main readable body text color
     * - muted: Dimmed/secondary text color
     * - accent: Secondary accent for special highlights
     */
    text: {
      primary: primaryColor,
      secondary: textColor || backgroundTextColors.secondary,
      muted: textColor ? withOpacity(textColor, 0.6) : backgroundTextColors.muted,
      accent: finalAccentColor,
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

    // Schatten (weich, mehrstufig)
    shadow: {
      card: '0 4px 16px -4px rgba(0, 0, 0, 0.4), 0 2px 6px -2px rgba(0, 0, 0, 0.3)',
      dialog: '0 16px 48px -12px rgba(0, 0, 0, 0.6), 0 8px 24px -8px rgba(0, 0, 0, 0.4)',
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

// Standard-Theme als Fallback (Cinematic Dark)
export const defaultThemeConfig: UserThemeConfig = {
  primaryColor: '#00fed7',
  backgroundColor: '#06090f',
  surfaceColor: '#0e1420',
  accentColor: '#00e6c3',
  backgroundImage: undefined,
  backgroundImageOpacity: 0.5,
  backgroundImageBlur: 0,
  backgroundIsVideo: false,
};

/** The shape returned by generateDynamicTheme */
export type DynamicTheme = ReturnType<typeof generateDynamicTheme>;

// Generiert das Standard-Theme
export const defaultDynamicTheme = generateDynamicTheme(defaultThemeConfig);

// Theme-Validierung
export function validateThemeConfig(config: Partial<UserThemeConfig>): UserThemeConfig {
  return {
    primaryColor: safeHex(config.primaryColor, defaultThemeConfig.primaryColor),
    backgroundColor: safeHex(config.backgroundColor, defaultThemeConfig.backgroundColor),
    surfaceColor: safeHex(config.surfaceColor, defaultThemeConfig.surfaceColor || '#0e1420'),
    accentColor: safeHex(config.accentColor, defaultThemeConfig.accentColor || '#ff6b6b'),
    textColor: config.textColor ? safeHex(config.textColor, '#ffffff') : undefined,
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
    typography: {
      fontFamily: "'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    },
    shape: {
      borderRadius: 12,
    },
  };
}
