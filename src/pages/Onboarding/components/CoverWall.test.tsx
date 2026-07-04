// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';

import { CoverWall } from './CoverWall';

beforeEach(() => {
  // No TMDB key in the test env → loadPosters returns [] without hitting the
  // network, but stub fetch defensively so a real request never fires.
  vi.stubGlobal(
    'fetch',
    vi.fn<() => Promise<Response>>(
      async () => ({ json: async () => ({ results: [] }) }) as Response
    )
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('CoverWall', () => {
  it('renders the vignette overlay when there are no posters', async () => {
    const { container } = render(<CoverWall tvGenreIds={[]} />);
    await waitFor(() => expect(container.querySelector('.ob-vignette')).not.toBeNull());
    // Without posters, no marquee rows are rendered.
    expect(container.querySelector('.ob-wall')).toBeNull();
  });
});
