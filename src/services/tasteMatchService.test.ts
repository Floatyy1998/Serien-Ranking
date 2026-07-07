import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Firebase: users/{id}/series + users/{id}/movies aus einem Pfad-Store.
// ---------------------------------------------------------------------------
const fb = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    once: vi.fn(async (path: string) => ({ val: () => store.get(path) ?? null })),
  };
});
vi.mock('firebase/compat/app', () => ({
  default: { database: () => ({ ref: (p: string) => ({ once: () => fb.once(p) }) }) },
}));
vi.mock('firebase/compat/database', () => ({}));

// staticCatalog: Serien-/Film-Metadaten liefern.
const cat = vi.hoisted(() => ({
  series: vi.fn(async (): Promise<unknown> => ({})),
  movies: vi.fn(async (): Promise<unknown> => ({})),
}));
vi.mock('../services/staticCatalog', () => ({
  fetchStaticCatalogSeries: cat.series,
  fetchStaticCatalogMovies: cat.movies,
}));

// Frisches Modul je Test → userDataCache leer.
async function load() {
  return import('./tasteMatchService');
}

beforeEach(() => {
  vi.resetModules();
  fb.store.clear();
  fb.once.mockClear();
  cat.series.mockReset().mockResolvedValue({});
  cat.movies.mockReset().mockResolvedValue({});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('calculateTasteMatch', () => {
  beforeEach(() => {
    // Katalog
    cat.series.mockResolvedValue({
      '1': { title: 'S1', poster: 'p1', genres: ['Action'], providers: [{ name: 'Netflix' }] },
      '2': { title: 'S2', poster: 'p2', genres: ['Drama'], providers: [{ name: 'Disney' }] },
      '3': { title: 'S3', poster: 'p3', genres: ['Action'], providers: [{ name: 'Netflix' }] },
    });
    cat.movies.mockResolvedValue({
      '10': { title: 'M1', poster: 'pm', genres: ['Comedy'], providers: [{ name: 'Netflix' }] },
    });
    // User A
    fb.store.set('users/A/series', { '1': { rating: { A: 8 } }, '2': { rating: { A: 6 } } });
    fb.store.set('users/A/movies', { '10': { rating: { A: 7 } } });
    // Friend B
    fb.store.set('users/B/series', { '1': { rating: { B: 9 } }, '3': { rating: { B: 7 } } });
    fb.store.set('users/B/movies', { '10': { rating: { B: 7 } } });
  });

  it('berechnet Serien-Overlap-Score und shared-Serien mit rating-Diff', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('A', 'B');

    // unique series {1,2,3}=3, shared {1}=1 → 33
    expect(r.seriesOverlap.score).toBe(33);
    expect(r.seriesOverlap.userOnlyCount).toBe(1);
    expect(r.seriesOverlap.friendOnlyCount).toBe(1);
    expect(r.seriesOverlap.sharedSeries).toHaveLength(1);
    const shared = r.seriesOverlap.sharedSeries[0];
    expect(shared.id).toBe(1);
    expect(shared.title).toBe('S1');
    expect(shared.userRating).toBe(8);
    expect(shared.friendRating).toBe(9);
    expect(shared.ratingDiff).toBe(1);
  });

  it('Film-Overlap = 100 % (einziger Film geteilt)', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('A', 'B');
    expect(r.movieOverlap.score).toBe(100);
    expect(r.movieOverlap.sharedMovies).toHaveLength(1);
  });

  it('Rating-Match: avg-Diff aus shared Serie (1) + Film (0) = 0.5', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('A', 'B');
    expect(r.ratingMatch.averageDifference).toBe(0.5);
    expect(r.ratingMatch.score).toBe(95);
    expect(r.ratingMatch.sameRatingCount).toBe(1); // nur der Film (Diff 0 < 1)
  });

  it('Provider-Match: Netflix geteilt, Disney nicht → 50 %', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('A', 'B');
    expect(r.providerMatch.sharedProviders).toEqual(['Netflix']);
    expect(r.providerMatch.score).toBe(50);
  });

  it('Genre-Match liefert Top-Genres und Score im 0–100-Bereich', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('A', 'B');
    expect(r.genreMatch.userTopGenres).toContain('Action');
    expect(r.genreMatch.score).toBeGreaterThanOrEqual(0);
    expect(r.genreMatch.score).toBeLessThanOrEqual(100);
  });

  it('overallMatch ist ein gewichteter Wert 0–100', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('A', 'B');
    expect(r.overallMatch).toBeGreaterThanOrEqual(0);
    expect(r.overallMatch).toBeLessThanOrEqual(100);
    expect(Number.isInteger(r.overallMatch)).toBe(true);
  });

  it('cached loadUserData: zwei Match-Berechnungen → User A nur einmal aus Firebase', async () => {
    const { calculateTasteMatch } = await load();
    await calculateTasteMatch('A', 'B');
    await calculateTasteMatch('A', 'B'); // beide User jetzt im Session-Cache
    const seriesReads = fb.once.mock.calls.filter((c) => c[0] === 'users/A/series').length;
    expect(seriesReads).toBe(1);
  });
});

describe('calculateTasteMatch — leere Nutzer', () => {
  it('keine Serien/Filme → alle Overlap-Scores 0, Rating-Default 50', async () => {
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('X', 'Y');

    expect(r.seriesOverlap.score).toBe(0);
    expect(r.movieOverlap.score).toBe(0);
    expect(r.genreMatch.score).toBe(0);
    expect(r.providerMatch.score).toBe(0);
    expect(r.ratingMatch.score).toBe(50); // Default ohne Vergleichsdaten
    expect(r.overallMatch).toBeGreaterThanOrEqual(0);
  });

  it('unbekannte Katalog-Einträge → title "Unknown", leere Genres/Provider', async () => {
    fb.store.set('users/X/series', { '999': { rating: { X: 5 } } });
    const { calculateTasteMatch } = await load();
    const r = await calculateTasteMatch('X', 'Y');
    expect(r.seriesOverlap.userOnlyCount).toBe(1);
    expect(r.providerMatch.sharedProviders).toEqual([]);
  });
});
