// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

const { useProfileDataMock } = vi.hoisted(() => ({ useProfileDataMock: vi.fn() }));

vi.mock('../../components/ui/BackButton', () => ({ BackButton: () => <button>Zurück</button> }));
vi.mock('./ProfileComponents', () => ({
  ProfileHeader: ({ displayName }: { displayName: string }) => <div>NAME:{displayName}</div>,
  ProfileStats: () => <div data-testid="stats" />,
  ProfileFeaturedNav: ({ title }: { title: string }) => <div>{title}</div>,
  ProfileMenuGroup: ({ title }: { title: string }) => <div>{title}</div>,
  ProfileLogoutButton: () => <div data-testid="logout" />,
}));
vi.mock('./useProfileData', () => ({ useProfileData: useProfileDataMock }));

import { ProfilePage } from './ProfilePage';

const makeTheme = (): unknown =>
  new Proxy(() => '#333', {
    get: (_t, prop) => {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
        return () => '#333';
      return makeTheme();
    },
  });

const baseReturn = () => ({
  user: null as unknown,
  userData: null as unknown,
  currentTheme: makeTheme(),
  stats: {},
  menuItems: [],
  secondaryMenuItems: [],
  mangaMenuItems: [],
  settingsItems: [],
  heroBackdrops: [] as string[],
  goTo: vi.fn(),
  handleLogout: vi.fn(),
});

beforeEach(() => useProfileDataMock.mockReset());

afterEach(() => cleanup());

describe('ProfilePage', () => {
  it('falls back to "User" when no display name is available', () => {
    useProfileDataMock.mockReturnValue(baseReturn());
    render(<ProfilePage />);
    expect(screen.getByText('NAME:User')).toBeInTheDocument();
    expect(screen.getByTestId('logout')).toBeInTheDocument();
  });

  it('uses the display name from userData', () => {
    useProfileDataMock.mockReturnValue({
      ...baseReturn(),
      userData: { displayName: 'Bob' },
    });
    render(<ProfilePage />);
    expect(screen.getByText('NAME:Bob')).toBeInTheDocument();
  });

  it('renders the manga menu group only when manga items exist', () => {
    useProfileDataMock.mockReturnValue({
      ...baseReturn(),
      mangaMenuItems: [{ path: '/manga', label: 'M', icon: () => null, color: '#f00' }],
    });
    render(<ProfilePage />);
    expect(screen.getByText('Manga')).toBeInTheDocument();
  });
});
