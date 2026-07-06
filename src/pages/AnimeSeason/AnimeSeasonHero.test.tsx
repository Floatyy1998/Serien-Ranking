// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { SeasonAnime } from '../../services/anilistSeasonService';

vi.mock('@mui/icons-material', () => ({ Add: () => null, CheckCircle: () => null }));
vi.mock('@mui/material', () => ({ CircularProgress: () => null }));
vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: false }) }));
vi.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../theme/colorUtils', () => ({
  getOptimalTextColor: () => '#000000',
  lightenColor: () => '#ffffff',
}));
vi.mock('../../utils/themedPlaceholder', () => ({ useThemedPlaceholder: () => 'ph.jpg' }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../HomePage/sections/MiniProviderBadges', () => ({ MiniProviderBadges: () => null }));
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

import { AnimeSeasonHero } from './AnimeSeasonHero';

const anime: SeasonAnime = {
  id: 100,
  idMal: null,
  title: { romaji: 'Sousou no Frieren', english: 'Frieren' },
  coverImage: { large: '/c.jpg', color: '#334455' },
  bannerImage: '/b.jpg',
  episodes: 28,
  format: 'TV',
  genres: ['Adventure'],
  averageScore: 90,
  popularity: 5000,
  siteUrl: 'https://anilist.co/anime/100',
  status: 'RELEASING',
  description: 'An elf mage journeys across the land.',
  startDate: { year: 2020, month: 1, day: 5 },
  studios: { nodes: [{ name: 'Madhouse' }] },
  nextAiringEpisode: null,
  relations: null,
  externalLinks: null,
};

beforeEach(() => cleanup());
afterEach(() => cleanup());

describe('AnimeSeasonHero', () => {
  it('renders the eyebrow and title', () => {
    render(
      <AnimeSeasonHero
        anime={anime}
        eyebrow="Season-Highlight"
        inList={false}
        resolving={false}
        overviewDe={null}
        tmdbProviders={null}
        onOpen={vi.fn()}
      />
    );
    expect(screen.getByText('Season-Highlight')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Frieren' })).toBeInTheDocument();
  });

  it('invokes onOpen when the hero is clicked', () => {
    const onOpen = vi.fn();
    render(
      <AnimeSeasonHero
        anime={anime}
        eyebrow="Season-Highlight"
        inList={false}
        resolving={false}
        overviewDe={null}
        tmdbProviders={null}
        onOpen={onOpen}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Frieren' }));
    expect(onOpen).toHaveBeenCalled();
  });

  it('invokes onAdd from the add button without opening the hero', () => {
    const onOpen = vi.fn();
    const onAdd = vi.fn();
    render(
      <AnimeSeasonHero
        anime={anime}
        eyebrow="Season-Highlight"
        inList={false}
        resolving={false}
        overviewDe={null}
        tmdbProviders={null}
        onOpen={onOpen}
        onAdd={onAdd}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Frieren zur Liste hinzufügen' }));
    expect(onAdd).toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
  });
});
