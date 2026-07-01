import { useEffect, useRef, type FC, type ReactNode } from 'react';
import { showToast } from '../../lib/toast';

interface SnackbarProps {
  open: boolean;
  message: string;
  icon?: ReactNode;
  variant?: 'success' | 'error' | 'info';
}

/**
 * Dünner Adapter auf das zentrale DOM-Toast-System (`lib/toast`).
 *
 * Früher war dies eine eigene, parallele Toast-Implementierung (anderer Look,
 * andere Position, kein aria-live). Um EIN konsistentes Feedback-System zu haben,
 * delegiert die Komponente jetzt bei jeder open-Flanke an `showToast` und rendert
 * selbst nichts mehr. Bestehende `<Snackbar open message variant />`-Aufrufer
 * bleiben unverändert, bekommen aber automatisch Stacking + Barrierefreiheit.
 */
export const Snackbar: FC<SnackbarProps> = ({ open, message, variant = 'success' }) => {
  const prevOpen = useRef(false);

  useEffect(() => {
    if (open && !prevOpen.current && message) {
      showToast(message, 2500, variant);
    }
    prevOpen.current = open;
  }, [open, message, variant]);

  return null;
};
