import { useEffect, useRef } from 'react';
import { registerBackInterceptor } from '../services/nativeShell';

/**
 * Fängt den Android-Hardware-Back ab, solange `active` gilt — für Overlays,
 * die keine eigene Route haben (Sheets, Dialoge). Ohne das schließt der
 * Zurück-Knopf die Seite oder minimiert die App, statt das Overlay zu schließen.
 * Im Browser und auf iOS passiert nichts.
 */
export const useAndroidBack = (active: boolean, onBack: () => void): void => {
  // Ref, damit ein wechselnder Callback die Registrierung nicht neu aufsetzt.
  const handler = useRef(onBack);
  useEffect(() => {
    handler.current = onBack;
  }, [onBack]);

  useEffect(() => {
    if (!active) return;
    return registerBackInterceptor(() => {
      handler.current();
      return true;
    });
  }, [active]);
};
