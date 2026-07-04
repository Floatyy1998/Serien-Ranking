// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DailySpinWheel } from './DailySpinWheel';

const authState = vi.hoisted(() => ({ user: { uid: 'u1' } as { uid: string } | null }));
vi.mock('../../AuthContext', () => ({
  useAuth: () => ({ user: authState.user }),
}));

const spin = vi.hoisted(() => ({
  buildSpinSegments: vi.fn(),
  canSpinToday: vi.fn<() => Promise<boolean>>(),
  performDailySpin: vi.fn(),
}));
vi.mock('../../services/pet/dailySpinService', () => ({
  buildSpinSegments: spin.buildSpinSegments,
  canSpinToday: spin.canSpinToday,
  performDailySpin: spin.performDailySpin,
}));

beforeEach(() => {
  authState.user = { uid: 'u1' };
  spin.buildSpinSegments.mockReturnValue(
    Array.from({ length: 9 }, (_, i) => ({
      type: 'nothing',
      label: `Segment ${i}`,
      rarity: 'common',
    }))
  );
  spin.canSpinToday.mockResolvedValue(true);
  spin.performDailySpin.mockReset();
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DailySpinWheel', () => {
  it('rendert das Glücksrad nachdem canSpinToday aufgelöst ist', async () => {
    render(<DailySpinWheel streakDays={0} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Tägliches Glücksrad')).toBeInTheDocument());
    expect(screen.getByText('Drehen!')).toBeInTheDocument();
  });

  it('zeigt den Streak-Hinweis wenn streakDays > 0', async () => {
    render(<DailySpinWheel streakDays={5} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText(/5 Tage Streak/)).toBeInTheDocument());
  });

  it('zeigt "Morgen wieder!" wenn heute schon gedreht wurde', async () => {
    spin.canSpinToday.mockResolvedValue(false);
    render(<DailySpinWheel streakDays={0} onClose={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Morgen wieder!')).toBeInTheDocument());
  });

  it('ruft onClose über den Schließen-Button', async () => {
    const onClose = vi.fn();
    render(<DailySpinWheel streakDays={0} onClose={onClose} />);
    await waitFor(() => expect(screen.getByText('Drehen!')).toBeInTheDocument());
    fireEvent.click(screen.getAllByRole('button')[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
