import firebase from 'firebase/compat/app';

// Funktion um eine Farbe heller oder dunkler zu machen
export const adjustBrightness = (color: string, percent: number) => {
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
      // console.log('Lokales Theme geladen (hat Vorrang):', theme);
    } catch (error) {
      // console.error('Fehler beim Laden des lokalen Themes:', error);
    }
  }

  // Falls kein lokales Theme, Cloud-Theme als Fallback laden
  if (!theme && userId) {
    try {
      const themeRef = firebase.database().ref(`users/${userId}/theme`);
      const snapshot = await themeRef.once('value');
      theme = snapshot.val();
      if (theme) {
        // console.log('Cloud-Theme als Fallback geladen:', theme);
        // WICHTIG: Speichere Cloud-Theme temporär im localStorage,
        // damit BackgroundMedia Komponente es aufgreifen kann (speziell für Videos)
        localStorage.setItem('customTheme', JSON.stringify(theme));
        // console.log('Cloud-Theme im localStorage gespeichert für BackgroundMedia');
      }
    } catch (error) {
      // console.error('Fehler beim Laden des Cloud-Themes:', error);
    }
  }

  // Theme anwenden oder Defaults verwenden
  const root = document.documentElement;

  if (theme) {
    root.style.setProperty('--theme-primary', theme.primaryColor || '#00fed7');
    // Hover-Farbe automatisch berechnen (etwas heller/dunkler)
    const primaryHover = adjustBrightness(theme.primaryColor || '#00fed7', 10);
    root.style.setProperty('--theme-primary-hover', primaryHover);
    root.style.setProperty('--theme-accent', theme.accentColor || '#ff6b6b');
    root.style.setProperty('--theme-background', theme.backgroundColor || '#06090f');
    root.style.setProperty('--theme-surface', theme.surfaceColor || '#0e1420');
    root.style.setProperty('--theme-text-primary', theme.primaryColor || '#00fed7');
    root.style.setProperty('--theme-text-secondary', '#ffffff');

    // Mobile-first app - no background images needed

    // Update theme-color Meta-Tag für PWA Status Bar
    updateThemeColorMeta(theme.backgroundColor || '#06090f');
  } else {
    // Stelle sicher, dass Default-Werte gesetzt sind
    root.style.setProperty('--theme-primary', '#00fed7');
    root.style.setProperty('--theme-primary-hover', adjustBrightness('#00fed7', 10));
    root.style.setProperty('--theme-accent', '#ff6b6b');
    root.style.setProperty('--theme-background', '#06090f');
    root.style.setProperty('--theme-surface', '#0e1420');
    root.style.setProperty('--theme-text-primary', '#00fed7');
    root.style.setProperty('--theme-text-secondary', '#ffffff');

    // Update theme-color Meta-Tag für PWA Status Bar
    updateThemeColorMeta('#06090f');
  }
};
