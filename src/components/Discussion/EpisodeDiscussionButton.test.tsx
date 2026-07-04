// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));

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

vi.mock('../../hooks/discussionCountHooks', () => ({
  useDiscussionCount: vi.fn(),
}));

import { EpisodeDiscussionButton } from './EpisodeDiscussionButton';
import { useDiscussionCount } from '../../hooks/discussionCountHooks';

const mockedCount = vi.mocked(useDiscussionCount);

beforeEach(() => {
  navigateMock.mockReset();
  mockedCount.mockReset();
});

afterEach(() => cleanup());

describe('EpisodeDiscussionButton', () => {
  it('shows the discussion count when greater than zero', () => {
    mockedCount.mockReturnValue(3);
    render(<EpisodeDiscussionButton seriesId={10} seasonNumber={1} episodeNumber={2} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders without a count number when there are no discussions', () => {
    mockedCount.mockReturnValue(0);
    render(<EpisodeDiscussionButton seriesId={10} seasonNumber={1} episodeNumber={2} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('navigates to the episode discussion route on click', () => {
    mockedCount.mockReturnValue(1);
    render(<EpisodeDiscussionButton seriesId={10} seasonNumber={1} episodeNumber={2} />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith('/episode/10/s/1/e/2');
  });
});
