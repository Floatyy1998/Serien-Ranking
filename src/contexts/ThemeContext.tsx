import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { 
  generateDynamicTheme, 
  defaultThemeConfig, 
  UserThemeConfig, 
  validateThemeConfig,
  createMuiTheme
} from '../theme/dynamicTheme';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import { useAuth } from '../App';

// Theme-Context Interface
interface ThemeContextType {
  currentTheme: ReturnType<typeof generateDynamicTheme>;
  userConfig: UserThemeConfig;
  updateTheme: (config: Partial<UserThemeConfig>) => void;
  resetTheme: () => void;
  saveTheme: () => void;
  loadTheme: () => void;
  syncMode: 'local' | 'cloud';
  setSyncMode: (mode: 'local' | 'cloud') => void;
  getMobilePageBackground: () => string; // Neue Funktion für dynamische Transparenz
  getMobilePageStyle: () => React.CSSProperties; // Erweiterte Funktion für Glaseffekt
  getMobileHeaderStyle: (gradientColor?: string) => React.CSSProperties; // Header-Style mit Glaseffekt
}

// Theme-Context erstellen
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom Hook für Theme-Zugriff
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-Provider-Komponente
interface ThemeProviderProps {
  children: ReactNode;
}

export const DynamicThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user } = useAuth() || {};
  
  // Initialisiere Theme aus localStorage beim Start
  const getInitialConfig = (): UserThemeConfig => {
    try {
      const savedConfig = localStorage.getItem('customTheme');
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        return validateThemeConfig(parsed);
      }
    } catch (error) {
      console.error('Fehler beim Laden des initialen Themes:', error);
    }
    return defaultThemeConfig;
  };
  
  const initialConfig = getInitialConfig();
  const [userConfig, setUserConfig] = useState<UserThemeConfig>(initialConfig);
  const [currentTheme, setCurrentTheme] = useState(() => {
    const theme = generateDynamicTheme(initialConfig);
    // Setze CSS-Variablen sofort beim Start
    setTimeout(() => {
      const root = document.documentElement;
      // Primäre Farben
      root.style.setProperty('--color-primary', theme.primary);
      root.style.setProperty('--color-primary-hover', theme.primaryHover);
      root.style.setProperty('--color-primary-dark', theme.primaryDark);
      
      // Hintergrundfarben
      root.style.setProperty('--color-background-default', theme.background.default);
      root.style.setProperty('--color-background-surface', theme.background.surface);
      root.style.setProperty('--color-background-dialog', theme.background.dialog);
      root.style.setProperty('--color-background-elevated', theme.background.surface);
      
      // Textfarben
      root.style.setProperty('--color-text-primary', theme.text.primary);
      root.style.setProperty('--color-text-secondary', theme.text.secondary);
      root.style.setProperty('--color-text-muted', theme.text.muted);
      
      // Border-Farben
      root.style.setProperty('--color-border-default', theme.border.default);
      root.style.setProperty('--color-border-primary', theme.border.primary);
      
      // Status-Farben
      root.style.setProperty('--color-error', theme.status.error);
      root.style.setProperty('--color-warning', theme.status.warning);
      root.style.setProperty('--color-success', theme.status.success);
      
      // Hintergrundbild
      if (initialConfig.backgroundImage) {
        root.style.setProperty('--background-image', `url(${initialConfig.backgroundImage})`);
        root.style.setProperty('--background-image-opacity', String(initialConfig.backgroundImageOpacity || 0.3));
        root.style.setProperty('--background-image-blur', `${initialConfig.backgroundImageBlur || 0}px`);
      }
    }, 0);
    return theme;
  });
  
  const [syncMode, setSyncModeState] = useState<'local' | 'cloud'>(() => {
    // Lade Sync-Mode aus localStorage (default: local)
    const savedMode = localStorage.getItem('themeSyncMode');
    return (savedMode as 'local' | 'cloud') || 'local';
  });

  // Theme aus localStorage laden (mit Firebase als Fallback)
  useEffect(() => {
    loadTheme();
  }, [user]);

  // Theme aktualisieren
  const updateTheme = (newConfig: Partial<UserThemeConfig>) => {
    const validatedConfig = validateThemeConfig({ ...userConfig, ...newConfig });
    setUserConfig(validatedConfig);
    
    const newTheme = generateDynamicTheme(validatedConfig);
    setCurrentTheme(newTheme);
    
    // CSS-Variablen für dynamisches Styling setzen (mit Config übergeben)
    updateCSSVariables(newTheme, validatedConfig);
    
    // Auto-save with the new config directly
    saveThemeConfig(validatedConfig);
  };

  // Theme zurücksetzen
  const resetTheme = async () => {
    setUserConfig(defaultThemeConfig);
    const newTheme = generateDynamicTheme(defaultThemeConfig);
    setCurrentTheme(newTheme);
    updateCSSVariables(newTheme);
    localStorage.removeItem('customTheme'); // Gleicher Key wie Desktop!
    
    // Lösche auch aus Firebase
    if (user?.uid) {
      try {
        await firebase.database()
          .ref(`users/${user.uid}/theme`) // Gleicher Pfad wie Desktop!
          .remove();
      } catch (error) {
        console.error('Fehler beim Löschen des Themes aus Firebase:', error);
      }
    }
  };

  // Sync-Mode setzen und speichern
  const setSyncMode = (mode: 'local' | 'cloud') => {
    setSyncModeState(mode);
    localStorage.setItem('themeSyncMode', mode);
  };

  // Theme-Config direkt speichern (für updateTheme)
  const saveThemeConfig = async (config: UserThemeConfig) => {
    // Speichere IMMER lokal (wie im Desktop ThemeEditor)
    // WICHTIG: Verwende 'customTheme' als Key, genau wie Desktop!
    localStorage.setItem('customTheme', JSON.stringify(config));
    
    // Speichere in Firebase nur wenn Sync-Mode auf 'cloud' steht
    if (syncMode === 'cloud' && user?.uid) {
      try {
        await firebase.database()
          .ref(`users/${user.uid}/theme`) // Gleicher Pfad wie Desktop!
          .set(config);
      } catch (error) {
        console.error('Fehler beim Speichern des Themes in Firebase:', error);
      }
    }
  };

  // Theme speichern (verwendet aktuellen State)
  const saveTheme = async () => {
    await saveThemeConfig(userConfig);
  };

  // Theme laden (localStorage hat IMMER Priorität, dann Firebase als Fallback)
  const loadTheme = async () => {
    try {
      let loadedConfig = null;
      
      // WICHTIG: Lokales Theme hat Vorrang (wie im Desktop ThemeEditor)
      // Verwende 'customTheme' als Key, genau wie Desktop!
      const savedConfig = localStorage.getItem('customTheme');
      if (savedConfig) {
        try {
          loadedConfig = JSON.parse(savedConfig);
        } catch (error) {
          console.error('Fehler beim Parsen des lokalen Themes:', error);
        }
      }
      
      // Falls kein lokales Theme, Cloud-Theme als Fallback
      if (!loadedConfig && user?.uid) {
        const snapshot = await firebase.database()
          .ref(`users/${user.uid}/theme`) // Gleicher Pfad wie Desktop!
          .once('value');
        
        if (snapshot.exists()) {
          loadedConfig = snapshot.val();
          // WICHTIG: Speichere Cloud-Theme im localStorage für nächsten Load
          localStorage.setItem('customTheme', JSON.stringify(loadedConfig));
        }
      }
      
      // Wende das geladene Theme an
      if (loadedConfig) {
        const validatedConfig = validateThemeConfig(loadedConfig);
        setUserConfig(validatedConfig);
        
        const newTheme = generateDynamicTheme(validatedConfig);
        setCurrentTheme(newTheme);
        updateCSSVariables(newTheme);
      } else {
        // Ensure CSS variables are set even with default theme
        updateCSSVariables(currentTheme);
      }
    } catch (error) {
      console.error('Fehler beim Laden des Themes:', error);
      resetTheme();
    }
  };

  // CSS-Variablen für globale Verwendung setzen
  const updateCSSVariables = (theme: ReturnType<typeof generateDynamicTheme>, config?: UserThemeConfig) => {
    const root = document.documentElement;
    const configToUse = config || userConfig;
    
    // Primäre Farben
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-primary-dark', theme.primaryDark);
    
    // Hintergrundfarben
    root.style.setProperty('--color-background-default', theme.background.default);
    root.style.setProperty('--color-background-surface', theme.background.surface);
    root.style.setProperty('--color-background-dialog', theme.background.dialog);
    root.style.setProperty('--color-background-elevated', theme.background.surface);
    
    // Textfarben
    root.style.setProperty('--color-text-primary', theme.text.primary);
    root.style.setProperty('--color-text-secondary', theme.text.secondary);
    root.style.setProperty('--color-text-muted', theme.text.muted);
    
    // Border-Farben
    root.style.setProperty('--color-border-default', theme.border.default);
    root.style.setProperty('--color-border-primary', theme.border.primary);
    
    // Weitere wichtige Farben
    root.style.setProperty('--color-error', theme.status.error);
    root.style.setProperty('--color-warning', theme.status.warning);
    root.style.setProperty('--color-success', theme.status.success);
    
    // Hintergrundbild
    if (configToUse.backgroundImage) {
      root.style.setProperty('--background-image', `url(${configToUse.backgroundImage})`);
      root.style.setProperty('--background-image-opacity', String(configToUse.backgroundImageOpacity || 0.3));
      root.style.setProperty('--background-image-blur', `${configToUse.backgroundImageBlur || 0}px`);
      
      // Don't set glassy variables
    } else {
      root.style.removeProperty('--background-image');
      root.style.removeProperty('--background-image-opacity');
      root.style.removeProperty('--background-image-blur');
    }
  };

  // Funktion für dynamische Mobile-Hintergründe
  const getMobilePageBackground = (): string => {
    // Wenn ein Hintergrundbild vorhanden ist, verwende glasigen Effekt
    if (userConfig.backgroundImage) {
      // Glasiger Effekt mit semi-transparentem Hintergrund
      return `${currentTheme.background.default}B3`; // 70% Opazität für Glaseffekt
    }
    // Sonst verwende den normalen undurchsichtigen Hintergrund
    return currentTheme.background.default;
  };

  // Erweiterte Funktion für Glaseffekt-Styles
  const getMobilePageStyle = (): React.CSSProperties => {
    if (userConfig.backgroundImage) {
      return {
        minHeight: '100vh',
        background: `${currentTheme.background.default}B3`, // 70% Opazität
        color: currentTheme.text.primary,
        paddingBottom: '80px',
        backdropFilter: 'blur(10px)', // Glaseffekt
        WebkitBackdropFilter: 'blur(10px)', // Safari Support
      };
    }
    // Ohne Bild: normaler Hintergrund
    return {
      minHeight: '100vh',
      background: currentTheme.background.default,
      color: currentTheme.text.primary,
      paddingBottom: '80px',
    };
  };

  // Header-Style mit Glaseffekt
  const getMobileHeaderStyle = (gradientColor?: string): React.CSSProperties => {
    if (userConfig.backgroundImage) {
      // Mit Bild: komplett transparent, nur leichter Blur
      return {
        background: gradientColor && gradientColor !== 'transparent'
          ? `linear-gradient(180deg, ${gradientColor}1A 0%, transparent 100%)` // Only 10% opacity for subtle tint
          : 'transparent',
        backdropFilter: 'blur(5px)', // Lighter blur for headers
        WebkitBackdropFilter: 'blur(5px)',
      };
    }
    // Ohne Bild: normaler Gradient-Header
    return {
      background: gradientColor 
        ? `linear-gradient(180deg, ${gradientColor}33 0%, transparent 100%)`
        : `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
    };
  };

  // Material-UI Theme erstellen
  const muiTheme = createTheme(createMuiTheme(currentTheme));

  const contextValue: ThemeContextType = {
    currentTheme,
    userConfig,
    updateTheme,
    resetTheme,
    saveTheme,
    loadTheme,
    syncMode,
    setSyncMode,
    getMobilePageBackground,
    getMobilePageStyle,
    getMobileHeaderStyle,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

// Hook für direkten Theme-Zugriff in Komponenten
export const useCurrentTheme = () => {
  const { currentTheme } = useTheme();
  return currentTheme;
};