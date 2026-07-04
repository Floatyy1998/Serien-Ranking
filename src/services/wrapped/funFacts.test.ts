import { describe, expect, it } from 'vitest';
import { generateFunFacts } from './funFacts';
import type { FunFactContext } from './funFacts';

const ctx = (over: Partial<FunFactContext> = {}): FunFactContext => ({
  totalMinutes: 7200,
  totalEpisodes: 100,
  totalMovies: 10,
  topSeries: [],
  mostActiveMonth: {
    month: 6,
    monthName: 'Juni',
    episodesWatched: 25,
    moviesWatched: 5,
    minutesWatched: 1000,
  },
  favoriteTimeOfDay: { timeOfDay: 'night', label: 'Nachts (22-6 Uhr)', count: 10, percentage: 40 },
  ...over,
});

describe('generateFunFacts', () => {
  it('liefert 5 Facts mit Top-Serie in fester Reihenfolge', () => {
    const facts = generateFunFacts(
      ctx({ topSeries: [{ id: 1, title: 'Dark', episodesWatched: 42, minutesWatched: 1890 }] })
    );
    expect(facts.map((f) => f.id)).toEqual([
      'time_flights',
      'time_sleep',
      'top_series',
      'active_month',
      'time_of_day',
    ]);
  });

  it('ohne Top-Serie fehlt der top_series-Fact (4 Facts)', () => {
    const facts = generateFunFacts(ctx({ topSeries: [] }));
    expect(facts.map((f) => f.id)).toEqual([
      'time_flights',
      'time_sleep',
      'active_month',
      'time_of_day',
    ]);
  });

  it('formatiert die deutschen Texte exakt', () => {
    const facts = generateFunFacts(
      ctx({
        totalMinutes: 7200, // 120h → 10 Flüge, 5 Tage
        topSeries: [{ id: 1, title: 'Dark', episodesWatched: 42, minutesWatched: 1890 }],
      })
    );
    expect(facts[0].text).toBe('Mit 120 Stunden könntest du 10 Mal nach New York fliegen ✈️');
    expect(facts[1].text).toBe('Das entspricht 5 Tagen durchgehend schauen - ohne Schlaf!');
    expect(facts[2].text).toBe('"Dark" war dein Favorit mit 42 Episoden');
    expect(facts[3].text).toBe('Dein aktivster Monat war Juni mit 30 Titeln');
  });

  it('time_of_day nutzt lowercase-Label und passendes Emoji', () => {
    const facts = generateFunFacts(ctx());
    const tod = facts.find((f) => f.id === 'time_of_day');
    expect(tod?.text).toBe('Du schaust am liebsten nachts (22-6 uhr)');
    expect(tod?.icon).toBe('🌙');
  });

  it('mappt jede Tageszeit auf ihr Emoji', () => {
    const emoji = (t: FunFactContext['favoriteTimeOfDay']['timeOfDay']) =>
      generateFunFacts(
        ctx({ favoriteTimeOfDay: { timeOfDay: t, label: 'X', count: 1, percentage: 1 } })
      ).find((f) => f.id === 'time_of_day')?.icon;
    expect(emoji('morning')).toBe('🌅');
    expect(emoji('afternoon')).toBe('☀️');
    expect(emoji('evening')).toBe('🌆');
    expect(emoji('night')).toBe('🌙');
  });
});
