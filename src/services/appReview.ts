/**
 * Bewertungs-Aufforderung. Nativ läuft das über den Store-eigenen Dialog
 * (Play In-App-Review bzw. SKStoreReviewController), im Browser bleibt nur der
 * Store-Link. Alles ist bewusst still: fehlt das Plugin (ältere Hülle), passiert
 * nichts.
 *
 * Automatisch gefragt wird nur nach einem Erfolgsmoment und nur so oft, wie
 * `lib/reviewPrompt.ts` es erlaubt. Der Knopf in den Einstellungen öffnet
 * dagegen direkt den Store — Play verschluckt Dialoge stumm, wenn das
 * Kontingent leer ist, und ein Knopf ohne Reaktion wirkt kaputt.
 */

import { APPSTORE_APP_ID, storeUrlForDevice } from '../lib/appInstallTarget';
import {
  afterMoment,
  afterPrompt,
  emptyReviewState,
  normalizeReviewState,
  shouldRequestReview,
  type ReviewPromptState,
} from '../lib/reviewPrompt';

const STORAGE_KEY = 'appReviewState';

/** Der Store-Dialog soll die Abschluss-Animation des Erfolgsmoments nicht zerschneiden. */
const PROMPT_DELAY_MS = 1500;

interface CapacitorAppReviewPlugin {
  requestReview?: () => Promise<void>;
  openAppStore?: (options?: { appId: string }) => Promise<void>;
}

interface CapacitorGlobal {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
  Plugins?: { AppReview?: CapacitorAppReviewPlugin };
}

const getCapacitor = (): CapacitorGlobal | null => {
  if (typeof window === 'undefined') return null;
  const cap = (window as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() ? cap : null;
};

const getPlugin = (): CapacitorAppReviewPlugin | null => getCapacitor()?.Plugins?.AppReview ?? null;

const readState = (now: number): ReviewPromptState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyReviewState(now);
    return normalizeReviewState(JSON.parse(raw), now);
  } catch {
    return emptyReviewState(now);
  }
};

const writeState = (state: ReviewPromptState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Quota voll (iOS Safari) — die Drosselung fällt dann auf den Store zurück */
  }
};

/** Pro Sitzung höchstens eine Frage, auch wenn mehrere Momente zusammenfallen. */
let promptedThisSession = false;

/**
 * Meldet einen Erfolgsmoment (Badge freigeschaltet, Streak-Rekord, Serie
 * abgeschlossen). Erst wenn sich genug davon gesammelt haben, kommt die Frage.
 */
export const notePositiveMoment = (): void => {
  const plugin = getPlugin();
  if (!plugin?.requestReview || promptedThisSession) return;

  const now = Date.now();
  const state = afterMoment(readState(now));

  if (!shouldRequestReview(state, now)) {
    writeState(state);
    return;
  }

  promptedThisSession = true;
  writeState(afterPrompt(state, now));

  window.setTimeout(() => {
    plugin.requestReview?.().catch(() => {});
  }, PROMPT_DELAY_MS);
};

/**
 * Öffnet die Store-Seite. Nach einem bewussten Griff zum Bewerten-Knopf fragt
 * die App nicht mehr von allein nach.
 */
export const openStoreListing = (): void => {
  const now = Date.now();
  writeState({ ...readState(now), optedOut: true });

  const plugin = getPlugin();
  if (plugin?.openAppStore) {
    // Android findet die Seite über den Paketnamen, iOS braucht die Apple-ID.
    const isIOS = getCapacitor()?.getPlatform?.() === 'ios';
    if (isIOS && !APPSTORE_APP_ID) {
      plugin.requestReview?.().catch(() => {});
      return;
    }
    plugin.openAppStore(isIOS ? { appId: APPSTORE_APP_ID } : undefined).catch(() => {});
    return;
  }

  window.open(storeUrlForDevice(), '_blank', 'noopener,noreferrer');
};

/**
 * Der Bewerten-Knopf ergibt nur Sinn, wo ein Store dahinter liegt: in der
 * nativen Hülle mit Plugin oder im Browser (Play-Link). Nicht im Desktop-Build,
 * nicht in einer alten Hülle ohne Plugin.
 */
export const canOpenStoreListing = (): boolean => {
  if (window.electronAPI?.isElectron) return false;
  return getCapacitor() === null || getPlugin() !== null;
};
