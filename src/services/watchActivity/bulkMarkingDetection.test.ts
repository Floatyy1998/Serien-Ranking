/**
 * Tests für die Bulk-Marking-Erkennung.
 *
 * Kernlogik: ab dem 3. Markieren innerhalb von 60 s gilt es als Bulk-Marking;
 * die Timestamps werden dann rückwärts über Abendstunden/Tage verteilt.
 * Der Tracker ist ein Modul-Singleton → vor jedem Test resetModules + frische
 * Import-Instanz, damit die Zähler nicht durchsickern.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Lokale Zeit (kein 'Z'): BASE = 15. Juni 2026, 12:00 lokal.
const BASE = new Date('2026-06-15T12:00:00').getTime();
const EVENING_HOURS = [18, 19, 20, 21, 22, 23];

async function load() {
  return import('./bulkMarkingDetection');
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(BASE);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('checkBulkMarkingAndGetTimestamp – Schwelle', () => {
  it('die ersten zwei Markierungen sind kein Bulk-Marking, die dritte schon', async () => {
    const { checkBulkMarkingAndGetTimestamp } = await load();
    expect(checkBulkMarkingAndGetTimestamp().isBulkMarking).toBe(false);
    expect(checkBulkMarkingAndGetTimestamp().isBulkMarking).toBe(false);

    const third = checkBulkMarkingAndGetTimestamp();
    expect(third.isBulkMarking).toBe(true);
    expect(third.distributedDate).toBeInstanceOf(Date);
  });

  it('kein Bulk-Marking liefert keinen distributedDate', async () => {
    const { checkBulkMarkingAndGetTimestamp } = await load();
    const first = checkBulkMarkingAndGetTimestamp();
    expect(first.isBulkMarking).toBe(false);
    expect(first.distributedDate).toBeUndefined();
  });
});

describe('checkBulkMarkingAndGetTimestamp – Verteilung', () => {
  it('die 3. Markierung landet in der Abendstunde EVENING_HOURS[2]=20 am selben Tag', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { checkBulkMarkingAndGetTimestamp } = await load();
    checkBulkMarkingAndGetTimestamp();
    checkBulkMarkingAndGetTimestamp();
    const third = checkBulkMarkingAndGetTimestamp();

    const d = third.distributedDate as Date;
    // positionInBulk = 2 → daysBack 0, hourIndex 2 → EVENING_HOURS[2] = 20
    expect(d.getHours()).toBe(EVENING_HOURS[2]);
    expect(d.getDate()).toBe(15); // gleicher Tag
    expect(d.getMinutes()).toBe(5); // floor(0*45)+5
    expect(d.getSeconds()).toBe(0); // floor(0*60)
  });

  it('ab der 7. Markierung wird ein Tag zurück verteilt (daysBack 1, hourIndex 0 → 18 Uhr)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { checkBulkMarkingAndGetTimestamp } = await load();
    let last!: { isBulkMarking: boolean; distributedDate?: Date };
    for (let i = 0; i < 7; i++) last = checkBulkMarkingAndGetTimestamp();

    const d = last.distributedDate as Date;
    // positionInBulk = 6 → daysBack floor(6/6)=1, hourIndex 6%6=0 → EVENING_HOURS[0]=18
    expect(d.getHours()).toBe(EVENING_HOURS[0]);
    expect(d.getDate()).toBe(14); // ein Tag zurück
  });

  it('daysBack ist auf 7 Tage gedeckelt (Math.min)', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const { checkBulkMarkingAndGetTimestamp } = await load();
    let last!: { isBulkMarking: boolean; distributedDate?: Date };
    // 49 Markierungen → positionInBulk 48 → daysBack floor(48/6)=8 → auf 7 gedeckelt
    for (let i = 0; i < 49; i++) last = checkBulkMarkingAndGetTimestamp();

    const d = last.distributedDate as Date;
    expect(d.getDate()).toBe(8); // 15 - 7 (nicht 15 - 8)
    expect(d.getHours()).toBe(EVENING_HOURS[48 % 6]); // 48%6=0 → 18
  });

  it('Minuten (5-50) und Sekunden werden aus Math.random abgeleitet', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.999999);
    const { checkBulkMarkingAndGetTimestamp } = await load();
    checkBulkMarkingAndGetTimestamp();
    checkBulkMarkingAndGetTimestamp();
    const third = checkBulkMarkingAndGetTimestamp();
    const d = third.distributedDate as Date;
    expect(d.getMinutes()).toBe(Math.floor(0.999999 * 45) + 5); // 49
    expect(d.getSeconds()).toBe(Math.floor(0.999999 * 60)); // 59
  });
});

describe('checkBulkMarkingAndGetTimestamp – 60s-Fenster', () => {
  it('Einträge exakt 60 s alt fallen aus dem Fenster (< 60000, nicht <=)', async () => {
    const { checkBulkMarkingAndGetTimestamp } = await load();
    checkBulkMarkingAndGetTimestamp(); // t = BASE
    checkBulkMarkingAndGetTimestamp(); // t = BASE
    vi.advanceTimersByTime(60000); // exakt 60 s später
    const r = checkBulkMarkingAndGetTimestamp();
    // beide alten Einträge werden verworfen → nur 1 im Fenster → kein Bulk
    expect(r.isBulkMarking).toBe(false);
  });

  it('knapp innerhalb 60 s (59999 ms) bleibt es Bulk-Marking', async () => {
    const { checkBulkMarkingAndGetTimestamp } = await load();
    checkBulkMarkingAndGetTimestamp();
    checkBulkMarkingAndGetTimestamp();
    vi.advanceTimersByTime(59999);
    const r = checkBulkMarkingAndGetTimestamp();
    expect(r.isBulkMarking).toBe(true);
  });
});
