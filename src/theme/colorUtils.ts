// Kontrast-Berechnungs-Utilities für optimale Textfarben

/**
 * Konvertiert Hex-Farbe zu RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Berechnet die relative Luminanz einer Farbe
 * Basiert auf WCAG 2.1 Guidelines
 */
export function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;

  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Berechnet das Kontrastverhältnis zwischen zwei Farben
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return 1;

  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);

  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);

  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Bestimmt die optimale Textfarbe für einen gegebenen Hintergrund
 * Berücksichtigt WCAG AA Standards (Kontrast >= 4.5:1)
 */
export function getOptimalTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio(backgroundColor, '#ffffff');
  const blackContrast = getContrastRatio(backgroundColor, '#000000');

  // Prüfe ob weiß oder schwarz besseren Kontrast bietet
  if (whiteContrast >= blackContrast) {
    return whiteContrast >= 4.5 ? '#ffffff' : '#f0f0f0';
  } else {
    return blackContrast >= 4.5 ? '#000000' : '#1a1a1a';
  }
}

/**
 * Erstellt eine hellere Variante einer Farbe
 */
export function lightenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  return `#${[r, g, b]
    .map((c) => {
      const lightened = Math.min(255, Math.round(c + (255 - c) * amount));
      return lightened.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

/**
 * Erstellt eine dunklere Variante einer Farbe
 */
export function darkenColor(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const { r, g, b } = rgb;
  return `#${[r, g, b]
    .map((c) => {
      const darkened = Math.max(0, Math.round(c * (1 - amount)));
      return darkened.toString(16).padStart(2, '0');
    })
    .join('')}`;
}

/**
 * Erstellt eine transparente Version einer Farbe
 */
export function withOpacity(hex: string, opacity: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
}

/**
 * Generiert automatisch Hover-Farben
 */
export function generateHoverColor(baseColor: string): string {
  const rgb = hexToRgb(baseColor);
  if (!rgb) return baseColor;

  const luminance = getLuminance(rgb);

  // Dunkle Farben werden heller, helle Farben werden dunkler
  return luminance > 0.5 ? darkenColor(baseColor, 0.1) : lightenColor(baseColor, 0.1);
}

/**
 * Erstellt eine Palette basierend auf einer Primärfarbe
 */
export function generateColorPalette(primaryColor: string) {
  return {
    primary: primaryColor,
    primaryHover: generateHoverColor(primaryColor),
    primaryDark: darkenColor(primaryColor, 0.2),
    primaryLight: lightenColor(primaryColor, 0.3),

    // Automatische Textfarben basierend auf Kontrast
    textOnPrimary: getOptimalTextColor(primaryColor),
    textOnBackground: getOptimalTextColor('#000000'),

    // Overlay-Farben mit Primärfarbe
    overlayLight: withOpacity(primaryColor, 0.02),
    overlayMedium: withOpacity(primaryColor, 0.08),

    // Border-Farben
    borderLight: withOpacity(primaryColor, 0.08),
    borderPrimary: primaryColor,
  };
}

/**
 * Validiert ob eine Farbkombination WCAG-konform ist
 */
export function isAccessible(
  backgroundColor: string,
  textColor: string,
  level: 'AA' | 'AAA' = 'AA'
): boolean {
  const contrast = getContrastRatio(backgroundColor, textColor);
  const minContrast = level === 'AAA' ? 7 : 4.5;
  return contrast >= minContrast;
}

/**
 * Erstellt automatisch barrierefreie Textfarben
 */
export function createAccessibleTextColors(backgroundColor: string) {
  const primary = getOptimalTextColor(backgroundColor);
  const rgb = hexToRgb(backgroundColor);

  if (!rgb) {
    return {
      primary: '#ffffff',
      secondary: '#cccccc',
      muted: '#999999',
    };
  }

  const isLight = getLuminance(rgb) > 0.5;

  return {
    primary: primary,
    secondary: isLight ? '#333333' : '#e0e0e0',
    muted: isLight ? '#666666' : '#999999',
  };
}
