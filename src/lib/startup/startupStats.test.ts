import { describe, expect, it } from 'vitest';
import type { StartupSample } from '../../types/StartupSample';
import {
  formatMs,
  formatRate,
  groupSamples,
  measureThroughput,
  netClassOf,
  percentile,
  summarize,
  toSamples,
} from './startupStats';

const sample = (over: Partial<StartupSample>): StartupSample => ({
  u: 'u1',
  ts: 1,
  t: 2000,
  js: 500,
  p: 'web',
  b: 'b1',
  ...over,
});

describe('measureThroughput', () => {
  it('rechnet Bytes über die aktive Zeit in kbit/s um', () => {
    // 125 kB in 1 s = 1000 kbit/s
    expect(measureThroughput([{ start: 0, end: 1000, bytes: 125_000 }])).toBe(1000);
  });

  it('zählt parallele Downloads nicht doppelt und Pausen gar nicht', () => {
    const rate = measureThroughput([
      { start: 0, end: 1000, bytes: 100_000 },
      { start: 200, end: 800, bytes: 100_000 },
      { start: 5000, end: 6000, bytes: 50_000 },
    ]);
    // 250 kB über 2 s aktive Zeit
    expect(rate).toBe(1000);
  });

  it('liefert nichts, wenn zu wenig übertragen wurde', () => {
    expect(measureThroughput([{ start: 0, end: 100, bytes: 10_000 }])).toBeUndefined();
    expect(measureThroughput([])).toBeUndefined();
  });
});

describe('netClassOf', () => {
  it('nimmt die gemessene Rate vor allem anderen', () => {
    expect(netClassOf({ kbps: 250, ttfb: 50, ct: '4g' })).toBe('sehr-langsam');
    expect(netClassOf({ kbps: 1500 })).toBe('langsam');
    expect(netClassOf({ kbps: 5000 })).toBe('mittel');
    expect(netClassOf({ kbps: 40000 })).toBe('schnell');
  });

  it('fällt auf die Antwortzeit zurück, wenn alles aus dem Cache kam', () => {
    expect(netClassOf({ ttfb: 2000 })).toBe('sehr-langsam');
    expect(netClassOf({ ttfb: 800 })).toBe('langsam');
    expect(netClassOf({ ttfb: 300 })).toBe('mittel');
    expect(netClassOf({ ttfb: 90 })).toBe('schnell');
  });

  it('nutzt zuletzt die Angabe des Browsers', () => {
    expect(netClassOf({ ct: '2g' })).toBe('sehr-langsam');
    expect(netClassOf({ ct: '3g' })).toBe('langsam');
    expect(netClassOf({ ct: '4g' })).toBe('schnell');
    expect(netClassOf({})).toBe('unbekannt');
  });
});

describe('percentile / summarize', () => {
  it('bildet Median und 95 % über die Gesamtzeit', () => {
    const values = [1000, 2000, 3000, 4000, 10000];
    expect(percentile(values, 50)).toBe(3000);
    expect(percentile(values, 95)).toBe(10000);
    expect(percentile([], 50)).toBe(0);
  });

  it('zählt Konten, langsame Starts und die Zeit bis zum App-Code', () => {
    const s = summarize([
      sample({ t: 1000, js: 300 }),
      sample({ t: 2000, js: 500, u: 'u2' }),
      sample({ t: 9000, js: 4000, u: 'u2' }),
      sample({ t: 3000, js: 700 }),
    ]);
    expect(s.count).toBe(4);
    expect(s.users).toBe(2);
    expect(s.median).toBe(2000);
    expect(s.slowShare).toBe(25);
    expect(s.medianJs).toBe(500);
  });
});

describe('groupSamples', () => {
  it('gruppiert und sortiert nach Häufigkeit', () => {
    const groups = groupSamples(
      [sample({ p: 'ios' }), sample({ p: 'web' }), sample({ p: 'ios', t: 6000 })],
      (s) => s.p
    );
    expect(groups.map((g) => [g.key, g.count])).toEqual([
      ['ios', 2],
      ['web', 1],
    ]);
    expect(groups[0].slowShare).toBe(50);
  });
});

describe('toSamples', () => {
  it('übernimmt nur Einträge, die wie eine Messung aussehen', () => {
    const out = toSamples({
      u1: {
        a: { t: 1500, js: 200, p: 'ios', b: 'x', ts: 5 },
        b: { t: 'kaputt' },
        c: null,
      },
      u2: { d: { t: 900 } },
      u3: 'kaputt',
    });
    expect(out.map((s) => [s.u, s.t, s.p])).toEqual([
      ['u1', 1500, 'ios'],
      ['u2', 900, 'web'],
    ]);
    expect(toSamples(null)).toEqual([]);
  });
});

describe('Formatierung', () => {
  it('schreibt Zeiten und Raten lesbar', () => {
    expect(formatMs(850)).toBe('850 ms');
    expect(formatMs(2350)).toBe('2,4 s');
    expect(formatMs(undefined)).toBe('–');
    expect(formatRate(640)).toBe('640 kbit/s');
    expect(formatRate(12500)).toBe('12,5 Mbit/s');
  });
});
