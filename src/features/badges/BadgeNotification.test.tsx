// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { EarnedBadge } from './badgeDefinitions';

vi.mock('./BadgeIcons', () => ({ BadgeIcon: () => <span data-testid="badge-icon" /> }));

import BadgeNotification from './BadgeNotification';

const badge = {
  id: 'first-episode',
  name: 'Erste Episode',
  description: 'Deine erste Episode geschaut',
  color: '#3355ff',
} as unknown as EarnedBadge;

afterEach(() => cleanup());

describe('BadgeNotification', () => {
  it('renders nothing when there is no badge', () => {
    const { container } = render(<BadgeNotification badge={null} open onClose={vi.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the badge name and description when open', () => {
    render(<BadgeNotification badge={badge} open onClose={vi.fn()} />);
    expect(screen.getByText('Erste Episode')).toBeInTheDocument();
    expect(screen.getByText('Deine erste Episode geschaut')).toBeInTheDocument();
  });

  it('calls onViewAllBadges and onClose from the "Alle ansehen" action', () => {
    const onView = vi.fn();
    const onClose = vi.fn();
    render(<BadgeNotification badge={badge} open onClose={onClose} onViewAllBadges={onView} />);
    fireEvent.click(screen.getByText('Alle ansehen'));
    expect(onView).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
