// @vitest-environment jsdom
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

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
  };
});

vi.mock('@mui/icons-material', () => {
  const Stub = () => <span />;
  return {
    CalendarToday: Stub,
    ChevronRight: Stub,
    Logout: Stub,
    Movie: Stub,
    Person: Stub,
    PlayCircle: Stub,
  };
});
vi.mock('../../components/ui', () => ({
  GradientText: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));
vi.mock('../../lib/motion', () => ({ tapScaleSmall: {} }));

import {
  ProfileHeader,
  ProfileStats,
  ProfileFeaturedNav,
  ProfileLogoutButton,
} from './ProfileComponents';

const IconStub = () => <span />;

const makeTheme = <T,>() =>
  new Proxy(() => '#333', {
    get: (_t, prop) => {
      if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
        return () => '#333';
      return makeTheme();
    },
  }) as unknown as T;

afterEach(() => cleanup());

describe('ProfileComponents', () => {
  it('ProfileHeader renders the display name and email', () => {
    render(
      <ProfileHeader
        displayName="Alice"
        email="alice@example.com"
        photoURL={null}
        currentTheme={makeTheme<ComponentProps<typeof ProfileHeader>['currentTheme']>()}
      />
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('ProfileStats renders the three stat labels and values', () => {
    const stats = {
      totalSeries: 12,
      totalMovies: 5,
      watchedEpisodes: 340,
      timeString: '3 Tage',
    } as unknown as ComponentProps<typeof ProfileStats>['stats'];
    render(
      <ProfileStats
        stats={stats}
        currentTheme={makeTheme<ComponentProps<typeof ProfileStats>['currentTheme']>()}
      />
    );
    expect(screen.getByText('Serien')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('3 Tage')).toBeInTheDocument();
  });

  it('ProfileFeaturedNav renders items and navigates on click', () => {
    const onNavigate = vi.fn();
    const items = [
      { path: '/stats', label: 'Statistiken', icon: IconStub, color: '#f00' },
    ] as unknown as ComponentProps<typeof ProfileFeaturedNav>['items'];
    render(
      <ProfileFeaturedNav
        title="Schnellzugriff"
        items={items}
        currentTheme={makeTheme<ComponentProps<typeof ProfileFeaturedNav>['currentTheme']>()}
        onNavigate={onNavigate}
        animationDelay={0}
      />
    );
    fireEvent.click(screen.getByText('Statistiken'));
    expect(onNavigate).toHaveBeenCalledWith('/stats');
  });

  it('ProfileLogoutButton triggers logout on click', () => {
    const onLogout = vi.fn();
    render(
      <ProfileLogoutButton
        currentTheme={makeTheme<ComponentProps<typeof ProfileLogoutButton>['currentTheme']>()}
        onLogout={onLogout}
        animationDelay={0}
      />
    );
    fireEvent.click(screen.getByText('Abmelden'));
    expect(onLogout).toHaveBeenCalled();
  });
});
