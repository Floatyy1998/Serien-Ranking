// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { dbGetMock } = vi.hoisted(() => ({ dbGetMock: vi.fn() }));
vi.mock('../../../services/db/ref', () => ({ dbGet: dbGetMock }));

import { StartupTab } from './StartupTab';

afterEach(() => {
  cleanup();
  dbGetMock.mockReset();
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

describe('StartupTab', () => {
  it('zeigt Kennzahlen, Gruppen und die langsamsten Starts', async () => {
    dbGetMock.mockResolvedValueOnce(today).mockResolvedValue(null);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText('gemessene Starts')).toBeInTheDocument());
    expect(dbGetMock).toHaveBeenCalledTimes(7);
    expect(screen.getByText('Nach Verbindung')).toBeInTheDocument();
    expect(screen.getByText('Nach Plattform')).toBeInTheDocument();
    expect(screen.getAllByText('9,4 s').length).toBeGreaterThan(0);
    expect(screen.getByText(/sehr langsam \(320 kbit\/s · 3g\)/)).toBeInTheDocument();
    expect(screen.getByText('bbbbbb')).toBeInTheDocument();
  });

  it('filtert nach Plattform', async () => {
    dbGetMock.mockResolvedValueOnce(today).mockResolvedValue(null);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText('Langsamste Starts')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'iOS-App' }));
    expect(screen.queryByText('bbbbbb')).not.toBeInTheDocument();
    expect(screen.getAllByText('aaaaaa')).toHaveLength(2);
  });

  it('erklärt den leeren Zustand und lädt beim Zeitraumwechsel neu', async () => {
    dbGetMock.mockResolvedValue(null);
    render(<StartupTab />);
    await waitFor(() => expect(screen.getByText(/Noch keine Messungen/)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Heute' }));
    await waitFor(() => expect(dbGetMock).toHaveBeenCalledTimes(8));
  });
});
