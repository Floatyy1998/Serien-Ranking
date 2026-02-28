import { createTheme } from '@mui/material/styles';
import './global.css';
import { colors } from './theme/colors';

// Export theme als named export aus dem Theme-Verzeichnis
export { colors } from './theme/colors';
export { commonStyles, styleHelpers } from './theme/styles';

// Funktion zum Erstellen eines dynamischen Themes basierend auf gespeicherten Farben
const createDynamicTheme = () => {
  // CSS-Variablen direkt lesen für Material-UI Theme
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);

  // Fallback-Werte falls CSS-Variablen noch nicht gesetzt sind
  const primaryColor = computedStyle.getPropertyValue('--theme-primary').trim() || '#00fed7';
  const backgroundColor = computedStyle.getPropertyValue('--theme-background').trim() || '#000000';
  const textSecondary =
    computedStyle.getPropertyValue('--theme-text-secondary').trim() || '#ffffff';

  return createTheme({
    palette: {
      mode: 'dark',
      primary: {
        main: primaryColor,
      },
      secondary: {
        main: primaryColor,
      },
      background: {
        default: backgroundColor,
        paper: backgroundColor,
      },
      text: {
        primary: textSecondary,
        secondary: textSecondary,
      },
    },
    typography: {
      h1: {
        fontSize: '2rem ',
      },
      h2: {
        fontSize: '1.75rem',
      },
      h3: {
        fontSize: '1.5rem',
        marginBottom: '1rem',
      },
      h4: {
        fontSize: '1.25rem',
      },
      h5: {
        fontSize: '1rem',
      },
      h6: {
        fontSize: '0.875rem',
      },
    },
    shape: {
      borderRadius: 8,
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
            boxShadow: `0 25px 50px -12px rgba(0, 254, 215, 0.15)`,
            border: `1px solid ${colors.border.lighter}`,
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
            backgroundColor: colors.overlay.light,
            border: `1px solid ${colors.border.light}`,
            borderRadius: '12px ',
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
            backgroundColor: colors.overlay.black,
            borderTop: `1px solid ${colors.border.light}`,
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
                borderColor: colors.border.default,
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
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: '8px !important',
            fontSize: '1rem',
            border: `1px solid ${primaryColor}`,
            backgroundColor: backgroundColor,
            minWidth: '140px !important',
            minHeight: '40px !important',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            textAlign: 'center',
            position: 'relative',
            fontSize: '1.5rem',
            paddingLeft: '48px',
            paddingRight: '48px',
            '& .closeButton': {
              position: 'absolute',
              right: 8,
              top: 8,
              color: 'red',
            },
          },
        },
      },
    },
  });
};

// Theme beim ersten Laden erstellen
export let theme = createDynamicTheme();

// Funktion zum Aktualisieren des Themes
export const updateTheme = () => {
  theme = createDynamicTheme();
  return theme;
};
