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
    fontFamily: 'Belanosima, Arial, sans-serif',
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
          backgroundColor: '#000',
          textAlign: 'center',
          width: '80% !important',
          maxWidth: '1400px',
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          textAlign: 'center',
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          textAlign: 'center',
        },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: {
          justifyContent: 'space-around',
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
