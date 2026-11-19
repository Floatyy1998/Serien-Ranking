import type { StartupSample } from '../../types/StartupSample';

export type NetClass = 'sehr-langsam' | 'langsam' | 'mittel' | 'schnell' | 'unbekannt';

export const NET_CLASS_LABEL: Record<NetClass, string> = {
  'sehr-langsam': 'sehr langsam',
  langsam: 'langsam',
  mittel: 'mittel',
  schnell: 'schnell',
  unbekannt: 'unbekannt',
};

export const NET_CLASS_ORDER: NetClass[] = [
  'sehr-langsam',
  'langsam',
  'mittel',
  'schnell',
  'unbekannt',
];

/** Ab hier gilt ein Start als langsam. */
export const SLOW_START_MS = 5000;

interface Transfer {
  start: number;
  end: number;
  bytes: number;
}

/**
 * Download-Rate in kbit/s über die Zeit, in der wirklich übertragen wurde.
 * Parallele Downloads zählen nicht doppelt, Pausen dazwischen gar nicht.
 */
export function measureThroughput(transfers: Transfer[]): number | undefined {
  const valid = transfers.filter((x) => x.bytes > 0 && x.end > x.start);
  const bytes = valid.reduce((sum, x) => sum + x.bytes, 0);
  // Unter 50 kB misst man Verbindungsaufbau statt Durchsatz.
  if (bytes < 50_000) return undefined;
  const sorted = [...valid].sort((a, b) => a.start - b.start);
  let activeMs = 0;
  let curStart = sorted[0].start;
  let curEnd = sorted[0].end;
  for (const x of sorted.slice(1)) {
    if (x.start > curEnd) {
      activeMs += curEnd - curStart;
      curStart = x.start;
      curEnd = x.end;
    } else if (x.end > curEnd) {
      curEnd = x.end;
    }
  }
  activeMs += curEnd - curStart;
  if (activeMs <= 0) return undefined;
  return Math.round((bytes * 8) / activeMs);
}

/** Verbindungsklasse: gemessene Rate vor Antwortzeit vor Browser-Angabe. */
export function netClassOf(
  sample: Pick<StartupSample, 'kbps' | 'ttfb' | 'ct' | 'rtt' | 'dl'>
): NetClass {
  if (typeof sample.kbps === 'number') {
    if (sample.kbps < 500) return 'sehr-langsam';
    if (sample.kbps < 2000) return 'langsam';
    if (sample.kbps < 10000) return 'mittel';
    return 'schnell';
  }
  const latency = sample.ttfb ?? sample.rtt;
  if (typeof latency === 'number') {
    if (latency > 1500) return 'sehr-langsam';
    if (latency > 600) return 'langsam';
    if (latency > 250) return 'mittel';
    return 'schnell';
  }
  if (sample.ct === 'slow-2g' || sample.ct === '2g') return 'sehr-langsam';
  if (sample.ct === '3g') return 'langsam';
  if (sample.ct === '4g') return 'schnell';
  return 'unbekannt';
}

export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[index];
}

export interface StartupSummary {
  count: number;
  users: number;
  median: number;
  p75: number;
  p95: number;
  /** Anteil der Starts über SLOW_START_MS in Prozent */
  slowShare: number;
  /** Median der Zeit, bis der App-Code läuft */
  medianJs: number;
}

export function summarize(samples: StartupSample[]): StartupSummary {
  const totals = samples.map((s) => s.t);
  const slow = samples.filter((s) => s.t > SLOW_START_MS).length;
  return {
    count: samples.length,
    users: new Set(samples.map((s) => s.u)).size,
    median: percentile(totals, 50),
    p75: percentile(totals, 75),
    p95: percentile(totals, 95),
    slowShare: samples.length ? Math.round((slow / samples.length) * 100) : 0,
    medianJs: percentile(
      samples.map((s) => s.js),
      50
    ),
  };
}

export interface StartupGroup extends StartupSummary {
  key: string;
}

export function groupSamples(
  samples: StartupSample[],
  keyOf: (sample: StartupSample) => string
): StartupGroup[] {
  const buckets = new Map<string, StartupSample[]>();
  for (const sample of samples) {
    const key = keyOf(sample);
    const list = buckets.get(key);
    if (list) list.push(sample);
    else buckets.set(key, [sample]);
  }
  return [...buckets.entries()]
    .map(([key, list]) => ({ key, ...summarize(list) }))
    .sort((a, b) => b.count - a.count);
}

/** Nur Einträge, die wie eine Messung aussehen — die Rules prüfen nicht jedes Feld. */
export function toSamples(raw: unknown): StartupSample[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: StartupSample[] = [];
  for (const value of Object.values(raw as Record<string, unknown>)) {
    const s = value as Partial<StartupSample> | null;
    if (!s || typeof s.t !== 'number' || typeof s.u !== 'string' || s.t <= 0) continue;
    out.push({
      ...s,
      u: s.u,
      t: s.t,
      ts: typeof s.ts === 'number' ? s.ts : 0,
      js: typeof s.js === 'number' ? s.js : 0,
      p: s.p ?? 'web',
      b: typeof s.b === 'string' ? s.b : '',
    });
  }
  return out;
}

export function formatMs(ms: number | undefined): string {
  if (typeof ms !== 'number') return '–';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : `${Math.round(ms)} ms`;
}

export function formatRate(kbps: number | undefined): string {
  if (typeof kbps !== 'number') return '–';
  return kbps >= 1000
    ? `${(kbps / 1000).toFixed(1).replace('.', ',')} Mbit/s`
    : `${Math.round(kbps)} kbit/s`;
}
