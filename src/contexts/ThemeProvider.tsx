import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import type { UserThemeConfig } from '../theme/dynamicTheme';
import { activeSeason, resolveThemeConfig } from '../theme/seasonalThemes';
import {
  createMuiTheme,
  defaultThemeConfig,
  generateDynamicTheme,
  validateThemeConfig,
} from '../theme/dynamicTheme';
import { getOptimalTextColor, getRelativeLuminance } from '../theme/colorUtils';
import { setThemedPlaceholder } from '../utils/imageUrl';
import { buildThemedPlaceholderDataUrl } from '../utils/themedPlaceholder';
import { dbRef, paths } from '../services/db/ref';
import { ThemeContext } from './ThemeContext';
import type { ThemeContextType } from './ThemeContext';

// Zentrale Funktion zum Setzen aller CSS-Variablen
function applyCSSVariables(
  theme: ReturnType<typeof generateDynamicTheme>,
  userConfig: UserThemeConfig,
  isMobileDevice: boolean
) {
  const root = document.documentElement;
  const config = resolveThemeConfig(userConfig);
  const season = activeSeason(userConfig);
  if (season) root.dataset.season = season;
  else delete root.dataset.season;
  const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement | null;
  if (metaThemeColor) metaThemeColor.content = theme.background.default;

  // Primäre Farben
  root.style.setProperty('--color-primary', theme.primary);
  root.style.setProperty('--color-primary-hover', theme.primaryHover);
  root.style.setProperty('--color-primary-dark', theme.primaryDark);

  // Theme-Variablen (für CSS-Nutzung)
  root.style.setProperty('--theme-primary', theme.primary);
  root.style.setProperty('--theme-primary-hover', theme.primaryHover);
  root.style.setProperty('--theme-background', theme.background.default);
  // Helle Themes: CSS kann Stellen umschalten, die sonst nur auf dunklem Grund funktionieren.
  root.dataset.tone = getRelativeLuminance(theme.background.default) > 0.5 ? 'light' : 'dark';
  root.style.setProperty('--theme-surface', theme.background.surface);
  root.style.setProperty('--theme-surface-elevated', theme.background.surfaceElevated);
  root.style.setProperty('--theme-secondary-gradient', theme.secondary);
  // Lesbare Schrift auf Primary-Flächen und -Verläufen — für reines CSS.
  root.style.setProperty('--on-primary', getOptimalTextColor(theme.primary));

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

const THEME_STAMP_KEY = 'customThemeAt';
// Wessen Theme im Gerätespeicher liegt — nach einem Kontowechsel darf es nicht ins neue Konto wandern.
const THEME_OWNER_KEY = 'customThemeUid';

const buildTheme = (config: UserThemeConfig) => generateDynamicTheme(resolveThemeConfig(config));

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
      const theme = buildTheme(initialConfig);
      setTimeout(() => applyCSSVariables(theme, initialConfig, isMobile()), 0);
      // Themed Poster-Placeholder vor dem ersten Render setzen, sonst rendert
      // jede vor dem ThemeContext-Effect ausgefuehrte getImageUrl-Aufrufkette
      // mit dem statischen Placeholder.
      setThemedPlaceholder(
        buildThemedPlaceholderDataUrl(theme.primary, theme.secondary || theme.accent)
      );
      return theme;
    } catch {
      // Fallback auf Default-Theme wenn die Theme-Generation selbst scheitert.
      // localStorage-Eintrag NICHT loeschen — der ist ja noch gueltig und nur
      // ein temporaerer Generierungsfehler darf die Theme-Praeferenz nicht
      // zerstoeren.
      const fallback = generateDynamicTheme(defaultThemeConfig);
      setTimeout(() => applyCSSVariables(fallback, defaultThemeConfig, isMobile()), 0);
      setThemedPlaceholder(
        buildThemedPlaceholderDataUrl(fallback.primary, fallback.secondary || fallback.accent)
      );
      return fallback;
    }
  });

  // Das Theme hängt am Konto: jedes Gerät trägt dasselbe. Der Modus bleibt nur für die
  // Schnittstelle des Contexts bestehen.
  const syncMode = 'cloud' as const;

  // CSS-Variablen für globale Verwendung setzen
  const updateCSSVariables = useCallback(
    (theme: ReturnType<typeof generateDynamicTheme>, config?: UserThemeConfig) => {
      applyCSSVariables(theme, config || userConfig, isMobile());
    },
    [userConfig]
  );

  // Theme-Config direkt speichern (für updateTheme).
  const saveThemeConfig = useCallback(
    async (config: UserThemeConfig) => {
      // Speichere IMMER lokal (wie im Desktop ThemeEditor)
      // WICHTIG: Verwende 'customTheme' als Key, genau wie Desktop!
      // setItem in try/catch — auf iOS Safari kann das Quota voll sein, dann
      // soll es nicht den Save-Flow oder andere Theme-Logik unterbrechen.
      const stamp = Date.now();
      try {
        localStorage.setItem('customTheme', JSON.stringify(config));
        localStorage.setItem(THEME_STAMP_KEY, String(stamp));
        if (user?.uid) localStorage.setItem(THEME_OWNER_KEY, user.uid);
      } catch {
        // ignore — Theme bleibt im React-State, Cloud-Save unten greift evtl.
      }

      // Am Konto speichern, damit alle Geräte dasselbe Theme tragen
      if (user?.uid) {
        try {
          // RTDB lehnt undefined-Felder (z. B. backgroundImage) mit einem Throw ab
          const cloudConfig = JSON.parse(JSON.stringify(config)) as UserThemeConfig;
          await dbRef(paths.theme(user.uid)).set({ ...cloudConfig, updatedAt: stamp });
        } catch {
          // ignore — theme is persisted in localStorage too, cloud sync is best-effort
        }
      }
    },
    [user?.uid]
  );

  // Persistenz wird gebündelt: der Farbwähler feuert beim Ziehen im Sekundentakt
  // dutzende Änderungen, die sonst je einen localStorage- und Firebase-Write auslösen.
  const pendingSaveRef = useRef<UserThemeConfig | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveThemeConfigRef = useRef(saveThemeConfig);
  useEffect(() => {
    saveThemeConfigRef.current = saveThemeConfig;
  }, [saveThemeConfig]);

  const cancelPendingSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    pendingSaveRef.current = null;
  }, []);

  const flushPendingSave = useCallback(() => {
    if (saveTimerRef.current !== null) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const pending = pendingSaveRef.current;
    if (!pending) return;
    pendingSaveRef.current = null;
    void saveThemeConfigRef.current(pending);
  }, []);

  const queueSaveThemeConfig = useCallback(
    (config: UserThemeConfig) => {
      pendingSaveRef.current = config;
      if (saveTimerRef.current !== null) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(flushPendingSave, 300);
    },
    [flushPendingSave]
  );

  // Community-Design: prüfen, ob das Konto das übernommene Design noch trägt — bei jedem Start
  // und nach jeder Farbänderung, egal von welcher Seite sie kommt. Verzögert, damit ein Ziehen
  // im Farbwähler nicht bei jedem Zwischenwert schreibt.
  const reconcileUid = user?.uid;
  const reconcileSig = [
    userConfig.primaryColor,
    userConfig.backgroundColor,
    userConfig.surfaceColor,
    userConfig.accentColor,
    userConfig.textColor,
  ].join('|');
  useEffect(() => {
    if (!reconcileUid) return;
    const timer = setTimeout(() => {
      void import('../services/theme/communityThemes').then((mod) =>
        mod.reconcileCommunityThemeUse(reconcileUid, userConfig, true)
      );
    }, 4000);
    return () => clearTimeout(timer);
    // userConfig steckt in reconcileSig; das Objekt selbst wechselt auch ohne Farbänderung.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconcileUid, reconcileSig]);

  // Ausstehende Änderung nicht verlieren, wenn die App weggeht oder unmountet
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') flushPendingSave();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', flushPendingSave);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', flushPendingSave);
      flushPendingSave();
    };
  }, [flushPendingSave]);

  // Theme zurücksetzen
  const resetTheme = useCallback(async () => {
    cancelPendingSave();
    setUserConfig(defaultThemeConfig);
    const newTheme = generateDynamicTheme(defaultThemeConfig);
    setCurrentTheme(newTheme);
    updateCSSVariables(newTheme, defaultThemeConfig);
    const stamp = Date.now();
    try {
      localStorage.removeItem('customTheme'); // Gleicher Key wie Desktop!
      localStorage.setItem(THEME_STAMP_KEY, String(stamp));
    } catch {
      // ignore
    }

    // Standard am Konto ablegen: die anderen Geräte setzen dann ebenfalls zurück
    if (user?.uid) {
      try {
        const cloudDefault = JSON.parse(JSON.stringify(defaultThemeConfig)) as UserThemeConfig;
        await dbRef(paths.theme(user.uid)).set({ ...cloudDefault, updatedAt: stamp });
      } catch {
        // ignore — local reset is what the user actually sees, cloud cleanup is best-effort
      }
    }
  }, [user?.uid, updateCSSVariables, cancelPendingSave]);

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

    // Wende das geladene Theme an
    if (loadedConfig) {
      const validatedConfig = validateThemeConfig(loadedConfig);
      setUserConfig(validatedConfig);

      const newTheme = buildTheme(validatedConfig);
      setCurrentTheme(newTheme);
      updateCSSVariables(newTheme, validatedConfig);
    } else {
      // Ensure CSS variables are set even with default theme
      updateCSSVariables(currentTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, updateCSSVariables]);

  // Theme aus localStorage laden (mit Firebase als Fallback). loadTheme
  // ruft async setState — legitimer External-Sync, den die Rule nicht
  // durch den async-Pfad tracen kann.
  useEffect(() => {
    void loadTheme();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Live-Abgleich mit dem Konto: das neuere Theme gewinnt. Ändert man es am Handy, zieht der
  // PC ohne Neustart nach. Gibt es am Konto noch keins, lädt dieses Gerät seines hoch.
  const themeUid = user?.uid;
  useEffect(() => {
    if (!themeUid) return;
    const ref = dbRef(paths.theme(themeUid));
    const readLocal = () => {
      try {
        const owner = localStorage.getItem(THEME_OWNER_KEY);
        // Ohne Vermerk (Bestand vor der Umstellung) gilt das Theme als das eigene.
        const mine = owner === null || owner === themeUid;
        return {
          raw: mine ? localStorage.getItem('customTheme') : null,
          at: mine ? Number(localStorage.getItem(THEME_STAMP_KEY)) || 0 : 0,
        };
      } catch {
        return { raw: null, at: 0 };
      }
    };
    const upload = (raw: string) => {
      try {
        const stamp = Date.now();
        localStorage.setItem(THEME_STAMP_KEY, String(stamp));
        localStorage.setItem(THEME_OWNER_KEY, themeUid);
        void ref.set({ ...(JSON.parse(raw) as object), updatedAt: stamp }).catch(() => {});
      } catch {
        // ignore
      }
    };
    const handler = ref.on(
      'value',
      (snapshot) => {
        const cloud = snapshot.val() as (Partial<UserThemeConfig> & { updatedAt?: number }) | null;
        const local = readLocal();
        if (!cloud) {
          if (local.raw) upload(local.raw);
          return;
        }
        const cloudAt = Number(cloud.updatedAt) || 0;
        if (local.raw && cloudAt < local.at) {
          upload(local.raw);
          return;
        }
        if (local.raw && cloudAt === local.at) {
          // Gleicher Stand; ohne Zeitstempel auf beiden Seiten gewinnt dieses Gerät einmalig.
          if (cloudAt === 0) upload(local.raw);
          return;
        }
        const validated = validateThemeConfig(cloud);
        try {
          localStorage.setItem('customTheme', JSON.stringify(validated));
          localStorage.setItem(THEME_STAMP_KEY, String(cloudAt));
          localStorage.setItem(THEME_OWNER_KEY, themeUid);
        } catch {
          // ignore — in-memory reicht
        }
        setUserConfig(validated);
        const next = buildTheme(validated);
        setCurrentTheme(next);
        applyCSSVariables(next, validated, isMobile());
      },
      () => {}
    );
    return () => ref.off('value', handler);
  }, [themeUid]);

  // Theme aktualisieren
  const updateTheme = useCallback(
    (newConfig: Partial<UserThemeConfig>) => {
      const validatedConfig = validateThemeConfig({ ...userConfig, ...newConfig });
      setUserConfig(validatedConfig);

      const newTheme = buildTheme(validatedConfig);
      setCurrentTheme(newTheme);

      // CSS-Variablen für dynamisches Styling setzen (mit Config übergeben)
      updateCSSVariables(newTheme, validatedConfig);

      // Auto-save gebündelt, damit ein Drag im Farbwähler keine Write-Flut auslöst
      queueSaveThemeConfig(validatedConfig);
    },
    [userConfig, updateCSSVariables, queueSaveThemeConfig]
  );

  // Theme speichern (verwendet aktuellen State)
  const saveTheme = useCallback(async () => {
    cancelPendingSave();
    await saveThemeConfig(userConfig);
  }, [saveThemeConfig, userConfig, cancelPendingSave]);

  // Sync-Mode setzen und speichern
  const setSyncMode = useCallback((_mode: 'local' | 'cloud') => {
    // Das Theme hängt immer am Konto — es gibt nichts mehr umzuschalten.
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

  // Themed Poster-Placeholder als data:-URL hinterlegen, damit getImageUrl
  // ohne expliziten Fallback automatisch die Theme-Akzentfarben verwendet
  // (gilt fuer alle Hooks, Helpers und Views ohne useTheme-Zugang).
  useEffect(() => {
    const url = buildThemedPlaceholderDataUrl(
      currentTheme.primary,
      currentTheme.secondary || currentTheme.accent
    );
    setThemedPlaceholder(url);
  }, [currentTheme.primary, currentTheme.secondary, currentTheme.accent]);

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
