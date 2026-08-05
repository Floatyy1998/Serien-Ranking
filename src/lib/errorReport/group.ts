/**
 * Bündelt einzelne Berichte zu Fehlergruppen. Interessant ist nicht das
 * einzelne Auftreten, sondern wie viele Nutzer eine Ursache trifft und ob sie
 * noch aktiv ist.
 */
import type { ErrorReport } from '../../types/ErrorReport';

export interface ErrorGroup {
  fingerprint: string;
  /** Geschriebene Berichte. */
  reports: number;
  /** Tatsächliche Auftreten inklusive der gedrosselten Wiederholungen. */
  occurrences: number;
  users: number;
  firstTs: number;
  lastTs: number;
  openCount: number;
  /** Jüngster Bericht der Gruppe — Grundlage der Detailansicht. */
  latest: ErrorReport;
}

const asMillis = (ts: ErrorReport['ts']): number => (typeof ts === 'number' ? ts : 0);

export function groupReports(reports: ErrorReport[]): ErrorGroup[] {
  const byFingerprint = new Map<string, { list: ErrorReport[]; users: Set<string> }>();

  for (const report of reports) {
    if (!report || typeof report !== 'object') continue;
    const key = report.fingerprint || report.id || 'unbekannt';
    const entry = byFingerprint.get(key) || { list: [], users: new Set<string>() };
    entry.list.push(report);
    if (report.uid) entry.users.add(report.uid);
    byFingerprint.set(key, entry);
  }

  const groups: ErrorGroup[] = [];
  for (const [fingerprint, { list, users }] of byFingerprint) {
    const sorted = [...list].sort((a, b) => asMillis(b.ts) - asMillis(a.ts));
    const stamps = list.map((r) => asMillis(r.ts)).filter((n) => n > 0);
    groups.push({
      fingerprint,
      reports: list.length,
      occurrences: list.reduce((sum, r) => sum + 1 + (r.suppressed || 0), 0),
      users: users.size,
      firstTs: stamps.length ? Math.min(...stamps) : 0,
      lastTs: stamps.length ? Math.max(...stamps) : 0,
      openCount: list.filter((r) => r.status !== 'resolved').length,
      latest: sorted[0],
    });
  }

  return groups.sort((a, b) => b.lastTs - a.lastTs);
}
