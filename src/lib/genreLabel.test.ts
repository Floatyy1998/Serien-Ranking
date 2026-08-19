import { describe, expect, it, vi } from 'vitest';
import { primaryGenre } from './genreLabel';

const identity = (value: string) => value;

describe('primaryGenre', () => {
  it('nimmt nur das erste Genre', () => {
    expect(primaryGenre('Sci-Fi & Fantasy, Drama', identity)).toBe('Sci-Fi & Fantasy');
  });

  it('behält ein einzelnes Genre unverändert', () => {
    expect(primaryGenre('Drama', identity)).toBe('Drama');
  });

  it('schneidet Leerraum ab', () => {
    expect(primaryGenre('  Krimi , Drama', identity)).toBe('Krimi');
  });

  it('schickt den Wert durch die Übersetzung', () => {
    const translate = vi.fn(() => 'Abenteuer');
    expect(primaryGenre('Adventure, Action', translate)).toBe('Abenteuer');
    expect(translate).toHaveBeenCalledWith('Adventure');
    expect(translate).toHaveBeenCalledTimes(1);
  });

  it('liefert leer bei fehlender Angabe', () => {
    expect(primaryGenre(undefined, identity)).toBe('');
    expect(primaryGenre(null, identity)).toBe('');
    expect(primaryGenre('', identity)).toBe('');
    expect(primaryGenre('   ', identity)).toBe('');
  });
});
