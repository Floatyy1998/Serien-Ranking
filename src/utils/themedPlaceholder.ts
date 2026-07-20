import { useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { t } from '../services/i18n';

/**
 * Generiert einen Poster-Placeholder als data: URL — mit TV-Rank Logo als
 * Marken-Anker, prominenter "KEIN POSTER"-Botschaft und Glas-/Aurora-Optik
 * in den Theme-Akzentfarben. Wird als <img src=...>-Fallback genutzt,
 * dadurch bleibt das bestehende getImageUrl-Pattern erhalten.
 *
 * Die Logo-Pfade stammen 1:1 aus /public/tv-logo.svg (viewBox
 * "240 120 544 544", innerer rotate(180 512 512)).
 */
const TV_LOGO_PATH_BODY =
  'M388.3 902c-4-2.4-5.3-4.8-5.3-9.9 0-4.5-3.3-.3 38-48.1 14-16.2 27.9-32.3 30.8-35.7l5.3-6.2-3.1-3.9c-3.7-4.7-5.7-5.2-21.5-5.2-29.4 0-118.7-6-129-8.6-25.5-6.5-43.6-27.7-46.5-54.7-4.7-42.8-6.3-153.3-3-202.2 3.7-54.6 7-66.5 23-82.6 12.1-12.1 23.8-17.1 43.8-18.5 6.2-.5 9.2-1.1 9.2-1.9 0-.7-1.6-9.1-3.6-18.6-2.9-14.4-3.4-18-2.5-20.9 3.3-11.1 18.2-13.4 25.4-3.9 1.3 1.9 6.6 11.1 11.5 20.4 5 9.4 9.5 17.7 10 18.4.7 1.3 3.6 1.3 20.8.3 45.1-2.8 70.6-3.5 122.9-3.5 52.5-.1 97.2 1.4 126 4.2 6.5.7 9.3.6 10.1-.2.6-.7 5.7-9.7 11.3-20.2 12.1-22.6 13.9-24.7 21.4-25.3 6.5-.5 10.9 1.4 13.7 6.1 2.6 4.3 2.6 5.5-1.5 25.6-1.9 9.5-3.3 17.6-3 18 .2.5 3.9 1.1 8.2 1.5 18.1 1.6 32.8 7 42.6 15.7 9.7 8.5 18.2 23.6 20.8 37.2 5.4 27.9 7.4 137.5 4 211.2-2.1 43.5-3.2 50.4-10.2 63.6-8.4 15.6-25.1 27.4-44.8 31.4-10.6 2.2-60.9 5.3-118.9 7.4l-22.3.8-4.2 4.1c-3.1 3.1-3.9 4.6-3.2 5.6.6.7 16.8 19.5 36 41.6 19.3 22.1 35.5 41.2 36.2 42.4.7 1.1 1.2 3.8 1.3 5.9 0 3.1-.7 4.6-3.4 7.3-2.8 2.8-4.2 3.4-7.5 3.4-5.8 0-9.3-2.1-14.8-9-5.6-6.9-39.3-46.9-57.6-68.5-7.1-8.2-13.4-14.9-14-14.8-.7.1-5.7 1.1-11.2 2.3-12.5 2.7-31.7 2.3-43.2-.8l-7.3-2-9.2 11.2c-5 6.1-15.5 18.5-23.3 27.6-7.8 9.1-20.3 23.9-27.9 33-7.5 9.1-15.1 17.5-16.8 18.8-3.8 2.7-9.2 2.9-13.5.2zm164.2-148c31-1.4 64.3-3.9 69-5.1 15.5-4.2 28.1-18 30.5-33.5 4.7-30.4 4.7-183-.1-217.9-1.9-14.3-11.5-26.9-23.9-31.6-15.4-5.8-108.4-10.1-175.3-8-69.8 2.1-115.8 4.9-126.3 7.7-7.3 1.9-10.9 4.1-16.8 10.4-8.6 9.2-10.7 16.7-12.5 46-3.5 54.7-3 144.7 1 185 1.6 16.4 6.7 25.7 18.2 33.1 7.7 5 14.7 6.4 44.2 8.9 66 5.5 139.2 7.4 192 5zm168.2-53.1c4.1-2.5 9-9.7 9.9-14.5 1.5-8.2-3.9-18.5-11.9-22.5-5.8-3-14.8-3-20.4-.1-16.8 8.8-14 35 4.3 39.7 5.8 1.5 13.2.4 18.1-2.6zm-4-65c5.9-2.2 12.2-10.2 13.8-17.6 1-4.9-1.8-13.2-5.7-17-5.1-4.8-9-6.3-16.1-6.3-12.4 0-20.8 7.5-21.5 19.4-.3 4.9 0 7.1 1.6 10.2 2.5 4.8 6.6 8.8 11.2 10.8 4.1 1.8 12.7 2.1 16.7.5zm17.5-86.4c.8-1.9.8-3.1 0-5-1.3-2.8.5-2.7-31-2.7-17.6 0-19.2.4-19.2 5.1 0 5 .7 5.1 25.7 5.1l23.3 0 1.2-2.5zm-1-24.2c2.4-2.1 2.3-4.8-.2-7.3-1.9-1.9-3.3-2-23.7-2-23.7 0-25.3.4-25.3 6 0 4.8.8 5 24.9 5 19.5 0 22.7-.2 24.3-1.7zm0-24c2.2-2 2.3-5.1.1-7.5-1.5-1.6-3.6-1.8-23.6-1.8-19.1 0-22.3.2-23.9 1.7-2.3 2.1-2.4 6.9 0 8.2 1 .6 10.6 1.1 23.6 1.1 19 0 22.2-.2 23.8-1.7z';

const TV_LOGO_PATH_SCREEN =
  'M549.3 713.6l-2.8-2.4-.2-33.9c-.1-18.6.1-37.4.4-41.9l.6-8 7.6 1.4c11.7 2.2 27.2 0 43.4-6.3 1.6-.7 1.7 1.8 1.7 42.8 0 29.8-.4 44.4-1.1 46-1.9 4.2-4.7 4.7-26.4 4.7-20.1 0-20.4 0-23.2-2.4zM479.5 667.5l-2.5-2.4 0-80.9c0-78.2.1-81.1 1.9-83.3 1.8-2.2 2.8-2.4 12.5-2.7l10.7-.4-4.6 6.5c-16.9 24.3-19.4 55.1-6.4 81.4 6.8 13.8 19.5 27 32.5 34l5.6 3-.1 21.4-.1 21.4-2.6 2.3c-2.4 2.1-3.2 2.2-23.5 2.2-21 0-21 0-23.4-2.5zM411.2 628c-1.2-1.1-2.4-3.1-2.7-4.3-.3-1.2-.4-28.9-.3-61.5l.3-59.4 2.8-2.4c2.8-2.4 3.1-2.4 22.7-2.4 21.2 0 24 .5 25.9 4.7.8 1.7 1.1 20.6 1.1 62.4l0 60-2.5 2.4c-2.4 2.5-2.4 2.5-23.8 2.5-20 0-21.5-.1-23.5-2zM552.8 617c-19-3.4-37.8-15.8-47.6-31.3-7-11-9.4-19.4-9.9-33.7-.8-22.2 4.1-35.5 18.6-50.1 13.8-13.9 29.3-20.3 48.6-20.3 11.9.1 22.3 2.6 33 8.1 9.8 5.1 23.8 19.2 28.3 28.7 4.9 10.1 7.2 20.2 7.2 31.5 0 11.7-1.7 18.9-7.2 30.1-5.3 10.9';

const buildPlaceholderSvg = (primary: string, secondary: string): string => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" preserveAspectRatio="xMidYMid slice">
  <defs>
    <!-- Backgrounds -->
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10182b"/>
      <stop offset="55%" stop-color="#0a0e1a"/>
      <stop offset="100%" stop-color="#04060c"/>
    </linearGradient>
    <radialGradient id="auroraA" cx="18%" cy="14%" r="75%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.55"/>
      <stop offset="45%" stop-color="${primary}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="auroraB" cx="86%" cy="90%" r="75%">
      <stop offset="0%" stop-color="${secondary}" stop-opacity="0.42"/>
      <stop offset="50%" stop-color="${secondary}" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="75%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0.6"/>
    </radialGradient>

    <!-- Theme accents -->
    <linearGradient id="ico" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.98"/>
      <stop offset="50%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="hero" x1="0%" y1="50%" x2="100%" y2="50%">
      <stop offset="0%" stop-color="${primary}"/>
      <stop offset="100%" stop-color="${secondary}"/>
    </linearGradient>
    <linearGradient id="wordmark" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.7"/>
    </linearGradient>

    <!-- Halos -->
    <radialGradient id="logoHalo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.48"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="heroHalo" cx="50%" cy="50%" r="55%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.32"/>
      <stop offset="100%" stop-color="${primary}" stop-opacity="0"/>
    </radialGradient>

    <!-- Glass card gradients -->
    <linearGradient id="glassFill" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.07"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
    </linearGradient>
    <linearGradient id="glassEdge" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primary}" stop-opacity="0.55"/>
      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="${secondary}" stop-opacity="0.45"/>
    </linearGradient>

    <!-- Filters -->
    <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5"/>
    </filter>
    <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="3"/>
    </filter>
    <filter id="heroGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="6"/>
    </filter>
  </defs>

  <!-- Background layers -->
  <rect width="300" height="450" fill="url(#bg)"/>
  <rect width="300" height="450" fill="url(#auroraA)"/>
  <rect width="300" height="450" fill="url(#auroraB)"/>

  <!-- Tech grid -->
  <g stroke="${primary}" stroke-opacity="0.04" stroke-width="0.5">
    <line x1="0" y1="90" x2="300" y2="90"/>
    <line x1="0" y1="180" x2="300" y2="180"/>
    <line x1="0" y1="270" x2="300" y2="270"/>
    <line x1="0" y1="360" x2="300" y2="360"/>
    <line x1="75" y1="0" x2="75" y2="450"/>
    <line x1="150" y1="0" x2="150" y2="450"/>
    <line x1="225" y1="0" x2="225" y2="450"/>
  </g>

  <!-- Star field -->
  <g fill="#ffffff">
    <circle cx="42" cy="58" r="1" opacity="0.65"/>
    <circle cx="86" cy="34" r="0.7" opacity="0.4"/>
    <circle cx="220" cy="72" r="1.2" opacity="0.7"/>
    <circle cx="272" cy="118" r="0.7" opacity="0.4"/>
    <circle cx="194" cy="42" r="0.9" opacity="0.55"/>
    <circle cx="30" cy="148" r="0.6" opacity="0.4"/>
    <circle cx="276" cy="338" r="0.8" opacity="0.5"/>
    <circle cx="24" cy="380" r="0.7" opacity="0.4"/>
    <circle cx="60" cy="416" r="0.9" opacity="0.5"/>
    <circle cx="248" cy="424" r="0.8" opacity="0.45"/>
  </g>

  <!-- Top: Logo + Wordmark -->
  <!-- Sanfter Halo direkt hinter dem Logo (kein Ring, kein Glasdisc) -->
  <circle cx="150" cy="98" r="68" fill="url(#logoHalo)"/>

  <!-- TV-Rank logo (glow) -->
  <g filter="url(#logoGlow)" opacity="0.5">
    <svg x="108" y="56" width="84" height="84" viewBox="240 120 544 544" overflow="visible">
      <g transform="rotate(180 512 512)">
        <path fill="url(#ico)" d="${TV_LOGO_PATH_BODY}"/>
        <path fill="url(#ico)" d="${TV_LOGO_PATH_SCREEN}"/>
      </g>
    </svg>
  </g>
  <!-- TV-Rank logo (crisp) -->
  <svg x="108" y="56" width="84" height="84" viewBox="240 120 544 544" overflow="visible">
    <g transform="rotate(180 512 512)">
      <path fill="url(#ico)" d="${TV_LOGO_PATH_BODY}"/>
      <path fill="url(#ico)" d="${TV_LOGO_PATH_SCREEN}"/>
    </g>
  </svg>

  <!-- TV·RANK Wordmark -->
  <text x="150" y="172" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif"
        font-size="17" font-weight="900" fill="url(#hero)" letter-spacing="5">TV·RANK</text>

  <!-- Decorative divider -->
  <g stroke="${primary}" stroke-opacity="0.35" stroke-width="1" stroke-linecap="round">
    <line x1="84" y1="188" x2="126" y2="188"/>
    <line x1="174" y1="188" x2="216" y2="188"/>
    <circle cx="150" cy="188" r="2" fill="${primary}" stroke="none"/>
  </g>

  <!-- Hero card: "KEIN POSTER" -->
  <!-- Glass card -->
  <rect x="28" y="232" width="244" height="104" rx="18"
        fill="url(#glassFill)" stroke="url(#glassEdge)" stroke-width="1.2"/>
  <!-- Card inner border accent (extra depth) -->
  <rect x="32" y="236" width="236" height="96" rx="15"
        fill="none" stroke="${primary}" stroke-opacity="0.08" stroke-width="0.6"/>

  <!-- Corner brackets im Card -->
  <g stroke="${primary}" stroke-opacity="0.55" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M 40 246 L 40 240 L 46 240"/>
    <path d="M 260 246 L 260 240 L 254 240"/>
    <path d="M 40 322 L 40 328 L 46 328"/>
    <path d="M 260 322 L 260 328 L 254 328"/>
  </g>

  <!-- "KEIN POSTER" (glow + crisp) -->
  <text x="150" y="284" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif"
        font-size="30" font-weight="900" fill="url(#hero)" letter-spacing="2"
        filter="url(#heroGlow)" opacity="0.65">${t('KEIN POSTER')}</text>
  <text x="150" y="284" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Inter, sans-serif"
        font-size="30" font-weight="900" fill="url(#hero)" letter-spacing="2">${t('KEIN POSTER')}</text>

  <!-- Status row: blinking-dot + subtitle -->
  <g transform="translate(150 312)">
    <circle cx="-50" cy="0" r="3.2" fill="${primary}" filter="url(#softGlow)"/>
    <circle cx="-50" cy="0" r="2" fill="${primary}"/>
    <text x="-38" y="4" text-anchor="start"
          font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
          font-size="11" font-weight="600" fill="#a3afc7" letter-spacing="2">${t('VORHANDEN')}</text>
  </g>

  <!-- Bottom: Tagline + Footer -->
  <!-- Tagline -->
  <text x="150" y="380" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="9" font-weight="700" fill="${primary}" fill-opacity="0.65" letter-spacing="4">${t('SERIEN · FILME · MANGA')}</text>

  <!-- Footer note -->
  <text x="150" y="404" text-anchor="middle"
        font-family="ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
        font-size="9" font-weight="500" fill="#6b7793" letter-spacing="0.6">${t('Coverbild bald verfügbar')}</text>

  <!-- Cinema corner brackets (outer frame) -->
  <g stroke="${primary}" stroke-opacity="0.5" stroke-width="1.5" fill="none" stroke-linecap="round">
    <path d="M 16 28 L 16 16 L 28 16"/>
    <path d="M 284 28 L 284 16 L 272 16"/>
    <path d="M 16 422 L 16 434 L 28 434"/>
    <path d="M 284 422 L 284 434 L 272 434"/>
  </g>

  <!-- Vignette on top -->
  <rect width="300" height="450" fill="url(#vignette)" pointer-events="none"/>
</svg>`;

export const buildThemedPlaceholderDataUrl = (primary: string, secondary: string): string => {
  const svg = buildPlaceholderSvg(primary, secondary).trim();
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/**
 * Hook: liefert die data:-URL des Poster-Placeholders, eingefaerbt mit den
 * aktuellen Theme-Akzenten. Wechselt automatisch beim Theme-Switch.
 * Memoized auf (primary, secondary), damit nicht jedes Render eine neue
 * URL erzeugt wird.
 */
export const useThemedPlaceholder = (): string => {
  const { currentTheme } = useTheme();
  const primary = currentTheme.primary;
  const secondary = currentTheme.secondary || currentTheme.accent;
  return useMemo(() => buildThemedPlaceholderDataUrl(primary, secondary), [primary, secondary]);
};
