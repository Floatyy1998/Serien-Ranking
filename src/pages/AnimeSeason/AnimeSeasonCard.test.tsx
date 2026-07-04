// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeasonAnime } from '../../services/anilistSeasonService';

vi.mock('@mui/icons-material', () => ({ Add: () => null, CheckCircle: () => null }));
vi.mock('@mui/material', () => ({ CircularProgress: () => null }));
vi.mock('../../theme/colorUtils', () => ({
  getOptimalTextColor: () => '#000000',
  lightenColor: () => '#ffffff',
}));
vi.mock('../../utils/themedPlaceholder', () => ({ useThemedPlaceholder: () => 'ph.jpg' }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../../lib/providerLinks', () => ({
  getProviderSearchUrl: () => 'https://x',
  handleProviderLinkClick: vi.fn(),
  providerNeedsClipboardCopy: () => false,
}));
vi.mock('../../contexts/ThemeContextDef', () => {
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

import { AnimeSeasonCard } from './AnimeSeasonCard';

const anime: SeasonAnime = {
  id: 100,
  idMal: null,
  title: { romaji: 'Sousou no Frieren', english: 'Frieren' },
  coverImage: { large: '/c.jpg', color: '#334455' },
  bannerImage: null,
  episodes: 28,
  format: 'TV',
  genres: ['Adventure'],
  averageScore: 90,
  popularity: 5000,
  siteUrl: 'https://anilist.co/anime/100',
  status: 'RELEASING',
  description: 'An elf mage journeys across the land.',
  startDate: { year: 2026, month: 1, day: 5 },
  studios: { nodes: [{ name: 'Madhouse' }] },
  nextAiringEpisode: null,
  relations: null,
  externalLinks: null,
};

beforeEach(() => cleanup());
afterEach(() => cleanup());

describe('AnimeSeasonCard', () => {
  it('renders the title and the "LÄUFT" status pill', () => {
    render(
      <AnimeSeasonCard
        anime={anime}
        inList={false}
        resolving={false}
        overviewDe={null}
        tmdbProviders={undefined}
        onOpen={vi.fn()}
      />
    );
    expect(screen.getByRole('heading', { name: 'Frieren' })).toBeInTheDocument();
    expect(screen.getByText('LÄUFT')).toBeInTheDocument();
  });

  it('invokes onOpen when the card is clicked', () => {
    const onOpen = vi.fn();
    render(
      <AnimeSeasonCard
        anime={anime}
        inList={false}
        resolving={false}
        overviewDe={null}
        tmdbProviders={undefined}
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Frieren' }));
    expect(onOpen).toHaveBeenCalled();
  });

  it('invokes onAdd from the add button without opening the card', () => {
    const onOpen = vi.fn();
    const onAdd = vi.fn();
    render(
      <AnimeSeasonCard
        anime={anime}
        inList={false}
        resolving={false}
        overviewDe={null}
        tmdbProviders={undefined}
        onOpen={onOpen}
        onAdd={onAdd}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Frieren zur Liste hinzufügen' }));
    expect(onAdd).toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('uses the German overview text when provided', () => {
    render(
      <AnimeSeasonCard
        anime={anime}
        inList={false}
        resolving={false}
        overviewDe="Eine Elfe reist durch das Land."
        tmdbProviders={undefined}
        onOpen={vi.fn()}
      />
    );
    expect(screen.getByText('Eine Elfe reist durch das Land.')).toBeInTheDocument();
  });
});
