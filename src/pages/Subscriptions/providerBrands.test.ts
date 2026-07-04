import { describe, expect, it } from 'vitest';
import { PROVIDER_BRANDS, getProviderBrand } from './providerBrands';

describe('PROVIDER_BRANDS', () => {
  it('jede Marke hat eine gültige color und ein Kürzel (max 3 Zeichen)', () => {
    for (const [name, brand] of Object.entries(PROVIDER_BRANDS)) {
      expect(brand.color, name).toMatch(/^#[0-9a-f]{6}$/i);
      expect(brand.abbr.length, name).toBeGreaterThan(0);
      expect(brand.abbr.length, name).toBeLessThanOrEqual(3);
      if (brand.accent) expect(brand.accent, name).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('enthält die wichtigsten Anbieter', () => {
    expect(PROVIDER_BRANDS.Netflix).toBeDefined();
    expect(PROVIDER_BRANDS['Amazon Prime Video']).toBeDefined();
    expect(PROVIDER_BRANDS.Crunchyroll).toBeDefined();
  });
});

describe('getProviderBrand', () => {
  it('liefert die passende Marke', () => {
    expect(getProviderBrand('Netflix')).toEqual({ color: '#E50914', accent: '#B81D24', abbr: 'N' });
  });

  it('unbekannter Anbieter → Fallback', () => {
    expect(getProviderBrand('Nichtbekannt')).toEqual({ color: '#888888', abbr: '?' });
  });
});
