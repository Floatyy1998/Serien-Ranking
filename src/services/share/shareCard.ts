/**
 * Share-Card-Export: rendert einen DOM-Knoten als PNG und teilt/speichert ihn.
 *
 * Basis ist html-to-image (SVG-foreignObject → Canvas). Externe Bilder
 * (TMDB-Poster, Avatare) werden dabei als Daten-URLs eingebettet — schlägt
 * das fehl (CORS), rendert die Stelle leer statt den Canvas zu tainten.
 * Aufrufer sollten bei einem Fehler die Karte einmal ohne Poster erneut
 * rendern (siehe ShareCardSheet).
 */

import { toBlob } from 'html-to-image';
import { showToast } from '../../lib/interaction/toast';
import { t } from '../i18n';

/** Hintergrundfarbe aus dem aktiven Theme (CSS-Var), Fallback Schwarz. */
function themeBackgroundColor(): string {
  if (typeof document === 'undefined') return '#000000';
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue('--theme-background')
    .trim();
  return value || '#000000';
}

/**
 * Rendert `node` als PNG-Blob (pixelRatio 2 für scharfe Story-Exports).
 * Schlägt das Einbetten der Webfonts fehl (Cross-Origin-CSS), wird einmal
 * ohne Fonts erneut versucht, bevor der Fehler an den Aufrufer geht.
 */
export async function exportNodeAsImage(node: HTMLElement, filename: string): Promise<Blob> {
  const options = {
    pixelRatio: 2,
    // Feste Maße des Knotens selbst: er liegt in einer verkleinerten Vorschau,
    // deren Breite der Export sonst übernimmt.
    width: node.offsetWidth || undefined,
    height: node.offsetHeight || undefined,
    backgroundColor: themeBackgroundColor(),
    // Cache-Busting: verhindert, dass eine bereits ohne CORS gecachte
    // Poster-Response den fetch() beim Einbetten scheitern lässt.
    cacheBust: true,
  };

  let blob: Blob | null;
  try {
    blob = await toBlob(node, options);
  } catch {
    // Font-Einbettung (fontshare-CSS) kann cross-origin scheitern —
    // ohne eingebettete Fonts erneut versuchen (Fallback-Font im Bild).
    blob = await toBlob(node, { ...options, skipFonts: true });
  }

  if (!blob) {
    throw new Error(`Bild-Export fehlgeschlagen (${filename})`);
  }
  return blob;
}

/**
 * Teilt das Bild mit Begleittext über den nativen Share-Dialog (wenn Dateien
 * unterstützt werden), sonst Download. Abbruch durch den User ist kein Fehler.
 *
 * Nur `text`, kein `title` und keine `url`: so haben Messenger die beste
 * Chance, den Text als Bildunterschrift an dasselbe Bild zu hängen. Ob daraus
 * eine oder zwei Nachrichten werden, entscheidet am Ende die Ziel-App.
 */
export async function shareOrDownload(
  blob: Blob,
  filename: string,
  shareText: string
): Promise<void> {
  const file = new File([blob], filename, { type: 'image/png' });

  if (
    typeof navigator !== 'undefined' &&
    typeof navigator.canShare === 'function' &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({ files: [file], text: shareText });
      return;
    } catch (error) {
      // Vom User abgebrochen → still beenden, kein Download aufdrängen.
      if ((error as DOMException)?.name === 'AbortError') return;
      // Anderer Share-Fehler → auf Download zurückfallen.
    }
  }

  downloadImage(blob, filename);
}

/** Speichert das Bild als Datei (Download). */
export function downloadImage(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  try {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast(t('Bild gespeichert'), 2000, 'success');
  } finally {
    // Etwas warten, damit der Download-Klick die URL noch lesen kann.
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }
}

/** Kann dieser Browser Bilder in die Zwischenablage legen? */
export const canCopyImage = (): boolean =>
  typeof navigator !== 'undefined' &&
  typeof navigator.clipboard?.write === 'function' &&
  typeof ClipboardItem !== 'undefined';

/** Legt das Bild in die Zwischenablage, zum Einfügen in Chats oder Bildprogramme. */
export async function copyImage(blob: Blob): Promise<boolean> {
  if (!canCopyImage()) return false;
  try {
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}
