// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HeatmapSlide } from './HeatmapSlide';

afterEach(() => cleanup());

// 7 days x 24 hours, with a single peak at day 3 (Mi), hour 20.
const heatmap = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
heatmap[3][20] = 9;

describe('HeatmapSlide', () => {
  it('renders the heading and grid labels', () => {
    render(<HeatmapSlide heatmapData={heatmap} />);
    expect(screen.getByText('Deine Watch-Zeiten')).toBeInTheDocument();
    expect(screen.getByText('Mo')).toBeInTheDocument();
    expect(screen.getByText('Sa')).toBeInTheDocument();
  });

  it('highlights the computed peak time', () => {
    render(<HeatmapSlide heatmapData={heatmap} />);
    expect(screen.getByText('Mi 20:00 Uhr')).toBeInTheDocument();
    expect(screen.getByText('9 Views zu dieser Zeit')).toBeInTheDocument();
  });
});
