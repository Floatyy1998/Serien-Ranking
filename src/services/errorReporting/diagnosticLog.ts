/**
 * Netzwerk- und Konsolenprotokoll der laufenden Sitzung. Anders als die
 * Breadcrumbs (nur Fehlschläge) hält es auch erfolgreiche Anfragen samt Dauer
 * fest — es wird nie automatisch gesendet, sondern nur, wenn jemand ein
 * Bug-Ticket mit Seitendaten abschickt.
 */
import { redactUrl, truncate } from '../../lib/errorReport/redact';
import type { ConsoleLogEntry, NetworkLogEntry } from '../../types/ErrorReport';

const MAX_NETWORK = 40;
const MAX_CONSOLE = 25;

let network: NetworkLogEntry[] = [];
let consoleLog: ConsoleLogEntry[] = [];

export const getNetworkLog = (): NetworkLogEntry[] => network.slice();
export const getConsoleLog = (): ConsoleLogEntry[] => consoleLog.slice();

/** Nur für Tests. */
export const resetDiagnosticLog = (): void => {
  network = [];
  consoleLog = [];
};

export function recordRequest(entry: NetworkLogEntry): void {
  network.push({ ...entry, url: redactUrl(entry.url), ms: Math.max(0, Math.round(entry.ms)) });
  if (network.length > MAX_NETWORK) network = network.slice(-MAX_NETWORK);
}

function describeArg(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === 'string') return arg;
  if (arg === null || arg === undefined || typeof arg !== 'object') return String(arg);
  try {
    return truncate(JSON.stringify(arg), 160);
  } catch {
    return Object.prototype.toString.call(arg);
  }
}

export function recordConsole(level: ConsoleLogEntry['level'], t: number, args: unknown[]): void {
  const text = truncate(args.map(describeArg).join(' '), 300);
  if (!text) return;
  consoleLog.push({ t, level, text });
  if (consoleLog.length > MAX_CONSOLE) consoleLog = consoleLog.slice(-MAX_CONSOLE);
}

let xhrInstalled = false;

/** Firebase Storage (Bild-Uploads) läuft über XHR statt fetch. */
export function installXhrLog(now: () => number): void {
  if (xhrInstalled || typeof XMLHttpRequest === 'undefined') return;
  xhrInstalled = true;
  const proto = XMLHttpRequest.prototype;
  const originalOpen = proto.open;
  const originalSend = proto.send;
  const meta = new WeakMap<XMLHttpRequest, { method: string; url: string }>();

  proto.open = function patchedOpen(this: XMLHttpRequest, ...args: unknown[]) {
    meta.set(this, { method: String(args[0] || 'GET').toUpperCase(), url: String(args[1] || '') });
    return (originalOpen as (...a: unknown[]) => void).apply(this, args);
  } as typeof proto.open;

  proto.send = function patchedSend(
    this: XMLHttpRequest,
    body?: Document | XMLHttpRequestBodyInit
  ) {
    const info = meta.get(this);
    if (info) {
      const t = now();
      const started = performance.now();
      this.addEventListener('loadend', () => {
        recordRequest({
          t,
          method: info.method,
          url: info.url,
          ms: performance.now() - started,
          via: 'xhr',
          ...(this.status ? { status: this.status } : { failed: 'network' }),
        });
      });
    }
    return originalSend.call(this, body);
  };
}
