// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BackendErrorsTab } from './BackendErrorsTab';

const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const snap = (path: string) => ({
    val: () => (path in store ? store[path] : null),
    exists: () => path in store && store[path] != null,
  });
  return {
    store,
    database: () => ({
      ref: (path: string) => ({
        on: (_e: string, cb: (s: ReturnType<typeof snap>) => void) => {
          cb(snap(path));
          return cb;
        },
        off: () => {},
        once: () => Promise.resolve(snap(path)),
        remove: () => Promise.resolve(),
        set: () => Promise.resolve(),
      }),
    }),
  };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const theme = {
  primary: '#00d123',
  text: { primary: '#fff', muted: '#888' },
  background: { paper: '#111' },
};

const PATH = 'admin/backendErrors';

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
});

afterEach(cleanup);

describe('BackendErrorsTab', () => {
  it('shows the all-clear state when there are no backend errors', () => {
    render(<BackendErrorsTab data={{}} theme={theme} />);
    expect(screen.getByText('Keine Backend-Fehler')).toBeInTheDocument();
    expect(screen.getByText('Fehler gesamt')).toBeInTheDocument();
  });

  it('renders errors grouped by context with action pills', () => {
    fb.store[PATH] = {
      episodes: {
        runStart: new Date().toISOString(),
        action: 'episodes',
        errorCount: 1,
        errors: [{ timestamp: new Date().toISOString(), context: 'TMDB', message: 'Boom' }],
      },
    };
    render(<BackendErrorsTab data={{}} theme={theme} />);
    expect(screen.getByText('Boom')).toBeInTheDocument();
    expect(screen.getByText('TMDB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /episodes \(1\)/ })).toBeInTheDocument();
  });
});
