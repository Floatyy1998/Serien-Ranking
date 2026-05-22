import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContextDef';

/**
 * Generiert einen Poster-Placeholder als data: URL mit den aktuellen Theme-
 * Akzentfarben. Wird als <img src=...>-Fallback genutzt, deshalb data-URL
 * statt einer React-Komponente — so bleibt das bestehende getImageUrl-
 * Pattern erhalten und alle Caller (Listen, Hero, Search, ...) bekommen den
 * gleichen Themed-Placeholder ohne Refactor.
 */
const buildPlaceholderSvg = (primary: string, secondary: string): string => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e1426"/>
      <stop offset="55%" stop-color="#0a0e1a"/>
      <stop offset="100%" stop-color="#05060c"/>
    </linearGradient>
    <radialGradient id="auroraA" cx="22%" cy="18%" r="70%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.45"/>
      <stop offset="55%" stop-color="${primary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="auroraB" cx="82%" cy="88%" r="70%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.38"/>
      <stop offset="60%" stop-color="${secondary}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="ico" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.95"/>
      <stop offset="55%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <radialGradient id="iconGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.55"/>
      <stop offset="55%" stop-color="${primary}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
    <filter id="heavyGlow" x="-100%" y="-100%" width="300%" height="300%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <rect width="300" height="450" fill="url(#bg)"/>
  <rect width="300" height="450" fill="url(#auroraA)"/>
  <rect width="300" height="450" fill="url(#auroraB)"/>

  <g stroke="${primary}" stroke-opacity="0.05" stroke-width="0.5">
    <line x1="0" y1="90" x2="300" y2="90"/>
    <line x1="0" y1="180" x2="300" y2="180"/>
    <line x1="0" y1="270" x2="300" y2="270"/>
    <line x1="0" y1="360" x2="300" y2="360"/>
    <line x1="75" y1="0" x2="75" y2="450"/>
    <line x1="150" y1="0" x2="150" y2="450"/>
    <line x1="225" y1="0" x2="225" y2="450"/>
  </g>

  <g fill="#ffffff">
    <circle cx="42" cy="58" r="1" opacity="0.65"/>
    <circle cx="88" cy="34" r="0.8" opacity="0.5"/>
    <circle cx="218" cy="72" r="1.3" opacity="0.75"/>
    <circle cx="270" cy="116" r="0.7" opacity="0.45"/>
    <circle cx="192" cy="42" r="0.9" opacity="0.6"/>
    <circle cx="52" cy="196" r="0.8" opacity="0.5"/>
    <circle cx="262" cy="232" r="1" opacity="0.6"/>
    <circle cx="28" cy="284" r="0.7" opacity="0.4"/>
    <circle cx="276" cy="346" r="0.8" opacity="0.55"/>
    <circle cx="98" cy="388" r="0.9" opacity="0.55"/>
    <circle cx="160" cy="416" r="0.7" opacity="0.4"/>
    <circle cx="200" cy="392" r="0.6" opacity="0.45"/>
  </g>

  <circle cx="150" cy="200" r="95" fill="url(#iconGlow)"/>

  <g transform="translate(150 200)">
    <circle r="62" fill="none" stroke="url(#ico)" stroke-width="2" stroke-opacity="0.55" filter="url(#heavyGlow)"/>
    <circle r="62" fill="none" stroke="url(#ico)" stroke-width="1.5" stroke-opacity="0.45"/>
    <path d="M -62 0 A 62 62 0 0 1 -44 -44" fill="none" stroke="url(#ico)" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M 62 0 A 62 62 0 0 1 44 44" fill="none" stroke="url(#ico)" stroke-width="2.5" stroke-linecap="round"/>
    <circle r="46" fill="#0a0e1a" fill-opacity="0.85" stroke="url(#ico)" stroke-width="1.3" stroke-opacity="0.7"/>
    <path d="M -11 -18 L -11 18 L 18 0 Z" fill="url(#ico)" filter="url(#softGlow)" opacity="0.6"/>
    <path d="M -11 -18 L -11 18 L 18 0 Z" fill="url(#ico)"/>
  </g>

  <g transform="translate(150 322)">
    <rect x="-72" y="-15" width="144" height="30" rx="15"
          fill="${primary}" fill-opacity="0.08"
          stroke="${primary}" stroke-opacity="0.32" stroke-width="1"/>
    <circle cx="-52" cy="0" r="3" fill="${primary}" filter="url(#softGlow)"/>
    <circle cx="-52" cy="0" r="2" fill="${primary}"/>
    <text x="-39" y="4" text-anchor="start"
          font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
          font-size="11" font-weight="700" fill="${primary}" letter-spacing="2">KEIN POSTER</text>
  </g>

  <text x="150" y="362" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="10" font-weight="500" fill="#6b7793" letter-spacing="0.8">noch nicht verfügbar</text>

  <g stroke="${primary}" stroke-opacity="0.35" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M 16 28 L 16 16 L 28 16"/>
    <path d="M 284 28 L 284 16 L 272 16"/>
    <path d="M 16 422 L 16 434 L 28 434"/>
    <path d="M 284 422 L 284 434 L 272 434"/>
  </g>
</svg>`;

export const buildThemedPlaceholderDataUrl = (primary: string, secondary: string): string => {
  const svg = buildPlaceholderSvg(primary, secondary).trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Hook: liefert die data:-URL des Poster-Placeholders, eingefaerbt mit den
 * aktuellen Theme-Akzenten. Wechselt automatisch, wenn der User das Theme
 * aendert. Memoized auf (primary, secondary), damit nicht jedes Render
 * eine neue URL erzeugt wird (Browser dekodiert sonst wiederholt).
 */
export const useThemedPlaceholder = (): string => {
  const { currentTheme } = useTheme();
  const primary = currentTheme.primary;
  const secondary = currentTheme.secondary || currentTheme.accent;
  return useMemo(() => buildThemedPlaceholderDataUrl(primary, secondary), [primary, secondary]);
};
