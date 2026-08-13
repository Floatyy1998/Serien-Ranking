// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { APPSTORE_APP_ID } from '../lib/appInstallTarget';
import { DAY_MS, REVIEW_RULES, type ReviewPromptState } from '../lib/reviewPrompt';

const STORAGE_KEY = 'appReviewState';
const NOW = 1_700_000_000_000;

let requestReview: ReturnType<typeof vi.fn>;
let openAppStore: ReturnType<typeof vi.fn>;

/** Setzt die native Hülle auf; `null` = Browser ohne Capacitor. */
function stubCapacitor(platform: 'android' | 'ios' | null, withPlugin = true): void {
  if (!platform) {
    delete (window as { Capacitor?: unknown }).Capacitor;
    return;
  }
  (window as { Capacitor?: unknown }).Capacitor = {
    isNativePlatform: () => true,
    getPlatform: () => platform,
    Plugins: withPlugin ? { AppReview: { requestReview, openAppStore } } : {},
  };
}

function storeState(state: Partial<ReviewPromptState>): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function readState(): ReviewPromptState {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

/** Alter Zustand, dem nur noch ein Erfolgsmoment zur Frage fehlt. */
const almostReady = (): Partial<ReviewPromptState> => ({
  firstSeen: NOW - (REVIEW_RULES.minAgeDays + 1) * DAY_MS,
  moments: REVIEW_RULES.minMoments - 1,
  lastPrompt: 0,
  prompts: 0,
  optedOut: false,
});

/** Frisches Modul je Test — `promptedThisSession` lebt im Modulzustand. */
async function loadModule() {
  vi.resetModules();
  return import('./appReview');
}

beforeEach(() => {
  requestReview = vi.fn(() => Promise.resolve());
  openAppStore = vi.fn(() => Promise.resolve());
  localStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
  delete (window as { Capacitor?: unknown }).Capacitor;
  delete (window as { electronAPI?: unknown }).electronAPI;
});

describe('notePositiveMoment', () => {
  it('tut im Browser nichts und schreibt keinen Zustand', async () => {
    stubCapacitor(null);
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    expect(requestReview).not.toHaveBeenCalled();
  });

  it('tut in einer Hülle ohne Plugin nichts', async () => {
    stubCapacitor('android', false);
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();

    expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('zählt den Moment, fragt bei frischer Installation aber nicht', async () => {
    stubCapacitor('android');
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();

    expect(readState().moments).toBe(1);
    vi.runAllTimers();
    expect(requestReview).not.toHaveBeenCalled();
  });

  it('fragt, sobald genug Momente auf einer alten Installation zusammenkommen', async () => {
    stubCapacitor('android');
    storeState(almostReady());
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();
    vi.runAllTimers();

    expect(requestReview).toHaveBeenCalledTimes(1);
    expect(readState()).toMatchObject({ moments: 0, prompts: 1, lastPrompt: NOW });
  });

  it('fragt erst nach der Verzögerung, damit die Feier zu Ende läuft', async () => {
    stubCapacitor('android');
    storeState(almostReady());
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();
    expect(requestReview).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1500);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it('fragt pro Sitzung höchstens einmal', async () => {
    stubCapacitor('android');
    storeState(almostReady());
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();
    notePositiveMoment();
    notePositiveMoment();
    vi.runAllTimers();

    expect(requestReview).toHaveBeenCalledTimes(1);
    expect(readState().moments).toBe(0);
  });

  it('fragt nicht, wenn der Nutzer bereits selbst bewertet hat', async () => {
    stubCapacitor('android');
    storeState({ ...almostReady(), optedOut: true });
    const { notePositiveMoment } = await loadModule();

    notePositiveMoment();
    vi.runAllTimers();

    expect(requestReview).not.toHaveBeenCalled();
  });

  it('überlebt einen kaputten Zustand im localStorage', async () => {
    stubCapacitor('android');
    localStorage.setItem(STORAGE_KEY, '{kein json');
    const { notePositiveMoment } = await loadModule();

    expect(() => notePositiveMoment()).not.toThrow();
    expect(readState().moments).toBe(1);
  });
});

describe('openStoreListing', () => {
  it('öffnet nativ den Store und schaltet die automatische Frage ab', async () => {
    stubCapacitor('android');
    const { openStoreListing } = await loadModule();

    openStoreListing();

    expect(openAppStore).toHaveBeenCalledWith(undefined);
    expect(readState().optedOut).toBe(true);
  });

  it('reicht auf iOS die Apple-ID durch — ohne sie findet der Store nichts', async () => {
    stubCapacitor('ios');
    const { openStoreListing } = await loadModule();

    openStoreListing();

    expect(openAppStore).toHaveBeenCalledWith({ appId: APPSTORE_APP_ID });
    expect(APPSTORE_APP_ID).not.toBe('');
    expect(requestReview).not.toHaveBeenCalled();
  });

  it('öffnet im Browser die zum Gerät passende Store-Seite', async () => {
    stubCapacitor(null);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { openStoreListing } = await loadModule();

    openStoreListing();

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('play.google.com'),
      '_blank',
      'noopener,noreferrer'
    );
  });

  it('öffnet im iOS-Browser die App-Store-Seite', async () => {
    stubCapacitor(null);
    vi.stubGlobal('navigator', { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)' });
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { openStoreListing } = await loadModule();

    openStoreListing();

    expect(openSpy).toHaveBeenCalledWith(
      `https://apps.apple.com/app/id${APPSTORE_APP_ID}`,
      '_blank',
      'noopener,noreferrer'
    );
    vi.unstubAllGlobals();
  });
});

describe('canOpenStoreListing', () => {
  it('ist im Browser wahr', async () => {
    stubCapacitor(null);
    const { canOpenStoreListing } = await loadModule();
    expect(canOpenStoreListing()).toBe(true);
  });

  it('ist in der nativen Hülle mit Plugin wahr', async () => {
    stubCapacitor('android');
    const { canOpenStoreListing } = await loadModule();
    expect(canOpenStoreListing()).toBe(true);
  });

  it('ist in einer alten Hülle ohne Plugin falsch', async () => {
    stubCapacitor('android', false);
    const { canOpenStoreListing } = await loadModule();
    expect(canOpenStoreListing()).toBe(false);
  });

  it('ist im Desktop-Build falsch', async () => {
    stubCapacitor(null);
    (window as { electronAPI?: unknown }).electronAPI = { isElectron: true };
    const { canOpenStoreListing } = await loadModule();
    expect(canOpenStoreListing()).toBe(false);
  });
});
