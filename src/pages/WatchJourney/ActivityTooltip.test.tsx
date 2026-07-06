// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';

vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: () => ({
    currentTheme: {
      text: { primary: '#fff', secondary: '#ccc', muted: '#999' },
      background: { surface: '#111' },
      border: { default: '#333' },
    },
  }),
}));

import { ActivityTooltip } from './ActivityTooltip';

afterEach(() => cleanup());

describe('ActivityTooltip', () => {
  it('renders nothing when inactive', () => {
    const { container } = render(<ActivityTooltip active={false} payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the label and positive entries (episodes)', () => {
    render(
      <ActivityTooltip
        active
        label="Januar"
        payload={[
          { name: 'Episoden', value: 12, color: '#8338ec' },
          { name: 'Filme', value: 0, color: '#ff006e' },
        ]}
      />
    );
    expect(screen.getByText('Januar')).toBeInTheDocument();
    expect(screen.getByText(/Episoden: 12 Episoden/)).toBeInTheDocument();
    // value === 0 entries are filtered out
    expect(screen.queryByText(/Filme:/)).toBeNull();
  });

  it('uses the hours suffix when unit is hours', () => {
    render(
      <ActivityTooltip
        active
        label="Feb"
        unit="hours"
        payload={[{ name: 'Stunden', value: 5, color: '#3a86ff' }]}
      />
    );
    expect(screen.getByText(/Stunden: 5 Stunden/)).toBeInTheDocument();
  });
});
