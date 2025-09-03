import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import { 
  generateDynamicTheme, 
  defaultThemeConfig, 
  UserThemeConfig, 
  validateThemeConfig,
  createMuiTheme
} from '../theme/dynamicTheme';

// Theme-Context Interface
interface ThemeContextType {
  currentTheme: ReturnType<typeof generateDynamicTheme>;
  userConfig: UserThemeConfig;
  updateTheme: (config: Partial<UserThemeConfig>) => void;
  resetTheme: () => void;
  saveTheme: () => void;
  loadTheme: () => void;
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
  const [userConfig, setUserConfig] = useState<UserThemeConfig>(defaultThemeConfig);
  const [currentTheme, setCurrentTheme] = useState(() => generateDynamicTheme(defaultThemeConfig));

  // Theme aus localStorage laden
  useEffect(() => {
    loadTheme();
  }, []);

  // Theme aktualisieren
  const updateTheme = (newConfig: Partial<UserThemeConfig>) => {
    const validatedConfig = validateThemeConfig({ ...userConfig, ...newConfig });
    setUserConfig(validatedConfig);
    
    const newTheme = generateDynamicTheme(validatedConfig);
    setCurrentTheme(newTheme);
    
    // CSS-Variablen für dynamisches Styling setzen
    updateCSSVariables(newTheme);
    
    // Auto-save after update
    setTimeout(() => {
      saveTheme();
    }, 50);
  };

  // Theme zurücksetzen
  const resetTheme = () => {
    setUserConfig(defaultThemeConfig);
    const newTheme = generateDynamicTheme(defaultThemeConfig);
    setCurrentTheme(newTheme);
    updateCSSVariables(newTheme);
    localStorage.removeItem('userThemeConfig');
  };

  // Theme speichern
  const saveTheme = () => {
    localStorage.setItem('userThemeConfig', JSON.stringify(userConfig));
  };

  // Theme laden
  const loadTheme = () => {
    try {
      const savedConfig = localStorage.getItem('userThemeConfig');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        const validatedConfig = validateThemeConfig(parsedConfig);
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
  const updateCSSVariables = (theme: ReturnType<typeof generateDynamicTheme>) => {
    const root = document.documentElement;
    
    // Primäre Farben
    root.style.setProperty('--color-primary', theme.primary);
    root.style.setProperty('--color-primary-hover', theme.primaryHover);
    root.style.setProperty('--color-primary-dark', theme.primaryDark);
    
    // Hintergrundfarben
    root.style.setProperty('--color-background-default', theme.background.default);
    root.style.setProperty('--color-background-surface', theme.background.surface);
    root.style.setProperty('--color-background-dialog', theme.background.dialog);
    
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
    if (userConfig.backgroundImage) {
      root.style.setProperty('--background-image', `url(${userConfig.backgroundImage})`);
      root.style.setProperty('--background-image-opacity', String(userConfig.backgroundImageOpacity || 0.3));
      root.style.setProperty('--background-image-blur', `${userConfig.backgroundImageBlur || 0}px`);
    } else {
      root.style.removeProperty('--background-image');
      root.style.removeProperty('--background-image-opacity');
      root.style.removeProperty('--background-image-blur');
    }
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