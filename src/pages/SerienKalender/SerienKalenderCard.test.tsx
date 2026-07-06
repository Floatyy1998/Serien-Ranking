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
    border: { default: '#333333' },
    status: { success: '#4cd137' },
  },
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ currentTheme: theme }) }));
vi.mock('../../utils/themedPlaceholder', () => ({ useThemedPlaceholder: () => 'placeholder.png' }));
vi.mock('../../lib/haptics', () => ({ hapticTap: vi.fn() }));

import { SerienKalenderCard } from './SerienKalenderCard';

const entry: TvPremiereStaticEntry = {
  tmdbId: 100,
  type: 'new',
  premiereDate: '2026-07-10',
  title: 'Neue Serie',
  originalTitle: null,
  overviewDe: 'Eine spannende neue Serie.',
  poster: 'poster.png',
  backdrop: null,
  rating: 8.2,
  genres: ['Drama', 'Thriller'],
  networks: ['Netflix'],
  providers: [{ name: 'Netflix', logo: 'netflix.png' }],
};

const now = new Date('2026-07-04').getTime();

beforeEach(() => vi.clearAllMocks());
afterEach(() => cleanup());

describe('SerienKalenderCard', () => {
  it('renders the title, meta line and "Neu" badge', () => {
    render(<SerienKalenderCard entry={entry} inList={false} now={now} onOpen={vi.fn()} />);
    expect(screen.getByText('Neue Serie')).toBeInTheDocument();
    expect(screen.getByText('Neu')).toBeInTheDocument();
    expect(screen.getByText('Netflix · ★ 8.2')).toBeInTheDocument();
  });

  it('calls onOpen when the card is clicked', () => {
    const onOpen = vi.fn();
    render(<SerienKalenderCard entry={entry} inList={false} now={now} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('button', { name: 'Neue Serie' }));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('calls onAdd from the add button when not in the list', () => {
    const onAdd = vi.fn();
    render(
      <SerienKalenderCard entry={entry} inList={false} now={now} onOpen={vi.fn()} onAdd={onAdd} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Neue Serie zur Liste hinzufügen' }));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
