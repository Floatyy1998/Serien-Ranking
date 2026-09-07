// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import {
  Skeleton,
  SkeletonPosterCard,
  SkeletonPosterRow,
  SkeletonListRow,
  SkeletonRatingsGrid,
} from './Skeleton';

afterEach(cleanup);

describe('Skeleton', () => {
  it('renders with the shimmer class (smoke)', () => {
    const { container } = render(<Skeleton />);
    const el = container.querySelector('.skeleton-shimmer');
    expect(el).toBeInTheDocument();
  });

  it('merges a custom className', () => {
    const { container } = render(<Skeleton className="my-extra" />);
    const el = container.querySelector('.skeleton-shimmer.my-extra');
    expect(el).toBeInTheDocument();
  });

  it('applies shape-derived border radius (circle)', () => {
    const { container } = render(<Skeleton shape="circle" width={20} height={20} />);
    const el = container.querySelector('.skeleton-shimmer') as HTMLElement;
    expect(el).toHaveStyle({ borderRadius: '50%' });
  });

  it('SkeletonPosterRow renders the requested number of cards', () => {
    const { container } = render(<SkeletonPosterRow count={4} />);
    expect(screen.getByRole('status', { name: 'Lade Inhalte' })).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-shimmer').length).toBe(4 * 3);
  });

  it('SkeletonPosterCard / SkeletonListRow / SkeletonRatingsGrid render without throwing', () => {
    render(<SkeletonPosterCard />);
    render(<SkeletonListRow />);
    render(<SkeletonRatingsGrid count={2} />);
    expect(screen.getByRole('status', { name: 'Lade Bewertungen' })).toBeInTheDocument();
  });
});
