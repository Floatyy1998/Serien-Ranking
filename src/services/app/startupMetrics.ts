/**
 * Misst einen App-Start (Dauer je Abschnitt + Verbindung) und legt ihn in der
 * eigenen Erhebung ab — nur mit Einwilligung, siehe analyticsService.
 */
import { isTestRunHere } from '../../lib/platform/testRun';
import { measureThroughput } from '../../lib/startup/startupStats';
import type { StartupSample } from '../../types/StartupSample';
import { detectPlatform } from '../errorReporting/context';
import { getAnalyticsConsent, logAppStart } from '../firebase/analytics';
import { appCodeStartedAt, startupTimings } from './appReady';
import { probeNetwork } from './netProbe';

const DAILY_CAP = 10;
const CAP_KEY = 'startupLogDay';
/** Der Verbindungstest läuft erst, wenn die Startseite zur Ruhe gekommen ist. */
const PROBE_DELAY_MS = 1500;

interface NetworkInformation {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

// Im Hintergrund frieren Timer ein — die Dauer sagt dann nichts über den Start.
let hiddenDuringStart = typeof document !== 'undefined' && document.visibilityState === 'hidden';
const markHidden = () => {
  if (document.visibilityState === 'hidden') hiddenDuringStart = true;
};
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', markHidden);

let recorded = false;

function underDailyCap(): boolean {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [day, count] = (localStorage.getItem(CAP_KEY) || '').split(':');
    const used = day === today ? Number(count) || 0 : 0;
    if (used >= DAILY_CAP) return false;
    localStorage.setItem(CAP_KEY, `${today}:${used + 1}`);
    return true;
  } catch {
    return false;
  }
}

function round(value: number | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? Math.round(value) : undefined;
}

/** Download-Rate und Cache-Anteil der eigenen App-Dateien, Antwortzeit der Startseite. */
export function measureNetwork(): Pick<StartupSample, 'kbps' | 'kb' | 'hit' | 'ttfb'> {
  const out: Pick<StartupSample, 'kbps' | 'kb' | 'hit' | 'ttfb'> = {};
  try {
    const nav = performance.getEntriesByType('navigation')[0] as
      PerformanceNavigationTiming | undefined;
    if (nav && nav.responseStart > 0 && nav.requestStart > 0) {
      out.ttfb = round(nav.responseStart - nav.requestStart);
    }
    const prefix = `${window.location.origin}/assets/`;
    const assets = (performance.getEntriesByType('resource') as PerformanceResourceTiming[]).filter(
      (entry) => entry.name.startsWith(prefix)
    );
    if (assets.length === 0) return out;
    const loaded = assets.filter((entry) => entry.transferSize > 0);
    const cached = assets.filter((entry) => entry.transferSize === 0 && entry.decodedBodySize > 0);
    const bytes = loaded.reduce((sum, entry) => sum + entry.transferSize, 0);
    out.kb = round(bytes / 1000);
    out.hit = round((cached.length / assets.length) * 100);
    out.kbps = measureThroughput(
      loaded.map((entry) => ({
        start: entry.requestStart || entry.fetchStart,
        end: entry.responseEnd,
        bytes: entry.transferSize,
      }))
    );
  } catch {
    // Ohne Timing-API bleibt die Verbindung unbekannt
  }
  return out;
}

function browserConnection(): Pick<StartupSample, 'ct' | 'dl' | 'rtt'> {
  const conn = (navigator as { connection?: NetworkInformation }).connection;
  if (!conn) return {};
  return {
    ...(conn.effectiveType ? { ct: conn.effectiveType } : {}),
    ...(typeof conn.downlink === 'number' ? { dl: conn.downlink } : {}),
    ...(typeof conn.rtt === 'number' ? { rtt: conn.rtt } : {}),
  };
}

/** Einmal je Seitenaufruf, in dem Moment, in dem der Splash weg ist. */
export function recordStartup(): void {
  if (recorded) return;
  recorded = true;
  document.removeEventListener('visibilitychange', markHidden);
  if (import.meta.env.DEV || hiddenDuringStart || isTestRunHere()) return;
  // Ohne Einwilligung wird weder gezählt noch der Verbindungstest geladen.
  if (getAnalyticsConsent() !== true) return;
  const total = round(performance.now());
  if (!total || !underDailyCap()) return;

  const sample: Record<string, string | number> = {
    t: total,
    js: round(appCodeStartedAt) ?? 0,
    p: detectPlatform(),
    b: __APP_BUILD__,
  };
  const optional: Record<string, string | number | undefined> = {
    a: round(startupTimings.auth),
    d: round(startupTimings.initialData),
    r: round(startupTimings.rendered),
    ...measureNetwork(),
    ...browserConnection(),
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value !== undefined) sample[key] = value;
  }
  setTimeout(() => {
    void probeNetwork()
      .catch(() => ({}) as Awaited<ReturnType<typeof probeNetwork>>)
      .then((net) => {
        if (net.lat !== undefined) sample.lat = net.lat;
        if (net.dn !== undefined) sample.dn = net.dn;
        logAppStart(sample);
      });
  }, PROBE_DELAY_MS);
}
