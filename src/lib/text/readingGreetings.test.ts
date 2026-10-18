import { afterEach, describe, expect, it, vi } from 'vitest';
import { getReadingGreeting, readingGreetingPool } from './readingGreetings';

afterEach(() => {
  vi.useRealTimers();
});

describe('readingGreetingPool', () => {
  it('nimmt bei nur Büchern keine Manga-Zitate auf und umgekehrt', () => {
    expect(readingGreetingPool('evening', 'books').some((g) => g.medium === 'manga')).toBe(false);
    expect(readingGreetingPool('evening', 'manga').some((g) => g.medium === 'books')).toBe(false);
    const both = readingGreetingPool('evening', 'both');
    expect(both.some((g) => g.medium === 'books')).toBe(true);
    expect(both.some((g) => g.medium === 'manga')).toBe(true);
  });

  it('hat in jedem Slot genug Grüße für sieben verschiedene Stunden', () => {
    for (const slot of ['morning', 'afternoon', 'evening', 'night'] as const) {
      for (const areas of ['both', 'books', 'manga'] as const) {
        expect(readingGreetingPool(slot, areas).length).toBeGreaterThan(7);
      }
    }
  });

  it('spricht niemanden mit fremdem Namen an — der eigene Name folgt dahinter', () => {
    const all = readingGreetingPool('morning', 'both');
    for (const g of all) expect(g.text).not.toMatch(/, [A-ZÄÖÜ][a-zäöüß]+$/);
  });
});

describe('getReadingGreeting', () => {
  it('liefert zur selben Stunde denselben Gruß', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T19:00:00'));
    expect(getReadingGreeting(19)).toEqual(getReadingGreeting(19));
  });

  it('wechselt zwischen aufeinanderfolgenden Stunden', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-18T19:00:00'));
    const texts = [17, 18, 19, 20, 21].map((h) => getReadingGreeting(h).text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('gibt Zitaten Werk, Autor und eine Suche mit, eigenen Grüßen nicht', () => {
    vi.useFakeTimers();
    let quote = null;
    let plain = null;
    for (let day = 1; day <= 60 && (!quote || !plain); day++) {
      vi.setSystemTime(new Date(2026, 9, day, 12));
      const g = getReadingGreeting(20);
      if (g.source) quote ??= g;
      else plain ??= g;
    }
    expect(quote?.source).toContain(' · ');
    expect(quote?.search?.query).toBeTruthy();
    expect(plain?.search).toBeNull();
  });
});
