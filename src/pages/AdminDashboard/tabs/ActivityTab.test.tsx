// @vitest-environment jsdom
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { RawEvent } from './ActivityEventConfig';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { ActivityTab } from './ActivityTab';

const theme = generateDynamicTheme(defaultThemeConfig);

type Data = ReturnType<typeof useAdminDashboardData>;

function makeData(overrides?: Partial<Data>): Data {
  return {
    userProfiles: {},
    loadAllRawEvents: vi.fn<() => Promise<RawEvent[]>>(() => Promise.resolve([])),
    ...overrides,
  } as unknown as Data;
}

afterEach(cleanup);

describe('ActivityTab', () => {
  it('renders quick-stat and filter labels (smoke)', () => {
    render(<ActivityTab data={makeData()} theme={theme} />);
    expect(screen.getByText('App Episoden')).toBeInTheDocument();
    expect(screen.getByText('Ratings')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Geschaut' })).toBeInTheDocument();
  });

  it('loads events and shows the empty feed for the range', async () => {
    render(<ActivityTab data={makeData()} theme={theme} />);
    expect(await screen.findByText('Keine Events fuer diesen Zeitraum')).toBeInTheDocument();
  });

  it('switches to a multi-day range when a range button is clicked', () => {
    render(<ActivityTab data={makeData()} theme={theme} />);
    fireEvent.click(screen.getByRole('button', { name: '3T' }));
    expect(screen.getByText('Letzte 3 Tage')).toBeInTheDocument();
  });
});
