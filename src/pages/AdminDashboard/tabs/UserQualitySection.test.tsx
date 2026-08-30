// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { UserQualitySection } from './UserQualitySection';
import type { UserQuality, useAdminDashboardData } from '../useAdminDashboardData';
import type { useTheme } from '../../../contexts/ThemeContext';

// Ganzes Modul ersetzt — KpiScorecard zieht die Trend-Icons mit.
vi.mock('@mui/icons-material', () => ({
  CheckCircle: () => null,
  HourglassEmpty: () => null,
  Public: () => null,
  Verified: () => null,
  TrendingDown: () => null,
  TrendingFlat: () => null,
  TrendingUp: () => null,
}));

vi.mock('recharts', () => ({
  Area: () => null,
  AreaChart: () => null,
  CartesianGrid: () => null,
  Line: () => null,
  LineChart: () => null,
  Tooltip: () => null,
  XAxis: () => null,
  YAxis: () => null,
}));

vi.mock('../../../components/ui/SafeResponsiveContainer', () => ({
  SafeResponsiveContainer: () => null,
}));

const theme = {
  primary: '#00d123',
  border: { default: '#333' },
  background: { surface: '#111' },
  text: { primary: '#fff', muted: '#999' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const quality = (over: Partial<UserQuality> = {}): UserQuality => ({
  ts: new Date(2026, 7, 30, 16, 20).getTime(),
  gesamt: 73,
  echt: 26,
  ruhend: 2,
  neu: 15,
  angefangen: 16,
  abgebrochen: 9,
  welle: 5,
  aktiv30: 23,
  laender: [
    { tz: 'Europe/Berlin', n: 14 },
    { tz: 'Africa/Lusaka', n: 1 },
    { tz: 'unbekannt', n: 5 },
  ],
  wellen: [{ tag: '2026-08-06', konten: 5, leer: 5 }],
  regeln: { karenzTage: 7, minInhalte: 3, ruhendTage: 60, welleMinKonten: 4 },
  ...over,
});

const makeData = (q: UserQuality | null) =>
  ({ userQuality: q, qualityChartData: [] }) as unknown as ReturnType<typeof useAdminDashboardData>;

afterEach(cleanup);

describe('UserQualitySection', () => {
  it('rendert nichts, solange der Cron nichts geschrieben hat', () => {
    const { container } = render(<UserQualitySection data={makeData(null)} theme={theme} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('nennt echte Nutzer, ihren Anteil und die Regelschwellen', () => {
    render(<UserQualitySection data={makeData(quality())} theme={theme} />);
    expect(screen.getByText(/von 73 Konten sind echte Nutzer \(36 %\)/)).toBeInTheDocument();
    expect(screen.getByText(/mindestens 3 Einträge/)).toBeInTheDocument();
    expect(screen.getByText(/unter 7 Tagen/)).toBeInTheDocument();
  });

  it('summiert Aussortierte aus Welle und Abbruch', () => {
    render(<UserQualitySection data={makeData(quality())} theme={theme} />);
    expect(screen.getByText('Aussortiert')).toBeInTheDocument();
    // 5 Wellen-Konten + 9 abgebrochene
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('zeigt Herkunft als lesbaren Ortsnamen statt als IANA-Pfad', () => {
    render(<UserQualitySection data={makeData(quality())} theme={theme} />);
    expect(screen.getByText('Lusaka')).toBeInTheDocument();
    expect(screen.getByText('Berlin')).toBeInTheDocument();
    expect(screen.queryByText('Europe/Berlin')).not.toBeInTheDocument();
  });

  it('nennt erkannte Registrier-Wellen mit Tag und Leerkonten', () => {
    render(<UserQualitySection data={makeData(quality())} theme={theme} />);
    expect(screen.getByText(/06\.08\. \(5 Konten, davon 5 leer\)/)).toBeInTheDocument();
  });

  it('kommt ohne Laender und Wellen aus', () => {
    render(
      <UserQualitySection data={makeData(quality({ laender: [], wellen: [] }))} theme={theme} />
    );
    expect(screen.queryByText(/Registrier-Wellen/)).not.toBeInTheDocument();
    // KPI-Kachel und Kohorten-Balken tragen beide diesen Text.
    expect(screen.getAllByText('Echte Nutzer')).toHaveLength(2);
  });
});
