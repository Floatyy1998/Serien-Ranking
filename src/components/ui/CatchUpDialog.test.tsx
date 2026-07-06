// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatchUpDialog } from './CatchUpDialog';
import type { Series } from '../../types/Series';

if (!window.matchMedia) {
  window.matchMedia = ((q: string) => ({
    matches: false,
    media: q,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      primary: '#00d123',
      background: { card: '#151515', default: '#000', surface: '#111' },
      text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
      border: { default: '#333' },
    },
  }),
}));

const series = {
  id: 1,
  title: 'Test Serie',
  seasons: [
    {
      seasonNumber: 0,
      episodes: [
        { name: 'Pilot', watched: false },
        { name: 'Zweite', watched: false },
      ],
    },
  ],
} as unknown as Series;

afterEach(() => cleanup());

describe('CatchUpDialog', () => {
  it('renders nothing when closed', () => {
    render(<CatchUpDialog open={false} onClose={vi.fn()} series={series} onConfirm={vi.fn()} />);
    expect(screen.queryByText('Ich bin bei...')).not.toBeInTheDocument();
  });

  it('renders the picker heading and season options when open', () => {
    render(<CatchUpDialog open onClose={vi.fn()} series={series} onConfirm={vi.fn()} />);
    expect(screen.getByText('Ich bin bei...')).toBeInTheDocument();
    expect(screen.getByText('Staffel 1 (2 Episoden)')).toBeInTheDocument();
  });

  it('calls onClose when Abbrechen is clicked', () => {
    const onClose = vi.fn();
    render(<CatchUpDialog open onClose={onClose} series={series} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abbrechen' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('confirms with the selected season/episode once episodes are picked', () => {
    const onConfirm = vi.fn<(s: number, e: number) => void>();
    const onClose = vi.fn();
    render(<CatchUpDialog open onClose={onClose} series={series} onConfirm={onConfirm} />);
    const selects = screen.getAllByRole('combobox');
    // second combobox is the episode picker; value 1 = "up to Episode 1"
    fireEvent.change(selects[1], { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Markieren' }));
    expect(onConfirm).toHaveBeenCalledWith(0, 1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
