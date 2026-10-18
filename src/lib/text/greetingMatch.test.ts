import { describe, expect, it } from 'vitest';
import { pickGreetingMatch } from './greetingMatch';

describe('pickGreetingMatch', () => {
  it('nimmt bei Titel-Treffern den mit den meisten Stimmen', () => {
    const results = [
      { id: 1, name: 'Dark Matter', original_name: 'Dark Matter', vote_count: 837 },
      { id: 2, name: 'Dark', original_name: 'Dark', vote_count: 8000 },
    ];
    expect(pickGreetingMatch(results, 'Dark')?.id).toBe(2);
  });

  it('findet den Film über den Originaltitel, wenn der deutsche Titel abweicht', () => {
    const results = [
      { id: 10, title: 'Koreanischer Kinderfilm', original_title: 'Kids', vote_count: 0 },
      {
        id: 11,
        title: 'Das fünfte Element',
        original_title: 'The Fifth Element',
        vote_count: 14000,
      },
    ];
    expect(pickGreetingMatch(results, 'The Fifth Element')?.id).toBe(11);
  });

  it('wählt das Original statt einer Fortsetzung, wenn es mehr Stimmen hat', () => {
    const results = [
      { id: 1, title: 'Toy Story 5', original_title: 'Toy Story 5', vote_count: 2644 },
      { id: 2, title: 'Toy Story', original_title: 'Toy Story', vote_count: 18000 },
    ];
    expect(pickGreetingMatch(results, 'Toy Story')?.id).toBe(2);
  });

  it('bevorzugt den exakten Titel vor längeren Titeln mit mehr Stimmen', () => {
    const results = [
      {
        id: 1,
        title: 'Ghost in the Shell',
        original_title: 'Ghost in the Shell',
        vote_count: 8801,
      },
      { id: 2, title: 'Ghost - Nachricht von Sam', original_title: 'Ghost', vote_count: 4200 },
    ];
    expect(pickGreetingMatch(results, 'Ghost')?.id).toBe(2);
  });

  it('übergeht einen kaum bekannten exakten Titel zugunsten der Filmreihe', () => {
    const results = [
      {
        id: 123,
        title: 'Der Herr der Ringe',
        original_title: 'The Lord of the Rings',
        vote_count: 1200,
      },
      {
        id: 120,
        title: 'Der Herr der Ringe - Die Gefährten',
        original_title: 'The Lord of the Rings: The Fellowship of the Ring',
        vote_count: 28608,
      },
    ];
    expect(pickGreetingMatch(results, 'The Lord of the Rings')?.id).toBe(120);
  });

  it('fällt ohne Titel-Treffer auf den bestbewerteten Treffer zurück', () => {
    const results = [
      { id: 1, name: 'Wickie und die starken Männer', original_name: 'ビッケ', vote_count: 60 },
      { id: 2, name: 'Irgendwas', original_name: 'Irgendwas', vote_count: 3 },
    ];
    expect(pickGreetingMatch(results, 'Vicky the Viking')?.id).toBe(1);
  });

  it('liefert null, wenn nichts Brauchbares dabei ist', () => {
    expect(pickGreetingMatch([], 'Dinner for One')).toBeNull();
    expect(pickGreetingMatch([{ id: 1, name: 'Irgendwas', vote_count: 1 }], 'Loriot')).toBeNull();
  });

  it('ignoriert Groß-/Kleinschreibung, Akzente und Satzzeichen', () => {
    const results = [
      { id: 5, name: 'Pokémon', original_name: 'ポケットモンスター', vote_count: 900 },
    ];
    expect(pickGreetingMatch(results, 'Pokemon')?.id).toBe(5);
  });
});
