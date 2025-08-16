// Mapping-Tabelle für häufige hardcodierte Farben zu Theme-Properties
export const colorMappings = {
  // Häufige Hex-Farben zu Theme-Pfaden
  '#00fed7': 'colors.primary',
  '#00e6c3': 'colors.primaryHover', 
  '#00d4b4': 'colors.primaryDark',
  '#ffffff': 'colors.text.white',
  '#000000': 'colors.background.default',
  '#1a1a1a': 'colors.background.dialog',
  '#2d2d30': 'colors.background.surface',
  '#404040': 'colors.border.default',
  '#ff4444': 'colors.status.error',
  '#cc3333': 'colors.status.errorHover',
  '#FFC107': 'colors.status.warning',
  '#ffd700': 'colors.status.warningDark',
  '#4caf50': 'colors.status.success',
  '#42d10f': 'colors.status.successLight',
  '#b103fc': 'colors.status.purple',
  '#ff9800': 'colors.status.warning',
  '#ccc': 'colors.text.muted',
  '#cccccc': 'colors.text.muted',
  '#e0e0e0': 'colors.text.secondary',
  '#9e9e9e': 'colors.text.muted',
  
  // Komplexe Gradienten
  'linear-gradient(145deg, #1a1a1a 0%, #2d2d30 50%, #1a1a1a 100%)': 'colors.background.gradient.complex',
  'linear-gradient(135deg, #000000 0%, #0C0C0C 100%)': 'colors.background.gradient.dark',
  
  // RGBA-Farben zu Overlay-Properties
  'rgba(0, 254, 215, 0.02)': 'colors.overlay.light',
  'rgba(0, 254, 215, 0.08)': 'colors.overlay.medium',
  'rgba(0, 0, 0, 0.2)': 'colors.overlay.black',
  'rgba(255, 255, 255, 0.2)': 'colors.overlay.white',
};

// Beispiel-Funktion für automatische Theme-Konvertierung
export function convertHardcodedColorToTheme(colorValue: string): string {
  // Direkte Mappings
  if (colorMappings[colorValue as keyof typeof colorMappings]) {
    return colorMappings[colorValue as keyof typeof colorMappings];
  }
  
  // Pattern-basierte Konvertierung für ähnliche Farben
  if (colorValue.startsWith('#')) {
    const hex = colorValue.toLowerCase();
    
    // Primärfarben-Varianten
    if (hex.includes('00fed7') || hex.includes('00e6c3') || hex.includes('00d4b4')) {
      return 'colors.primary';
    }
    
    // Grautöne
    if (hex.match(/#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$/i)) { // Grautöne wie #333, #666, etc.
      const value = parseInt(hex.substring(1, 3), 16);
      if (value < 50) return 'colors.background.default';
      if (value < 100) return 'colors.background.surface';
      return 'colors.text.muted';
    }
  }
  
  // Wenn keine Konvertierung möglich, Original zurückgeben
  return colorValue;
}

// Hilfsfunktion für Code-Replacement (für manuelle Nutzung)
export function generateThemeReplacement(oldColor: string, context: 'color' | 'backgroundColor' | 'borderColor' = 'color'): string {
  const themePath = convertHardcodedColorToTheme(oldColor);
  
  if (themePath === oldColor) {
    // Keine Konvertierung gefunden
    return `// TODO: Konvertiere ${oldColor} zu Theme-Farbe`;
  }
  
  // Template-String für dynamische Farben
  if (context === 'color') {
    return `{${themePath}}`;
  } else {
    return `\`\${${themePath}}\``;
  }
}