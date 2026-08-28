// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DropOffInsight } from '../../lib/dropOff';
import type { DynamicTheme } from '../../theme/dynamicTheme';

vi.mock('@mui/icons-material/ExitToApp', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ExpandLess', () => ({ default: () => null }));
vi.mock('@mui/icons-material/ExpandMore', () => ({ default: () => null }));

const state = vi.hoisted(() => ({ insight: null as DropOffInsight | null }));
vi.mock('../../hooks/useDropOff', () => ({
  useDropOff: () => state.insight,
}));

import { DropOffSection } from './DropOffSection';

const theme = {
  primary: '#00d123',
  accent: '#8b5cf6',
  background: { surface: '#111' },
  text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
  border: { default: '#333' },
  status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
} as unknown as DynamicTheme;

const makeInsight = (over: Partial<DropOffInsight> = {}): DropOffInsight => ({
  shouldShow: true,
  decided: 143,
  completionRate: 0.29,
  seasons: [
    { seasonNumber: 1, quitters: 10, share: 0.07 },
    { seasonNumber: 2, quitters: 60, share: 0.42 },
  ],
  worstSeason: { seasonNumber: 2, quitters: 60, share: 0.42 },
  holdPoint: { episodeNumber: 6, completionAfter: 0.89 },
  ...over,
});

const renderSection = () =>
  render(<DropOffSection seriesId={1} currentTheme={theme} isMobile={false} />);

beforeEach(() => {
  state.insight = makeInsight();
});
afterEach(cleanup);

describe('DropOffSection', () => {
  it('rendert nichts ohne Daten', () => {
    state.insight = null;
    const { container } = renderSection();
    expect(container).toBeEmptyDOMElement();
  });

  it('nennt Abschlussquote, Ausstiegsstaffel und Durchhaltepunkt', () => {
    renderSection();
    expect(screen.getByText('29 %')).toBeInTheDocument();
    expect(screen.getByText('Die meisten steigen in Staffel 2 aus.')).toBeInTheDocument();
    expect(screen.getByText('Wer Folge 6 erreicht, schaut zu 89 % zu Ende.')).toBeInTheDocument();
    expect(screen.getByText('143 Bewertungen ausgewertet')).toBeInTheDocument();
  });

  it('lässt den Durchhaltepunkt weg, wenn es keinen gibt', () => {
    state.insight = makeInsight({ holdPoint: null });
    renderSection();
    expect(screen.queryByText(/Wer Folge/)).not.toBeInTheDocument();
  });

  it('lässt die Ausstiegsstaffel weg, wenn keine heraussticht', () => {
    state.insight = makeInsight({ worstSeason: null });
    renderSection();
    expect(screen.queryByText(/Die meisten steigen/)).not.toBeInTheDocument();
  });

  it('klappt die Staffelverteilung erst auf Klick aus', () => {
    renderSection();
    expect(screen.queryByText('Staffel 2')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { expanded: false }));
    expect(screen.getByText('Staffel 1')).toBeInTheDocument();
    expect(screen.getByText('Staffel 2')).toBeInTheDocument();
    expect(
      screen.getByText('Anonym aus dem Sehverhalten aller Nutzer, die diese Serie begonnen haben.')
    ).toBeInTheDocument();
  });
});
