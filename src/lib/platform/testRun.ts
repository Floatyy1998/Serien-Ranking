export interface RunSignals {
  protocol: string;
  userAgent: string;
  webdriver: boolean;
}

/**
 * Lokaler Build oder ferngesteuerter Browser (Screenshot-Skripte, Startmessungen, Lighthouse).
 * Die echte App läuft überall über https — auch in den Hüllen, die die Live-Seite laden.
 * Solche Läufe scheitern gern an CORS oder gedrosseltem Netz und gehören nicht in Berichte und Statistik.
 */
export function isTestRun(signals: RunSignals): boolean {
  if (signals.protocol === 'http:') return true;
  if (signals.webdriver) return true;
  return /HeadlessChrome|Chrome-Lighthouse/i.test(signals.userAgent);
}

export function isTestRunHere(): boolean {
  if (typeof location === 'undefined' || typeof navigator === 'undefined') return false;
  return isTestRun({
    protocol: location.protocol,
    userAgent: navigator.userAgent || '',
    webdriver: navigator.webdriver === true,
  });
}
