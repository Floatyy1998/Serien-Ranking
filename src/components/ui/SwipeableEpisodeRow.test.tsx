// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SwipeableEpisodeRow } from './SwipeableEpisodeRow';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

afterEach(cleanup);

function baseProps() {
  return {
    itemKey: 'ep-1',
    poster: 'https://x/poster.jpg',
    posterAlt: 'S1E1 Poster',
    accentColor: '#00d123',
    isCompleting: false,
    isSwiping: false,
    dragOffset: 0,
    onSwipeStart: vi.fn(),
    onSwipeDrag: vi.fn<(offset: number) => void>(),
    onSwipeEnd: vi.fn(),
    onComplete: vi.fn<(direction: 'left' | 'right') => void>(),
    content: <span>Episode Title</span>,
    action: <button type="button">Mark</button>,
  };
}

describe('SwipeableEpisodeRow', () => {
  it('renders content, action and poster (smoke)', () => {
    render(<SwipeableEpisodeRow {...baseProps()} />);
    expect(screen.getByText('Episode Title')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Mark' })).toBeInTheDocument();
    expect(screen.getByAltText('S1E1 Poster')).toBeInTheDocument();
  });

  it('invokes onPosterClick when the poster is pressed', () => {
    const onPosterClick = vi.fn();
    render(<SwipeableEpisodeRow {...baseProps()} onPosterClick={onPosterClick} />);
    fireEvent.click(screen.getByAltText('S1E1 Poster'));
    expect(onPosterClick).toHaveBeenCalledTimes(1);
  });

  it('renders a poster overlay node when provided', () => {
    render(
      <SwipeableEpisodeRow
        {...baseProps()}
        posterOverlay={<span data-testid="overlay">NEW</span>}
      />
    );
    expect(screen.getByTestId('overlay')).toBeInTheDocument();
  });
});
