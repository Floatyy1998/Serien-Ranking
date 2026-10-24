import type { SecurityFinding } from './SecurityTab';

const TARGET_DIRS: Record<string, string> = {
  App: 'frontend/',
  'Cloud Function': 'frontend/functions/',
};

export const formatDateTime = (ts?: number) => (ts ? new Date(ts).toLocaleString('de-DE') : '—');

export const findingToText = (item: SecurityFinding) => {
  const dir = TARGET_DIRS[item.target];
  return [
    `## ${item.pkg} (${item.severity === 'critical' ? 'Kritisch' : 'Hoch'})`,
    `- Ort: ${item.target}${dir ? ` (${dir})` : ''}, ${
      item.runtime ? 'im ausgelieferten Code' : 'nur Build (Dev-Abhängigkeit)'
    }`,
    ...(item.titles ?? []).map((t) => `- Problem: ${t}`),
    ...(item.urls ?? []).map((u) => `- Advisory: ${u}`),
    `- Fix laut npm audit: ${item.fix}`,
    `- Gemeldet seit: ${formatDateTime(item.firstSeen)}`,
  ].join('\n');
};

export const findingsToText = (items: SecurityFinding[], lastRun?: number) =>
  [
    `CVE-Prüfung (npm audit), Stand ${formatDateTime(lastRun)}: ${items.length} offene Funde`,
    ...items.map(findingToText),
  ].join('\n\n');
