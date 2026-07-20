// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { CatalogSeason } from '../../../types/CatalogTypes';

import { EpisodePicker } from './EpisodePicker';

beforeAll(() => {
  // jsdom does not implement scrollIntoView; the season-tab effect calls it.
  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
  }
});

const seasons: CatalogSeason[] = [
  {
    seasonNumber: 1,
    episodes: [
      { id: 101, name: 'Pilot' },
      { id: 102, name: 'The Cat in the Bag' },
    ],
  },
  {
    seasonNumber: 2,
    episodes: [{ id: 201, name: 'Seven Thirty-Seven' }],
  },
];

afterEach(() => cleanup());

describe('EpisodePicker', () => {
  it('renders the episodes of the active season', () => {
    render(<EpisodePicker seasons={seasons} seasonIdx={0} episodeIdx={0} onPick={() => {}} />);
    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('The Cat in the Bag')).toBeInTheDocument();
    // Season tabs
    expect(screen.getByText('S01')).toBeInTheDocument();
    expect(screen.getByText('S02')).toBeInTheDocument();
  });

  it('invokes onPick with season and episode index', () => {
    const onPick = vi.fn<(s: number, e: number) => void>();
    render(<EpisodePicker seasons={seasons} seasonIdx={0} episodeIdx={0} onPick={onPick} />);
    fireEvent.click(screen.getByText('The Cat in the Bag'));
    expect(onPick).toHaveBeenCalledWith(0, 1);
  });

  it('renders episodes even when the catalog delivers them as a (sparse) object', () => {
    // Manche Serien liefern episodes als Objekt statt Array — darf nicht crashen.
    const objectSeasons = [
      {
        seasonNumber: 1,
        episodes: { a: { id: 101, name: 'Pilot' }, b: { id: 102, name: 'Zwei' } },
      },
    ] as unknown as CatalogSeason[];
    render(
      <EpisodePicker seasons={objectSeasons} seasonIdx={0} episodeIdx={0} onPick={() => {}} />
    );
    expect(screen.getByText('Pilot')).toBeInTheDocument();
    expect(screen.getByText('Zwei')).toBeInTheDocument();
  });
});
