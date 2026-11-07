/**
 * Lesbare Zeilen aus dem Seitenkontext eines Bug-Tickets — für die Vorschau
 * im Formular, die Admin-Ansicht und den Text-Export.
 */
import type {
  BugContext,
  ConsoleLogEntry,
  ErrorBreadcrumb,
  NetworkLogEntry,
} from '../../types/ErrorReport';
import { buildEnvRows, formatDuration } from './envRows';

export const isFailedRequest = (entry: NetworkLogEntry): boolean =>
  !!entry.failed || !entry.status || entry.status >= 400;

export function formatNetworkLine(entry: NetworkLogEntry): string {
  const outcome = entry.failed ? `ERR ${entry.failed}` : String(entry.status ?? '?');
  return `${entry.method} ${outcome} ${Math.round(entry.ms)} ms ${entry.url}`;
}

export function formatConsoleLine(entry: ConsoleLogEntry): string {
  return `${entry.level === 'error' ? 'E' : 'W'} ${entry.text}`;
}

export function formatCrumbLine(crumb: ErrorBreadcrumb): string {
  return `${crumb.type} ${crumb.label}${crumb.detail ? ` (${crumb.detail})` : ''}`;
}

export interface BugContextSummary {
  requests: number;
  failedRequests: number;
  consoleErrors: number;
  consoleWarnings: number;
}

export function summarizeBugContext(context: BugContext): BugContextSummary {
  const network = context.network || [];
  const consoleLog = context.console || [];
  return {
    requests: network.length,
    failedRequests: network.filter(isFailedRequest).length,
    consoleErrors: consoleLog.filter((c) => c.level === 'error').length,
    consoleWarnings: consoleLog.filter((c) => c.level === 'warn').length,
  };
}

/** Abstand eines Ereignisses zum Moment der Meldung: `-4,2 s`. */
export function beforeReport(context: BugContext, t: number): string {
  const at = context.env?.sessionAgeMs;
  return typeof at === 'number' ? `-${formatDuration(Math.max(0, at - t))}` : formatDuration(t);
}

/** Gesamter Kontext als Klartext (Admin-Export, Kopieren). */
export function bugContextToText(context: BugContext): string {
  const timed = (t: number, line: string) => `  ${beforeReport(context, t)}  ${line}`;
  const env = buildEnvRows(context.env).map((row) => `  ${row.label}: ${row.value}`);
  const lines = [
    `Seite: ${context.page}${context.pageTitle ? ` („${context.pageTitle}")` : ''}`,
    ...(context.scrollY ? [`Scrollposition: ${context.scrollY}px`] : []),
    `Erfasst: ${context.capturedAt}`,
    '',
    'Umgebung:',
    ...env,
    '',
    'Verlauf:',
    ...(context.breadcrumbs || []).map((c) => timed(c.t, formatCrumbLine(c))),
    '',
    'Netzwerk:',
    ...(context.network || []).map((n) => timed(n.t, formatNetworkLine(n))),
    '',
    'Konsole:',
    ...(context.console || []).map((c) => timed(c.t, formatConsoleLine(c))),
  ];
  return lines.join('\n');
}
