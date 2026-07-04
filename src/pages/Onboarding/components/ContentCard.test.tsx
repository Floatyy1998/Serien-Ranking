// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { OnboardingItem } from '../hooks/useOnboardingSearch';

import { ContentCard } from './ContentCard';

const item: OnboardingItem = {
  id: 7,
  title: 'Severance',
  poster_path: '/poster.jpg',
  vote_average: 8.4,
  first_air_date: '2022-02-18',
  type: 'series',
};

afterEach(() => cleanup());

describe('ContentCard', () => {
  it('renders the title, year and rating', () => {
    render(<ContentCard item={item} isAdded={false} isPending={false} onPrimaryTap={() => {}} />);
    expect(screen.getByText('Severance')).toBeInTheDocument();
    expect(screen.getByText('2022')).toBeInTheDocument();
    expect(screen.getByText('8.4')).toBeInTheDocument();
  });

  it('calls onPrimaryTap when the card is clicked', () => {
    const onPrimaryTap = vi.fn<(it: OnboardingItem) => void>();
    render(
      <ContentCard item={item} isAdded={false} isPending={false} onPrimaryTap={onPrimaryTap} />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onPrimaryTap).toHaveBeenCalledWith(item);
  });

  it('shows a remove action once added and fires onRemove', () => {
    const onRemove = vi.fn<(it: OnboardingItem) => void>();
    render(
      <ContentCard
        item={item}
        isAdded
        isPending={false}
        summary={{ kind: 'total' }}
        onPrimaryTap={() => {}}
        onRemove={onRemove}
      />
    );
    expect(screen.getByText('gesehen · komplett')).toBeInTheDocument();
    fireEvent.click(screen.getByText('entfernen'));
    expect(onRemove).toHaveBeenCalledWith(item);
  });
});
