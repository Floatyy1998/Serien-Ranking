// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { TvPremiereStaticEntry } from '../../lib/staticCatalog';

vi.mock('@mui/icons-material', () => ({ Add: () => null, CheckCircle: () => null }));

const { theme } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    accent: '#22d3ee',
    background: { default: '#000000', surface: '#111111', surfaceElevated: '#1a1a1a' },
    text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
    status: { success: '#4cd137' },
  },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../hooks/useDeviceType', () => ({ useDeviceType: () => ({ isMobile: true }) }));
vi.mock('../../hooks/useReducedMotion', () => ({ useReducedMotion: () => true }));
vi.mock('../../utils/themedPlaceholder', () => ({ useThemedPlaceholder: () => 'placeholder.png' }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));
vi.mock('../HomePage/sections/MiniProviderBadges', () => ({
  MiniProviderBadges: () => <div data-testid="providers" />,
}));

import { SerienKalenderHero } from './SerienKalenderHero';

const entry: TvPremiereStaticEntry = {
  tmdbId: 200,
  type: 'new',
  premiereDate: '2020-01-01',
  title: 'Gestartete Serie',
  originalTitle: null,
  overviewDe: 'Kurzbeschreibung.',
  poster: 'poster.png',
  backdrop: 'backdrop.png',
  rating: 8,
  genres: ['Drama'],
  networks: ['Netflix'],
  providers: [{ name: 'Netflix', logo: 'netflix.png' }],
};

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('SerienKalenderHero', () => {
  it('renders the eyebrow, title and start line for an aired premiere', () => {
    render(
      <SerienKalenderHero
        entry={entry}
        eyebrow="Highlight des Monats"
        inList={false}
        onOpen={vi.fn()}
      />
    );
    expect(screen.getByText('Highlight des Monats')).toBeInTheDocument();
    expect(screen.getByText('Gestartete Serie')).toBeInTheDocument();
    expect(screen.getByText('Bereits gestartet')).toBeInTheDocument();
  });

  it('calls onOpen when the hero is clicked', () => {
    const onOpen = vi.fn();
    render(<SerienKalenderHero entry={entry} eyebrow="x" inList={false} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Gestartete Serie' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onAdd from the add button when not in the list', () => {
    const onAdd = vi.fn();
    render(
      <SerienKalenderHero entry={entry} eyebrow="x" inList={false} onOpen={vi.fn()} onAdd={onAdd} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Gestartete Serie zur Liste hinzufügen' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
