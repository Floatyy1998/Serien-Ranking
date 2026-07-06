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

import { CustomTooltip } from './CustomTooltip';

afterEach(() => cleanup());

describe('CustomTooltip', () => {
  it('renders nothing when there is no payload', () => {
    const { container } = render(<CustomTooltip active payload={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('formats values as hours by default', () => {
    render(
      <CustomTooltip
        active
        label="Drama"
        payload={[{ name: 'Drama', value: 3, color: '#42a5f5' }]}
      />
    );
    expect(screen.getByText('Drama')).toBeInTheDocument();
    expect(screen.getByText(/Drama: .* Stunden/)).toBeInTheDocument();
  });

  it('formats values as percent when unit is percent', () => {
    render(
      <CustomTooltip
        active
        label="Action"
        unit="percent"
        payload={[{ name: 'Action', value: 42, color: '#ef5350' }]}
      />
    );
    expect(screen.getByText(/Action: 42%/)).toBeInTheDocument();
  });
});
