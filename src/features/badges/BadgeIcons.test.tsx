// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { getBadgeIconMock } = vi.hoisted(() => ({
  getBadgeIconMock: vi.fn(() => () => <span data-testid="badge-icon" />),
}));
vi.mock('./getBadgeIcon', () => ({ getBadgeIcon: getBadgeIconMock }));

import { BadgeIcon } from './BadgeIcons';

afterEach(() => {
  cleanup();
  getBadgeIconMock.mockClear();
});

describe('BadgeIcon', () => {
  it('renders the icon resolved from getBadgeIcon', () => {
    render(<BadgeIcon badgeId="first-episode" />);
    expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
  });

  it('resolves the icon by badge id', () => {
    render(<BadgeIcon badgeId="marathon" />);
    expect(getBadgeIconMock).toHaveBeenCalledWith('marathon');
  });
});
