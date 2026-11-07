import { beforeEach, describe, expect, it } from 'vitest';
import {
  getConsoleLog,
  getNetworkLog,
  recordConsole,
  recordRequest,
  resetDiagnosticLog,
} from './diagnosticLog';

describe('diagnosticLog', () => {
  beforeEach(() => resetDiagnosticLog());

  it('entfernt Query-Werte aus Adressen', () => {
    recordRequest({
      t: 1,
      method: 'GET',
      url: 'https://api.example.com/search?q=dark&token=geheim',
      status: 200,
      ms: 12.6,
      via: 'fetch',
    });
    expect(getNetworkLog()[0]).toMatchObject({
      url: 'https://api.example.com/search?q=~&token=~',
      ms: 13,
    });
  });

  it('hält nur die letzten 40 Anfragen', () => {
    for (let i = 0; i < 50; i++) {
      recordRequest({ t: i, method: 'GET', url: `/r/${i}`, status: 200, ms: 1, via: 'fetch' });
    }
    const log = getNetworkLog();
    expect(log).toHaveLength(40);
    expect(log[0].url).toBe('/r/10');
  });

  it('fasst Konsolen-Argumente zu einer Zeile zusammen', () => {
    recordConsole('error', 5, ['Upload fehlgeschlagen:', new TypeError('Failed to fetch')]);
    recordConsole('warn', 6, ['Status', { code: 429 }]);
    expect(getConsoleLog()).toEqual([
      { t: 5, level: 'error', text: 'Upload fehlgeschlagen: TypeError: Failed to fetch' },
      { t: 6, level: 'warn', text: 'Status {"code":429}' },
    ]);
  });
});
