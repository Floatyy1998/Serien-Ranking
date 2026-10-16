import { describe, expect, it } from 'vitest';
import { suggestsReadingHome } from './focusSuggestion';

describe('suggestsReadingHome', () => {
  it('schlägt die Lese-Startseite vor, wenn mehr gelesen als geschaut wird', () => {
    expect(suggestsReadingHome({ watch: 110, read: 169 })).toBe(true);
  });

  it('bleibt still bei Gleichstand, mehr Schauen oder zu wenig Lesestoff', () => {
    expect(suggestsReadingHome({ watch: 20, read: 20 })).toBe(false);
    expect(suggestsReadingHome({ watch: 353, read: 46 })).toBe(false);
    expect(suggestsReadingHome({ watch: 0, read: 4 })).toBe(false);
  });
});
