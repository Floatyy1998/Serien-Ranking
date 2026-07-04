// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimeFillerTab } from './AnimeFillerTab';

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

vi.mock('../../../contexts/ThemeContextDef', async () => {
  const { generateDynamicTheme, defaultThemeConfig } = await import('../../../theme/dynamicTheme');
  const currentTheme = generateDynamicTheme(defaultThemeConfig);
  return { useTheme: () => ({ currentTheme }) };
});

const PATH = 'admin/animeFiller_meta';

beforeEach(() => {
  for (const k of Object.keys(fb.store)) delete fb.store[k];
});

afterEach(cleanup);

describe('AnimeFillerTab', () => {
  it('shows the no-run message when no meta document exists', () => {
    render(<AnimeFillerTab />);
    expect(screen.getByText('Noch kein Filler-Run protokolliert.')).toBeInTheDocument();
  });

  it('renders an idle run summary with counts', () => {
    fb.store[PATH] = {
      phase: 'idle',
      processed: 10,
      total: 10,
      summary: { ok: 8, errors: 1 },
      lastRunAt: Date.now(),
      lastRunTookSec: 30,
    };
    render(<AnimeFillerTab />);
    expect(screen.getByText('Anime Filler Pipeline')).toBeInTheDocument();
    expect(screen.getByText('idle')).toBeInTheDocument();
    expect(screen.getByText('Letzter Run')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('errors')).toBeInTheDocument();
  });

  it('renders a running run with current title', () => {
    fb.store[PATH] = {
      phase: 'running',
      processed: 5,
      total: 10,
      startedAt: Date.now(),
      counts: { ok: 5 },
      currentTitle: 'Naruto',
      currentTmdbId: 123,
    };
    render(<AnimeFillerTab />);
    expect(screen.getByText('läuft')).toBeInTheDocument();
    expect(screen.getByText('Aktueller Run')).toBeInTheDocument();
    expect(screen.getByText(/Naruto/)).toBeInTheDocument();
  });
});
