// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { UsersTab } from './UsersTab';

const theme = generateDynamicTheme(defaultThemeConfig);

type Data = ReturnType<typeof useAdminDashboardData>;

function makeData(overrides?: Partial<Data>): Data {
  return {
    usersList: [
      {
        uid: 'user-123456789',
        displayName: 'Alice Admin',
        photoURL: '',
        username: 'alice',
        firstSeen: Date.now() - 100000000,
        lastSeen: Date.now(),
        platform: 'both',
        isOnline: true,
      },
    ],
    userProfiles: {},
    loadUserEvents: vi.fn(() => Promise.resolve([])),
    ...overrides,
  } as unknown as Data;
}

afterEach(cleanup);

describe('UsersTab', () => {
  it('renders the stats bar, rebuild button and user rows (smoke)', () => {
    render(<UsersTab data={makeData()} theme={theme} />);
    expect(screen.getByText('Gesamt')).toBeInTheDocument();
    // "Online" appears both as a stat label and in the table status column.
    expect(screen.getAllByText('Online').length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Suchindex neu aufbauen/ })).toBeInTheDocument();
    expect(screen.getByText('Alice Admin')).toBeInTheDocument();
    expect(screen.getByText('@alice')).toBeInTheDocument();
  });

  it('opens the user deep-dive when a row is clicked', async () => {
    render(<UsersTab data={makeData()} theme={theme} />);
    fireEvent.click(screen.getByText('Alice Admin'));
    expect(await screen.findByText('Deep-Dive — heute')).toBeInTheDocument();
  });
});
