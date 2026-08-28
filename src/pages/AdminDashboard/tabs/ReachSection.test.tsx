// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ReachSection } from './ReachSection';
import type { ReachStats } from '../useAdminDashboardData';
import type { useAdminDashboardData } from '../useAdminDashboardData';
import type { useTheme } from '../../../contexts/ThemeContext';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    ['CalendarMonth', 'DateRange', 'Groups', 'PersonAdd'].map((n) => [n, stub])
  );
});

vi.mock('recharts', () => ({
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock('../../../components/ui/SafeResponsiveContainer', () => ({
  SafeResponsiveContainer: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../components/KpiScorecard', () => ({
  KpiScorecard: ({ title, value }: { title: string; value: number }) => (
    <div>
      {title}: {value}
    </div>
  ),
}));

const theme = {
  primary: '#00d123',
  background: { surface: '#111' },
  text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
  border: { default: '#333' },
  status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const today = new Date().toISOString().slice(0, 10);

const makeData = (
  latest: ReachStats | null,
  chart: Array<{ date: string; dau: number; wau: number; mau: number }> = []
) =>
  ({
    reachLatest: latest,
    reachChartData: chart,
    reachStats: latest ? [latest] : [],
  }) as unknown as ReturnType<typeof useAdminDashboardData>;

afterEach(cleanup);

describe('ReachSection', () => {
  it('rendert nichts, solange keine Zahlen vorliegen', () => {
    const { container } = render(<ReachSection data={makeData(null)} theme={theme} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('zeigt Konten, DAU, WAU und MAU', () => {
    const latest: ReachStats = { date: today, total: 72, dau: 9, wau: 27, mau: 56 };
    render(<ReachSection data={makeData(latest)} theme={theme} />);

    expect(screen.getByText('Konten gesamt: 72')).toBeInTheDocument();
    expect(screen.getByText('Aktiv heute: 9')).toBeInTheDocument();
    expect(screen.getByText('Aktiv 7 Tage: 27')).toBeInTheDocument();
    expect(screen.getByText('Aktiv 30 Tage: 56')).toBeInTheDocument();
  });

  it('nennt den Stand und weist auf den Zaehllauf hin, wenn er alt ist', () => {
    const latest: ReachStats = { date: '2026-08-01', total: 72, dau: 9, wau: 27, mau: 56 };
    render(<ReachSection data={makeData(latest)} theme={theme} />);

    expect(screen.getByText(/Stand 2026-08-01/)).toBeInTheDocument();
    expect(screen.getByText(/taeglich um 23:55/)).toBeInTheDocument();
  });

  it('laesst den Hinweis auf den Zaehllauf weg, wenn die Zahlen von heute sind', () => {
    const latest: ReachStats = { date: today, total: 72, dau: 9, wau: 27, mau: 56 };
    render(<ReachSection data={makeData(latest)} theme={theme} />);

    expect(screen.queryByText(/taeglich um 23:55/)).not.toBeInTheDocument();
  });

  it('macht die Quelle transparent', () => {
    const latest: ReachStats = { date: today, total: 72, dau: 9, wau: 27, mau: 56 };
    render(<ReachSection data={makeData(latest)} theme={theme} />);

    expect(screen.getByText(/unabhaengig vom Analytics-Hinweis/)).toBeInTheDocument();
  });
});
