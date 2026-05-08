import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import firebase from 'firebase/compat/app';
import 'firebase/compat/database';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../AuthContext';
import type { UserThemeConfig } from '../theme/dynamicTheme';
import {
  createMuiTheme,
  defaultThemeConfig,
  generateDynamicTheme,
  validateThemeConfig,
} from '../theme/dynamicTheme';
import { ThemeContext } from './ThemeContextDef';
import type { ThemeContextType } from './ThemeContextDef';

// Zentrale Funktion zum Setzen aller CSS-Variablen
function applyCSSVariables(
  theme: ReturnType<typeof generateDynamicTheme>,
  config: UserThemeConfig,
  isMobileDevice: boolean
) {
  const root = document.documentElement;

  // Primäre Farben
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', theme.primaryHover);
  root.style.setProperty('--color-primary-dark', theme.primaryDark);
  root.style.setProperty('--color-primary-06', `${theme.primary}0f`);
  root.style.setProperty('--color-primary-10', `${theme.primary}1a`);
  root.style.setProperty('--color-primary-15', `${theme.primary}26`);

  // Theme-Variablen (für CSS-Nutzung)
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-hover', theme.primaryHover);
  root.style.setProperty('--theme-background', theme.background.default);
  root.style.setProperty('--theme-surface', theme.background.surface);
  root.style.setProperty('--theme-surface-elevated', theme.background.surfaceElevated);
  root.style.setProperty('--theme-secondary-gradient', theme.secondary);

  // Hintergrundfarben
  root.style.setProperty('--color-background-default', theme.background.default);
  root.style.setProperty('--color-background-surface', theme.background.surface);
  root.style.setProperty('--color-background-dialog', theme.background.dialog);
  root.style.setProperty('--color-background-elevated', theme.background.surfaceElevated);

  // Textfarben
  root.style.setProperty('--color-text-primary', theme.text.primary);
  root.style.setProperty('--color-text-secondary', theme.text.secondary);
  root.style.setProperty('--color-text-muted', theme.text.muted);
  root.style.setProperty('--color-text-accent', theme.text.accent);

  // Accent-Farbe
  root.style.setProperty('--theme-accent', theme.accent);

  // Border-Farben
  root.style.setProperty('--color-border-default', theme.border.default);
  root.style.setProperty('--color-border-primary', theme.border.primary);

  // Status-Farben
  root.style.setProperty('--color-error', theme.status.error);
  root.style.setProperty('--color-warning', theme.status.warning);
  root.style.setProperty('--color-success', theme.status.success);

  // Dynamische Glow-Variablen (theme-responsiv)
  root.style.setProperty('--glow-accent', `0 0 20px ${theme.accent}66, 0 0 40px ${theme.accent}33`);

  // Hintergrundbild - skip on mobile devices
  if (config.backgroundImage && !isMobileDevice) {
    root.style.setProperty('--background-image', `url(${config.backgroundImage})`);
    root.style.setProperty(
      '--background-image-opacity',
      String(config.backgroundImageOpacity || 0.3)
    );
    root.style.setProperty('--background-image-blur', `${config.backgroundImageBlur || 0}px`);
  } else {
    root.style.removeProperty('--background-image');
    root.style.removeProperty('--background-image-opacity');
    root.style.removeProperty('--background-image-blur');
  }
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768;
}

// Theme-Provider-Komponente
interface ThemeProviderProps {
  children: ReactNode;
}

export const DynamicThemeProvider = ({ children }: ThemeProviderProps) => {
  const { user } = useAuth() || {};

  // Initialisiere Theme aus localStorage beim Start — mit Auto-Recovery bei kaputten Werten
  const getInitialConfig = (): UserThemeConfig => {
    let savedConfig: string | null;
    try {
      savedConfig = localStorage.getItem('customTheme');
    } catch {
      // localStorage komplett unzugaenglich (Privacy-Mode etc.) — Default
      return defaultThemeConfig;
    }
    if (!savedConfig) return defaultThemeConfig;
    let parsed: unknown;
    try {
      parsed = JSON.parse(savedConfig);
    } catch {
      // Wirklich korrupte JSON-Daten — vorsichtig wegraeumen
      try {
        localStorage.removeItem('customTheme');
      } catch {
        // ignore
      }
      return defaultThemeConfig;
    }
    const validated = validateThemeConfig(parsed as Partial<UserThemeConfig>);
    // Repariertes Theme zurueckschreiben falls es korrigiert wurde — best-effort.
    // WICHTIG: setItem darf hier NIEMALS das Theme loeschen, falls quota voll
    // ist (siehe iOS-Safari-Quota-Problem). Der eingelesene Wert bleibt gueltig.
    try {
      const repaired = JSON.stringify(validated);
      if (repaired !== savedConfig) {
        localStorage.setItem('customTheme', repaired);
      }
    } catch {
      // ignore — Quota voll oder Storage disabled, in-memory Theme reicht
    }
    return validated;
  };

  const initialConfig = getInitialConfig();
  const [userConfig, setUserConfig] = useState<UserThemeConfig>(initialConfig);
  const [currentTheme, setCurrentTheme] = useState(() => {
    try {
      const theme = generateDynamicTheme(initialConfig);
      setTimeout(() => applyCSSVariables(theme, initialConfig, isMobile()), 0);
      return theme;
    } catch {
      // Fallback auf Default-Theme wenn die Theme-Generation selbst scheitert.
      // localStorage-Eintrag NICHT loeschen — der ist ja noch gueltig und nur
      // ein temporaerer Generierungsfehler darf die Theme-Praeferenz nicht
      // zerstoeren.
      const fallback = generateDynamicTheme(defaultThemeConfig);
      setTimeout(() => applyCSSVariables(fallback, defaultThemeConfig, isMobile()), 0);
      return fallback;
    }
  });

  const [syncMode, setSyncModeState] = useState<'local' | 'cloud'>(() => {
    // Lade Sync-Mode aus localStorage (default: local)
    const savedMode = localStorage.getItem('themeSyncMode');
    return (savedMode as 'local' | 'cloud') || 'local';
  });

  // CSS-Variablen für globale Verwendung setzen
  const updateCSSVariables = useCallback(
    (theme: ReturnType<typeof generateDynamicTheme>, config?: UserThemeConfig) => {
      applyCSSVariables(theme, config || userConfig, isMobile());
    },
    [userConfig]
  );

  // Theme-Config direkt speichern (für updateTheme)
  const saveThemeConfig = useCallback(
    async (config: UserThemeConfig) => {
      // Speichere IMMER lokal (wie im Desktop ThemeEditor)
      // WICHTIG: Verwende 'customTheme' als Key, genau wie Desktop!
      // setItem in try/catch — auf iOS Safari kann das Quota voll sein, dann
      // soll es nicht den Save-Flow oder andere Theme-Logik unterbrechen.
      try {
        localStorage.setItem('customTheme', JSON.stringify(config));
      } catch {
        // ignore — Theme bleibt im React-State, Cloud-Save unten greift evtl.
      }

      // Speichere in Firebase nur wenn Sync-Mode auf 'cloud' steht
      if (syncMode === 'cloud' && user?.uid) {
        try {
          await firebase
            .database()
            .ref(`users/${user.uid}/theme`) // Gleicher Pfad wie Desktop!
            .set(config);
        } catch {
          // console.error('Fehler beim Speichern des Themes in Firebase:', error);
        }
      }
    },
    [syncMode, user?.uid]
  );

  // Theme zurücksetzen
  const resetTheme = useCallback(async () => {
    setUserConfig(defaultThemeConfig);
    const newTheme = generateDynamicTheme(defaultThemeConfig);
    setCurrentTheme(newTheme);
    updateCSSVariables(newTheme);
    localStorage.removeItem('customTheme'); // Gleicher Key wie Desktop!

    // Lösche auch aus Firebase
    if (user?.uid) {
      try {
        await firebase
          .database()
          .ref(`users/${user.uid}/theme`) // Gleicher Pfad wie Desktop!
          .remove();
      } catch {
        // console.error('Fehler beim Löschen des Themes aus Firebase:', error);
      }
    }
  }, [user?.uid, updateCSSVariables]);

  // Theme laden (localStorage hat IMMER Priorität, dann Firebase als Fallback)
  const loadTheme = useCallback(async () => {
    let loadedConfig: unknown = null;

    // WICHTIG: Lokales Theme hat Vorrang (wie im Desktop ThemeEditor)
    // Verwende 'customTheme' als Key, genau wie Desktop!
    let savedConfig: string | null = null;
    try {
      savedConfig = localStorage.getItem('customTheme');
    } catch {
      // localStorage unzugaenglich — wir versuchen Cloud-Fallback unten
    }
    if (savedConfig) {
      try {
        loadedConfig = JSON.parse(savedConfig);
      } catch {
        // Korrupt — wird unten ueber Cloud-Fallback ersetzt
      }
    }

    // Falls kein lokales Theme, Cloud-Theme als Fallback
    if (!loadedConfig && user?.uid) {
      try {
        const snapshot = await firebase
          .database()
          .ref(`users/${user.uid}/theme`) // Gleicher Pfad wie Desktop!
          .once('value');

        if (snapshot.exists()) {
          loadedConfig = snapshot.val();
          // Cloud-Theme im localStorage spiegeln — best-effort. Quota-Fehler
          // hier darf NICHT das Cloud-Theme zerstoeren (frueher loeschte der
          // generische Catch resetTheme das auch aus Firebase!).
          try {
            localStorage.setItem('customTheme', JSON.stringify(loadedConfig));
          } catch {
            // ignore — in-memory + Cloud reichen
          }
        }
      } catch {
        // Firebase-Read fehlgeschlagen — Default-Theme wird unten gesetzt
      }
    }

    // Wende das geladene Theme an
    if (loadedConfig) {
      const validatedConfig = validateThemeConfig(loadedConfig);
      setUserConfig(validatedConfig);

      const newTheme = generateDynamicTheme(validatedConfig);
      setCurrentTheme(newTheme);
      updateCSSVariables(newTheme, validatedConfig);
    } else {
      // Ensure CSS variables are set even with default theme
      updateCSSVariables(currentTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, updateCSSVariables]);

  // Theme aus localStorage laden (mit Firebase als Fallback)
  useEffect(() => {
    loadTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Theme aktualisieren
  const updateTheme = useCallback(
    (newConfig: Partial<UserThemeConfig>) => {
      const validatedConfig = validateThemeConfig({ ...userConfig, ...newConfig });
      setUserConfig(validatedConfig);

      const newTheme = generateDynamicTheme(validatedConfig);
      setCurrentTheme(newTheme);

      // CSS-Variablen für dynamisches Styling setzen (mit Config übergeben)
      updateCSSVariables(newTheme, validatedConfig);

      // Auto-save with the new config directly
      saveThemeConfig(validatedConfig);
    },
    [userConfig, updateCSSVariables, saveThemeConfig]
  );

  // Theme speichern (verwendet aktuellen State)
  const saveTheme = useCallback(async () => {
    await saveThemeConfig(userConfig);
  }, [saveThemeConfig, userConfig]);

  // Sync-Mode setzen und speichern
  const setSyncMode = useCallback((mode: 'local' | 'cloud') => {
    setSyncModeState(mode);
    try {
      localStorage.setItem('themeSyncMode', mode);
    } catch {
      // ignore — Mode bleibt im React-State, Persistenz best-effort
    }
  }, []);

  // Funktion für dynamische Mobile-Hintergründe
  const getMobilePageBackground = useCallback((): string => {
    // Auf Mobile immer undurchsichtiger Hintergrund (kein Background-Image Support)
    return currentTheme.background.default;
  }, [currentTheme.background.default]);

  // Einfache Style-Funktion ohne minHeight oder flex
  const getMobilePageStyle = useCallback((): React.CSSProperties => {
    return {};
  }, []);

  // Header-Style - no glass effect on mobile
  const getMobileHeaderStyle = useCallback(
    (gradientColor?: string): React.CSSProperties => {
      // Always use normal gradient on mobile (no glass effect)
      return {
        background: gradientColor
          ? `linear-gradient(180deg, ${gradientColor}33 0%, transparent 100%)`
          : `linear-gradient(180deg, ${currentTheme.primary}33 0%, transparent 100%)`,
      };
    },
    [currentTheme.primary]
  );

  // Material-UI Theme erstellen - nur neu wenn sich currentTheme ändert
  const muiTheme = useMemo(() => createTheme(createMuiTheme(currentTheme)), [currentTheme]);

  const contextValue = useMemo<ThemeContextType>(
    () => ({
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
    }),
    [
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
    ]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={muiTheme}>{children}</MuiThemeProvider>
    </ThemeContext.Provider>
  );
};
