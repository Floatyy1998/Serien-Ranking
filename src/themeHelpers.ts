import firebase from 'firebase/compat/app';

// Funktion um eine Farbe heller oder dunkler zu machen
const VALID_HEX = /^#?[0-9a-fA-F]{6}$/;

export const adjustBrightness = (color: string, percent: number) => {
  if (!color || !VALID_HEX.test(color)) return '#00d123';
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
};

// Funktion zum Updaten des theme-color Meta-Tags
export const updateThemeColorMeta = (backgroundColor: string) => {
  const metaThemeColor = document.getElementById('theme-color-meta') as HTMLMetaElement;
  if (metaThemeColor) {
    metaThemeColor.content = backgroundColor;
  }
};

export const loadSavedTheme = async (userId?: string) => {
  let theme = null;

  // WICHTIG: Lokales Theme hat Vorrang vor Cloud-Theme
  // Erst lokales Theme versuchen
  const savedTheme = localStorage.getItem('customTheme');
  if (savedTheme) {
    try {
      theme = JSON.parse(savedTheme);
    } catch {
      // corrupted JSON — fall through to cloud / defaults
    }
  }

  // Falls kein lokales Theme, Cloud-Theme als Fallback laden
  if (!theme && userId) {
    try {
      const themeRef = firebase.database().ref(`users/${userId}/theme`);
      const snapshot = await themeRef.once('value');
      theme = snapshot.val();
      if (theme) {
        // WICHTIG: Speichere Cloud-Theme temporär im localStorage,
        // damit BackgroundMedia Komponente es aufgreifen kann (speziell für Videos)
        localStorage.setItem('customTheme', JSON.stringify(theme));
      }
    } catch {
      // ignore — defaults will apply
    }
  }

  // Theme anwenden oder Defaults verwenden
  const root = document.documentElement;

  if (theme) {
    const safe = (c: string | undefined, fallback: string) =>
      c && VALID_HEX.test(c) ? c : fallback;
    const primary = safe(theme.primaryColor, '#00d123');
    const accent = safe(theme.accentColor, '#008a6e');
    const bg = safe(theme.backgroundColor, '#000000');
    const surface = safe(theme.surfaceColor, '#0f0f0f');

    root.style.setProperty('--theme-primary', primary);
    const primaryHover = adjustBrightness(primary, 10);
    root.style.setProperty('--theme-primary-hover', primaryHover);
    root.style.setProperty('--theme-accent', accent);
    root.style.setProperty('--theme-background', bg);
    root.style.setProperty('--theme-surface', surface);
    root.style.setProperty('--theme-text-primary', primary);
    root.style.setProperty('--theme-text-secondary', '#ffffff');

    // Mobile-first app - no background images needed

    // Update theme-color Meta-Tag für PWA Status Bar
    updateThemeColorMeta(bg);
  } else {
    // Stelle sicher, dass Default-Werte gesetzt sind
    root.style.setProperty('--theme-primary', '#00d123');
    root.style.setProperty('--theme-primary-hover', adjustBrightness('#00d123', 10));
    root.style.setProperty('--theme-accent', '#008a6e');
    root.style.setProperty('--theme-background', '#000000');
    root.style.setProperty('--theme-surface', '#0f0f0f');
    root.style.setProperty('--theme-text-primary', '#00d123');
    root.style.setProperty('--theme-text-secondary', '#ffffff');

    // Update theme-color Meta-Tag für PWA Status Bar
    updateThemeColorMeta('#000000');
  }
};
