import { describe, expect, it, vi } from 'vitest';

// providerChangeDetection laedt firebase/compat/app + notificationSettings
// (die ihrerseits firebase laden). Fuer den Test von normalizeProviderName —
// einer reinen Funktion — mocken wir Firebase minimal weg.
vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({ ref: () => ({ once: async () => ({ val: () => null }) }) }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

import { normalizeProviderName } from './providerChangeDetection';

describe('normalizeProviderName — Alias-Mapping', () => {
  it('Netflix (case-insensitiv)', () => {
    expect(normalizeProviderName('Netflix')).toBe('Netflix');
    expect(normalizeProviderName('NETFLIX')).toBe('Netflix');
    expect(normalizeProviderName('netflix')).toBe('Netflix');
  });

  it('Amazon / Prime Video / Freevee → Amazon Prime Video', () => {
    expect(normalizeProviderName('Amazon Prime Video')).toBe('Amazon Prime Video');
    expect(normalizeProviderName('Prime Video')).toBe('Amazon Prime Video');
    expect(normalizeProviderName('Amazon')).toBe('Amazon Prime Video');
    expect(normalizeProviderName('Freevee')).toBe('Amazon Prime Video');
  });

  it('Disney / Paramount / Apple TV / Joyn → Plus-Varianten', () => {
    expect(normalizeProviderName('Disney+')).toBe('Disney Plus');
    expect(normalizeProviderName('Paramount+')).toBe('Paramount Plus');
    expect(normalizeProviderName('Apple TV+')).toBe('Apple TV Plus');
    expect(normalizeProviderName('Joyn')).toBe('Joyn Plus');
  });

  it('HBO-Substring oder exakt "max" → HBO Max', () => {
    expect(normalizeProviderName('HBO Max')).toBe('HBO Max');
    expect(normalizeProviderName('hbo')).toBe('HBO Max');
    expect(normalizeProviderName('Max')).toBe('HBO Max');
    expect(normalizeProviderName('MAX')).toBe('HBO Max');
  });

  it('"maximum" matcht NICHT die exakt-"max"-Regel und ist unbekannt → null', () => {
    expect(normalizeProviderName('maximum')).toBeNull();
  });
});

describe('normalizeProviderName — Channel-Ausschluss (hat Vorrang)', () => {
  it('"… Channel" wird immer verworfen, auch mit Marken-Substring', () => {
    expect(normalizeProviderName('Wow Fiction Amazon Channel')).toBeNull();
    expect(normalizeProviderName('Paramount+ Amazon Channel')).toBeNull();
  });
});

describe('normalizeProviderName — exakte Supported-Fallbacks', () => {
  it('exakt unterstuetzte Namen bleiben erhalten', () => {
    expect(normalizeProviderName('Crunchyroll')).toBe('Crunchyroll');
    expect(normalizeProviderName('MagentaTV')).toBe('MagentaTV');
    expect(normalizeProviderName('RTL+')).toBe('RTL+');
    expect(normalizeProviderName('WOW')).toBe('WOW');
    expect(normalizeProviderName('Animation Digital Network')).toBe('Animation Digital Network');
  });

  it('Whitespace wird NICHT getrimmt → exakter Fallback schlaegt fehl', () => {
    expect(normalizeProviderName(' Crunchyroll')).toBeNull();
    expect(normalizeProviderName('Crunchyroll ')).toBeNull();
  });

  it('unbekannter Name und leerer String → null', () => {
    expect(normalizeProviderName('Sky Ticket')).toBeNull();
    expect(normalizeProviderName('')).toBeNull();
  });
});
