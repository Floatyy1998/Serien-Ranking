// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const skip = new Set(['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover']);
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
  SentimentDissatisfied: () => null,
  SentimentNeutral: () => null,
  SentimentSatisfied: () => null,
  SentimentVeryDissatisfied: () => null,
  SentimentVerySatisfied: () => null,
}));

const { theme } = vi.hoisted(() => ({
  theme: {
    primary: '#3355ff',
    accent: '#22d3ee',
    status: { success: '#4cd137', error: '#e74c3c' },
  },
}));
vi.mock('../../contexts/ThemeContextDef', () => ({
  useTheme: () => ({ currentTheme: theme }),
}));

import { OverallRatingSection } from './OverallRatingSection';

afterEach(() => cleanup());

describe('OverallRatingSection', () => {
  it('renders the current rating value', () => {
    render(<OverallRatingSection overallRating={7.4} onRatingChange={vi.fn()} />);
    expect(screen.getByText('7.4')).toBeInTheDocument();
  });

  it('calls onRatingChange when a quick-select button is clicked', () => {
    const onRatingChange = vi.fn<(v: number) => void>();
    render(<OverallRatingSection overallRating={5} onRatingChange={onRatingChange} />);
    fireEvent.click(screen.getByRole('button', { name: '8' }));
    expect(onRatingChange).toHaveBeenCalledWith(8);
  });

  it('calls onRatingChange when the slider moves', () => {
    const onRatingChange = vi.fn<(v: number) => void>();
    render(<OverallRatingSection overallRating={5} onRatingChange={onRatingChange} />);
    const slider = document.querySelector('input[type="range"]') as HTMLInputElement;
    fireEvent.change(slider, { target: { value: '9.2' } });
    expect(onRatingChange).toHaveBeenCalledWith(9.2);
  });
});
