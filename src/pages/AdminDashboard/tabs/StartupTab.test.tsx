// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

const { dbGetMock, copyMock } = vi.hoisted(() => ({ dbGetMock: vi.fn(), copyMock: vi.fn() }));
vi.mock('../../../services/db/ref', () => ({ dbGet: dbGetMock }));
vi.mock('../../../utils/clipboard', () => ({ copyTextToClipboard: copyMock }));

import { StartupTab } from './StartupTab';

afterEach(() => {
  cleanup();
  dbGetMock.mockReset();
  copyMock.mockReset();
});

const rows = {
  s1: {
    u: 'aaaaaa111',
    ts: 1795126000000,
    t: 2100,
    js: 400,
    a: 700,
    d: 1500,
    r: 1900,
    p: 'ios',
    b: 'b1',
    ttfb: 90,
    hit: 100,
  },
  s2: {
    u: 'bbbbbb222',
    ts: 1795126100000,
    t: 9400,
    js: 6100,
    a: 6500,
    d: 8000,
    r: 9000,
    p: 'android',
    b: 'b1',
    kbps: 320,
    kb: 900,
    hit: 0,
    ct: '3g',
  },
  s3: {
    u: 'aaaaaa111',
    ts: 1795126200000,
    t: 3100,
    js: 800,
    p: 'ios',
    b: 'b1',
    kbps: 24000,
    hit: 40,
  },
};

const { s1, s2, s3 } = rows;
const strip = ({ u: _u, ...rest }: (typeof rows)['s1' | 's2' | 's3']) => rest;
const today = {
  aaaaaa111: { s1: strip(s1), s3: strip(s3) },
  bbbbbb222: { s2: strip(s2) },
};

const NAMES: Record<string, { displayName?: string; username?: string }> = {
  aaaaaa111: { displayName: 'Anna', username: 'anna92' },
  bbbbbb222: { username: 'ben' },
};

/** Der erste Tagesknoten liefert die Messungen, die Namen kommen aus dem Suchindex. */
function serve(day: unknown) {
  let served = false;
  dbGetMock.mockImplementation(async (path: string) => {
    if (path.startsWith('userSearchIndex/')) return NAMES[path.split('/')[1]] ?? null;
    if (served) return null;
    served = true;
    return day;
  });
}

const card = (title: string) => screen.getByText(title).closest('.adm-card') as HTMLElement;

const dayReads = () =>
  dbGetMock.mock.calls.filter(([path]) => String(path).startsWith('analytics/')).length;

describe('StartupTab', () => {
  it('zeigt Kennzahlen und eine Zeile je Konto mit Namen', async () => {
    serve(today);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText('gemessene Starts')).toBeInTheDocument());
    expect(dayReads()).toBe(7);
    expect(screen.getByText('Nach Konto')).toBeInTheDocument();
    expect(screen.getByText('Nach Verbindung')).toBeInTheDocument();
    expect(screen.getByText('Nach Plattform')).toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByText('Anna').length).toBeGreaterThan(0));
    expect(screen.getByText(/anna92/)).toBeInTheDocument();
    expect(screen.getAllByText('ben').length).toBeGreaterThan(0);
  });

  it('nennt die Verbindung für jede Zeile in denselben Einheiten', async () => {
    serve(today);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText('Auffällige Starts')).toBeInTheDocument());
    expect(screen.getAllByText('0,3 Mbit/s').length).toBeGreaterThan(0);
    expect(screen.getAllByText('24 Mbit/s').length).toBeGreaterThan(0);
    expect(screen.queryByText(/3g/)).not.toBeInTheDocument();
  });

  it('listet einzeln nur Starts über 5 s', async () => {
    serve(today);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText('Auffällige Starts')).toBeInTheDocument());
    const notable = within(card('Auffällige Starts'));
    expect(notable.getAllByText('9,4 s')).toHaveLength(1);
    expect(notable.queryByText('2,1 s')).not.toBeInTheDocument();
    expect(notable.queryByText('3,1 s')).not.toBeInTheDocument();
  });

  it('klappt die Starts eines Kontos auf und wieder zu', async () => {
    serve(today);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getAllByText('Anna').length).toBeGreaterThan(0));
    const accounts = within(card('Nach Konto'));
    const row = accounts.getByText('Anna').closest('tr') as HTMLElement;
    // Zugeklappt steht 2,1 s nur als Median des Kontos da.
    expect(accounts.getAllByText('2,1 s')).toHaveLength(1);
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'true');
    expect(accounts.getAllByText('2,1 s')).toHaveLength(2);
    expect(accounts.getByText('App laden')).toBeInTheDocument();
    fireEvent.click(row);
    expect(row).toHaveAttribute('aria-expanded', 'false');
    expect(accounts.getAllByText('2,1 s')).toHaveLength(1);
  });

  it('kennzeichnet Starts, die auf ein Update gewartet haben', async () => {
    serve({
      aaaaaa111: {
        u1: { ts: 1795126300000, t: 12000, js: 1300, a: 1600, d: 2500, r: 3000, p: 'electron' },
      },
    });
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText('Auffällige Starts')).toBeInTheDocument());
    expect(screen.getByText('Update')).toBeInTheDocument();
  });

  it('kopiert alle Zeilen als Tabelle', async () => {
    serve(today);
    copyMock.mockResolvedValue(true);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getAllByText('Anna').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: /Alle 3 Zeilen kopieren/ }));
    await waitFor(() => expect(screen.getByText('Kopiert')).toBeInTheDocument());
    const text = copyMock.mock.calls[0][0] as string;
    expect(text.split('\n')).toHaveLength(4);
    expect(text).toContain('anna92');
    expect(text).toContain('bbbbbb222');
  });

  it('filtert nach Plattform', async () => {
    serve(today);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getAllByText('ben').length).toBeGreaterThan(0));
    fireEvent.click(screen.getByRole('button', { name: 'iOS-App' }));
    expect(screen.queryByText('ben')).not.toBeInTheDocument();
    expect(screen.getAllByText('Anna').length).toBeGreaterThan(0);
  });

  it('erklärt den leeren Zustand und lädt beim Zeitraumwechsel neu', async () => {
    serve(null);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText(/Noch keine Messungen/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Heute' }));
    await waitFor(() => expect(dayReads()).toBe(8));
  });
});
