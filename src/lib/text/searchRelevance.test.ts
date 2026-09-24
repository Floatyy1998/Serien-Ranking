import { describe, expect, it } from 'vitest';
import { normalizeTitle, rankSearchResults } from './searchRelevance';

describe('normalizeTitle', () => {
  it('entfernt Leerzeichen, Satzzeichen und Akzente', () => {
    expect(normalizeTitle('3 %')).toBe('3');
    expect(normalizeTitle('Élite')).toBe('elite');
    expect(normalizeTitle('Lugar de Mulher')).toBe('lugardemulher');
  });
});

describe('rankSearchResults', () => {
  const results = [
    { id: 1, name: '3 Body Problem', popularity: 31 },
    { id: 2, name: '3 nach 9', popularity: 47 },
    { id: 3, name: '3 %', original_name: '3%', popularity: 10 },
    { id: 4, name: 'Extra 3', popularity: 20 },
  ];

  it('zieht den exakten Titeltreffer vor populärere Treffer', () => {
    expect(rankSearchResults(results, '3%').map((r) => r.id)).toEqual([3, 2, 1, 4]);
  });

  it('matcht auch über den Originaltitel', () => {
    const items = [
      { id: 1, name: 'Anderes', popularity: 50 },
      { id: 2, name: 'Deutscher Titel', original_name: 'Lugar de Mulher', popularity: 1 },
    ];
    expect(rankSearchResults(items, 'lugar de mulher')[0].id).toBe(2);
  });

  it('sortiert ohne exakten Treffer rein nach Popularität', () => {
    expect(rankSearchResults(results, 'body').map((r) => r.id)).toEqual([2, 1, 4, 3]);
  });

  it('boostet nichts bei einer Anfrage nur aus Satzzeichen', () => {
    expect(rankSearchResults(results, '%%').map((r) => r.id)).toEqual([2, 1, 4, 3]);
  });
});
