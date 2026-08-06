/**
 * Client-Fehlerbericht (RTDB `clientErrors/$id`). Ein Eintrag = ein
 * gemeldetes Auftreten; Wiederholungen werden gedrosselt und über
 * `suppressed` mitgezählt statt einzeln geschrieben.
 */

import type { Locale } from '../i18n/locales';

export type ErrorKind = 'render' | 'error' | 'promise' | 'resource';

export type ErrorPlatform = 'web' | 'pwa' | 'ios' | 'android' | 'electron';

export type BreadcrumbType = 'route' | 'click' | 'fetch' | 'console' | 'visibility' | 'error';

export interface ErrorBreadcrumb {
  /** Millisekunden seit Sitzungsstart. */
  t: number;
  type: BreadcrumbType;
  /** Kurzlabel — Selektor oder Pfad, bewusst kein Freitext aus dem DOM. */
  label: string;
  /** Zusatz wie HTTP-Status oder Fehlername. */
  detail?: string;
}

export interface ErrorEnvironment {
  /** Pfad ohne Query-Werte. */
  route: string;
  prevRoute?: string;
  build: string;
  platform: ErrorPlatform;
  language: Locale;
  userAgent: string;
  /** `1920x1080@2` — Breite x Höhe @ devicePixelRatio. */
  viewport: string;
  /** Anzeigegröße aus den Einstellungen, 1 = unskaliert. */
  displayScale?: number;
  online: boolean;
  /** `4g down=8.2 saveData=0`, falls die Network Information API da ist. */
  connection?: string;
  memoryMb?: number;
  storageUsedMb?: number;
  storageQuotaMb?: number;
  /** Zeit zwischen App-Start und Fehler. */
  sessionAgeMs: number;
  visibility: 'visible' | 'hidden';
  /** Anzahl bereits gemeldeter Fehler in dieser Sitzung (dieser hier zählt mit). */
  sessionErrorCount: number;
}

export interface ErrorReport {
  id: string;
  /** Gruppierschlüssel — gleiche Ursache ergibt denselben Wert. */
  fingerprint: string;
  kind: ErrorKind;
  name: string;
  message: string;
  stack?: string;
  componentStack?: string;
  /** `datei.js:120:33` aus dem window.onerror-Handler. */
  source?: string;
  uid: string;
  /** Server-Zeitstempel (beim Schreiben ein Sentinel-Objekt). */
  ts: number | object;
  clientTs: string;
  /**
   * Wie oft derselbe Fingerprint seit dem letzten geschriebenen Bericht
   * unterdrückt wurde. 0 = dieser Fehler kam genau einmal.
   */
  suppressed: number;
  env: ErrorEnvironment;
  breadcrumbs: ErrorBreadcrumb[];
  status?: 'open' | 'resolved';
}
