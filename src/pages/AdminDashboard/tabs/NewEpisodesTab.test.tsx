// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NewEpisodesTab } from './NewEpisodesTab';

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
      }),
    }),
  };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const theme = {
  primary: '#00d123',
  accent: '#008a6e',
  text: { primary: '#fff', muted: '#888' },
  background: { paper: '#111' },
};

const PATH = 'admin/newEpisodes';

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
});

afterEach(cleanup);

describe('NewEpisodesTab', () => {
  it('shows the empty state when no new episodes were found', () => {
    render(<NewEpisodesTab theme={theme} />);
    expect(screen.getByText('Keine neuen Episoden in den letzten 7 Tagen')).toBeInTheDocument();
    expect(screen.getByText('Neue Episoden (7 Tage)')).toBeInTheDocument();
  });

  it('aggregates runs into a per-series episode list', () => {
    fb.store[PATH] = {
      lastRunStart: new Date().toISOString(),
      runs: {
        r1: {
          runStart: new Date().toISOString(),
          totalNewEpisodes: 1,
          seriesCount: 1,
          series: [
            {
              title: 'Lost',
              serieId: 123,
              episodes: [{ season: 1, episode: 2, name: 'Pilot', air_date: '2026-07-01' }],
            },
          ],
        },
      },
    };
    render(<NewEpisodesTab theme={theme} />);
    expect(screen.getByText('Lost')).toBeInTheDocument();
    expect(screen.getByText(/Pilot/)).toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });
});
