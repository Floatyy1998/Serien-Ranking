import { createTheme } from '@mui/material/styles';
import './global.css'; // Importieren Sie die CSS-Datei

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00fed7',
    },
    background: {
      default: '#000',
      paper: '#000',
    },
    text: {
      primary: '#00fed7',
      secondary: '#ffffff',
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
          backgroundColor: '#000',
          color: '#00fed7',
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
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: '#000',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0C0C0C',
          backgroundImage: 'none',
          maxWidth: '50%',
          boxShadow: '0 25px 50px -12px rgba(0, 254, 215, 0.15)',
          border: '1px solid rgba(0, 254, 215, 0.05)',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(0, 254, 215, 0.02)',
          border: '1px solid rgba(0, 254, 215, 0.08)',
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
          color: '#00fed7',
          padding: '0 24px',
          minHeight: '56px',
          transition: 'all 0.2s ease-in-out',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          borderBottomLeftRadius: '8px', // Hinzugefügt
          borderBottomRightRadius: '8px', // Hinzugefügt
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
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          borderTop: '1px solid rgba(0, 254, 215, 0.08)',
          padding: 0,
          borderBottomLeftRadius: '12px',
          borderBottomRightRadius: '12px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: '#090909',
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '8px !important',
          fontSize: '1rem',
          border: '1px solid #00fed7',
          backgroundColor: '#000',
          minWidth: '140px !important',
          minHeight: '40px !important',
        },
      },
    },
  },
});
