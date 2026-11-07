/**
 * Bildschirmfoto für Bug-Tickets — nur dort, wo die Hülle es nativ kann
 * (Electron: webContents.capturePage, Millisekunden, blockiert nichts).
 *
 * Kein DOM-Rendering (html-to-image): das kopiert für jedes Element alle
 * berechneten Stile, fror auf der echten Startseite den Hauptthread bis zu
 * 15 s ein und ließ iOS den Webprozess beenden.
 */

const TIMEOUT_MS = 1500;

const bridge = () => (typeof window === 'undefined' ? undefined : window.electronAPI);

export function canShootPage(): boolean {
  return typeof bridge()?.capturePage === 'function';
}

/** null, wenn die Hülle kein Foto kann, es scheitert oder zu lange dauert. */
export async function capturePageShot(): Promise<Blob | null> {
  const capture = bridge()?.capturePage;
  if (typeof capture !== 'function') return null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), TIMEOUT_MS);
  });
  try {
    const bytes = await Promise.race([capture().catch(() => null), timeout]);
    if (!bytes || bytes.byteLength === 0) return null;
    return new Blob([bytes as BlobPart], { type: 'image/jpeg' });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
