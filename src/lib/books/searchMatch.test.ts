import { describe, expect, it } from 'vitest';
import { requiredTokens, searchMatch, titlePrefixQuery } from './searchMatch';

const book = (title: string, authors: string[] = [], subtitle?: string) => ({
  title,
  subtitle,
  authors,
});

describe('searchMatch', () => {
  it('lässt Volltext-Rauschen ohne die Titelwörter durchfallen', () => {
    expect(
      searchMatch(book('Der Name des Windes', ['Patrick Rothfuss']), 'Der Name des Windes')
    ).toEqual({ matches: true, inTitle: true, byAuthor: false });
    expect(
      searchMatch(
        book('Mitteilungen des Deutschen Archäologischen Instituts'),
        'Der Name des Windes'
      ).matches
    ).toBe(false);
  });

  it('versteht halb getippte Wörter, Umlaute und fehlende Artikel', () => {
    expect(searchMatch(book('Der Name des Windes'), 'name des wi').matches).toBe(true);
    expect(searchMatch(book('Die Mitternachtsbibliothek'), 'mitternachtsbib').matches).toBe(true);
    expect(searchMatch(book('Schwarm'), 'Der Schwarm').matches).toBe(true);
    expect(searchMatch(book('Gefährliche Liebschaften'), 'gefahrliche').matches).toBe(true);
  });

  it('findet Autorensuchen, aber nur Titeltreffer zählen als Titelsuche', () => {
    expect(searchMatch(book('Es', ['Stephen King']), 'stephen king')).toEqual({
      matches: true,
      inTitle: false,
      byAuthor: true,
    });
    expect(searchMatch(book('Stephen King', ['George Beahm']), 'stephen king')).toEqual({
      matches: true,
      inTitle: true,
      byAuthor: false,
    });
  });

  it('vergleicht Bandnummern als Zahl', () => {
    expect(searchMatch(book('Bride of the Death God 01'), 'Bride of the Death God 1').matches).toBe(
      true
    );
    expect(searchMatch(book('Bride of the Death God 10'), 'Bride of the Death God 1').matches).toBe(
      false
    );
  });

  it('kennt Füllwörter in mehreren Sprachen', () => {
    expect(requiredTokens('The Lord of the Rings')).toEqual(['lord', 'rings']);
    expect(requiredTokens('Die Tribute von Panem')).toEqual(['tribute', 'panem']);
  });
});

describe('titlePrefixQuery', () => {
  it('macht aus dem letzten Wort einen Wortanfang und entschärft Sonderzeichen', () => {
    expect(titlePrefixQuery('Name des Wi')).toBe('title:(Name des Wi*)');
    expect(titlePrefixQuery('Harry Potter: Band 1')).toBe('title:(Harry Potter Band 1)');
    expect(titlePrefixQuery('  ')).toBeNull();
  });
});
