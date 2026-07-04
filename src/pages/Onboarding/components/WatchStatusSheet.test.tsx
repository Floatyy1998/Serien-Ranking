// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { WatchTarget } from '../hooks/useApplyWatchProgress';

const fetchSeasons = vi.hoisted(() =>
  vi.fn<() => Promise<Record<string, unknown> | null>>(async () => null)
);

vi.mock('../../../lib/staticCatalog', () => ({
  fetchStaticCatalogSeasons: fetchSeasons,
}));

vi.mock('./EpisodePicker', () => ({
  EpisodePicker: () => <div>episode-picker</div>,
}));

import { WatchStatusSheet } from './WatchStatusSheet';

afterEach(() => cleanup());

describe('WatchStatusSheet', () => {
  it('renders the title and the choose-view options when open', () => {
    render(
      <WatchStatusSheet
        open
        tmdbId={5}
        title="Dark"
        posterPath={null}
        initial={{ kind: 'none' }}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(screen.getByRole('heading', { name: 'Dark' })).toBeInTheDocument();
    expect(screen.getByText('Noch nicht gesehen')).toBeInTheDocument();
    expect(screen.getByText('Bin mittendrin')).toBeInTheDocument();
    expect(screen.getByText('Komplett gesehen')).toBeInTheDocument();
  });

  it('confirms the selected target and closes', () => {
    const onConfirm = vi.fn<(t: WatchTarget) => void>();
    const onClose = vi.fn<() => void>();
    render(
      <WatchStatusSheet
        open
        tmdbId={5}
        title="Dark"
        posterPath={null}
        initial={{ kind: 'none' }}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    );
    fireEvent.click(screen.getByText('Komplett gesehen'));
    fireEvent.click(screen.getByText('übernehmen'));
    expect(onConfirm).toHaveBeenCalledWith({ kind: 'total' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <WatchStatusSheet
        open={false}
        tmdbId={5}
        title="Dark"
        posterPath={null}
        initial={{ kind: 'none' }}
        onClose={() => {}}
        onConfirm={() => {}}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
