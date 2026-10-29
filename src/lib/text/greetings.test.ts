import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getGreeting, greetingPools } from './greetings';

// getGreeting waehlt den Slot ueber den `hour`-Parameter, den Tages-Seed aber
// aus `new Date()`. Fake-Timers fixieren das Datum, damit die Auswahl
// deterministisch wird.
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-07-04T08:30:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

// Rekonstruiert die Greeting-Menge eines Slots: bei Offset-Stunde 0 liefert
// getGreeting das erste Element einer tages-geseedeten Permutation. Ueber viele
// Tage deckt shuffled[0] die komplette Slot-Liste ab.
function reconstructSlotTexts(hour: number, days = 2500): Set<string> {
  const texts = new Set<string>();
  const base = Date.UTC(2019, 0, 1, 8, 0, 0);
  for (let i = 0; i < days; i++) {
    vi.setSystemTime(new Date(base + i * 86_400_000));
    texts.add(getGreeting(hour).text);
  }
  return texts;
}

describe('getGreeting — Slot-Zuordnung nach Stunde', () => {
  it('Morgen-Slot (5–11) zieht nur aus den Morgen-Greetings', () => {
    const morning = reconstructSlotTexts(5);
    expect(morning.has('Guten Morgen')).toBe(true);
    expect(morning.has('Hakuna Matata')).toBe(true);
    expect(morning.has('Rise and shine')).toBe(true);
    // Fremd-Slot-Marker duerfen niemals auftauchen.
    expect(morning.has('Gute Nacht')).toBe(false);
    expect(morning.has('Bazinga')).toBe(false);
    expect(morning.has('Winter is coming')).toBe(false);
  });

  it('Nachmittag-Slot (12–16) zieht nur aus den Nachmittags-Greetings', () => {
    const afternoon = reconstructSlotTexts(12);
    expect(afternoon.has('Mahlzeit')).toBe(true);
    expect(afternoon.has('Bazinga')).toBe(true);
    expect(afternoon.has('Hola')).toBe(true);
    expect(afternoon.has('Guten Morgen')).toBe(false);
    expect(afternoon.has('Winter is coming')).toBe(false);
    expect(afternoon.has('Gute Nacht')).toBe(false);
  });

  it('Abend-Slot (17–21) zieht nur aus den Abend-Greetings', () => {
    const evening = reconstructSlotTexts(17);
    expect(evening.has('Guten Abend')).toBe(true);
    expect(evening.has('Winter is coming')).toBe(true);
    expect(evening.has('Say my name')).toBe(true);
    expect(evening.has('Guten Morgen')).toBe(false);
    expect(evening.has('Bazinga')).toBe(false);
  });

  it('Nacht-Slot (22–4) zieht nur aus den Nacht-Greetings', () => {
    const night = reconstructSlotTexts(22);
    expect(night.has('Gute Nacht')).toBe(true);
    expect(night.has('Redrum')).toBe(true);
    expect(night.has('Hodor')).toBe(true);
    expect(night.has('Guten Morgen')).toBe(false);
    expect(night.has('Bazinga')).toBe(false);
  });
});

describe('getGreeting — Slot-Grenzen', () => {
  it('11 gehoert noch zum Morgen, 12 kippt in den Nachmittag', () => {
    const morning = reconstructSlotTexts(5);
    const afternoon = reconstructSlotTexts(12);
    vi.setSystemTime(new Date('2026-07-04T08:30:00Z'));
    expect(morning.has(getGreeting(11).text)).toBe(true);
    expect(afternoon.has(getGreeting(12).text)).toBe(true);
  });

  it('16→17 Grenze (Nachmittag→Abend) und 21→22 Grenze (Abend→Nacht)', () => {
    const afternoon = reconstructSlotTexts(12);
    const evening = reconstructSlotTexts(17);
    const night = reconstructSlotTexts(22);
    vi.setSystemTime(new Date('2026-07-04T08:30:00Z'));
    expect(afternoon.has(getGreeting(16).text)).toBe(true);
    expect(evening.has(getGreeting(17).text)).toBe(true);
    expect(evening.has(getGreeting(21).text)).toBe(true);
    expect(night.has(getGreeting(22).text)).toBe(true);
  });

  it('Fruehe Morgenstunden 0–4 zaehlen als (Vortag-)Nacht', () => {
    const night = reconstructSlotTexts(22);
    vi.setSystemTime(new Date('2026-07-04T08:30:00Z'));
    for (const h of [0, 1, 2, 3, 4]) {
      expect(night.has(getGreeting(h).text)).toBe(true);
    }
    // 23 Uhr ebenfalls Nacht
    expect(night.has(getGreeting(23).text)).toBe(true);
  });
});

describe('getGreeting — Determinismus & Rotation', () => {
  it('gleiche Stunde + gleiches Datum → identisches Greeting', () => {
    vi.setSystemTime(new Date('2026-03-15T00:00:00Z'));
    const a = getGreeting(8);
    const b = getGreeting(8);
    expect(a).toEqual(b);
  });

  it('aufeinanderfolgende Stunden im selben Slot liefern verschiedene Greetings', () => {
    vi.setSystemTime(new Date('2026-07-04T00:00:00Z'));
    const morningTexts = [5, 6, 7, 8, 9, 10, 11].map((h) => getGreeting(h).text);
    expect(new Set(morningTexts).size).toBe(morningTexts.length);
  });

  it('Nacht ueber die beiden Teilbereiche (22,23,0..4) liefert 7 verschiedene Greetings', () => {
    vi.setSystemTime(new Date('2026-07-04T00:00:00Z'));
    const nightHours = [22, 23, 0, 1, 2, 3, 4];
    const texts = nightHours.map((h) => getGreeting(h).text);
    expect(new Set(texts).size).toBe(texts.length);
  });

  it('verschiedene Tage rotieren die Sequenz (Tag A ≠ Tag B fuer dieselbe Stunde, meistens)', () => {
    vi.setSystemTime(new Date('2026-07-04T00:00:00Z'));
    const dayA = getGreeting(8).text;
    vi.setSystemTime(new Date('2026-07-05T00:00:00Z'));
    const dayB = getGreeting(8).text;
    // Kann in Einzelfaellen kollidieren; ueber 3 Tage muss mind. ein Wechsel sein.
    vi.setSystemTime(new Date('2026-07-06T00:00:00Z'));
    const dayC = getGreeting(8).text;
    expect(new Set([dayA, dayB, dayC]).size).toBeGreaterThan(1);
  });

  it('jedes Greeting hat text und lang als nicht-leere Strings', () => {
    for (const h of [7, 14, 19, 23]) {
      const g = getGreeting(h);
      expect(typeof g.text).toBe('string');
      expect(g.text.length).toBeGreaterThan(0);
      expect(typeof g.lang).toBe('string');
      expect(g.lang.length).toBeGreaterThan(0);
    }
  });
});

describe('getGreeting — Reihen ohne frühe Wiederholung', () => {
  const DAY = 86_400_000;
  const ALL_HOURS = Array.from({ length: 24 }, (_, i) => i);
  const SLOT_HOURS = [
    [5, 6, 7, 8, 9, 10, 11],
    [12, 13, 14, 15, 16],
    [17, 18, 19, 20, 21],
    [22, 23, 0, 1, 2, 3, 4],
  ];
  const quotes = new Set(greetingPools('morning').shared.map((g) => g.text));

  function shown(hours: number[], days: number, from = Date.UTC(2027, 2, 1, 12)): string[] {
    const out: string[] = [];
    for (let i = 0; i < days; i++) {
      vi.setSystemTime(new Date(from + i * DAY));
      for (const h of hours) out.push(getGreeting(h).text);
    }
    return out;
  }

  it('Zitate wiederholen sich 30 Tage lang zu keiner Stunde — auch nicht über Slots hinweg', () => {
    const seen = shown(ALL_HOURS, 30).filter((t) => quotes.has(t));
    expect(seen.length).toBeGreaterThan(350);
    expect(new Set(seen).size).toBe(seen.length);
  });

  it('Stunden wechseln zwischen Slot-Gruß und Zitat, am Folgetag versetzt', () => {
    vi.setSystemTime(new Date('2027-03-01T12:00:00'));
    const dayA = SLOT_HOURS[2].map((h) => quotes.has(getGreeting(h).text));
    vi.setSystemTime(new Date('2027-03-02T12:00:00'));
    const dayB = SLOT_HOURS[2].map((h) => quotes.has(getGreeting(h).text));
    const a = dayA[0];
    expect(dayA).toEqual([a, !a, a, !a, a]);
    expect(dayB).toEqual([!a, a, !a, a, !a]);
  });

  it('Slot-Grüße wiederholen sich im eigenen Slot 14 Tage lang nicht', () => {
    for (const hours of SLOT_HOURS) {
      const seen = shown(hours, 14).filter((t) => !quotes.has(t));
      expect(seen.length).toBeGreaterThan(20);
      expect(new Set(seen).size).toBe(seen.length);
    }
  });

  it('zur selben Stunde: 200 Tage kein Zitat, 100 Tage kein Slot-Gruß doppelt', () => {
    for (const h of [8, 14, 19, 23]) {
      const q = shown([h], 200).filter((t) => quotes.has(t));
      expect(q.length).toBe(100);
      expect(new Set(q).size).toBe(q.length);
      const own = shown([h], 100).filter((t) => !quotes.has(t));
      expect(own.length).toBe(50);
      expect(new Set(own).size).toBe(own.length);
    }
  });

  it('jedes Jahr mischt den Pool neu', () => {
    const a: string[] = [];
    const b: string[] = [];
    for (let i = 0; i < 10; i++) {
      vi.setSystemTime(new Date(Date.UTC(2027, 4, 1 + i, 12)));
      a.push(getGreeting(14).text);
      vi.setSystemTime(new Date(Date.UTC(2028, 4, 1 + i, 12)));
      b.push(getGreeting(14).text);
    }
    expect(a).not.toEqual(b);
  });

  it('Zitate-Pool und Slot-Grüße tauchen gemeinsam im Slot auf', () => {
    const morning = reconstructSlotTexts(5, 4000);
    expect(morning.has('Guten Morgen')).toBe(true);
    expect(morning.has('Es gibt keinen Löffel')).toBe(true);
    expect(morning.has('Verdammt guter Kaffee')).toBe(true);
    expect(morning.has('Heute Abend ist die Nacht')).toBe(false);
  });
});

describe('Grüße ohne doppelte Anrede', () => {
  it('kein Gruß endet auf eine Anrede, wenn der Nutzername noch dahinter kommt', () => {
    const texts = new Set<string>();
    for (const slot of ['morning', 'afternoon', 'evening', 'night'] as const) {
      const { own, shared } = greetingPools(slot);
      for (const g of [...own, ...shared]) {
        if (!g.noName && !g.text.includes('{name}')) texts.add(g.text);
      }
    }
    const vocative =
      /, (?:[A-ZÄÖÜ][a-zäöüß]+|mate|love|man|friend|all|everyone|brother|baby|bitch|kree|neighborino|cowboy|pal|dude|kid)$/;
    expect([...texts].filter((t) => vocative.test(t))).toEqual([]);
  });
});
