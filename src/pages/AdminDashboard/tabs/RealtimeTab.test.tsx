// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { RealtimeTab } from './RealtimeTab';

const theme = generateDynamicTheme(defaultThemeConfig);

type Data = ReturnType<typeof useAdminDashboardData>;

function makeData(overrides?: Partial<Data>): Data {
  return {
    realtimeUsers: [],
    userProfiles: {},
    ...overrides,
  } as unknown as Data;
}

afterEach(cleanup);

describe('RealtimeTab', () => {
  it('renders the empty state when nobody is online (smoke)', () => {
    render(<RealtimeTab data={makeData()} theme={theme} />);
    expect(screen.getByText('Aktive User')).toBeInTheDocument();
    expect(screen.getByText('Niemand online')).toBeInTheDocument();
    expect(screen.getByText(/Users jetzt aktiv/)).toBeInTheDocument();
  });

  it('lists active users and renders the page distribution chart', () => {
    const data = makeData({
      realtimeUsers: [
        { uid: 'user-123456789', page: '/home', since: Date.now() },
        { uid: 'user-987654321', page: '/stats', since: Date.now() },
      ],
      userProfiles: {
        'user-123456789': { displayName: 'Alice', photoURL: '', username: 'alice' },
      },
    });
    const { container } = render(<RealtimeTab data={data} theme={theme} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText(/Users jetzt aktiv/)).toBeInTheDocument();
    expect(screen.getByText('Seiten-Verteilung')).toBeInTheDocument();
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });
});
