import { describe, expect, it, vi } from 'vitest';

vi.mock('@mui/icons-material', () =>
  Object.fromEntries(
    [
      'AutoFixHigh',
      'Bolt',
      'DarkMode',
      'Favorite',
      'Fingerprint',
      'HistoryEdu',
      'Lightbulb',
      'RocketLaunch',
    ].map((n) => [n, () => null])
  )
);

import { SHELF_SORTS, SHELF_THEMES } from '../../../services/api/bookDiscovery';
import { GENRES } from './genres';

describe('Genre-Untergenres', () => {
  it('hat für jedes Untergenre der Oberfläche eine Abfrage und umgekehrt', () => {
    for (const genre of GENRES) {
      expect(genre.themes.map((th) => th.id).sort()).toEqual(
        Object.keys(SHELF_THEMES[genre.id] ?? {}).sort()
      );
    }
  });

  it('bietet jedem Genre mehrere Sortierungen an', () => {
    for (const genre of GENRES) expect(SHELF_SORTS[genre.id].length).toBeGreaterThan(1);
  });
});
