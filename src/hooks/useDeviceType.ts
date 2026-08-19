import { useEffect, useState } from 'react';
import { effectiveWidth, getDisplayScale } from '../services/displayScale';

const MOBILE_BREAKPOINT = 768;

/**
 * Entscheidend ist die NUTZBARE Breite, nicht die Fensterbreite.
 *
 * Die Anzeigegröße skaliert die Oberfläche per `zoom`: bei 800px Fenster und
 * Zoom 1.25 stehen den Inhalten nur 640px zur Verfügung. Mit `window.innerWidth`
 * galt das als Desktop — das Desktop-Layout rendert dann in einen Raum, der
 * dafür zu schmal ist (auf der Serien-Detailseite lief der Titel über das
 * Poster). Geteilt durch den Zoom stimmt die Einordnung wieder.
 */
function getIsMobile(): boolean {
  return effectiveWidth(window.innerWidth, getDisplayScale()) < MOBILE_BREAKPOINT;
}

/**
 * Zentraler Hook für Mobile/Desktop-Erkennung.
 * Reagiert auf Resize-Events und liefert `isMobile` und `isDesktop`.
 */
export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(getIsMobile);

  useEffect(() => {
    const onResize = () => setIsMobile(getIsMobile());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return { isMobile, isDesktop: !isMobile } as const;
}
