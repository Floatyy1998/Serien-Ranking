// @vitest-environment jsdom
import type React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { GreetingSection } from './GreetingSection';

const { navigateMock } = vi.hoisted(() => ({ navigateMock: vi.fn() }));

vi.mock('react-router-dom', () => ({ useNavigate: () => navigateMock }));
vi.mock('../../../contexts/ThemeContext', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, p) =>
        p === Symbol.toPrimitive || p === 'toString' || p === 'valueOf' ? () => '#3355ff' : make(),
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});
vi.mock('../../../lib/text/greetings', () => ({
  getGreeting: () => ({ text: 'Guten Morgen', lang: 'Deutsch', title: '', type: '' }),
}));
vi.mock('../LiveClock', () => ({ LiveClock: () => <span data-testid="clock" /> }));
vi.mock('../../../components/ui', () => ({
  GradientText: ({ children }: { children?: React.ReactNode }) => <h1>{children}</h1>,
  HeaderActions: () => <div data-testid="header-actions" />,
  HorizontalScrollContainer: ({ children }: { children?: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const MOTION_ONLY = new Set([
  'initial',
  'animate',
  'exit',
  'transition',
  'variants',
  'whileHover',
  'whileTap',
  'layout',
  'drag',
]);
const strip = (props: Record<string, unknown>): React.HTMLAttributes<HTMLDivElement> => {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (!MOTION_ONLY.has(k)) out[k] = props[k];
  return out as React.HTMLAttributes<HTMLDivElement>;
};
vi.mock('framer-motion', () => ({
  motion: new Proxy(
    {},
    { get: () => (props: Record<string, unknown>) => <div {...strip(props)} /> }
  ),
}));

afterEach(() => {
  navigateMock.mockClear();
  cleanup();
});

const baseProps = {
  displayName: 'Max Mustermann',
  photoURL: undefined,
  totalUnreadBadge: 0,
  onNotificationsOpen: vi.fn(),
  watchedEpisodes: 42,
  totalMovies: 7,
  progress: 85,
  todayEpisodes: 3,
};

const renderT = (props = baseProps) =>
  render(
    <ThemeProvider theme={createTheme()}>
      <GreetingSection {...props} />
    </ThemeProvider>
  );

describe('GreetingSection', () => {
  it('renders the greeting text and the quick-stats chips', () => {
    renderT();
    expect(screen.getByText('Guten Morgen')).toBeInTheDocument();
    expect(screen.getByText('42 Eps. gesamt')).toBeInTheDocument();
    expect(screen.getByText('7 Filme')).toBeInTheDocument();
    expect(screen.getByText('85% aktive Serien')).toBeInTheDocument();
    expect(screen.getByTestId('header-actions')).toBeInTheDocument();
    expect(screen.getByTestId('clock')).toBeInTheDocument();
  });

  it('shows the "Heute" chip only when there are episodes today', () => {
    renderT();
    expect(screen.getByText('3 Heute')).toBeInTheDocument();
    cleanup();
    renderT({ ...baseProps, todayEpisodes: 0 });
    expect(screen.queryByText(/Heute/)).not.toBeInTheDocument();
  });

  it('navigates to /search when the search bar is clicked', () => {
    renderT();
    fireEvent.click(screen.getByText('Suche nach Serien oder Filmen'));
    expect(navigateMock).toHaveBeenCalledWith('/search');
  });
});
