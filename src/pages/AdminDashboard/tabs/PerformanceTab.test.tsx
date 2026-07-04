// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PerformanceTab } from './PerformanceTab';

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

const PATH = 'admin/performance';

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
});

afterEach(cleanup);

describe('PerformanceTab', () => {
  it('shows the empty state when there is no performance data', () => {
    render(<PerformanceTab theme={theme} />);
    expect(screen.getByText('Noch keine Performance-Daten vorhanden')).toBeInTheDocument();
  });

  it('renders action cards, phase legend and per-user timings', () => {
    fb.store[PATH] = {
      episodes: {
        timestamp: new Date().toISOString(),
        action: 'episodes',
        totalDurationMs: 1000,
        totalDurationFormatted: '1.0s',
        phases: { apiCalls: { ms: 500, formatted: '0.5s', percent: '50%' } },
        users: [{ user: 'user-1', durationMs: 500, durationFormatted: '0.5s', itemCount: 3 }],
        tmdb: { requests: 10, cacheHits: 5, rateLimits: 0, fails: 0 },
      },
    };
    render(<PerformanceTab theme={theme} />);
    expect(screen.getAllByText('1.0s').length).toBeGreaterThan(0);
    expect(screen.getByText('API Calls:')).toBeInTheDocument();
    expect(screen.getByText('Pro User')).toBeInTheDocument();
    expect(screen.getByText('user-1')).toBeInTheDocument();
  });
});
