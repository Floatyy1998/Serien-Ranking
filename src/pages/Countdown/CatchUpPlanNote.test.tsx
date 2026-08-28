// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatchUpPlanNote } from './CatchUpPlanNote';
import type { CatchUpPlan, CatchUpVariant } from '../../lib/catchUpPlan';

vi.mock('@mui/icons-material', () => {
  const stub = () => null;
  return Object.fromEntries(
    ['CheckCircleOutlined', 'FastForwardRounded', 'WarningAmberRounded'].map((n) => [n, stub])
  );
});

const theme = vi.hoisted(() => ({
  currentTheme: {
    primary: '#00d123',
    accent: '#8b5cf6',
    background: { default: '#000', surface: '#111' },
    text: { primary: '#fff', secondary: '#ddd', muted: '#999' },
    border: { default: '#333' },
    status: { success: '#4caf50', warning: '#f59e0b', error: '#ef4444' },
  },
}));
vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => theme }));

const variant = (over: Partial<CatchUpVariant> = {}): CatchUpVariant => ({
  episodes: 41,
  hours: 28,
  projectedDate: new Date(2027, 0, 8),
  willMakeIt: false,
  daysLate: 86,
  ...over,
});

const makePlan = (over: Partial<CatchUpPlan> = {}): CatchUpPlan => ({
  shouldShow: true,
  daysUntilTarget: 47,
  episodesPerWeek: 4.2,
  requiredPerWeek: 6.1,
  current: variant(),
  withoutFiller: null,
  fillerSavesIt: false,
  ...over,
});

afterEach(cleanup);

describe('CatchUpPlanNote', () => {
  it('warnt in Wochen, wenn das Tempo nicht reicht', () => {
    render(<CatchUpPlanNote plan={makePlan()} />);
    expect(screen.getByText('12 Wochen zu spät')).toBeInTheDocument();
    expect(screen.getByText('41 Folgen offen · 6,1 Folgen/Woche nötig')).toBeInTheDocument();
  });

  it('warnt in Tagen bei kleinem Rückstand', () => {
    render(<CatchUpPlanNote plan={makePlan({ current: variant({ daysLate: 5 }) })} />);
    expect(screen.getByText('5 Tage zu spät')).toBeInTheDocument();
  });

  it('bestätigt einen rechtzeitigen Abschluss', () => {
    const plan = makePlan({
      current: variant({ willMakeIt: true, daysLate: 0, projectedDate: new Date(2026, 9, 2) }),
    });
    render(<CatchUpPlanNote plan={plan} />);
    expect(screen.getByText('Rechtzeitig durch — fertig ca. 02.10.')).toBeInTheDocument();
  });

  it('nennt den Rückstand, wenn kein Tempo messbar ist', () => {
    const plan = makePlan({
      episodesPerWeek: 0,
      current: variant({ projectedDate: null }),
    });
    render(<CatchUpPlanNote plan={plan} />);
    expect(screen.getByText('41 Folgen offen, kein Tempo messbar')).toBeInTheDocument();
  });

  it('zeigt den Filler-Hebel, wenn er den Termin rettet', () => {
    const plan = makePlan({
      withoutFiller: variant({ episodes: 30, willMakeIt: true, daysLate: 0 }),
      fillerSavesIt: true,
    });
    render(<CatchUpPlanNote plan={plan} />);
    expect(screen.getByText('Ohne die 11 Filler-Folgen schaffst du es.')).toBeInTheDocument();
  });

  it('zeigt den Filler-Hebel auch, wenn er nicht reicht', () => {
    const plan = makePlan({ withoutFiller: variant({ episodes: 30, daysLate: 40 }) });
    render(<CatchUpPlanNote plan={plan} />);
    expect(screen.getByText('Ohne die 11 Filler-Folgen: noch 30 Folgen.')).toBeInTheDocument();
  });

  it('lässt den Filler-Hebel in der kompakten Zeile weg', () => {
    const plan = makePlan({
      withoutFiller: variant({ episodes: 30, willMakeIt: true }),
      fillerSavesIt: true,
    });
    render(<CatchUpPlanNote plan={plan} compact />);
    expect(screen.queryByText('Ohne die 11 Filler-Folgen schaffst du es.')).not.toBeInTheDocument();
    expect(screen.getByText('12 Wochen zu spät')).toBeInTheDocument();
  });
});
