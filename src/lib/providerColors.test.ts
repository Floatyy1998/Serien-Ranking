import { describe, expect, it } from 'vitest';
import { getProviderColor, PROVIDER_COLORS } from './providerColors';

describe('getProviderColor (D4)', () => {
  it('mappt kanonische Namen direkt', () => {
    expect(getProviderColor('Netflix')).toBe('#e50914');
    expect(getProviderColor('Crunchyroll')).toBe('#f47521');
  });

  it('normalisiert rohe TMDB-Namen vor dem Lookup', () => {
    // TMDB liefert z. B. "Apple TV+" / Ad-Tiers — normalizeProviderName kanonisiert.
    expect(getProviderColor('Apple TV+')).toBe(PROVIDER_COLORS['Apple TV Plus']);
    expect(getProviderColor('Amazon Prime Video with Ads')).toBe(
      PROVIDER_COLORS['Amazon Prime Video']
    );
  });

  it('liefert null für unbekannte oder fehlende Provider', () => {
    expect(getProviderColor('Obscure TV')).toBeNull();
    expect(getProviderColor(undefined)).toBeNull();
    expect(getProviderColor(null)).toBeNull();
  });
});
