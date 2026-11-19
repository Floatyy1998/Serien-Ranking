import { describe, expect, it } from 'vitest';
import { pickDirectors, pickLeadCast } from './filmReleaseData';

describe('pickDirectors', () => {
  it('nimmt nur Regie-Einträge, ohne Dubletten, höchstens zwei', () => {
    const credits = {
      crew: [
        { name: 'Anna Autorin', job: 'Screenplay' },
        { name: 'Jared Bush', job: 'Director' },
        { name: 'Jared Bush', job: 'Director' },
        { name: 'Byron Howard', job: 'Director' },
        { name: 'Dritte Person', job: 'Director' },
      ],
    };
    expect(pickDirectors(credits)).toEqual(['Jared Bush', 'Byron Howard']);
  });

  it('liefert ohne Credits eine leere Liste', () => {
    expect(pickDirectors(undefined)).toEqual([]);
    expect(pickDirectors({})).toEqual([]);
  });
});

describe('pickLeadCast', () => {
  it('sortiert nach order und nimmt die ersten drei', () => {
    const credits = {
      cast: [
        { name: 'Vierte', order: 3 },
        { name: 'Zweite', order: 1 },
        { name: 'Erste', order: 0 },
        { name: 'Ohne Rang' },
        { name: 'Dritte', order: 2 },
      ],
    };
    expect(pickLeadCast(credits)).toEqual(['Erste', 'Zweite', 'Dritte']);
  });

  it('überspringt Einträge ohne Namen', () => {
    expect(pickLeadCast({ cast: [{ order: 0 }, { name: 'Einzige', order: 1 }] })).toEqual([
      'Einzige',
    ]);
  });
});
