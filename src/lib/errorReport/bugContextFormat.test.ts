import { describe, expect, it } from 'vitest';
import type { BugContext } from '../../types/ErrorReport';
import {
  beforeReport,
  bugContextToText,
  formatNetworkLine,
  isFailedRequest,
  summarizeBugContext,
} from './bugContextFormat';

const context: BugContext = {
  page: '/series/1396',
  pageTitle: 'Breaking Bad',
  scrollY: 820,
  capturedAt: '2026-11-07T10:00:00.000Z',
  env: {
    route: '/series/1396',
    build: 'abc123',
    platform: 'web',
    language: 'de',
    userAgent: 'UA',
    viewport: '390x844@3',
    online: true,
    sessionAgeMs: 60000,
    visibility: 'visible',
    sessionErrorCount: 0,
  },
  breadcrumbs: [{ t: 55000, type: 'click', label: 'button.add' }],
  network: [
    {
      t: 56000,
      method: 'GET',
      url: '/catalog/seasons/1396.json',
      status: 200,
      ms: 84,
      via: 'fetch',
    },
    { t: 57000, method: 'POST', url: 'https://api/add', status: 500, ms: 310, via: 'fetch' },
    { t: 58000, method: 'GET', url: 'https://api/x', ms: 12, failed: 'TypeError', via: 'xhr' },
  ],
  console: [
    { t: 57500, level: 'error', text: 'Add failed' },
    { t: 57600, level: 'warn', text: 'retrying' },
  ],
};

describe('bugContextFormat', () => {
  it('erkennt fehlgeschlagene Anfragen an Status und Abbruch', () => {
    expect(context.network.map(isFailedRequest)).toEqual([false, true, true]);
  });

  it('zählt Anfragen und Konsolenmeldungen', () => {
    expect(summarizeBugContext(context)).toEqual({
      requests: 3,
      failedRequests: 2,
      consoleErrors: 1,
      consoleWarnings: 1,
    });
  });

  it('formatiert Anfragen kompakt', () => {
    expect(formatNetworkLine(context.network[1])).toBe('POST 500 310 ms https://api/add');
    expect(formatNetworkLine(context.network[2])).toBe('GET ERR TypeError 12 ms https://api/x');
  });

  it('gibt Zeiten relativ zur Meldung an', () => {
    expect(beforeReport(context, 55800)).toBe('-4,2 s');
  });

  it('enthält alle Abschnitte im Klartext', () => {
    const text = bugContextToText(context);
    expect(text).toContain('Seite: /series/1396');
    expect(text).toContain('Scrollposition: 820px');
    expect(text).toContain('POST 500');
    expect(text).toContain('E Add failed');
    expect(text).toContain('W retrying');
  });
});
