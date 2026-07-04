// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { Series } from '../../types/Series';

vi.mock('../../contexts/ThemeContextDef', () => {
  const make = (): unknown =>
    new Proxy(() => '#3355ff', {
      get: (_t, prop) => {
        if (prop === Symbol.toPrimitive || prop === 'toString' || prop === 'valueOf')
          return () => '#3355ff';
        return make();
      },
    });
  return { useTheme: () => ({ currentTheme: make() }) };
});

import { StatusBadge, NextEpisodeChip } from './StatusBadge';

const makeSeries = (over: Partial<Series>): Series =>
  ({ id: 1, title: 'Show', seasons: [], ...over }) as unknown as Series;

afterEach(() => cleanup());

describe('StatusBadge', () => {
  it('shows the ongoing label for a returning series', () => {
    render(<StatusBadge series={makeSeries({ status: 'Returning Series' })} />);
    expect(screen.getByText('Fortlaufend')).toBeInTheDocument();
  });

  it('shows the ended label for an ended series', () => {
    render(<StatusBadge series={makeSeries({ status: 'Ended' })} />);
    expect(screen.getByText('Beendet')).toBeInTheDocument();
  });

  it('renders nothing when the status is indeterminate', () => {
    const { container } = render(<StatusBadge series={makeSeries({ status: undefined })} />);
    expect(container).toBeEmptyDOMElement();
  });
});

describe('NextEpisodeChip', () => {
  it('renders nothing when there is no next episode', () => {
    const { container } = render(<NextEpisodeChip series={makeSeries({ seasons: undefined })} />);
    expect(container).toBeEmptyDOMElement();
  });
});
