/**
 * Unsichtbarer Marker für Inhalt, der noch nachkommt, aber keinen Platzhalter
 * hat (z. B. die Zahl an der Glocke). Solange er im Bild steht, wartet der
 * Splash auf ihn — begrenzt wie bei Platzhaltern, siehe services/app/renderSettled.
 */
export const PendingMarker = () => (
  <span
    data-app-pending=""
    aria-hidden="true"
    style={{ position: 'absolute', width: 1, height: 1, pointerEvents: 'none' }}
  />
);
