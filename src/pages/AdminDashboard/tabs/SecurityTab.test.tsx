// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SecurityTab } from './SecurityTab';
import type { SecurityFinding } from './SecurityTab';

const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const snap = (path: string) => ({
    val: () => (path in store ? store[path] : null),
    exists: () => path in store && store[path] != null,
  });
  const makeRef = (path: string) => ({
    on: (_e: string, cb: (s: ReturnType<typeof snap>) => void) => {
      cb(snap(path));
      return cb;
    },
    off: () => {},
  });
  return {
    store,
    database: Object.assign(() => ({ ref: (path?: string) => makeRef(path ?? '') }), {
      ServerValue: { TIMESTAMP: 'ts' },
    }),
  };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const finding = (over: Partial<SecurityFinding> = {}): SecurityFinding => ({
  key: 'App:@capacitor/android:critical:1',
  target: 'App',
  pkg: '@capacitor/android',
  severity: 'critical',
  runtime: true,
  titles: ['Capacitor Android and iOS: remote content can be loaded at the app origin'],
  urls: ['https://github.com/advisories/GHSA-rvm3-566m-v7fv'],
  fix: 'npm audit fix',
  firstSeen: Date.UTC(2026, 9, 22),
  ...over,
});

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
});
afterEach(cleanup);

describe('SecurityTab', () => {
  it('zeigt „Keine offenen Lücken“ ohne Funde', () => {
    fb.store['admin/securityAudit'] = { items: [], lastRun: 1, open: 0 };
    render(<SecurityTab />);
    expect(screen.getByText('Keine offenen Lücken')).toBeTruthy();
  });

  it('listet Funde mit Schwere, Ort und Advisory-Link', () => {
    fb.store['admin/securityAudit'] = {
      items: [
        finding(),
        finding({
          key: 'App:vite:high:2',
          pkg: 'vite',
          severity: 'high',
          runtime: false,
          urls: [],
          titles: [],
        }),
      ],
      runUrl: 'https://github.com/x/actions/runs/1',
    };
    render(<SecurityTab />);
    expect(screen.getByText('@capacitor/android')).toBeTruthy();
    expect(screen.getByText('vite')).toBeTruthy();
    expect(screen.getByText('Nur Build')).toBeTruthy();
    expect(screen.getByText('GHSA-rvm3-566m-v7fv').getAttribute('href')).toBe(
      'https://github.com/advisories/GHSA-rvm3-566m-v7fv'
    );
    expect(
      screen
        .getByText(/Letzter Lauf/)
        .closest('a')
        ?.getAttribute('href')
    ).toBe('https://github.com/x/actions/runs/1');
  });
});
