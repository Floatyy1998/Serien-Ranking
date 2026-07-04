// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { OverviewTab } from './OverviewTab';

const theme = generateDynamicTheme(defaultThemeConfig);

type Data = ReturnType<typeof useAdminDashboardData>;

function makeData(overrides?: Partial<Data>): Data {
  return {
    realtimeUsers: [],
    dauToday: 10,
    dauDelta: 5,
    dauSparkline: [{ value: 1 }, { value: 2 }, { value: 3 }],
    totalUsers: 42,
    eventsToday: 100,
    eventsDelta: -3,
    eventsSparkline: [{ value: 4 }, { value: 5 }],
    extensionUserCount: 7,
    activityChartData: [{ date: '01-01', dau: 1, events: 2, newUsers: 0 }],
    topEvents: [{ name: 'page_view', count: 50 }],
    topPages: [{ name: '/home', count: 30 }],
    userProfiles: {},
    ...overrides,
  } as unknown as Data;
}

afterEach(cleanup);

describe('OverviewTab', () => {
  it('renders the KPI scorecards and chart headings (smoke)', () => {
    render(<OverviewTab data={makeData()} theme={theme} />);
    expect(screen.getByText('DAU')).toBeInTheDocument();
    expect(screen.getByText('Nutzer gesamt')).toBeInTheDocument();
    expect(screen.getByText('Events heute')).toBeInTheDocument();
    expect(screen.getByText('Extension')).toBeInTheDocument();
    expect(screen.getByText('Aktivitaet (letzte 30 Tage)')).toBeInTheDocument();
    expect(screen.getByText('Top Events heute')).toBeInTheDocument();
  });

  it('shows the live pulse with active user count', () => {
    render(
      <OverviewTab
        data={makeData({
          realtimeUsers: [{ uid: 'u1', page: '/home', since: Date.now() }],
        })}
        theme={theme}
      />
    );
    expect(screen.getByText(/1 User aktiv/)).toBeInTheDocument();
  });

  it('renders the empty placeholder for top pages when there is no data', () => {
    render(<OverviewTab data={makeData({ topPages: [] })} theme={theme} />);
    expect(screen.getByText('Top Seiten heute')).toBeInTheDocument();
    expect(screen.getByText('Keine Daten')).toBeInTheDocument();
  });
});
