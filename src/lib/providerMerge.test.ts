import { describe, expect, it, vi } from 'vitest';

// providerMerge importiert transitiv normalizeProviderName aus
// providerChangeDetection, das firebase/compat/app laedt. Firebase minimal
// mocken, damit der Import in der node-Umgebung keine Seiteneffekte hat.
vi.mock('firebase/compat/app', () => ({
  default: {
    database: () => ({ ref: () => ({ once: async () => ({ val: () => null }) }) }),
  },
}));
vi.mock('firebase/compat/database', () => ({}));

import {
  getProviderLogoUrl,
  applyOverrideToProviders,
  resolveProviderOverlay,
  mergeProviders,
  mergeProviderNames,
} from './providerMerge';

const NETFLIX_LOGO = 'https://image.tmdb.org/t/p/w342/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg';
const DISNEY_LOGO = 'https://image.tmdb.org/t/p/w342/7rwgEs15tFwyR9NPQ5vpzxTj19Q.jpg';

describe('getProviderLogoUrl', () => {
  it('liefert die statische Logo-URL fuer einen bekannten normalisierten Namen', () => {
    expect(getProviderLogoUrl('Netflix')).toBe(NETFLIX_LOGO);
  });

  it('undefined fuer unbekannte / nicht-normalisierte Namen', () => {
    expect(getProviderLogoUrl('Disney+')).toBeUndefined(); // nicht normalisiert
    expect(getProviderLogoUrl('Foo')).toBeUndefined();
  });
});

describe('applyOverrideToProviders', () => {
  it('kein Override → Original-Liste durchgereicht', () => {
    const providers = [{ name: 'Netflix', id: 8 }];
    expect(applyOverrideToProviders(providers, null)).toBe(providers);
  });

  it('kein Override + undefined Liste → leeres Array', () => {
    expect(applyOverrideToProviders(undefined, null)).toEqual([]);
  });

  it('leerer Override-String ist falsy → Passthrough', () => {
    const providers = [{ name: 'Netflix' }];
    expect(applyOverrideToProviders(providers, '')).toBe(providers);
  });

  it('Override → einzelnes synthetisches Provider-Objekt mit Logo aus der Map', () => {
    expect(applyOverrideToProviders([{ name: 'Netflix' }], 'Disney Plus')).toEqual([
      { id: undefined, logo: DISNEY_LOGO, name: 'Disney Plus' },
    ]);
  });

  it('Override ohne Map-Eintrag → Logo undefined', () => {
    expect(applyOverrideToProviders([], 'Unbekannt')).toEqual([
      { id: undefined, logo: undefined, name: 'Unbekannt' },
    ]);
  });
});

describe('resolveProviderOverlay', () => {
  it('Override in der Map → dessen URL + Name', () => {
    expect(resolveProviderOverlay('Netflix', null, null)).toEqual({
      src: NETFLIX_LOGO,
      name: 'Netflix',
    });
  });

  it('Override NICHT in der Map → faellt auf Fallback durch (kein Early-Return)', () => {
    expect(resolveProviderOverlay('Unbekannt', '/abc.jpg', 'Fallback')).toEqual({
      src: 'https://image.tmdb.org/t/p/w92/abc.jpg',
      name: 'Fallback',
    });
  });

  it('kein Override, http-Logo → unveraendert', () => {
    expect(resolveProviderOverlay(null, 'https://cdn/x.jpg', 'X')).toEqual({
      src: 'https://cdn/x.jpg',
      name: 'X',
    });
  });

  it('kein Override, relatives Logo → mit TMDB-Prefix', () => {
    expect(resolveProviderOverlay(null, '/rel.jpg', 'X')).toEqual({
      src: 'https://image.tmdb.org/t/p/w92/rel.jpg',
      name: 'X',
    });
  });

  it('kein Fallback-Logo → null', () => {
    expect(resolveProviderOverlay(null, null, 'X')).toBeNull();
    expect(resolveProviderOverlay(null, undefined, 'X')).toBeNull();
  });

  it('fehlender Fallback-Name → leerer String', () => {
    expect(resolveProviderOverlay(null, '/x.jpg', null)).toEqual({
      src: 'https://image.tmdb.org/t/p/w92/x.jpg',
      name: '',
    });
  });
});

describe('mergeProviders', () => {
  it('format-agnostisch: {provider_id, provider_name, logo_path} wird vereinheitlicht', () => {
    const out = mergeProviders({
      catalog: [{ provider_id: 8, provider_name: 'Netflix', logo_path: '/own.jpg' }],
    });
    expect(out).toEqual([{ id: 8, logo: '/own.jpg', name: 'Netflix' }]);
  });

  it('normalisiert Namen (Disney+ → Disney Plus)', () => {
    expect(mergeProviders({ known: ['Disney+'] })).toEqual([
      { id: undefined, logo: DISNEY_LOGO, name: 'Disney Plus' },
    ]);
  });

  it('dedupliziert nach normalisiertem Namen — erste Quelle gewinnt fuer Logo/ID', () => {
    const out = mergeProviders({
      catalog: [{ name: 'Netflix', id: 8, logo: '/catalog.jpg' }],
      known: ['Netflix'],
      live: [{ name: 'netflix', id: 99, logo: '/live.jpg' }],
    });
    expect(out).toEqual([{ id: 8, logo: '/catalog.jpg', name: 'Netflix' }]);
  });

  it('Name-only known-Eintrag bekommt Logo aus der statischen Map nachgereicht', () => {
    expect(mergeProviders({ known: ['Netflix'] })).toEqual([
      { id: undefined, logo: NETFLIX_LOGO, name: 'Netflix' },
    ]);
  });

  it('eigenes Logo gewinnt vor statischem Backfill', () => {
    const out = mergeProviders({ catalog: [{ name: 'Netflix', logo: '/mine.jpg' }] });
    expect(out[0].logo).toBe('/mine.jpg');
  });

  it('Provider dessen Name zu null normalisiert (Channel-Add-on) wird verworfen', () => {
    expect(mergeProviders({ live: [{ name: 'Wow Fiction Amazon Channel' }] })).toEqual([]);
  });

  it('Eintrag ohne Namen wird uebersprungen', () => {
    expect(mergeProviders({ catalog: [{ id: 5 }] })).toEqual([]);
  });

  it('Quellen-Reihenfolge catalog → known → live', () => {
    const out = mergeProviders({
      catalog: [{ name: 'Netflix' }],
      known: ['Disney+'],
      live: [{ name: 'Crunchyroll' }],
    });
    expect(out.map((p) => p.name)).toEqual(['Netflix', 'Disney Plus', 'Crunchyroll']);
  });

  it('leere / fehlende Quellen → leeres Array', () => {
    expect(mergeProviders({})).toEqual([]);
  });
});

describe('mergeProviderNames', () => {
  it('liefert nur die normalisierten Namen, dedupliziert + in Quellen-Reihenfolge', () => {
    expect(
      mergeProviderNames({
        catalog: [{ name: 'amazon' }],
        known: ['Amazon Prime Video', 'Netflix'],
      })
    ).toEqual(['Amazon Prime Video', 'Netflix']);
  });
});
