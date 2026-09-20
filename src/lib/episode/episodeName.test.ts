import { describe, expect, it } from 'vitest';
import { isGenericEpisodeName } from './episodeName';

describe('isGenericEpisodeName', () => {
  it('erkennt Platzhalter in allen App-Sprachen', () => {
    for (const name of [
      'Folge 8',
      'Episode 8',
      'Épisode 8',
      'Episodio 8',
      'Episódio 8',
      'Capítulo 12',
      'Ep. 3',
      'E4',
      'episode 8',
      '8. Folge',
    ]) {
      expect(isGenericEpisodeName(name), name).toBe(true);
    }
  });

  it('behandelt leere Namen wie Platzhalter', () => {
    expect(isGenericEpisodeName('')).toBe(true);
    expect(isGenericEpisodeName('   ')).toBe(true);
    expect(isGenericEpisodeName(undefined)).toBe(true);
  });

  it('laesst echte Titel stehen', () => {
    for (const name of [
      'Fly',
      'Die Verräter',
      'Episode of Bardock',
      'Folge dem weissen Kaninchen',
      'Kapitel Eins: Verschwunden',
      '8 Uhr 48',
    ]) {
      expect(isGenericEpisodeName(name), name).toBe(false);
    }
  });
});
