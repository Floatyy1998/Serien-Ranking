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

type NetFields = Pick<StartupSample, 'dn' | 'lat' | 'kbps' | 'ttfb' | 'ct' | 'rtt' | 'dl'>;

/** Download-Rate einer Zeile: der Verbindungstest, sonst die an den App-Dateien gemessene. */
export function rateOf(sample: Pick<StartupSample, 'dn' | 'kbps'>): number | undefined {
  return sample.dn ?? sample.kbps;
}

/** Latenz einer Zeile: der Verbindungstest, sonst die Antwortzeit der Startseite. */
export function latencyOf(sample: Pick<StartupSample, 'lat' | 'ttfb'>): number | undefined {
  return sample.lat ?? sample.ttfb;
}

/** Verbindungsklasse: gemessene Rate vor Antwortzeit vor Browser-Angabe. */
export function netClassOf(sample: NetFields): NetClass {
  const rate = rateOf(sample);
  if (typeof rate === 'number') {
    if (rate < 500) return 'sehr-langsam';
    if (rate < 2000) return 'langsam';
    if (rate < 10000) return 'mittel';
    return 'schnell';
  }
  const latency = latencyOf(sample) ?? sample.rtt;
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
  /** Langsamster Start */
  max: number;
  /** Anteil der Starts über SLOW_START_MS in Prozent */
  slowShare: number;
  /** Median der Zeit, bis der App-Code läuft */
  medianJs: number;
  /** Median der Download-Rate in kbit/s, soweit gemessen */
  medianRate?: number;
  /** Median der Latenz in ms, soweit gemessen */
  medianLatency?: number;
}

function medianOfKnown(values: (number | undefined)[]): number | undefined {
  const known = values.filter((v): v is number => typeof v === 'number');
  return known.length ? percentile(known, 50) : undefined;
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
    max: totals.length ? Math.max(...totals) : 0,
    medianRate: medianOfKnown(samples.map(rateOf)),
    medianLatency: medianOfKnown(samples.map(latencyOf)),
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

/**
 * Liest den Tagesknoten `starts/{uid}/{id}`. Nur Einträge, die wie eine Messung
 * aussehen — die Rules prüfen nicht jedes Feld.
 */
export function toSamples(raw: unknown): StartupSample[] {
  if (!raw || typeof raw !== 'object') return [];
  const out: StartupSample[] = [];
  for (const [uid, rows] of Object.entries(raw as Record<string, unknown>)) {
    if (!rows || typeof rows !== 'object') continue;
    for (const value of Object.values(rows as Record<string, unknown>)) {
      const s = value as Partial<StartupSample> | null;
      if (!s || typeof s !== 'object' || typeof s.t !== 'number' || s.t <= 0) continue;
      out.push({
        ...s,
        u: uid,
        t: s.t,
        ts: typeof s.ts === 'number' ? s.ts : 0,
        js: typeof s.js === 'number' ? s.js : 0,
        p: s.p ?? 'web',
        b: typeof s.b === 'string' ? s.b : '',
      });
    }
  }
  return out;
}

export function formatMs(ms: number | undefined): string {
  if (typeof ms !== 'number') return '–';
  return ms >= 1000 ? `${(ms / 1000).toFixed(1).replace('.', ',')} s` : `${Math.round(ms)} ms`;
}

/** Immer in Mbit/s, damit sich Zeilen untereinander vergleichen lassen. */
export function formatRate(kbps: number | undefined): string {
  if (typeof kbps !== 'number') return '–';
  const mbit = kbps / 1000;
  return `${mbit.toFixed(mbit >= 10 ? 0 : 1).replace('.', ',')} Mbit/s`;
}

export interface StartupNames {
  [uid: string]: { displayName?: string; username?: string } | undefined;
}

export function nameOf(uid: string, names: StartupNames): string {
  const entry = names[uid];
  return entry?.displayName || entry?.username || uid.slice(0, 8);
}

const TSV_HEAD = [
  'Zeit',
  'Name',
  'Nutzername',
  'Konto',
  'Plattform',
  'Build',
  'Gesamt ms',
  'App-Code ms',
  'Anmeldung ms',
  'Daten ms',
  'Aufgebaut ms',
  'Verbindung',
  'Download Mbit/s',
  'Latenz ms',
  'Cache %',
  'Netz laut Browser',
];

const cell = (value: string | number | undefined): string =>
  value === undefined ? '' : String(value).replace(/[\t\r\n]+/g, ' ');

/** Alle Messzeilen als Tabelle zum Einfügen in eine Tabellenkalkulation oder einen Chat. */
export function samplesToTsv(samples: StartupSample[], names: StartupNames): string {
  const rows = [...samples]
    .sort((a, b) => b.ts - a.ts)
    .map((s) => {
      const rate = rateOf(s);
      return [
        s.ts ? new Date(s.ts).toLocaleString('de-DE') : '',
        names[s.u]?.displayName || names[s.u]?.username || '',
        names[s.u]?.username || '',
        s.u,
        s.p,
        s.b,
        s.t,
        s.js,
        s.a,
        s.d,
        s.r,
        NET_CLASS_LABEL[netClassOf(s)],
        typeof rate === 'number' ? (rate / 1000).toFixed(1).replace('.', ',') : undefined,
        latencyOf(s),
        s.hit,
        s.ct,
      ]
        .map(cell)
        .join('\t');
    });
  return [TSV_HEAD.join('\t'), ...rows].join('\n');
}
