import { describe, expect, it } from 'vitest';
import type { StartupSample } from '../../types/StartupSample';
import {
  formatMs,
  formatRate,
  groupSamples,
  latencyOf,
  measureThroughput,
  nameOf,
  netClassOf,
  percentile,
  rateOf,
  samplesToTsv,
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

  it('nimmt den Verbindungstest vor der Messung an den App-Dateien', () => {
    expect(netClassOf({ dn: 300, kbps: 40000 })).toBe('sehr-langsam');
    expect(rateOf({ dn: 300, kbps: 40000 })).toBe(300);
    expect(rateOf({ kbps: 40000 })).toBe(40000);
    expect(latencyOf({ lat: 70, ttfb: 400 })).toBe(70);
    expect(latencyOf({ ttfb: 400 })).toBe(400);
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
    expect(s.max).toBe(9000);
    expect(s.medianRate).toBeUndefined();
  });

  it('bildet Download und Latenz nur über Zeilen, die sie haben', () => {
    const s = summarize([
      sample({ dn: 4000, lat: 60 }),
      sample({ dn: 20000, lat: 30 }),
      sample({ ttfb: 500 }),
    ]);
    expect(s.medianRate).toBe(4000);
    expect(s.medianLatency).toBe(60);
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
    expect(formatRate(640)).toBe('0,6 Mbit/s');
    expect(formatRate(4200)).toBe('4,2 Mbit/s');
    expect(formatRate(12500)).toBe('13 Mbit/s');
    expect(formatRate(undefined)).toBe('–');
  });
});

describe('Namen und Kopieren', () => {
  const names = { u1: { displayName: 'Anna', username: 'anna92' }, u2: { username: 'ben' } };

  it('zeigt den Anzeigenamen, sonst den Nutzernamen, sonst die Kennung', () => {
    expect(nameOf('u1', names)).toBe('Anna');
    expect(nameOf('u2', names)).toBe('ben');
    expect(nameOf('unbekannt-0123456789', names)).toBe('unbekann');
  });

  it('schreibt alle Zeilen als Tabelle mit Kopfzeile, neueste zuerst', () => {
    const tsv = samplesToTsv(
      [
        sample({ u: 'u1', ts: 1000, t: 2100, js: 400, p: 'ios', dn: 12500, lat: 70, hit: 100 }),
        sample({
          u: 'u2',
          ts: 5000,
          t: 9400,
          js: 6100,
          p: 'android',
          kbps: 320,
          ttfb: 900,
          ct: '3g',
        }),
      ],
      names
    );
    const lines = tsv.split('\n');
    expect(lines).toHaveLength(3);
    const head = lines[0].split('\t');
    const first = lines[1].split('\t');
    const second = lines[2].split('\t');
    expect(head.slice(1, 5)).toEqual(['Name', 'Nutzername', 'Konto', 'Plattform']);
    expect(first.length).toBe(head.length);
    expect(first.slice(1, 5)).toEqual(['ben', 'ben', 'u2', 'android']);
    expect(first[head.indexOf('Download Mbit/s')]).toBe('0,3');
    expect(first[head.indexOf('Latenz ms')]).toBe('900');
    expect(first[head.indexOf('Verbindung')]).toBe('sehr langsam');
    expect(second.slice(1, 3)).toEqual(['Anna', 'anna92']);
    expect(second[head.indexOf('Download Mbit/s')]).toBe('12,5');
  });
});
