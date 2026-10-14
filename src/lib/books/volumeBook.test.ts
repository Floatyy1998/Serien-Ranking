import { describe, expect, it } from 'vitest';
import type { BookSearchResult } from '../../types/Book';
import { pickVolumeBook } from './volumeBook';

const hit = (id: string, title: string, over: Partial<BookSearchResult> = {}) =>
  ({ id, title, authors: [], source: 'google', ...over }) as BookSearchResult;

describe('Band N einer Reihe als Buch', () => {
  const names = ['Bride of the Death God', 'Shinigami no Hanayome: Yomei 7-nichi kara no Koufuku'];

  it('nimmt nur die exakte Bandnummer der Reihe, deutsche Ausgabe mit Cover zuerst', () => {
    const hits = [
      hit('stub', 'Bride of the Death God', { language: 'de' }),
      hit('en2', 'Bride of the Death God 02', { language: 'en', cover: 'c' }),
      hit('fr1', 'Bride of the Death God - Tome 1', { language: 'fr', cover: 'c' }),
      hit('de1-bare', 'Bride of the Death God 01', { language: 'de' }),
      hit('de1', 'Bride of the Death God 01', { language: 'de', cover: 'c' }),
    ];
    expect(pickVolumeBook(hits, names, 1, 'de')?.id).toBe('de1');
    expect(pickVolumeBook(hits, names, 1, 'fr')?.id).toBe('fr1');
    expect(pickVolumeBook(hits, names, 2, 'de')?.id).toBe('en2');
  });

  it('lässt fremde Reihen mit ähnlichem Titel liegen', () => {
    const hits = [hit('x', 'Bride of the Water God 1', { language: 'de', cover: 'c' })];
    expect(pickVolumeBook(hits, names, 1, 'de')).toBeNull();
  });
});
