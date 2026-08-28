// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const updateSpy = vi.hoisted(() => vi.fn(async (_u: Record<string, unknown>) => {}));
const refSpy = vi.hoisted(() => vi.fn((_p: string) => ({ update: updateSpy })));

vi.mock('./db/ref', () => ({
  dbRef: (path: string) => refSpy(path),
  serverTimestamp: () => 'TS',
  userPath: (uid: string, ...rest: string[]) => ['users', uid, ...rest].join('/'),
}));

import { markOnboardingStep, signupProvider } from './onboardingProgress';

beforeEach(() => {
  updateSpy.mockClear();
  refSpy.mockClear();
});

describe('signupProvider', () => {
  it('reduziert die Anmeldearten auf drei bekannte Namen', () => {
    expect(signupProvider('google.com')).toBe('google');
    expect(signupProvider('apple.com')).toBe('apple');
    expect(signupProvider('password')).toBe('passwort');
    expect(signupProvider(undefined)).toBe('unbekannt');
    expect(signupProvider('github.com')).toBe('github.com');
  });
});

describe('markOnboardingStep', () => {
  it('schreibt Schritt und Zeitstempel unter den Nutzerknoten', async () => {
    await markOnboardingStep('u1', 'series');
    expect(refSpy).toHaveBeenCalledWith('users/u1/onboarding');
    expect(updateSpy).toHaveBeenCalledWith({ step: 'series', updatedAt: 'TS' });
  });

  it('setzt startedAt nur beim ersten Schritt und merkt sich die Anmeldeart', async () => {
    await markOnboardingStep('u1', 'welcome', { provider: 'google.com', first: true });
    expect(updateSpy).toHaveBeenCalledWith({
      step: 'welcome',
      updatedAt: 'TS',
      startedAt: 'TS',
      via: 'google',
    });
  });

  it('haelt den Abschluss mit eigenem Zeitstempel fest', async () => {
    await markOnboardingStep('u1', 'finished');
    expect(updateSpy).toHaveBeenCalledWith({ step: 'finished', updatedAt: 'TS', finishedAt: 'TS' });
  });

  it('ohne uid passiert nichts', async () => {
    await markOnboardingStep('', 'series');
    expect(refSpy).not.toHaveBeenCalled();
  });

  it('schluckt Schreibfehler, damit das Onboarding weiterlaeuft', async () => {
    updateSpy.mockRejectedValueOnce(new Error('offline'));
    await expect(markOnboardingStep('u1', 'pet')).resolves.toBeUndefined();
  });
});
