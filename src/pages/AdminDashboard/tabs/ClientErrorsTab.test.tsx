// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClientErrorsTab } from './ClientErrorsTab';
import type { ErrorReport } from '../../../types/ErrorReport';

const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const updates: Record<string, unknown>[] = [];
  const snap = (path: string) => ({
    val: () => (path in store ? store[path] : null),
    exists: () => path in store && store[path] != null,
  });
  const makeRef = (path: string) => {
    const ref = {
      orderByChild: () => ref,
      limitToLast: () => ref,
      on: (_e: string, cb: (s: ReturnType<typeof snap>) => void) => {
        cb(snap(path));
        return cb;
      },
      off: () => {},
      update: (value: Record<string, unknown>) => {
        updates.push(value);
        return Promise.resolve();
      },
    };
    return ref;
  };
  return {
    store,
    updates,
    database: () => ({ ref: (path?: string) => makeRef(path ?? '') }),
  };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const report = (over: Partial<ErrorReport>): ErrorReport =>
  ({
    id: 'a',
    fingerprint: 'fp1',
    kind: 'error',
    name: 'TypeError',
    message: 'x is not a function',
    uid: 'u1',
    ts: Date.now(),
    clientTs: '2026-08-05T09:00:00.000Z',
    suppressed: 0,
    status: 'open',
    env: { route: '/home', build: '2026-08-05 09:00' },
    breadcrumbs: [{ t: 12, type: 'click', label: 'button#save' }],
    ...over,
  }) as ErrorReport;

const seed = (reports: ErrorReport[]) => {
  fb.store.clientErrors = Object.fromEntries(reports.map((r) => [r.id, r]));
};

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
  fb.updates.length = 0;
});

afterEach(cleanup);

describe('ClientErrorsTab', () => {
  it('zeigt einen Leerzustand ohne Fehler', () => {
    render(<ClientErrorsTab />);
    expect(screen.getByText(/Keine Fehler/)).toBeInTheDocument();
  });

  it('gruppiert Berichte und zeigt Auftreten und Nutzer', () => {
    seed([
      report({ id: 'a', uid: 'u1', suppressed: 2 }),
      report({ id: 'b', uid: 'u2' }),
      report({ id: 'c', fingerprint: 'fp2', message: 'anderer Fehler' }),
    ]);
    const { container } = render(<ClientErrorsTab />);

    expect(screen.getByText(/x is not a function/)).toBeInTheDocument();
    const meta = container.querySelector('.adm-row__meta')?.textContent ?? '';
    expect(meta).toContain('4 Auftreten');
    expect(meta).toContain('2 Nutzer');
    expect(screen.getByText(/anderer Fehler/)).toBeInTheDocument();
  });

  it('blendet erledigte Gruppen aus, bis der Filter aus ist', () => {
    seed([report({ id: 'a', status: 'resolved' })]);
    render(<ClientErrorsTab />);
    expect(screen.getByText(/Keine Fehler/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('nur offene'));
    expect(screen.getByText(/x is not a function/)).toBeInTheDocument();
  });

  it('filtert nach Fehlerart', () => {
    seed([
      report({ id: 'a', kind: 'error' }),
      report({ id: 'b', fingerprint: 'fp2', kind: 'render', message: 'Render kaputt' }),
    ]);
    render(<ClientErrorsTab />);

    fireEvent.click(screen.getByRole('button', { name: 'Render' }));
    expect(screen.getByText(/Render kaputt/)).toBeInTheDocument();
    expect(screen.queryByText(/x is not a function/)).not.toBeInTheDocument();
  });

  it('zeigt Umgebung und Verlauf beim Aufklappen', () => {
    seed([report({ id: 'a' })]);
    render(<ClientErrorsTab />);

    fireEvent.click(screen.getByText(/x is not a function/));
    expect(screen.getByText(/Verlauf vor dem Fehler/)).toBeInTheDocument();
    expect(screen.getByText(/button#save/)).toBeInTheDocument();
    expect(screen.getByText('Route')).toBeInTheDocument();
    expect(screen.getAllByText('/home').length).toBeGreaterThan(0);
    expect(screen.getByText('Klick')).toBeInTheDocument();
  });

  it('markiert eine Gruppe als erledigt', () => {
    seed([report({ id: 'a' }), report({ id: 'b' })]);
    render(<ClientErrorsTab />);

    fireEvent.click(screen.getByTitle('Als erledigt markieren'));
    expect(fb.updates[0]).toEqual({
      'clientErrors/a/status': 'resolved',
      'clientErrors/b/status': 'resolved',
    });
  });

  it('loescht eine Gruppe', () => {
    seed([report({ id: 'a' })]);
    render(<ClientErrorsTab />);

    fireEvent.click(screen.getByTitle('Gruppe löschen'));
    expect(fb.updates[0]).toEqual({ 'clientErrors/a': null });
  });
});
