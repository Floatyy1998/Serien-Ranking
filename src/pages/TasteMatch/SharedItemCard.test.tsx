// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SharedItem } from '../../services/tasteMatchService';
import { SharedItemCard } from './SharedItemCard';

const navigate = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigate,
}));

function makeItem(overrides: Partial<SharedItem> = {}): SharedItem {
  return {
    id: 123,
    title: 'Breaking Bad',
    poster: '/poster.jpg',
    userRating: 9,
    friendRating: 8.5,
    ratingDiff: 0.5,
    ...overrides,
  };
}

beforeEach(() => navigate.mockReset());
afterEach(() => cleanup());

describe('SharedItemCard', () => {
  it('rendert Titel und beide Ratings', () => {
    render(<SharedItemCard item={makeItem()} index={0} type="series" bgColor="#111" />);
    expect(screen.getByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByText('9.0')).toBeInTheDocument();
    expect(screen.getByText('8.5')).toBeInTheDocument();
  });

  it('navigiert zur Serien-Detailseite beim Klick', () => {
    render(<SharedItemCard item={makeItem()} index={0} type="series" bgColor="#111" />);
    fireEvent.click(screen.getByRole('button'));
    expect(navigate).toHaveBeenCalledWith('/series/123');
  });

  it('navigiert zur Film-Detailseite bei type=movie', () => {
    render(
      <SharedItemCard
        item={makeItem({ poster: undefined })}
        index={1}
        type="movie"
        bgColor="#111"
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(navigate).toHaveBeenCalledWith('/movie/123');
  });
});
