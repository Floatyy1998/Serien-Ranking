// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { EventsTab } from './EventsTab';

const theme = generateDynamicTheme(defaultThemeConfig);

type Data = ReturnType<typeof useAdminDashboardData>;

function makeData(): Data {
  return {
    dailyStats: [
      {
        date: '2026-07-04',
        totalEvents: 12,
        pageViews: {},
        events: { page_view: 10, login: 2 },
        activeUsers: {},
        newUsers: 0,
      },
      {
        date: '2026-07-03',
        totalEvents: 5,
        pageViews: {},
        events: { page_view: 5 },
        activeUsers: {},
        newUsers: 0,
      },
    ],
  } as unknown as Data;
}

afterEach(cleanup);

describe('EventsTab', () => {
  it('renders the event explorer with a pill per event name (smoke)', () => {
    render(<EventsTab data={makeData()} theme={theme} />);
    expect(screen.getByText('Event Explorer')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /page_view/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/ })).toBeInTheDocument();
  });

  it('filters the event pills via the search box', () => {
    render(<EventsTab data={makeData()} theme={theme} />);
    fireEvent.change(screen.getByPlaceholderText('Event suchen...'), {
      target: { value: 'login' },
    });
    expect(screen.getByRole('button', { name: /login/ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /page_view/ })).not.toBeInTheDocument();
  });

  it('shows the event chart when a pill is selected', () => {
    render(<EventsTab data={makeData()} theme={theme} />);
    fireEvent.click(screen.getByRole('button', { name: /page_view/ }));
    expect(screen.getByRole('heading', { name: 'page_view' })).toBeInTheDocument();
    expect(screen.getByText(/Gesamt \(30d\)/)).toBeInTheDocument();
  });
});
