/**
 * Schnappschuss der Seite, auf der ein Bug gemeldet wird. Der Bug-Knopf hält
 * ihn fest, bevor er zur Ticketseite navigiert — danach wären Route,
 * Scrollposition und Seitentitel schon die der Ticketseite.
 */
import { truncate } from '../../lib/errorReport/redact';
import type { BugContext } from '../../types/ErrorReport';
import { getBreadcrumbs, getRoutes } from './breadcrumbs';
import { collectEnvironment } from './context';
import { getConsoleLog, getNetworkLog } from './diagnosticLog';
import { getSessionErrorCount } from './errorReporter';

const BUG_REPORT_PATH = '/bug-report';
const STASH_MAX_AGE_MS = 10 * 60 * 1000;

let stashed: { at: number; context: BugContext } | null = null;
let stashedShot: { at: number; blob: Blob } | null = null;

/** `scrollY` vom Seiten-Scroller; die App scrollt in `.mobile-content`, nicht im Fenster. */
export function captureBugContext(scrollY = window.scrollY || 0): BugContext {
  const { route, prevRoute } = getRoutes();
  const onReportPage = route.startsWith(BUG_REPORT_PATH);
  const page = onReportPage ? prevRoute || route : route;
  const title = onReportPage ? '' : truncate(document.title || '', 160);
  return {
    page,
    ...(title ? { pageTitle: title } : {}),
    ...(!onReportPage ? { scrollY: Math.round(scrollY) } : {}),
    capturedAt: new Date().toISOString(),
    env: collectEnvironment(getSessionErrorCount()),
    breadcrumbs: getBreadcrumbs(),
    network: getNetworkLog(),
    console: getConsoleLog(),
  };
}

export function stashBugContext(scrollY?: number): void {
  stashedShot = null;
  try {
    stashed = { at: Date.now(), context: captureBugContext(scrollY) };
  } catch {
    stashed = null;
  }
}

/** Der vom Bug-Knopf festgehaltene Stand, sonst der jetzige. */
export function currentBugContext(): BugContext | null {
  if (stashed && Date.now() - stashed.at < STASH_MAX_AGE_MS) return stashed.context;
  try {
    return captureBugContext();
  } catch {
    return null;
  }
}

/** Nach stashBugContext, damit die Bild-Downloads des Fotos nicht im Netzwerkprotokoll landen. */
export function stashPageShot(shot: Blob | null): void {
  stashedShot = shot ? { at: Date.now(), blob: shot } : null;
}

/** Das Bildschirmfoto, das der Bug-Knopf vor dem Seitenwechsel gemacht hat. */
export function stashedPageShot(): Blob | null {
  return stashedShot && Date.now() - stashedShot.at < STASH_MAX_AGE_MS ? stashedShot.blob : null;
}

export function clearStashedBugContext(): void {
  stashed = null;
  stashedShot = null;
}
