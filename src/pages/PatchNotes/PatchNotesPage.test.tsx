// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('framer-motion', async () => {
  const React = await import('react');
  const make = (tag: string) =>
    React.forwardRef(function Motion(props: Record<string, unknown>, ref: unknown) {
      const clean: Record<string, unknown> = { ref };
      for (const k in props)
        if (!['initial', 'animate', 'exit', 'transition'].includes(k)) clean[k] = props[k];
      return React.createElement(tag, clean);
    });
  return {
    motion: new Proxy({} as Record<string, unknown>, { get: (_t, tag) => make(String(tag)) }),
  };
});

vi.mock('@mui/icons-material', () => {
  const Stub = () => null;
  const names = [
    'AccountCircle',
    'ArrowForward',
    'AutoAwesome',
    'AutoFixHigh',
    'CalendarMonth',
    'CalendarToday',
    'Equalizer',
    'EuroSymbol',
    'FilterAlt',
    'Forum',
    'History',
    'HourglassEmpty',
    'LibraryAddCheck',
    'LocalFireDepartment',
    'LocalMovies',
    'Navigation',
    'NewReleases',
    'NotificationsActive',
    'Palette',
    'PauseCircle',
    'PeopleAlt',
    'Pets',
    'PlaylistAddCheck',
    'PhoneIphone',
    'Recommend',
    'Replay',
    'RocketLaunch',
    'Search',
    'SmartDisplay',
    'Sort',
    'Speed',
    'Subscriptions',
    'SwapHoriz',
    'SystemUpdateAlt',
    'Today',
    'TransferWithinAStation',
    'TrendingUp',
    'Tune',
    'ViewQuilt',
    'Visibility',
    'WarningAmber',
  ];
  return Object.fromEntries(names.map((n) => [n, Stub]));
});
vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
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
vi.mock('../../components/ui', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
}));

import { PatchNotesPage } from './PatchNotesPage';

beforeEach(() => navigateMock.mockReset());

afterEach(() => cleanup());

describe('PatchNotesPage', () => {
  it('renders the page header and a release version', () => {
    render(<PatchNotesPage />);
    expect(screen.getByText('Patch Notes')).toBeInTheDocument();
    expect(screen.getByText('Juli 2026 – Anime-Season-Kalender')).toBeInTheDocument();
  });

  it('navigates when a feature with a link is clicked', () => {
    render(<PatchNotesPage />);
    fireEvent.click(screen.getByText('Neue Seite: Anime-Season-Kalender'));
    expect(navigateMock).toHaveBeenCalledWith('/anime-season');
  });
});
