// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap']);
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props) if (!skip.has(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  const motion = new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) });
  return { motion };
});

vi.mock('@mui/icons-material', () => ({
  AutoAwesome: () => null,
  Bolt: () => null,
  Favorite: () => null,
  Star: () => null,
  TheaterComedy: () => null,
  TrendingUp: () => null,
  Mood: () => null,
}));

const { theme } = vi.hoisted(() => ({ theme: { accent: '#22d3ee' } }));
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({ currentTheme: theme }),
}));

import { GenreRatingSection } from './GenreRatingSection';

afterEach(() => cleanup());

describe('GenreRatingSection', () => {
  it('renders each genre name and its value', () => {
    render(
      <GenreRatingSection genreRatings={{ Action: 8, Comedy: 6.5 }} onGenreRatingChange={vi.fn()} />
    );
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Comedy')).toBeInTheDocument();
    expect(screen.getByText('8.0')).toBeInTheDocument();
  });

  it('sorts the "All" genre to the front', () => {
    render(
      <GenreRatingSection genreRatings={{ Comedy: 6, All: 7 }} onGenreRatingChange={vi.fn()} />
    );
    const names = Array.from(document.querySelectorAll('.rate-genre-name')).map(
      (el) => el.textContent
    );
    expect(names[0]).toBe('All');
  });

  it('calls onGenreRatingChange when a slider moves', () => {
    const onChange = vi.fn<(g: string, v: number) => void>();
    render(<GenreRatingSection genreRatings={{ Action: 5 }} onGenreRatingChange={onChange} />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '7.5' } });
    expect(onChange).toHaveBeenCalledWith('Action', 7.5);
  });
});
