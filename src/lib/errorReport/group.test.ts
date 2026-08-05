import { describe, expect, it } from 'vitest';
import { groupReports } from './group';
import type { ErrorReport } from '../../types/ErrorReport';

const report = (over: Partial<ErrorReport>): ErrorReport =>
  ({
    id: 'id1',
    fingerprint: 'fp1',
    kind: 'error',
    name: 'TypeError',
    message: 'kaputt',
    uid: 'u1',
    ts: 1000,
    clientTs: '2026-08-05T09:00:00.000Z',
    suppressed: 0,
    env: {},
    breadcrumbs: [],
    ...over,
  }) as ErrorReport;

describe('groupReports', () => {
  it('fasst gleiche Fingerprints zusammen', () => {
    const groups = groupReports([
      report({ id: 'a', ts: 1000 }),
      report({ id: 'b', ts: 2000 }),
      report({ id: 'c', fingerprint: 'fp2', ts: 500 }),
    ]);
    expect(groups).toHaveLength(2);
    expect(groups[0].fingerprint).toBe('fp1');
    expect(groups[0].reports).toBe(2);
  });

  it('zaehlt unterdrueckte Wiederholungen in die Auftreten', () => {
    const groups = groupReports([report({ suppressed: 4 }), report({ id: 'b', suppressed: 1 })]);
    expect(groups[0].occurrences).toBe(7);
  });

  it('zaehlt betroffene Nutzer eindeutig', () => {
    const groups = groupReports([
      report({ uid: 'u1' }),
      report({ id: 'b', uid: 'u1' }),
      report({ id: 'c', uid: 'u2' }),
    ]);
    expect(groups[0].users).toBe(2);
  });

  it('nimmt den juengsten Bericht als latest', () => {
    const groups = groupReports([
      report({ id: 'alt', ts: 1000, message: 'alt' }),
      report({ id: 'neu', ts: 5000, message: 'neu' }),
    ]);
    expect(groups[0].latest.message).toBe('neu');
    expect(groups[0].firstTs).toBe(1000);
    expect(groups[0].lastTs).toBe(5000);
  });

  it('zaehlt nur nicht erledigte Berichte als offen', () => {
    const groups = groupReports([
      report({ id: 'a', status: 'resolved' }),
      report({ id: 'b', status: 'open' }),
    ]);
    expect(groups[0].openCount).toBe(1);
  });

  it('sortiert nach juengstem Auftreten', () => {
    const groups = groupReports([
      report({ fingerprint: 'alt', ts: 100 }),
      report({ id: 'b', fingerprint: 'neu', ts: 900 }),
    ]);
    expect(groups[0].fingerprint).toBe('neu');
  });

  it('ignoriert kaputte Eintraege und leere Listen', () => {
    expect(groupReports([])).toEqual([]);
    expect(groupReports([null as unknown as ErrorReport, report({})])).toHaveLength(1);
  });

  it('vertraegt fehlende Zeitstempel', () => {
    const groups = groupReports([report({ ts: {} as object })]);
    expect(groups[0].firstTs).toBe(0);
  });
});
