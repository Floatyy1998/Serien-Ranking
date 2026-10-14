import { describe, expect, it } from 'vitest';
import { seriesPlacement } from './bookSeries';

describe('seriesPlacement', () => {
  it('nimmt die eigene Angabe vor Wikidata und Manga-Abgleich', () => {
    expect(
      seriesPlacement({
        title: 'Die Chroniken von Narnia',
        own: { name: 'Narnia', position: 2 },
        linked: { name: 'Die Chroniken von Narnia', position: 5 },
      })
    ).toEqual({ name: 'Narnia', position: 2 });
    expect(
      seriesPlacement({ title: 'Der König von Narnia', linked: { name: 'Narnia', position: 1 } })
    ).toEqual({ name: 'Narnia', position: 1 });
  });

  it('liest die Bandnummer aus dem Titel bei Manga-Bänden und mit „Band"', () => {
    expect(
      seriesPlacement({
        title: 'Bride of the Death God 01',
        manga: { name: 'Bride of the Death God', volume: 1 },
      })
    ).toEqual({ name: 'Bride of the Death God', position: 1 });
    expect(seriesPlacement({ title: 'Die Zwerge, Band 3' })).toEqual({
      name: 'Die Zwerge',
      position: 3,
    });
  });

  it('hält Zahlen im Titel von Romanen nicht für Bände', () => {
    expect(seriesPlacement({ title: '1984' })).toEqual({ name: undefined, position: undefined });
    expect(seriesPlacement({ title: 'Fahrenheit 451' })).toEqual({
      name: undefined,
      position: undefined,
    });
  });
});
