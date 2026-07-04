// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { BingeStatsSlide } from './BingeStatsSlide';
import type { BingeSessionStats } from '../../types/Wrapped';

afterEach(() => cleanup());

const longest: BingeSessionStats = {
  seriesId: 1,
  seriesTitle: 'The Office',
  episodeCount: 12,
  totalMinutes: 300,
  date: '2025-03-01',
};

describe('BingeStatsSlide', () => {
  it('shows the empty state when there were no binge sessions', () => {
    render(<BingeStatsSlide totalBingeSessions={0} longestBinge={null} averageBingeLength={0} />);
    expect(screen.getByText('Kein Binge-Watching')).toBeInTheDocument();
  });

  it('renders session count and the longest binge card', () => {
    render(
      <BingeStatsSlide totalBingeSessions={7} longestBinge={longest} averageBingeLength={4.4} />
    );
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('Binge-Sessions')).toBeInTheDocument();
    expect(screen.getByText('The Office')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('rounds the average binge length', () => {
    render(<BingeStatsSlide totalBingeSessions={3} longestBinge={null} averageBingeLength={4.6} />);
    expect(screen.getByText('5 Episoden')).toBeInTheDocument();
  });
});
