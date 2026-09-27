// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TmdbAheadTab } from './TmdbAheadTab';
import type { TmdbAheadItem } from './TmdbAheadTab';

const fb = vi.hoisted(() => {
  const store: Record<string, unknown> = {};
  const writes: { path: string; value: unknown }[] = [];
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
    set: (value: unknown) => {
      writes.push({ path, value });
      return Promise.resolve();
    },
    remove: () => {
      writes.push({ path, value: null });
      return Promise.resolve();
    },
  });
  return {
    store,
    writes,
    database: Object.assign(() => ({ ref: (path?: string) => makeRef(path ?? '') }), {
      ServerValue: { TIMESTAMP: 'ts' },
    }),
  };
});

vi.mock('firebase/compat/app', () => ({ default: { database: fb.database } }));
vi.mock('firebase/compat/database', () => ({}));

const item = (over: Partial<TmdbAheadItem> = {}): TmdbAheadItem => ({
  title: 'The Rookie',
  poster: null,
  tmdbSeason: 9,
  airDate: '2027-01-01',
  tmdbEpisodes: 0,
  catalogSeasons: 8,
  catalogLastAired: '2026-05-12',
  tvmazeId: 34131,
  tvmazeUrl: 'https://www.tvmaze.com/shows/34131/the-rookie',
  tvmazeSeasonExists: false,
  tvmazeUndated: 0,
  tvmazeLastSeason: 8,
  firstSeen: 1,
  ...over,
});

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
  fb.writes.length = 0;
});

afterEach(cleanup);

describe('TmdbAheadTab', () => {
  it('zeigt einen Leerzustand ohne Befunde', () => {
    fb.store['adminPrivate/tmdbAhead'] = { lastRun: 1, checked: 1700, items: {} };
    render(<TmdbAheadTab />);
    expect(screen.getByText('Nichts offen')).toBeInTheDocument();
  });

  it('listet Befunde mit Staffel und TVMaze-Status', () => {
    fb.store['adminPrivate/tmdbAhead'] = {
      items: {
        '79744': item(),
        '126027': item({ title: 'Ghosts', tmdbSeason: 6, tvmazeSeasonExists: true }),
      },
    };
    render(<TmdbAheadTab />);
    expect(screen.getByText('The Rookie · Staffel 9')).toBeInTheDocument();
    expect(screen.getByText(/TVMaze: fehlt \(dort bis Staffel 8\)/)).toBeInTheDocument();
    expect(screen.getByText(/Staffel angelegt, ohne Termin/)).toBeInTheDocument();
  });

  it('ignoriert eine Staffel ueber admin/config', () => {
    fb.store['adminPrivate/tmdbAhead'] = { items: { '79744': item() } };
    render(<TmdbAheadTab />);
    fireEvent.click(screen.getByTitle('Diese Staffel ignorieren'));
    expect(fb.writes[0].path).toBe('admin/config/tmdbAheadDismissed/79744');
    expect(fb.writes[0].value).toMatchObject({ season: 9, title: 'The Rookie' });
  });

  it('blendet ignorierte Staffeln aus, eine neuere erscheint wieder', () => {
    fb.store['adminPrivate/tmdbAhead'] = {
      items: { '79744': item(), '1': item({ title: 'Neuer', tmdbSeason: 3 }) },
    };
    fb.store['admin/config/tmdbAheadDismissed'] = { '79744': { season: 9 }, '1': { season: 2 } };
    render(<TmdbAheadTab />);
    expect(screen.queryByText('The Rookie · Staffel 9')).not.toBeInTheDocument();
    expect(screen.getByText('Neuer · Staffel 3')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ignorierte anzeigen'));
    expect(screen.getByText('The Rookie · Staffel 9')).toBeInTheDocument();
  });
});
