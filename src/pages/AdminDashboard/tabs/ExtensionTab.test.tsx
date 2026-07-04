// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDynamicTheme, defaultThemeConfig } from '../../../theme/dynamicTheme';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import { ExtensionTab } from './ExtensionTab';

const theme = generateDynamicTheme(defaultThemeConfig);

type Data = ReturnType<typeof useAdminDashboardData>;
interface RawEvent {
  e: string;
  p?: Record<string, unknown>;
  t: number;
  uid: string;
}

function makeData(events: RawEvent[]): Data {
  return {
    userProfiles: {},
    loadAllRawEvents: vi.fn<() => Promise<RawEvent[]>>(() => Promise.resolve(events)),
  } as unknown as Data;
}

afterEach(cleanup);

describe('ExtensionTab', () => {
  it('shows the empty state when there are no extension events', async () => {
    render(<ExtensionTab data={makeData([])} theme={theme} />);
    expect(await screen.findByText('Keine Extension-Events heute')).toBeInTheDocument();
  });

  it('renders KPI scorecards and charts when extension events exist', async () => {
    const events: RawEvent[] = [
      {
        e: 'ext_watch_session_started',
        p: { platform: 'netflix', series_name: 'Lost', season: 1, episode: 2 },
        t: Date.now(),
        uid: 'u1',
      },
    ];
    render(<ExtensionTab data={makeData(events)} theme={theme} />);
    expect(await screen.findByText('Extension User')).toBeInTheDocument();
    expect(screen.getByText('Sessions')).toBeInTheDocument();
    expect(screen.getByText('Plattform-Verteilung')).toBeInTheDocument();
  });
});
