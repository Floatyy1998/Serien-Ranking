// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OnboardingFunnelSection } from './OnboardingFunnelSection';
import type { OnboardingFunnel, useAdminDashboardData } from '../useAdminDashboardData';
import type { useTheme } from '../../../contexts/ThemeContext';

vi.mock('@mui/icons-material', () => ({ HowToReg: () => null }));

const theme = {
  primary: '#00d123',
  text: { primary: '#fff', muted: '#999' },
} as unknown as ReturnType<typeof useTheme>['currentTheme'];

const funnel = (over: Partial<OnboardingFunnel> = {}): OnboardingFunnel => ({
  ts: new Date(2026, 7, 28, 17, 50).getTime(),
  total: 73,
  done: 52,
  open: 21,
  legacy: 9,
  steps: { welcome: 0, series: 0, movies: 0, subscriptions: 0, pet: 0, done: 0 },
  ohneMarker: 21,
  ohneName: 10,
  mitPet: 3,
  sofortWeg: 15,
  provider: {
    google: { angelegt: 20, fertig: 9, offen: 11 },
    apple: { angelegt: 14, fertig: 6, offen: 8 },
  },
  letzte30Tage: { angelegt: 42, fertig: 27 },
  ...over,
});

const makeData = (f: OnboardingFunnel | null) =>
  ({ onboardingFunnel: f }) as unknown as ReturnType<typeof useAdminDashboardData>;

afterEach(cleanup);

describe('OnboardingFunnelSection', () => {
  it('rendert nichts, solange der Zaehler nichts geschrieben hat', () => {
    const { container } = render(<OnboardingFunnelSection data={makeData(null)} theme={theme} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('nennt Abschlussquote, offene Konten und den Stand', () => {
    render(<OnboardingFunnelSection data={makeData(funnel())} theme={theme} />);
    expect(screen.getByText('64 %')).toBeInTheDocument();
    expect(screen.getByText(/27 von 42 neuen Konten/)).toBeInTheDocument();
    expect(screen.getByText(/Stand 28\.08\., 17:50/)).toBeInTheDocument();
  });

  it('erklaert die Luecke, solange keine Schritt-Marker vorliegen', () => {
    render(<OnboardingFunnelSection data={makeData(funnel())} theme={theme} />);
    expect(screen.getByText(/Noch keine Schritt-Marker/)).toBeInTheDocument();
    expect(screen.queryByText('Genres & Name')).not.toBeInTheDocument();
  });

  it('zeigt die Stufen, sobald Marker da sind', () => {
    const f = funnel({
      steps: { welcome: 4, series: 2, movies: 1, subscriptions: 0, pet: 1, done: 0 },
      ohneMarker: 13,
    });
    render(<OnboardingFunnelSection data={makeData(f)} theme={theme} />);
    expect(screen.getByText('Genres & Name')).toBeInTheDocument();
    expect(screen.getByText('ohne Marker (Altbestand)')).toBeInTheDocument();
  });

  it('schluesselt nach Anmeldeart auf, absteigend nach Konten', () => {
    render(<OnboardingFunnelSection data={makeData(funnel())} theme={theme} />);
    const zeilen = screen.getAllByRole('row').slice(1);
    expect(zeilen[0].textContent).toContain('Google');
    expect(zeilen[0].textContent).toContain('45 %');
    expect(zeilen[1].textContent).toContain('Apple');
  });
});
