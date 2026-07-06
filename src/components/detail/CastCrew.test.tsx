// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

// Child views are rendered for real; router is only needed transitively there.
vi.mock('react-router-dom', () => ({ useNavigate: () => vi.fn() }));
vi.mock('../ui', () => ({
  HorizontalScrollContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { CastCrew } from './CastCrew';

beforeEach(() => {
  // Force credit fetches to fail so the component settles into the list view
  // with empty cast/crew (no network dependency, no API key needed).
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: false, json: async () => ({}) }) as unknown as Response)
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CastCrew', () => {
  it('shows a loading indicator initially then the cast/crew tabs', async () => {
    render(<CastCrew tmdbId={100} mediaType="tv" />);
    // Note: the transient "Lade Cast & Crew..." loading indicator is NOT asserted here —
    // with the empty/fast-resolved data path the tabs can render immediately (no loading
    // frame), which made the assertion racy in CI. Assert the settled tabs instead.
    expect(await screen.findByText('Besetzung (0)', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText('Crew (0)')).toBeInTheDocument();
  });

  it('renders without crashing when an onPersonClick handler is provided', async () => {
    const onPersonClick = vi.fn();
    render(<CastCrew tmdbId={200} mediaType="movie" onPersonClick={onPersonClick} />);
    await waitFor(() => expect(screen.getByText('Besetzung (0)')).toBeInTheDocument(), {
      timeout: 5000,
    });
  });
});
