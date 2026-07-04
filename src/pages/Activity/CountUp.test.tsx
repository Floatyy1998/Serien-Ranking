// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type * as FramerMotion from 'framer-motion';

// Reduced motion → the value renders immediately (no rAF animation), keeping
// the assertion deterministic.
vi.mock('framer-motion', async (orig) => ({
  ...(await orig<typeof FramerMotion>()),
  useReducedMotion: () => true,
}));

import { CountUp } from './CountUp';

afterEach(() => cleanup());

describe('CountUp', () => {
  it('renders the rounded integer value', () => {
    render(<CountUp value={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders one decimal place when decimals=1', () => {
    render(<CountUp value={7.5} decimals={1} />);
    expect(screen.getByText('7.5')).toBeInTheDocument();
  });

  it('renders zero for a zero value', () => {
    render(<CountUp value={0} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
