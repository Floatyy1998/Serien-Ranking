import { createContext, useContext } from 'react';
import type { UserThemeConfig } from '../theme/dynamicTheme';
import type { generateDynamicTheme } from '../theme/dynamicTheme';

// Theme-Context Interface
export interface ThemeContextType {
  currentTheme: ReturnType<typeof generateDynamicTheme>;
  userConfig: UserThemeConfig;
  updateTheme: (config: Partial<UserThemeConfig>) => void;
  resetTheme: () => void;
  saveTheme: () => void;
  loadTheme: () => void;
  syncMode: 'local' | 'cloud';
  setSyncMode: (mode: 'local' | 'cloud') => void;
  getMobilePageBackground: () => string;
  getMobilePageStyle: () => React.CSSProperties;
  getMobileHeaderStyle: (gradientColor?: string) => React.CSSProperties;
}

// Theme-Context erstellen
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom Hook für Theme-Zugriff
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook für direkten Theme-Zugriff in Komponenten
export const useCurrentTheme = () => {
  const { currentTheme } = useTheme();
  return currentTheme;
};
