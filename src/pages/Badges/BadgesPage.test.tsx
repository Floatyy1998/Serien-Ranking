// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const { badgeSystem, finalizeMock } = vi.hoisted(() => ({
  badgeSystem: {
    isCacheValid: vi.fn(() => true),
    getUserBadges: vi.fn<() => Promise<unknown[]>>(),
    getAllBadgeProgress: vi.fn<() => Promise<Record<string, unknown>>>(),
    invalidateCache: vi.fn(),
    checkForNewBadges: vi.fn<() => Promise<unknown[]>>(),
  },
  finalizeMock: vi.fn<() => Promise<void>>(),
}));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition', 'whileTap', 'whileHover'].includes(k))
          clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
    AnimatePresence: (props: { children: React.ReactNode }) => <>{props.children}</>,
  };
});

vi.mock('@mui/icons-material', () => ({
  EmojiEvents: () => <span />,
  Refresh: () => <span />,
}));
vi.mock('../../AuthContext', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }));
vi.mock('../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#333', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#333';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../features/badges/badgeDefinitions', () => ({ BADGE_DEFINITIONS: [{ id: 'a' }] }));
vi.mock('../../features/badges/offlineBadgeSystem', () => ({
  getOfflineBadgeSystem: () => badgeSystem,
}));
vi.mock('../../features/badges/badgeCounterService', () => ({
  badgeCounterService: { finalizeBingeSession: finalizeMock },
}));
vi.mock('../../components/ui', () => ({
  LoadingSpinner: () => <div data-testid="spinner" />,
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      {actions}
    </div>
  ),
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ProgressBar: () => <div data-testid="progress-bar" />,
}));
vi.mock('./BadgeCard', () => ({ BadgeCard: () => <div data-testid="badge-card" /> }));
vi.mock('./badgesPageHelpers', () => ({
  categories: [{ key: 'all', label: 'Alle', icon: 'A' }],
  getEarnedCount: () => 0,
  getTotalCount: () => 1,
  getCategoryBadges: () => [],
  getNextTierInfo: () => null,
}));
vi.mock('../../lib/motion', () => ({ tapScale: {}, tapScaleTight: {} }));

import { BadgesPage } from './BadgesPage';

beforeEach(() => {
  badgeSystem.isCacheValid.mockReturnValue(true);
  badgeSystem.getUserBadges.mockReset().mockResolvedValue([]);
  badgeSystem.getAllBadgeProgress.mockReset().mockResolvedValue({});
  badgeSystem.checkForNewBadges.mockReset().mockResolvedValue([]);
  badgeSystem.invalidateCache.mockReset();
  finalizeMock.mockReset().mockResolvedValue(undefined);
});

afterEach(() => cleanup());

describe('BadgesPage', () => {
  it('renders the header and overall progress summary', async () => {
    render(<BadgesPage />);
    expect(screen.getByText('Erfolge')).toBeInTheDocument();
    expect(screen.getByText('0 von 1 Badges freigeschaltet')).toBeInTheDocument();
    await waitFor(() => expect(badgeSystem.getUserBadges).toHaveBeenCalled());
  });

  it('renders the category tab', () => {
    render(<BadgesPage />);
    expect(screen.getByText('Alle')).toBeInTheDocument();
  });

  it('checks for new badges when the check button is clicked', async () => {
    render(<BadgesPage />);
    fireEvent.click(screen.getByText('Prüfen'));
    await waitFor(() => expect(badgeSystem.checkForNewBadges).toHaveBeenCalled());
  });
});
