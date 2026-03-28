import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

function getIsMobile(): boolean {
  return window.innerWidth < MOBILE_BREAKPOINT;
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
