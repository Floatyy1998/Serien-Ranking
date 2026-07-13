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
vi.mock('./HomeSearchOverlay', () => ({
  HomeSearchOverlay: ({ open }: { open: boolean }) =>
    open ? <div data-testid="home-search-overlay" /> : null,
}));
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
    // Stat-Pods rendern Wert und Label seit dem Redesign getrennt
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Episoden')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Filme')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('Aktiv')).toBeInTheDocument();
    expect(screen.getByTestId('header-actions')).toBeInTheDocument();
    expect(screen.getByTestId('clock')).toBeInTheDocument();
  });

  it('shows the "Heute" chip only when there are episodes today', () => {
    renderT();
    expect(screen.getByText('Heute')).toBeInTheDocument();
    cleanup();
    renderT({ ...baseProps, todayEpisodes: 0 });
    expect(screen.queryByText(/Heute/)).not.toBeInTheDocument();
  });

  it('öffnet das Such-Overlay beim Klick auf den Suchbalken (kein Sprung zu /search)', () => {
    renderT();
    expect(screen.queryByTestId('home-search-overlay')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Suche nach Serien oder Filmen'));
    expect(screen.getByTestId('home-search-overlay')).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
