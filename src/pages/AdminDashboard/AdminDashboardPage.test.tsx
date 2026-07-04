// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import { generateDynamicTheme, defaultThemeConfig } from '../../theme/dynamicTheme';
import { AdminDashboardPage } from './AdminDashboardPage';

const theme = generateDynamicTheme(defaultThemeConfig);

const h = vi.hoisted(() => ({
  guard: { isAdmin: true, checking: false },
  data: { loading: false, refresh: () => {} } as { loading: boolean; refresh: () => void },
}));

vi.mock('./useAdminGuard', () => ({ useAdminGuard: () => h.guard }));
vi.mock('./useAdminDashboardData', () => ({ useAdminDashboardData: () => h.data }));

vi.mock('../../contexts/ThemeContextDef', () => ({ useTheme: () => ({ currentTheme: theme }) }));

vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(''), vi.fn()],
}));

// Passthrough framer-motion so AnimatePresence "mode=wait" doesn't hold back
// the newly-activated tab behind an unfinished exit animation.
vi.mock('framer-motion', () => {
  const make =
    () =>
    ({
      children,
      style,
      className,
      onClick,
    }: {
      children?: React.ReactNode;
      style?: React.CSSProperties;
      className?: string;
      onClick?: React.MouseEventHandler;
    }) => (
      <div style={style} className={className} onClick={onClick}>
        {children}
      </div>
    );
  return {
    AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
    motion: new Proxy({}, { get: () => make() }),
  };
});

vi.mock('../../components/ui', () => ({
  PageHeader: ({ title }: { title: string }) => <h1>{title}</h1>,
  PageLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Stub every tab module so the page shell is tested in isolation.
vi.mock('./tabs/OverviewTab', () => ({ OverviewTab: () => <div>overview-tab</div> }));
vi.mock('./tabs/RealtimeTab', () => ({ RealtimeTab: () => <div>realtime-tab</div> }));
vi.mock('./tabs/UsersTab', () => ({ UsersTab: () => <div>users-tab</div> }));
vi.mock('./tabs/ActivityTab', () => ({ ActivityTab: () => <div>activity-tab</div> }));
vi.mock('./tabs/EventsTab', () => ({ EventsTab: () => <div>events-tab</div> }));
vi.mock('./tabs/ExtensionTab', () => ({ ExtensionTab: () => <div>extension-tab</div> }));
vi.mock('./tabs/TicketsTab', () => ({ TicketsTab: () => <div>tickets-tab</div> }));
vi.mock('./tabs/MessagesTab', () => ({ MessagesTab: () => <div>messages-tab</div> }));
vi.mock('./tabs/DataHealthTab', () => ({ DataHealthTab: () => <div>health-tab</div> }));
vi.mock('./tabs/NewEpisodesTab', () => ({ NewEpisodesTab: () => <div>new-episodes-tab</div> }));
vi.mock('./tabs/AnimeFillerTab', () => ({ AnimeFillerTab: () => <div>anime-filler-tab</div> }));
vi.mock('./tabs/PerformanceTab', () => ({ PerformanceTab: () => <div>performance-tab</div> }));
vi.mock('./tabs/BackendErrorsTab', () => ({ BackendErrorsTab: () => <div>backend-tab</div> }));
vi.mock('./tabs/ConfigTab', () => ({ ConfigTab: () => <div>config-tab</div> }));

beforeEach(() => {
  h.guard = { isAdmin: true, checking: false };
  h.data = { loading: false, refresh: vi.fn() };
});

afterEach(cleanup);

describe('AdminDashboardPage', () => {
  it('renders the header, tab bar and the default overview tab', () => {
    render(<AdminDashboardPage />);
    expect(screen.getByRole('heading', { name: 'Admin Dashboard' })).toBeInTheDocument();
    expect(screen.getByText('overview-tab')).toBeInTheDocument();
  });

  it('shows a loading placeholder when the guard is still checking', () => {
    h.guard = { isAdmin: false, checking: true };
    render(<AdminDashboardPage />);
    expect(screen.getByText('Lade...')).toBeInTheDocument();
    expect(screen.queryByText('overview-tab')).not.toBeInTheDocument();
  });

  it('switches the active tab content when a tab button is clicked', () => {
    render(<AdminDashboardPage />);
    fireEvent.click(screen.getByRole('button', { name: /Users/ }));
    expect(screen.getByText('users-tab')).toBeInTheDocument();
    expect(screen.queryByText('overview-tab')).not.toBeInTheDocument();
  });

  it('renders the data-loading placeholder while data.loading is true', () => {
    h.data = { loading: true, refresh: vi.fn() };
    render(<AdminDashboardPage />);
    expect(screen.getByText('Daten laden...')).toBeInTheDocument();
  });
});
