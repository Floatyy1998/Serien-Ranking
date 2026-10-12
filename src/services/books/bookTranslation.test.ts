import { describe, expect, it, vi } from 'vitest';

vi.mock('../api/backendApi', () => ({ backendFetch: vi.fn() }));

import { paragraphBatches } from './bookTranslation';

describe('paragraphBatches', () => {
  it('schickt Absätze ohne Zeilenumbruch und höchstens drei pro Anfrage', () => {
    const text = 'Eins\nmit Umbruch\n\nZwei\n\nDrei\n\nVier';
    const batches = paragraphBatches(text);
    expect(batches).toEqual([
      ['Eins', 'mit Umbruch', 'Zwei'],
      ['Drei', 'Vier'],
    ]);
    expect(batches.flat().every((p) => !p.includes('\n'))).toBe(true);
  });

  it('trennt lange Absätze vor dem Längenlimit des Backends', () => {
    const long = 'x'.repeat(2000);
    expect(paragraphBatches(`${long}\n${long}`)).toHaveLength(2);
  });
});
