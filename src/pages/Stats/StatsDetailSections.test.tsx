// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

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
  Category: () => null,
  LocalFireDepartment: () => null,
  Star: () => null,
  Stream: () => null,
}));

import {
  RatingsSection,
  TopGenresSection,
  TopProvidersSection,
  WeekActivitySection,
} from './StatsDetailSections';

const theme = {
  primary: '#3355ff',
  accent: '#22d3ee',
  background: { default: '#000000', surface: '#111111' },
  text: { primary: '#ffffff', secondary: '#eeeeee', muted: '#888888' },
  border: { default: '#333333' },
  status: { success: '#4cd137', error: '#e74c3c', warning: '#f5a623' },
};

afterEach(() => cleanup());

describe('StatsDetailSections', () => {
  it('renders average ratings', () => {
    render(<RatingsSection avgSeriesRating={8.2} avgMovieRating={7.1} theme={theme} />);
    expect(screen.getByText('8.2')).toBeInTheDocument();
    expect(screen.getByText('7.1')).toBeInTheDocument();
  });

  it('renders the top genres with counts', () => {
    render(
      <TopGenresSection
        genres={[
          { name: 'Drama', count: 20 },
          { name: 'Comedy', count: 12 },
        ]}
        theme={theme}
      />
    );
    expect(screen.getByText('Top Genres')).toBeInTheDocument();
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('renders nothing when there are no providers', () => {
    const { container } = render(<TopProvidersSection providers={[]} theme={theme} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the weekly activity count', () => {
    render(<WeekActivitySection lastWeekWatched={17} theme={theme} />);
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('Episoden diese Woche')).toBeInTheDocument();
  });
});
