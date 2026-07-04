// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { LateNightSlide } from './LateNightSlide';
import type { LateNightStats } from '../../types/Wrapped';

afterEach(() => cleanup());

const stats = (overrides: Partial<LateNightStats> = {}): LateNightStats => ({
  totalLateNightWatches: 42,
  midnightWatches: 8,
  latestWatch: { time: '03:14', title: 'Nachtfilm' },
  percentage: 33,
  ...overrides,
});

describe('LateNightSlide', () => {
  it('shows the empty state without late-night watches', () => {
    render(<LateNightSlide lateNightStats={stats({ totalLateNightWatches: 0 })} />);
    expect(screen.getByText('Früh ins Bett?')).toBeInTheDocument();
  });

  it('renders the totals and percentage', () => {
    render(<LateNightSlide lateNightStats={stats()} />);
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('33% deiner Views')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('renders the latest watch time and title', () => {
    render(<LateNightSlide lateNightStats={stats()} />);
    expect(screen.getByText('03:14')).toBeInTheDocument();
    expect(screen.getByText('Nachtfilm')).toBeInTheDocument();
  });
});
