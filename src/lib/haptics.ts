/**
 * Haptic feedback helpers.
 *
 * Semantische, app-weite Muster statt magischer `vibrate()`-Zahlen an jeder
 * Stelle. Läuft die App in der nativen Capacitor-Hülle (iOS/Android), wird
 * die echte Haptics-Engine benutzt (Taptic Engine auf iOS — dort gibt es
 * kein `navigator.vibrate`); im Browser fällt alles auf die Vibration API
 * zurück und ist ohne Support ein No-op.
 *
 * Reduced motion wird respektiert: Vibration ist ein Bewegungs-Cue.
 */

interface CapacitorHapticsPlugin {
  impact?: (options: { style: 'HEAVY' | 'MEDIUM' | 'LIGHT' }) => Promise<void>;
  notification?: (options: { type: 'SUCCESS' | 'WARNING' | 'ERROR' }) => Promise<void>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  Plugins?: { Haptics?: CapacitorHapticsPlugin };
}

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

const nativeHaptics = (): CapacitorHapticsPlugin | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.Haptics ?? null;
};

const vibrate = (pattern: number | number[]): void => {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // ignore — some browsers throw if called too frequently
  }
};

const impact = (style: 'HEAVY' | 'MEDIUM' | 'LIGHT', fallback: number | number[]): void => {
  if (prefersReducedMotion()) return;
  const native = nativeHaptics();
  if (native?.impact) {
    native.impact({ style }).catch(() => {});
    return;
  }
  vibrate(fallback);
};

const notify = (type: 'SUCCESS' | 'WARNING' | 'ERROR', fallback: number | number[]): void => {
  if (prefersReducedMotion()) return;
  const native = nativeHaptics();
  if (native?.notification) {
    native.notification({ type }).catch(() => {});
    return;
  }
  vibrate(fallback);
};

/** Lightest touch — taps, toggles, list-item picks. */
export const hapticTap = (): void => impact('LIGHT', 10);

/** Selection change — sort/filter switches, segmented controls. */
export const hapticSelect = (): void => impact('MEDIUM', 15);

/** Confirmation — episode marked, rating saved, item added. */
export const hapticSuccess = (): void => notify('SUCCESS', [20, 30, 20]);

/** Mild warning — destructive confirm, undo prompt. */
export const hapticWarning = (): void => notify('WARNING', [30, 40]);

/** Error — failed action, invalid input. */
export const hapticError = (): void => notify('ERROR', [60, 50, 60]);

/** Celebration — streak milestone, badge unlock, mystery box. */
export const hapticCelebrate = (): void => {
  if (prefersReducedMotion()) return;
  const native = nativeHaptics();
  if (native?.notification) {
    native.notification({ type: 'SUCCESS' }).catch(() => {});
    native.impact?.({ style: 'HEAVY' }).catch(() => {});
    return;
  }
  vibrate([60, 40, 60, 40, 120]);
};
