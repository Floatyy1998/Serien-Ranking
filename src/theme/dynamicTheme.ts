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
    primaryColor: safeHex(config.primaryColor, '#00d123'),
    backgroundColor: safeHex(config.backgroundColor, '#000000'),
    surfaceColor: config.surfaceColor ? safeHex(config.surfaceColor, '#0f0f0f') : undefined,
    accentColor: config.accentColor ? safeHex(config.accentColor, '#008a6e') : undefined,
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
     * - primary: ACHTUNG — Akzent-/Highlight-Farbe (= Theme-Primary), KEIN
     *            Lesetext. Für Fließtext `body`/`secondary` verwenden.
     * - body:    Klar benannter Alias für lesbaren Fließtext (= `secondary`).
     * - secondary: Haupt-Lesetext-Farbe (identisch zu `body`).
     * - muted: Gedimmte Sekundär-/Tertiärtext-Farbe.
     * - accent: Sekundär-Akzent für besondere Hervorhebungen.
     */
    text: {
      primary: primaryColor,
      body: textColor || backgroundTextColors.secondary,
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

// Standard-Theme als Fallback.
// ABSICHTLICH Grün auf Schwarz (Owner-Entscheidung) — NICHT an die Cyan/Navy-
// Fallbacks aus global.css/:root "angleichen"; die gelten nur als CSS-Fallback.
export const defaultThemeConfig: UserThemeConfig = {
  primaryColor: '#00d123',
  backgroundColor: '#000000',
  surfaceColor: '#000000',
  accentColor: '#008a6e',
  textColor: '#e0e0e0',
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
    surfaceColor: safeHex(config.surfaceColor, defaultThemeConfig.surfaceColor || '#0f0f0f'),
    accentColor: safeHex(config.accentColor, defaultThemeConfig.accentColor || '#008a6e'),
    textColor: config.textColor ? safeHex(config.textColor, '#ffffff') : undefined,
    backgroundImage: config.backgroundImage || defaultThemeConfig.backgroundImage,
    backgroundImageOpacity:
      config.backgroundImageOpacity ?? defaultThemeConfig.backgroundImageOpacity,
    backgroundImageBlur: config.backgroundImageBlur ?? defaultThemeConfig.backgroundImageBlur,
    backgroundIsVideo: config.backgroundIsVideo ?? defaultThemeConfig.backgroundIsVideo,
  };
}

// Exportiert Theme für Material-UI
//
// WICHTIG: Dies ist die EINZIGE Quelle für das MUI-Objekt-Theme (via
// ThemeContext: `createTheme(createMuiTheme(currentTheme))`). Die
// `components`-Overrides (Chip/Dialog/Accordion/Tab/TextField/Tooltip/…)
// wurden aus dem alten `theme/themeConfig.ts` hierher gezogen: früher
// umschloss ein zweites `<ThemeProvider theme={themeConfig}>` in App.tsx
// diesen Provider und wurde von MUI komplett ersetzt → die Overrides waren
// zur Laufzeit tot. Jetzt sind sie theme-responsiv (nutzen `dynamicTheme.*`).
export function createMuiTheme(dynamicTheme: ReturnType<typeof generateDynamicTheme>) {
  const primaryColor = dynamicTheme.primary;
  const backgroundColor = dynamicTheme.background.default;
  const border = dynamicTheme.border;
  const overlay = dynamicTheme.overlay;

  return {
    palette: {
      mode: 'dark' as const,
      primary: {
        main: dynamicTheme.primary,
      },
      secondary: {
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
    components: {
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: backgroundColor,
            color: primaryColor,
            fontSize: '1rem',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none !important',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
          },
          containedPrimary: {
            backgroundColor: primaryColor,
            color: backgroundColor,
            fontWeight: 600,
            '&:hover': {
              backgroundColor: primaryColor,
            },
          },
          outlinedPrimary: {
            borderColor: primaryColor,
            color: primaryColor,
            '&:hover': {
              borderColor: primaryColor,
              backgroundColor: 'transparent',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: backgroundColor,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: backgroundColor,
            backgroundImage: 'none',
            maxWidth: '50%',
            boxShadow: `0 25px 50px -12px ${withOpacity(primaryColor, 0.15)}`,
            border: `1px solid ${border.lighter}`,
            '@media (max-width: 600px)': {
              maxWidth: '100%',
            },
            '@media (max-width: 2000px) and (min-width: 601px)': {
              maxWidth: '75%',
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: overlay.light,
            border: `1px solid ${border.light}`,
            borderRadius: '12px',
            '&:before': {
              display: 'none',
            },
            '&.Mui-expanded': {
              margin: '8px 0',
            },
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            color: primaryColor,
            padding: '0 24px',
            minHeight: '56px',
            transition: 'all 0.2s ease-in-out',
            borderTopLeftRadius: '8px',
            borderTopRightRadius: '8px',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            '&.Mui-expanded': {
              borderBottomLeftRadius: '0px',
              borderBottomRightRadius: '0px',
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            backgroundColor: overlay.black,
            borderTop: `1px solid ${border.light}`,
            padding: 0,
            borderBottomLeftRadius: '12px',
            borderBottomRightRadius: '12px',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          indicator: {
            backgroundColor: primaryColor,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            '&.Mui-selected': {
              color: primaryColor,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: backgroundColor,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: border.default,
              },
              '&:hover fieldset': {
                borderColor: primaryColor,
              },
              '&.Mui-focused fieldset': {
                borderColor: primaryColor,
              },
            },
            '& .MuiInputLabel-root': {
              '&.Mui-focused': {
                color: primaryColor,
              },
            },
          },
        },
      },
      // MuiChip bewusst NICHT ueberschrieben: dieses Override war frueher tot
      // (das App.tsx-Doppel-ThemeProvider ersetzte es), der reale Baseline-Look
      // sind die kompakten MUI-Default-Chips (z.B. die Home-Quick-Stats-Pills).
      // Ein minWidth:140px/minHeight:40px-Override wuerde sie unerwuenscht
      // vergroessern, daher hier ausgelassen.
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            textAlign: 'center' as const,
            position: 'relative' as const,
            fontSize: '1.5rem',
            paddingLeft: '48px',
            paddingRight: '48px',
            '& .closeButton': {
              position: 'absolute' as const,
              right: 8,
              top: 8,
              color: 'red',
            },
          },
        },
      },
    },
  };
}
