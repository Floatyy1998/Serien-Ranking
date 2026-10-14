import { describe, expect, it } from 'vitest';
import {
  nameMatchesQuery,
  peopleLeadResults,
  pickPersonHits,
  pickPopularPeople,
} from './personSearch';

const person = (id: number, name: string, popularity: number, profile = true, votes = 500) => ({
  id,
  name,
  popularity,
  profile_path: profile ? `/${id}.jpg` : null,
  known_for_department: 'Acting',
  known_for: [{ name: `Show ${id}`, vote_count: votes }],
});

describe('nameMatchesQuery', () => {
  it('verlangt jedes Suchwort als Wortanfang im Namen', () => {
    expect(nameMatchesQuery('Pedro Pascal', 'pedro')).toBe(true);
    expect(nameMatchesQuery('Pedro Pascal', 'pasc ped')).toBe(true);
    expect(nameMatchesQuery('Pedro Pascal', 'edro')).toBe(false);
    expect(nameMatchesQuery('Pedro Pascal', 'pedro x')).toBe(false);
  });

  it('ignoriert Akzente und Großschreibung', () => {
    expect(nameMatchesQuery('Penélope Cruz', 'PENELOPE')).toBe(true);
  });
});

describe('pickPersonHits', () => {
  it('wirft Personen ohne Foto und ohne Namensbezug raus, beliebteste zuerst', () => {
    const hits = pickPersonHits(
      [
        person(1, 'Emma Roberts', 4),
        person(2, 'Emma Stone', 8),
        person(3, 'Emma Nobody', 0.3, false),
        person(4, 'Jemma Other', 9),
      ],
      'emma'
    );
    expect(hits.map((h) => h.id)).toEqual([2, 1]);
    expect(hits[0]).toMatchObject({ name: 'Emma Stone', knownFor: 'Show 2', department: 'Acting' });
  });

  it('gibt dem exakten Namen Vorrang vor etwas bekannteren Teiltreffern', () => {
    const hits = pickPersonHits(
      [person(1, 'Chris Evanson', 5), person(2, 'Chris Evans', 3)],
      'chris evans'
    );
    expect(hits[0].id).toBe(2);
  });

  it('lässt einen unbekannten Einzelnamen nicht vor einen Star rutschen', () => {
    const hits = pickPersonHits([person(1, 'Pedro', 0.7), person(2, 'Pedro Pascal', 10)], 'pedro');
    expect(hits.map((h) => h.id)).toEqual([2, 1]);
  });

  it('lässt Teiltreffer ohne nennenswert bekannte Titel weg, den exakten Namen aber nicht', () => {
    const hits = pickPersonHits(
      [person(1, 'Yui Star', 20, true, 12), person(2, 'Yui Aragaki', 6, true, 900)],
      'yui'
    );
    expect(hits.map((h) => h.id)).toEqual([2]);
    expect(pickPersonHits([person(1, 'Yui Star', 20, true, 12)], 'yui star')).toHaveLength(1);
  });

  it('nimmt als Untertitel den bekanntesten Titel', () => {
    const [hit] = pickPersonHits(
      [
        {
          ...person(1, 'Pedro Pascal', 10),
          known_for: [
            { name: 'Narcos', vote_count: 3000 },
            { name: 'The Mandalorian', vote_count: 10000 },
          ],
        },
      ],
      'pedro'
    );
    expect(hit.knownFor).toBe('The Mandalorian');
  });

  it('fällt auf bekannte Personen zurück, wenn TMDB nur über Alias-Namen trifft', () => {
    const hits = pickPersonHits([person(1, 'Jackie Chan', 5), person(2, 'Nobody', 0.2)], '成龍');
    expect(hits.map((h) => h.id)).toEqual([1]);
  });
});

describe('peopleLeadResults', () => {
  const pedro = { id: 1, name: 'Pedro Pascal', popularity: 10 };

  it('stellt Personen vorn an, wenn kein Titel exakt passt', () => {
    expect(
      peopleLeadResults([pedro], [{ title: 'Pedro Páramo', popularity: 50 }], 'pedro pascal')
    ).toBe(true);
  });

  it('lässt einen exakt passenden, bekannteren Titel vorn', () => {
    expect(
      peopleLeadResults(
        [{ id: 2, name: 'Bart the Bear', popularity: 1 }],
        [{ title: 'The Bear: King of the Kitchen', original_name: 'The Bear', popularity: 40 }],
        'the bear'
      )
    ).toBe(false);
  });

  it('richtet sich nach der bekanntesten Person, nicht nach der ersten', () => {
    expect(
      peopleLeadResults(
        [
          { id: 3, name: 'Pedro', popularity: 0.7 },
          { id: 1, name: 'Pedro Pascal', popularity: 10 },
        ],
        [{ title: 'Pedro', popularity: 2.6 }],
        'pedro'
      )
    ).toBe(true);
  });

  it('ohne Personen nie', () => {
    expect(peopleLeadResults([], [], 'x')).toBe(false);
  });
});

describe('pickPopularPeople', () => {
  it('zeigt nur Schauspieler mit wirklich bekannten Titeln, ohne Doppelte', () => {
    const hits = pickPopularPeople([
      person(1, 'Tom Holland', 20, true, 24000),
      person(2, 'Unbekannt', 30, true, 22),
      { ...person(3, 'Christopher Nolan', 9, true, 40000), known_for_department: 'Directing' },
      person(1, 'Tom Holland', 20, true, 24000),
      person(4, 'Ohne Bild', 15, false, 9000),
    ]);
    expect(hits.map((h) => h.name)).toEqual(['Tom Holland']);
  });
});
