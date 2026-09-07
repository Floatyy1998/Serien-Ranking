import { describe, expect, it } from 'vitest';
import { analyzeDropOff, MIN_DECIDED_USERS, type DropOffEntry } from './dropOff';

const entry = (over: Partial<DropOffEntry> = {}): DropOffEntry => ({
  n: 100,
  d: 40,
  f: 60,
  s: {},
  e: {},
  ...over,
});

describe('analyzeDropOff', () => {
  it('zeigt nichts ohne Daten', () => {
    expect(analyzeDropOff(null).shouldShow).toBe(false);
    expect(analyzeDropOff(undefined).shouldShow).toBe(false);
  });

  it('schweigt unter der Mindestzahl an Entscheidungen', () => {
    const insight = analyzeDropOff(entry({ d: 5, f: 5 }));
    expect(insight.shouldShow).toBe(false);
    expect(insight.decided).toBe(10);
    expect(insight.decided).toBeLessThan(MIN_DECIDED_USERS);
  });

  it('rechnet die Abschlussquote über die Entschiedenen', () => {
    const insight = analyzeDropOff(entry({ d: 40, f: 60 }));
    expect(insight.shouldShow).toBe(true);
    expect(insight.decided).toBe(100);
    expect(insight.completionRate).toBeCloseTo(0.6, 5);
  });

  it('nennt die Staffel mit den meisten Abbrüchen', () => {
    const insight = analyzeDropOff(entry({ d: 40, f: 60, s: { 1: 5, 2: 30, 3: 5 } }));
    expect(insight.worstSeason?.seasonNumber).toBe(2);
    expect(insight.worstSeason?.quitters).toBe(30);
    expect(insight.worstSeason?.share).toBeCloseTo(0.3, 5);
  });

  it('schweigt über eine Staffel, die nicht heraussticht', () => {
    // Gleichmäßig verteilte Abbrüche: keine Staffel ist "die" Ausstiegsstaffel.
    const insight = analyzeDropOff(entry({ d: 40, f: 60, s: { 1: 10, 2: 10, 3: 10, 4: 10 } }));
    expect(insight.worstSeason).toBeNull();
    expect(insight.seasons).toHaveLength(4);
  });

  it('findet den Durchhaltepunkt in Staffel 1', () => {
    // 100 entschieden, 75 durch. 20 steigen bei Folge 1 aus, 5 bei Folge 2.
    // Ab Folge 2 sind noch 80 dabei, davon schauen 75 zu Ende = 94 %.
    const insight = analyzeDropOff(entry({ d: 25, f: 75, e: { 1: 20, 2: 5 } }));
    expect(insight.holdPoint?.episodeNumber).toBe(2);
    expect(insight.holdPoint?.completionAfter).toBeCloseTo(75 / 80, 5);
  });

  it('meldet keinen Durchhaltepunkt, wenn die Serie von Anfang an hält', () => {
    const insight = analyzeDropOff(entry({ d: 10, f: 90, e: { 1: 5, 2: 5 } }));
    expect(insight.holdPoint).toBeNull();
  });

  it('meldet keinen Durchhaltepunkt, wenn die Quote nie hoch genug wird', () => {
    const insight = analyzeDropOff(entry({ d: 60, f: 40, e: { 1: 20, 2: 20, 3: 20 } }));
    expect(insight.holdPoint).toBeNull();
  });

  it('ignoriert kaputte Zähler', () => {
    const broken = {
      n: 100,
      d: 40,
      f: 60,
      s: { '0': 5, x: 3, '2': -2, '3': 30 },
      e: {},
    } as unknown as DropOffEntry;
    const insight = analyzeDropOff(broken);
    expect(insight.seasons.map((s) => s.seasonNumber)).toEqual([3]);
  });

  it('kommt ohne Staffel- und Folgendaten aus', () => {
    const insight = analyzeDropOff(entry({ s: {}, e: {} }));
    expect(insight.shouldShow).toBe(true);
    expect(insight.seasons).toEqual([]);
    expect(insight.worstSeason).toBeNull();
    expect(insight.holdPoint).toBeNull();
  });
});
