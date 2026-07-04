// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DataHealthTab } from './DataHealthTab';

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
        set: () => Promise.resolve(),
        remove: () => Promise.resolve(),
        update: () => Promise.resolve(),
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

const PATH = 'admin/dataIntegrityIssues';

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
});

afterEach(cleanup);

describe('DataHealthTab', () => {
  it('shows the all-clear state when there are no issues', () => {
    render(<DataHealthTab data={{}} theme={theme} />);
    expect(screen.getByText('Keine Datenprobleme gefunden')).toBeInTheDocument();
    expect(screen.getByText('Datenprobleme')).toBeInTheDocument();
  });

  it('renders per-user issues with problem descriptions', () => {
    fb.store[PATH] = {
      u1: {
        timestamp: new Date().toISOString(),
        userName: 'Max',
        issueCount: 1,
        issues: [
          {
            type: 'empty-season',
            seriesName: 'Lost',
            seriesKey: '1',
            seasonIndex: 0,
            episodeIndex: -1,
            firebasePath: 'users/x/seriesWatch',
            problem: 'Leere Staffel entdeckt',
            storedFields: [],
            storedValues: {},
          },
        ],
      },
    };
    render(<DataHealthTab data={{}} theme={theme} />);
    expect(screen.getByText('Max')).toBeInTheDocument();
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText('Leere Staffel entdeckt')).toBeInTheDocument();
    // type label appears as filter pill + badge
    expect(screen.getAllByText(/Leere Staffeln/).length).toBeGreaterThan(0);
  });

  it('keeps the issue visible after clicking its type filter pill', () => {
    fb.store[PATH] = {
      u1: {
        timestamp: new Date().toISOString(),
        userName: 'Max',
        issueCount: 1,
        issues: [
          {
            type: 'empty-season',
            seriesName: 'Lost',
            seriesKey: '1',
            seasonIndex: 0,
            episodeIndex: -1,
            firebasePath: 'users/x',
            problem: 'p',
            storedFields: [],
            storedValues: {},
          },
        ],
      },
    };
    render(<DataHealthTab data={{}} theme={theme} />);
    fireEvent.click(screen.getByRole('button', { name: /Leere Staffeln \(1\)/ }));
    expect(screen.getByText('Lost')).toBeInTheDocument();
  });
});
